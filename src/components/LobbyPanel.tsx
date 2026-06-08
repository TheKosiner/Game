import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';
import { db } from '../lib/firebase';
import { portraitSrc } from '../data/portraits';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  addDoc, query, orderBy, limit as fsLimit,
} from 'firebase/firestore';

// ── World constants ───────────────────────────────────────────────────────────
const TILE     = 40;
const COLS     = 50;
const ROWS     = 32;
const MAP_W    = COLS * TILE;
const MAP_H    = ROWS * TILE;
const SPEED    = 180;
const AVATAR_R = 18;
const WRITE_MS = 400;
const STALE_MS = 30_000;
const BUBBLE_MS = 5_000;

// ── Isometric projection constants ───────────────────────────────────────────
// iso tile: screen width = 2*TILE, height = TILE  (2:1 ratio)
const ISO_HW = TILE;       // half-width  = 40 px
const ISO_HH = TILE / 2;   // half-height = 20 px
const WALL_H  = 36;        // screen-pixel height of raised wall block

// 0=concrete  1=wall  2=pillar  3=neon(lounge)  4=grating  5=track
type Cell = 0 | 1 | 2 | 3 | 4 | 5;

// ── Zone colors ───────────────────────────────────────────────────────────────
const ZONES = [
  { r1:2,  r2:8,  c1:17, c2:32, color:'#9d4edd' },
  { r1:10, r2:21, c1:2,  c2:8,  color:'#f5a623' },
  { r1:9,  r2:21, c1:41, c2:47, color:'#ff2d78' },
  { r1:23, r2:28, c1:16, c2:33, color:'#00f5ff' },
];
function zoneAt(r: number, c: number): string {
  for (const z of ZONES) if (r>=z.r1&&r<=z.r2&&c>=z.c1&&c<=z.c2) return z.color;
  return '#00f5ff';
}

// ── Hex → rgba ────────────────────────────────────────────────────────────────
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n>>16},${(n>>8)&255},${n&255},${a.toFixed(2)})`;
}

// ── Map builder ───────────────────────────────────────────────────────────────
const MAP: Cell[][] = (() => {
  const g: Cell[][] = Array.from({length:ROWS}, () => Array<Cell>(COLS).fill(1));
  const fill = (x1:number,y1:number,x2:number,y2:number,t:Cell) => {
    for (let r=Math.max(0,y1); r<=Math.min(ROWS-1,y2); r++)
      for (let c=Math.max(0,x1); c<=Math.min(COLS-1,x2); c++) g[r][c]=t;
  };
  const wl = (x1:number,y1:number,x2:number,y2:number) => fill(x1,y1,x2,y2,1);
  const pl = (c:number,r:number) => { if(r>0&&r<ROWS-1&&c>0&&c<COLS-1) g[r][c]=2; };

  fill(9, 8, 40, 22, 0);
  fill(17, 2, 32, 7, 3);
  wl(17,7,22,7); wl(27,7,32,7);
  fill(23,7,26,8,3);
  fill(2, 11, 8, 20, 5);
  wl(8,11,8,14); wl(8,18,8,20);
  fill(41, 9, 47, 21, 4);
  wl(41,9,41,13); wl(41,18,41,21);
  fill(16, 23, 33, 28, 4);
  wl(16,23,20,23); wl(29,23,33,23);

  for (const [c,r] of [[13,11],[13,14],[13,17],[13,20],[36,11],[36,14],[36,17],[36,20],[21,11],[21,20],[28,11],[28,20]])
    pl(c,r);
  pl(20,4); pl(29,4);
  for (const [c,r] of [[43,11],[45,11],[43,15],[45,15],[43,19],[45,19]]) pl(c,r);
  return g;
})();

// ── Collision ─────────────────────────────────────────────────────────────────
function walkable(x: number, y: number) {
  const c=Math.floor(x/TILE), r=Math.floor(y/TILE);
  if (r<0||r>=ROWS||c<0||c>=COLS) return false;
  return MAP[r][c]!==1 && MAP[r][c]!==2;
}
function resolveMove(ox:number,oy:number,dx:number,dy:number):[number,number] {
  const R=AVATAR_R-4, nx=ox+dx, ny=oy+dy;
  const xOk=[[nx-R,oy],[nx+R,oy]].every(([px])=>walkable(px,oy));
  const yOk=[[ox,ny-R],[ox,ny+R]].every(([,py])=>walkable(ox,py));
  return [xOk?nx:ox, yOk?ny:oy];
}

// ── Neon signs (world coords) ─────────────────────────────────────────────────
const SIGNS = [
  { wx:24.5*TILE, wy:4.5*TILE,   text:'— VIP LOUNGE —',          color:'#9d4edd', sz:13 },
  { wx:5*TILE,    wy:15.5*TILE,  text:'◄ PLATFORM-A',             color:'#f5a623', sz:11 },
  { wx:44*TILE,   wy:15*TILE,    text:'MARKET ►',                 color:'#ff2d78', sz:11 },
  { wx:24.5*TILE, wy:25.5*TILE,  text:'SERVICE TUNNEL',           color:'#00f5ff', sz:10 },
  { wx:24.5*TILE, wy:9.8*TILE,   text:'[ GLITCHSOUL HIDEOUT ]',   color:'#ff2d78', sz:16 },
];

// ── Particles ─────────────────────────────────────────────────────────────────
const PCOLS = ['#00f5ff','#9d4edd','#ff2d78','#f5a623'];
interface Pt { x:number;y:number;vx:number;vy:number;color:string;alpha:number;size:number; }
function mkPt(): Pt {
  return { x:Math.random()*MAP_W, y:Math.random()*MAP_H,
    vx:(Math.random()-.5)*5, vy:-(Math.random()*12+4),
    color:PCOLS[Math.floor(Math.random()*4)],
    alpha:Math.random()*.5+.1, size:Math.random()*1.5+.4 };
}

// ── Firebase types ────────────────────────────────────────────────────────────
interface RemotePlayer { x:number;y:number;portrait:number;username:string;updatedAt:number; }
interface ChatMsg      { uid:string;username:string;text:string;createdAt:number; }
interface Bubble       { text:string;expiresAt:number; }

// ── Component ─────────────────────────────────────────────────────────────────
export default function LobbyPanel() {
  const hero = useGameStore(s => s.hero);
  const user = useAuthStore(s => s.user);
  const { lang } = useLangStore();

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef   = useRef<HTMLDivElement>(null);

  const heroRef = useRef(hero); heroRef.current = hero;
  const userRef = useRef(user); userRef.current = user;

  const posRef       = useRef({ x: MAP_W/2, y: MAP_H/2 });
  const keysRef      = useRef(new Set<string>());
  const imgCache     = useRef(new Map<number, HTMLImageElement>());
  const remotesRef   = useRef(new Map<string, RemotePlayer>());
  const bubblesRef   = useRef(new Map<string, Bubble>());
  const particlesRef = useRef<Pt[]>(Array.from({length:25}, mkPt));
  const dprRef       = useRef(window.devicePixelRatio||1);
  const logicalSize  = useRef({w:400,h:400});
  const rafRef       = useRef(0);
  const lastWrite    = useRef(0);
  const lastTime     = useRef(0);
  const chatFocus    = useRef(false);
  const joystick     = useRef({active:false,sx:0,sy:0,dx:0,dy:0});

  const [msgs,    setMsgs]    = useState<ChatMsg[]>([]);
  const [input,   setInput]   = useState('');
  const [chatErr, setChatErr] = useState('');

  function getImg(idx: number): HTMLImageElement | null {
    const cache = imgCache.current;
    if (!cache.has(idx)) { const img=new Image(); img.src=portraitSrc(idx); cache.set(idx,img); }
    const img = cache.get(idx)!;
    return img.complete && img.naturalWidth>0 ? img : null;
  }

  // ── Resize (DPR-aware) ────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const resize = () => {
      const canvas = canvasRef.current; if (!canvas) return;
      const dpr = window.devicePixelRatio||1;
      dprRef.current = dpr;
      const lw=el.clientWidth, lh=el.clientHeight;
      logicalSize.current = {w:lw, h:lh};
      canvas.width=lw*dpr; canvas.height=lh*dpr;
      canvas.style.width=lw+'px'; canvas.style.height=lh+'px';
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Firebase: presence ────────────────────────────────────────────────────
  useEffect(() => {
    if (!db||!user) return;
    const selfRef = doc(db,'lobbyPlayers',user.uid);
    setDoc(selfRef,{x:posRef.current.x,y:posRef.current.y,portrait:hero.portrait??0,username:user.username,updatedAt:Date.now()} satisfies RemotePlayer).catch(()=>{});
    const unsub = onSnapshot(collection(db,'lobbyPlayers'), snap => {
      snap.docChanges().forEach(ch => {
        const uid=ch.doc.id; if (uid===user.uid) return;
        if (ch.type==='removed') remotesRef.current.delete(uid);
        else remotesRef.current.set(uid, ch.doc.data() as RemotePlayer);
      });
    }, ()=>{});
    return () => { unsub(); deleteDoc(selfRef).catch(()=>{}); };
  }, [user?.uid]);

  // ── Firebase: chat ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!db) { setChatErr('Firebase not connected'); return; }
    const q = query(collection(db,'lobbyChat'), orderBy('createdAt','desc'), fsLimit(30));
    let first = true;
    const unsub = onSnapshot(q, snap => {
      if (!first) snap.docChanges().forEach(ch => {
        if (ch.type==='added') { const m=ch.doc.data() as ChatMsg; bubblesRef.current.set(m.uid,{text:m.text,expiresAt:Date.now()+BUBBLE_MS}); }
      });
      first = false;
      setMsgs(snap.docs.map(d=>d.data() as ChatMsg).reverse());
      setChatErr('');
    }, err => setChatErr(`Chat error: ${(err as {code?:string}).code??'unknown'} — add Firestore rules for lobbyChat`));
    return unsub;
  }, []);

  const sendMsg = useCallback(async () => {
    const text = input.trim().slice(0,200); if (!text||!db||!userRef.current) return;
    setInput('');
    try {
      await addDoc(collection(db,'lobbyChat'),{uid:userRef.current.uid,username:userRef.current.username,text,createdAt:Date.now()} satisfies ChatMsg);
    } catch(err) { setChatErr(`Send failed: ${(err as {code?:string}).code??'error'}`); }
  }, [input]);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function loop(ts: number) {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min((ts - (lastTime.current||ts)) / 1000, .1);
      lastTime.current = ts;

      const dpr = dprRef.current;
      const {w:cw, h:ch} = logicalSize.current;
      if (!cw||!ch) return;
      ctx.setTransform(dpr,0,0,dpr,0,0);

      // ── Movement ──────────────────────────────────────────────────────────
      if (!chatFocus.current) {
        const k = keysRef.current, j = joystick.current;
        let dx=0, dy=0;
        if (k.has('ArrowLeft')||k.has('a')||k.has('A'))  dx -= 1;
        if (k.has('ArrowRight')||k.has('d')||k.has('D')) dx += 1;
        if (k.has('ArrowUp')||k.has('w')||k.has('W'))    dy -= 1;
        if (k.has('ArrowDown')||k.has('s')||k.has('S'))  dy += 1;
        if (j.active) {
          // Transform screen-space joystick to isometric world directions
          const origMag = Math.sqrt(j.dx*j.dx + j.dy*j.dy);
          if (origMag > 0.01) {
            const wdx = (j.dx + 2*j.dy) / 2;
            const wdy = (2*j.dy - j.dx) / 2;
            const newMag = Math.sqrt(wdx*wdx + wdy*wdy);
            dx += wdx / newMag * origMag;
            dy += wdy / newMag * origMag;
          }
        }
        if (dx!==0&&dy!==0) { dx*=.707; dy*=.707; }
        if (dx!==0||dy!==0) {
          const [nx,ny] = resolveMove(posRef.current.x, posRef.current.y, dx*SPEED*dt, dy*SPEED*dt);
          posRef.current = {x:nx, y:ny};
          if (db&&userRef.current&&ts-lastWrite.current>WRITE_MS) {
            lastWrite.current = ts;
            const u=userRef.current, h=heroRef.current;
            setDoc(doc(db,'lobbyPlayers',u.uid),{x:nx,y:ny,portrait:h.portrait??0,username:u.username,updatedAt:Date.now()} satisfies RemotePlayer,{merge:true}).catch(()=>{});
          }
        }
      }

      const {x:px, y:py} = posRef.current;
      const pulse = Math.sin(ts*.0015)*.5+.5;
      const now = Date.now();

      // ── Isometric projection: center player on screen ─────────────────────
      // iso(wx,wy) → [screen_x, screen_y]
      // sx = (wx-wy - px+py) + cw/2
      // sy = (wx+wy - px-py)/2 + ch/2
      function iso(wx: number, wy: number): [number, number] {
        return [
          (wx - wy - px + py) + cw/2,
          (wx + wy - px - py) / 2 + ch/2,
        ];
      }

      // ── Background ────────────────────────────────────────────────────────
      ctx.fillStyle = '#040408';
      ctx.fillRect(0, 0, cw, ch);

      // ── Tile range to render ──────────────────────────────────────────────
      const BUF = 20;
      const pc  = Math.floor(px/TILE), pr = Math.floor(py/TILE);
      const c0  = Math.max(0, pc-BUF),   c1 = Math.min(COLS-1, pc+BUF);
      const r0  = Math.max(0, pr-BUF),   r1 = Math.min(ROWS-1, pr+BUF);

      // Helper: draw a diamond at iso top-vertex (tx,ty)
      function diamond(tx: number, ty: number) {
        ctx.beginPath();
        ctx.moveTo(tx,           ty);
        ctx.lineTo(tx + ISO_HW,  ty + ISO_HH);
        ctx.lineTo(tx,           ty + ISO_HH*2);
        ctx.lineTo(tx - ISO_HW,  ty + ISO_HH);
        ctx.closePath();
      }

      // ── PASS 1: Floor tiles (no depth sorting needed) ─────────────────────
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const cell = MAP[r][c];
          if (cell === 1 || cell === 2) continue; // drawn in pass 2

          const [tx, ty] = iso(c*TILE, r*TILE);
          if (tx+ISO_HW < -4 || tx-ISO_HW > cw+4 || ty+ISO_HH*2 < -4 || ty > ch+4) continue;

          const zc = zoneAt(r, c);

          if (cell === 0) {
            diamond(tx, ty);
            ctx.fillStyle = (c+r)%2===0 ? '#101020' : '#131328';
            ctx.fill();
            diamond(tx, ty);
            ctx.strokeStyle = 'rgba(255,255,255,0.025)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            diamond(tx, ty);
            ctx.fillStyle = rgba(zc, 0.05+0.02*pulse);
            ctx.fill();
          } else if (cell === 3) {
            diamond(tx, ty);
            ctx.fillStyle = '#0c0620'; ctx.fill();
            diamond(tx, ty);
            ctx.strokeStyle = rgba('#9d4edd', 0.18+0.12*pulse);
            ctx.lineWidth = 0.8; ctx.stroke();
          } else if (cell === 4) {
            diamond(tx, ty);
            ctx.fillStyle = '#060612'; ctx.fill();
            diamond(tx, ty);
            ctx.strokeStyle = rgba('#00f5ff', 0.07);
            ctx.lineWidth = 0.5; ctx.stroke();
          } else if (cell === 5) {
            diamond(tx, ty);
            ctx.fillStyle = '#0a0a0e'; ctx.fill();
            // Rail lines along world-y axis (appear diagonal in iso)
            const [ax, ay] = iso(c*TILE + TILE*0.2, r*TILE);
            const [bx, by] = iso(c*TILE + TILE*0.2, (r+1)*TILE);
            const [cx2, cy2] = iso(c*TILE + TILE*0.8, r*TILE);
            const [dx2, dy2] = iso(c*TILE + TILE*0.8, (r+1)*TILE);
            ctx.save();
            diamond(tx, ty); ctx.clip();
            ctx.strokeStyle = rgba('#a0a0c0', 0.7);
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx2,cy2); ctx.lineTo(dx2,dy2); ctx.stroke();
            ctx.restore();
          }
        }
      }

      // ── PASS 2: Depth-sorted objects ──────────────────────────────────────
      type Item = { d: number; fn: () => void };
      const items: Item[] = [];

      // Walls & pillars
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const cell = MAP[r][c];
          if (cell !== 1 && cell !== 2) continue;
          // Use tile south-corner for depth so avatars walking south of wall render on top
          const depth = (c+1)*TILE + (r+1)*TILE;
          const cc=c, rr=r, cellc=cell;
          items.push({ d: depth, fn: () => {
            const wx=cc*TILE, wy=rr*TILE;
            const [tx,ty] = iso(wx, wy);
            if (tx+ISO_HW < -4 || tx-ISO_HW > cw+4 || ty+ISO_HH*2 < -WALL_H-4 || ty > ch+4) return;

            const zc = zoneAt(rr, cc);

            // Dark ground plate under block
            diamond(tx, ty);
            ctx.fillStyle = '#040408'; ctx.fill();

            if (cellc === 2) {
              // ── Pillar (circular column) ────────────────────────────────
              const [colX, colY] = iso(wx + TILE/2, wy + TILE/2);
              const pr2 = 9;
              const H2 = Math.round(WALL_H * 0.85);

              // Shaft (gradient rectangle, clipped behind front of tile)
              ctx.save();
              diamond(tx, ty); ctx.clip();
              const shG = ctx.createLinearGradient(colX-pr2, 0, colX+pr2, 0);
              shG.addColorStop(0, rgba(zc, 0.45));
              shG.addColorStop(0.5, rgba(zc, 0.7));
              shG.addColorStop(1, rgba(zc, 0.45));
              ctx.fillStyle = shG;
              ctx.fillRect(colX-pr2, colY-H2, pr2*2, H2+2);
              ctx.restore();

              // Base ellipse
              ctx.beginPath();
              ctx.ellipse(colX, colY, pr2+2, (pr2+2)*0.4, 0, 0, Math.PI*2);
              ctx.fillStyle = rgba(zc, 0.5); ctx.fill();

              // Cap ellipse (glow)
              ctx.beginPath();
              ctx.ellipse(colX, colY-H2, pr2+3, (pr2+3)*0.4, 0, 0, Math.PI*2);
              ctx.fillStyle = rgba(zc, 0.85+0.12*pulse);
              ctx.shadowBlur = 10; ctx.shadowColor = zc;
              ctx.fill(); ctx.shadowBlur = 0;
            } else {
              // ── Solid wall block ─────────────────────────────────────────
              const H = WALL_H;

              // Left face (NW — darker)
              ctx.beginPath();
              ctx.moveTo(tx,          ty);
              ctx.lineTo(tx - ISO_HW, ty + ISO_HH);
              ctx.lineTo(tx - ISO_HW, ty + ISO_HH - H);
              ctx.lineTo(tx,          ty - H);
              ctx.closePath();
              ctx.fillStyle = rgba(zc, 0.18+0.06*pulse); ctx.fill();

              // Right face (NE — medium)
              ctx.beginPath();
              ctx.moveTo(tx,          ty);
              ctx.lineTo(tx + ISO_HW, ty + ISO_HH);
              ctx.lineTo(tx + ISO_HW, ty + ISO_HH - H);
              ctx.lineTo(tx,          ty - H);
              ctx.closePath();
              ctx.fillStyle = rgba(zc, 0.28+0.07*pulse); ctx.fill();

              // Top face (diamond, raised)
              ctx.beginPath();
              ctx.moveTo(tx,          ty - H);
              ctx.lineTo(tx + ISO_HW, ty + ISO_HH - H);
              ctx.lineTo(tx,          ty + ISO_HH*2 - H);
              ctx.lineTo(tx - ISO_HW, ty + ISO_HH - H);
              ctx.closePath();
              ctx.fillStyle = rgba(zc, 0.45+0.12*pulse); ctx.fill();
              // Edge glow on top
              ctx.strokeStyle = rgba(zc, 0.65+0.2*pulse);
              ctx.lineWidth = 0.8;
              ctx.shadowBlur = 6; ctx.shadowColor = zc;
              ctx.stroke(); ctx.shadowBlur = 0;
            }
          }});
        }
      }

      // Characters
      const addChar = (wx: number, wy: number, portrait: number, local: boolean, name: string, alpha: number, uid: string) => {
        items.push({ d: wx + wy, fn: () => {
          const [sx, sy] = iso(wx, wy);
          const R = AVATAR_R;
          const ay = sy - R; // avatar center lifted above ground

          ctx.save();
          if (alpha < 1) ctx.globalAlpha = alpha;

          // Ground shadow
          ctx.beginPath();
          ctx.ellipse(sx, sy, R*0.6, R*0.22, 0, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fill();

          // Glow ring
          ctx.beginPath(); ctx.arc(sx, ay, R+3, 0, Math.PI*2);
          ctx.strokeStyle = local ? '#ff2d78' : '#00f5ff';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 14; ctx.shadowColor = local ? '#ff2d78' : '#00f5ff';
          ctx.stroke(); ctx.shadowBlur = 0;

          // Portrait clipped to circle
          ctx.save();
          ctx.beginPath(); ctx.arc(sx, ay, R, 0, Math.PI*2); ctx.clip();
          const img = getImg(portrait);
          if (img) {
            ctx.drawImage(img, sx-R, ay-R, R*2, R*2);
          } else {
            ctx.fillStyle = local ? 'rgba(255,45,120,.5)' : 'rgba(157,78,221,.5)'; ctx.fill();
            ctx.font = `bold ${R}px Orbitron,sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
            ctx.fillText((name[0]??'?').toUpperCase(), sx, ay);
          }
          ctx.restore();

          ctx.restore();

          // Name tag (outside clip)
          ctx.save();
          if (alpha < 1) ctx.globalAlpha = alpha;
          ctx.font = '700 11px "Share Tech Mono",monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          const tw = ctx.measureText(name).width;
          ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(sx-tw/2-4, sy+3, tw+8, 14);
          ctx.fillStyle = local ? '#ff2d78' : '#e0e0e0';
          ctx.fillText(name, sx, sy+4);
          ctx.restore();

          // Speech bubble
          const bub = bubblesRef.current.get(uid);
          if (bub && bub.expiresAt > now) {
            const text = bub.text;
            const PAD=8, LINE=13, MAX=140, TAIL=7;
            ctx.font = '10px "Share Tech Mono",monospace';
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            const words = text.split(' '); const lines: string[] = []; let cur = '';
            for (const w of words) {
              const t = cur ? cur+' '+w : w;
              if (ctx.measureText(t).width > MAX-PAD*2 && cur) {
                lines.push(cur); if(lines.length>=2){lines.push('...');cur='';break;} cur=w;
              } else cur = t;
            }
            if (cur && lines.length<3) lines.push(cur);
            const bW = Math.min(MAX, Math.max(...lines.map(l=>ctx.measureText(l).width))+PAD*2);
            const bH = lines.length*LINE+PAD;
            const bX = Math.round(sx-bW/2), bY = Math.round(ay-R-TAIL-bH-4), cr = 5;
            const col = local ? '#ff2d78' : '#00f5ff';
            ctx.fillStyle = 'rgba(7,7,20,.94)'; ctx.strokeStyle = col; ctx.lineWidth = 1;
            ctx.shadowBlur = 6; ctx.shadowColor = col;
            ctx.beginPath();
            ctx.moveTo(bX+cr,bY); ctx.lineTo(bX+bW-cr,bY);
            ctx.arcTo(bX+bW,bY,bX+bW,bY+cr,cr); ctx.lineTo(bX+bW,bY+bH-cr);
            ctx.arcTo(bX+bW,bY+bH,bX+bW-cr,bY+bH,cr);
            ctx.lineTo(sx+7,bY+bH); ctx.lineTo(sx,bY+bH+TAIL); ctx.lineTo(sx-7,bY+bH);
            ctx.lineTo(bX+cr,bY+bH);
            ctx.arcTo(bX,bY+bH,bX,bY+bH-cr,cr); ctx.lineTo(bX,bY+cr);
            ctx.arcTo(bX,bY,bX+cr,bY,cr);
            ctx.closePath(); ctx.fill(); ctx.shadowBlur=0; ctx.stroke();
            ctx.fillStyle = '#fff';
            lines.forEach((l,i) => ctx.fillText(l, bX+PAD, bY+PAD/2+i*LINE));
          }
        }});
      };

      remotesRef.current.forEach((p, uid) => {
        if (uid === userRef.current?.uid) return;
        addChar(p.x, p.y, p.portrait, false, p.username, now-p.updatedAt>STALE_MS?.3:1, uid);
      });
      const localUid = userRef.current?.uid ?? '';
      addChar(px, py, heroRef.current.portrait??0, true, userRef.current?.username??heroRef.current.name, 1, localUid);

      // Neon signs (floating above ground)
      for (const s of SIGNS) {
        const ss = s;
        items.push({ d: ss.wx + ss.wy, fn: () => {
          const [sx, sy] = iso(ss.wx, ss.wy);
          const signY = sy - WALL_H - 8;
          if (sx < -200 || sx > cw+200 || signY < -30 || signY > ch+30) return;
          const sp = Math.sin(ts*.0012)*.25+.75;
          ctx.save();
          ctx.font = `900 ${ss.sz}px "Orbitron",monospace`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.shadowBlur = 22*sp; ctx.shadowColor = ss.color;
          ctx.fillStyle = rgba(ss.color, 0.88*sp);
          ctx.fillText(ss.text, sx, signY);
          ctx.shadowBlur = 5;
          ctx.fillStyle = rgba(ss.color, 0.38);
          ctx.fillText(ss.text, sx, signY);
          ctx.restore();
        }});
      }

      // Sort ascending (furthest from camera first) then render
      items.sort((a,b) => a.d - b.d);
      for (const item of items) item.fn();

      // ── Particles (world-pos to iso screen) ──────────────────────────────
      const pts = particlesRef.current;
      for (let i=0; i<pts.length; i++) {
        const p = pts[i];
        p.x+=p.vx*dt*8; p.y+=p.vy*dt*8; p.alpha-=dt*.06;
        if (p.alpha<=0||p.y<0||p.x<0||p.x>MAP_W||p.y>MAP_H) { pts[i]=mkPt(); continue; }
        const [sx,sy] = iso(p.x, p.y);
        if (sx<-5||sx>cw+5||sy<-5||sy>ch+5) continue;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 4; ctx.shadowColor = p.color;
        ctx.fillRect(sx-p.size*.5, sy-p.size*.5, p.size, p.size);
        ctx.restore();
      }

      // ── HUD ───────────────────────────────────────────────────────────────
      ctx.font = '700 10px "Share Tech Mono",monospace';
      const hudTxt = `● ${remotesRef.current.size+1} ONLINE`;
      ctx.textAlign = 'right';
      const hudW = ctx.measureText(hudTxt).width + 16;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(cw-hudW-4, 6, hudW, 18);
      ctx.fillStyle = '#00f5ff'; ctx.fillText(hudTxt, cw-8, 19);
      const hint = 'WASD / arrows / touch';
      ctx.textAlign = 'left';
      const hintW = ctx.measureText(hint).width + 16;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(4, 6, hintW, 18);
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillText(hint, 12, 19);

      // ── Scanlines ─────────────────────────────────────────────────────────
      ctx.save(); ctx.globalAlpha = .025; ctx.fillStyle = '#000';
      for (let y=0; y<ch; y+=3) ctx.fillRect(0, y, cw, 1);
      ctx.restore();

      // ── Joystick ──────────────────────────────────────────────────────────
      const j = joystick.current;
      if (j.active) {
        const jR = 40;
        ctx.save(); ctx.globalAlpha = .25;
        ctx.beginPath(); ctx.arc(j.sx, j.sy, jR, 0, Math.PI*2);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        ctx.save(); ctx.globalAlpha = .6;
        ctx.beginPath(); ctx.arc(j.sx+j.dx*jR, j.sy+j.dy*jR, 18, 0, Math.PI*2);
        ctx.fillStyle = '#ff2d78'; ctx.fill(); ctx.restore();
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    const MOVE=new Set(['w','a','s','d','W','A','S','D','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
    const dn=(e:KeyboardEvent)=>{if(!chatFocus.current&&MOVE.has(e.key))e.preventDefault();keysRef.current.add(e.key);};
    const up=(e:KeyboardEvent)=>keysRef.current.delete(e.key);
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up);};
  },[]);

  // ── Touch ─────────────────────────────────────────────────────────────────
  const onTouchStart=useCallback((e:React.TouchEvent)=>{
    const t=e.touches[0],r=canvasRef.current!.getBoundingClientRect();
    joystick.current={active:true,sx:t.clientX-r.left,sy:t.clientY-r.top,dx:0,dy:0};
  },[]);
  const onTouchMove=useCallback((e:React.TouchEvent)=>{
    e.preventDefault();
    const t=e.touches[0],r=canvasRef.current!.getBoundingClientRect();
    const ddx=t.clientX-r.left-joystick.current.sx, ddy=t.clientY-r.top-joystick.current.sy;
    const len=Math.sqrt(ddx*ddx+ddy*ddy);
    if(len<5){joystick.current.dx=0;joystick.current.dy=0;return;}
    const s=Math.min(len,40)/40;
    joystick.current.dx=(ddx/len)*s; joystick.current.dy=(ddy/len)*s;
  },[]);
  const onTouchEnd=useCallback(()=>{joystick.current={active:false,sx:0,sy:0,dx:0,dy:0};},[]);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[msgs]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#040408'}}>
      <div ref={containerRef} style={{flex:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{display:'block',touchAction:'none'}}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}/>
      </div>
      <div style={{flexShrink:0,height:160,background:'#080810',borderTop:'1px solid rgba(255,45,120,.2)',display:'flex',flexDirection:'column'}}>
        {chatErr&&(
          <div style={{flexShrink:0,padding:'3px 10px',background:'rgba(255,45,120,.1)',borderBottom:'1px solid rgba(255,45,120,.25)',fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'#ff2d78'}}>
            ⚠ {chatErr}
          </div>
        )}
        <div style={{flex:1,overflowY:'auto',padding:'6px 10px',display:'flex',flexDirection:'column',gap:2}}>
          {msgs.length===0&&!chatErr&&(
            <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'rgba(255,255,255,.2)'}}>
              {lang==='en'?'No messages yet. Say hi!':'Brak wiadomości. Napisz coś!'}
            </span>
          )}
          {msgs.map((m,i)=>(
            <div key={i} style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,lineHeight:1.4}}>
              <span style={{color:'#ff2d78',marginRight:5}}>{m.username}:</span>
              <span style={{color:'rgba(255,255,255,.85)'}}>{m.text}</span>
            </div>
          ))}
          <div ref={chatEndRef}/>
        </div>
        <div style={{display:'flex',gap:6,padding:'6px 10px',borderTop:'1px solid rgba(255,255,255,.04)'}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onFocus={()=>{chatFocus.current=true;}} onBlur={()=>{chatFocus.current=false;}}
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();sendMsg();}}}
            placeholder={lang==='en'?'Type a message...':'Napisz wiadomość...'} maxLength={200}
            style={{flex:1,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,45,120,.2)',outline:'none',color:'#fff',padding:'5px 10px',fontFamily:"'Share Tech Mono',monospace",fontSize:11}}/>
          <button onClick={sendMsg} style={{background:'rgba(255,45,120,.12)',color:'#ff2d78',border:'1px solid rgba(255,45,120,.35)',cursor:'pointer',padding:'5px 14px',fontFamily:"'Orbitron',monospace",fontSize:9,fontWeight:700}}>
            {lang==='en'?'SEND':'WYŚLIJ'}
          </button>
        </div>
      </div>
    </div>
  );
}
