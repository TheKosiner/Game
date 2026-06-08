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

// ── Map constants ─────────────────────────────────────────────────────────────
const TILE     = 40;
const COLS     = 50;
const ROWS     = 32;
const MAP_W    = COLS * TILE;
const MAP_H    = ROWS * TILE;
const WALL_T   = 3;
const SPEED    = 180;  // px/s
const AVATAR_R = 28;   // larger → sharper portraits
const WRITE_MS = 400;
const STALE_MS = 30_000;
const BUBBLE_MS = 5_000;

// ── Colors ────────────────────────────────────────────────────────────────────
const FLOOR_EVEN  = '#13131f';
const FLOOR_ODD   = '#181828';
const WALL_COL    = '#0a0a15';
const WALL_GLOW   = '#e94560';
const PILLAR_COL  = '#0e0e22';
const PILLAR_EDGE = '#9d4edd';
const ACCENT = '#ff2d78';
const CYAN   = '#00f5ff';

// ── Static map ────────────────────────────────────────────────────────────────
type Cell = 0 | 1 | 2;

const MAP: Cell[][] = (() => {
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  const grid: Cell[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) =>
      r < WALL_T || r >= ROWS - WALL_T || c < WALL_T || c >= COLS - WALL_T ? 1 : 0
    ) as Cell[]
  );
  for (let r = WALL_T + 3; r < ROWS - WALL_T - 2; r += 5)
    for (let c = WALL_T + 3; c < COLS - WALL_T - 2; c += 6)
      if (!(Math.abs(r - cy) < 4 && Math.abs(c - cx) < 5)) grid[r][c] = 2;
  return grid;
})();

// ── Collision ─────────────────────────────────────────────────────────────────
function walkable(x: number, y: number) {
  const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
  return r >= 0 && r < ROWS && c >= 0 && c < COLS && MAP[r][c] === 0;
}
function resolveMove(ox: number, oy: number, dx: number, dy: number): [number, number] {
  const R = AVATAR_R - 4;
  const nx = ox + dx, ny = oy + dy;
  const xOk = [[nx - R, oy], [nx + R, oy]].every(([px]) => walkable(px, oy));
  const yOk = [[ox, ny - R], [ox, ny + R]].every(([, py]) => walkable(ox, py));
  return [xOk ? nx : ox, yOk ? ny : oy];
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface RemotePlayer { x: number; y: number; portrait: number; username: string; updatedAt: number; }
interface ChatMsg      { uid: string; username: string; text: string; createdAt: number; }
interface Bubble       { text: string; expiresAt: number; }
interface AvatarEntry  { sx: number; sy: number; portrait: number; local: boolean; name: string; alpha: number; uid: string; }

// ── Component ─────────────────────────────────────────────────────────────────
export default function LobbyPanel() {
  const hero = useGameStore(s => s.hero);
  const user = useAuthStore(s => s.user);
  const { lang } = useLangStore();

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef   = useRef<HTMLDivElement>(null);

  // Live refs — re-assigned every render so RAF closures always read fresh values
  const heroRef = useRef(hero); heroRef.current = hero;
  const userRef = useRef(user); userRef.current = user;

  // Game state refs
  const posRef        = useRef({ x: MAP_W / 2, y: MAP_H / 2 });
  const keysRef       = useRef(new Set<string>());
  const imgCache      = useRef(new Map<number, HTMLImageElement>());
  const remotesRef    = useRef(new Map<string, RemotePlayer>());
  const bubblesRef    = useRef(new Map<string, Bubble>());
  const dprRef        = useRef(window.devicePixelRatio || 1);
  const logicalSize   = useRef({ w: 400, h: 400 });
  const rafRef        = useRef(0);
  const lastWrite     = useRef(0);
  const lastTime      = useRef(0);
  const chatFocus     = useRef(false);
  const joystick      = useRef({ active: false, sx: 0, sy: 0, dx: 0, dy: 0 });

  const [msgs, setMsgs]         = useState<ChatMsg[]>([]);
  const [input, setInput]       = useState('');
  const [chatErr, setChatErr]   = useState('');

  // Portrait image loader
  function getImg(idx: number): HTMLImageElement | null {
    const cache = imgCache.current;
    if (!cache.has(idx)) {
      const img = new Image();
      img.src = portraitSrc(idx);
      cache.set(idx, img);
    }
    const img = cache.get(idx)!;
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  // ── Canvas resize — DPR-aware ──────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const lw = el.clientWidth;
      const lh = el.clientHeight;
      logicalSize.current = { w: lw, h: lh };
      canvas.width  = lw * dpr;
      canvas.height = lh * dpr;
      canvas.style.width  = lw + 'px';
      canvas.style.height = lh + 'px';
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Firebase: lobby presence ──────────────────────────────────────────────
  useEffect(() => {
    if (!db || !user) return;
    const selfRef = doc(db, 'lobbyPlayers', user.uid);
    setDoc(selfRef, {
      x: posRef.current.x, y: posRef.current.y,
      portrait: hero.portrait ?? 0, username: user.username,
      updatedAt: Date.now(),
    } satisfies RemotePlayer).catch(e => console.warn('lobbyPlayers write:', e));

    const unsub = onSnapshot(collection(db, 'lobbyPlayers'), snap => {
      snap.docChanges().forEach(ch => {
        const uid = ch.doc.id;
        if (uid === user.uid) return;
        if (ch.type === 'removed') remotesRef.current.delete(uid);
        else remotesRef.current.set(uid, ch.doc.data() as RemotePlayer);
      });
    }, e => console.warn('lobbyPlayers snapshot:', e));

    return () => { unsub(); deleteDoc(selfRef).catch(() => {}); };
  }, [user?.uid]);

  // ── Firebase: chat ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!db) { setChatErr(lang === 'en' ? 'Firebase not connected' : 'Brak połączenia z Firebase'); return; }
    const q = query(collection(db, 'lobbyChat'), orderBy('createdAt', 'desc'), fsLimit(30));
    let firstLoad = true;
    const unsub = onSnapshot(q, snap => {
      if (!firstLoad) {
        // Only new 'added' docs after initial load trigger bubbles
        snap.docChanges().forEach(ch => {
          if (ch.type === 'added') {
            const m = ch.doc.data() as ChatMsg;
            bubblesRef.current.set(m.uid, { text: m.text, expiresAt: Date.now() + BUBBLE_MS });
          }
        });
      }
      firstLoad = false;
      setMsgs(snap.docs.map(d => d.data() as ChatMsg).reverse());
      setChatErr('');
    }, err => {
      console.warn('lobbyChat error:', err);
      setChatErr(lang === 'en'
        ? `Chat unavailable (${err.code ?? 'error'}) — check Firestore rules for lobbyChat`
        : `Czat niedostępny (${err.code ?? 'błąd'}) — sprawdź reguły Firestore dla lobbyChat`);
    });
    return unsub;
  }, []);

  const sendMsg = useCallback(async () => {
    const text = input.trim().slice(0, 200);
    if (!text) return;
    if (!db) { setChatErr('Firebase not connected'); return; }
    if (!userRef.current) return;
    setInput('');
    try {
      await addDoc(collection(db, 'lobbyChat'), {
        uid: userRef.current.uid,
        username: userRef.current.username,
        text,
        createdAt: Date.now(),
      } satisfies ChatMsg);
    } catch (err: unknown) {
      const e = err as { code?: string };
      console.warn('lobbyChat addDoc failed:', err);
      setChatErr(lang === 'en'
        ? `Send failed (${e.code ?? 'error'}) — check Firestore rules for lobbyChat`
        : `Błąd wysyłania (${e.code ?? 'błąd'}) — sprawdź reguły Firestore dla lobbyChat`);
    }
  }, [input, lang]);

  // ── Game loop (empty deps — all mutable state via refs) ───────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // ── Draw helpers ────────────────────────────────────────────────────────

    function drawTile(col: number, row: number, camX: number, camY: number) {
      const sx = col * TILE - camX;
      const sy = row * TILE - camY;
      const cell = MAP[row][col];
      if (cell === 1) {
        ctx.fillStyle = WALL_COL;
        ctx.fillRect(sx, sy, TILE, TILE);
        if (row === WALL_T - 1)    { ctx.fillStyle = WALL_GLOW; ctx.fillRect(sx, sy + TILE - 2, TILE, 2); }
        if (row === ROWS - WALL_T) { ctx.fillStyle = WALL_GLOW; ctx.fillRect(sx, sy, TILE, 2); }
        if (col === WALL_T - 1)    { ctx.fillStyle = WALL_GLOW; ctx.fillRect(sx + TILE - 2, sy, 2, TILE); }
        if (col === COLS - WALL_T) { ctx.fillStyle = WALL_GLOW; ctx.fillRect(sx, sy, 2, TILE); }
        return;
      }
      ctx.fillStyle = (col + row) % 2 === 0 ? FLOOR_EVEN : FLOOR_ODD;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
      if (cell === 2) {
        const pw = 20, ph = 28, px = sx + (TILE - pw) / 2, py = sy + (TILE - ph) / 2;
        ctx.fillStyle = PILLAR_COL; ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = PILLAR_EDGE; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
        const g = ctx.createLinearGradient(px, py, px, py + 8);
        g.addColorStop(0, 'rgba(157,78,221,0.5)'); g.addColorStop(1, 'rgba(157,78,221,0)');
        ctx.fillStyle = g; ctx.fillRect(px, py, pw, 8);
      }
    }

    function drawAvatar(e: AvatarEntry) {
      const { sx, sy, portrait, local, name, alpha } = e;
      const R = AVATAR_R;
      ctx.save();
      ctx.globalAlpha = alpha;

      // Ground shadow
      ctx.beginPath();
      ctx.ellipse(sx, sy + R - 2, R * 0.65, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();

      // Glow ring
      ctx.beginPath();
      ctx.arc(sx, sy, R + 3, 0, Math.PI * 2);
      ctx.strokeStyle = local ? ACCENT : CYAN;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 14;
      ctx.shadowColor = local ? ACCENT : CYAN;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Portrait clipped to circle
      ctx.beginPath();
      ctx.arc(sx, sy, R, 0, Math.PI * 2);
      ctx.clip();
      const img = getImg(portrait);
      if (img) {
        ctx.drawImage(img, sx - R, sy - R, R * 2, R * 2);
      } else {
        ctx.fillStyle = local ? 'rgba(255,45,120,0.5)' : 'rgba(157,78,221,0.5)';
        ctx.fill();
        ctx.font = `bold ${R}px Orbitron,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText((name[0] ?? '?').toUpperCase(), sx, sy);
      }
      ctx.restore();

      // Name tag
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '700 11px "Share Tech Mono",monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const tw = ctx.measureText(name).width;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(sx - tw / 2 - 4, sy + R + 3, tw + 8, 15);
      ctx.fillStyle = local ? ACCENT : '#e0e0e0';
      ctx.fillText(name, sx, sy + R + 4);
      ctx.restore();
    }

    function drawBubble(e: AvatarEntry, text: string) {
      const { sx, sy, local } = e;
      const R = AVATAR_R;
      const PAD  = 8;
      const LINE = 13;
      const MAX  = 140;
      const TAIL = 7;

      ctx.save();
      ctx.font = '10px "Share Tech Mono",monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Word-wrap into max 3 lines
      const words = text.split(' ');
      const lines: string[] = [];
      let cur = '';
      for (const w of words) {
        const trial = cur ? cur + ' ' + w : w;
        if (ctx.measureText(trial).width > MAX - PAD * 2 && cur) {
          lines.push(cur);
          if (lines.length >= 2) { lines.push('...'); cur = ''; break; }
          cur = w;
        } else cur = trial;
      }
      if (cur && lines.length < 3) lines.push(cur);

      const bW = Math.min(MAX, Math.max(...lines.map(l => ctx.measureText(l).width)) + PAD * 2);
      const bH = lines.length * LINE + PAD;
      const bX = Math.round(sx - bW / 2);
      const bY = Math.round(sy - R - TAIL - bH - 4);
      const cr = 5;
      const color = local ? ACCENT : CYAN;

      // Bubble shape with downward tail
      ctx.fillStyle = 'rgba(7,7,20,0.94)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 6;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.moveTo(bX + cr, bY);
      ctx.lineTo(bX + bW - cr, bY);
      ctx.arcTo(bX + bW, bY, bX + bW, bY + cr, cr);
      ctx.lineTo(bX + bW, bY + bH - cr);
      ctx.arcTo(bX + bW, bY + bH, bX + bW - cr, bY + bH, cr);
      ctx.lineTo(sx + 7, bY + bH);
      ctx.lineTo(sx, bY + bH + TAIL);
      ctx.lineTo(sx - 7, bY + bH);
      ctx.lineTo(bX + cr, bY + bH);
      ctx.arcTo(bX, bY + bH, bX, bY + bH - cr, cr);
      ctx.lineTo(bX, bY + cr);
      ctx.arcTo(bX, bY, bX + cr, bY, cr);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.stroke();

      // Text
      ctx.fillStyle = '#fff';
      lines.forEach((l, i) => ctx.fillText(l, bX + PAD, bY + PAD / 2 + i * LINE));
      ctx.restore();
    }

    // ── RAF loop ─────────────────────────────────────────────────────────────
    function loop(ts: number) {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min((ts - (lastTime.current || ts)) / 1000, 0.1);
      lastTime.current = ts;

      const dpr = dprRef.current;
      const { w: cw, h: ch } = logicalSize.current;
      if (!cw || !ch) return;

      // Apply DPR scale so all coords are in logical CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Movement
      if (!chatFocus.current) {
        const k = keysRef.current;
        const j = joystick.current;
        let dx = 0, dy = 0;
        if (k.has('ArrowLeft')  || k.has('a') || k.has('A')) dx -= 1;
        if (k.has('ArrowRight') || k.has('d') || k.has('D')) dx += 1;
        if (k.has('ArrowUp')    || k.has('w') || k.has('W')) dy -= 1;
        if (k.has('ArrowDown')  || k.has('s') || k.has('S')) dy += 1;
        if (j.active) { dx += j.dx; dy += j.dy; }
        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
        if (dx !== 0 || dy !== 0) {
          const [nx, ny] = resolveMove(posRef.current.x, posRef.current.y, dx * SPEED * dt, dy * SPEED * dt);
          posRef.current = { x: nx, y: ny };
          if (db && userRef.current && ts - lastWrite.current > WRITE_MS) {
            lastWrite.current = ts;
            const u = userRef.current, h = heroRef.current;
            setDoc(doc(db, 'lobbyPlayers', u.uid), {
              x: nx, y: ny, portrait: h.portrait ?? 0,
              username: u.username, updatedAt: Date.now(),
            } satisfies RemotePlayer, { merge: true }).catch(() => {});
          }
        }
      }

      // Camera
      const { x: px, y: py } = posRef.current;
      const camX = Math.max(0, Math.min(MAP_W - cw, px - cw / 2));
      const camY = Math.max(0, Math.min(MAP_H - ch, py - ch / 2));

      // Background
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, cw, ch);

      // Tiles
      const c0 = Math.max(0, Math.floor(camX / TILE));
      const c1 = Math.min(COLS - 1, Math.ceil((camX + cw) / TILE));
      const r0 = Math.max(0, Math.floor(camY / TILE));
      const r1 = Math.min(ROWS - 1, Math.ceil((camY + ch) / TILE));
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++)
          drawTile(c, r, camX, camY);

      // Build avatar list (Y-sorted for depth)
      const now = Date.now();
      const avatars: AvatarEntry[] = [];
      remotesRef.current.forEach((p, uid) => {
        if (uid === userRef.current?.uid) return;
        const sx = p.x - camX, sy = p.y - camY;
        if (sx < -80 || sx > cw + 80 || sy < -80 || sy > ch + 80) return;
        avatars.push({ sx, sy, portrait: p.portrait, local: false, name: p.username,
          alpha: now - p.updatedAt > STALE_MS ? 0.3 : 1, uid });
      });
      const localUid = userRef.current?.uid ?? '';
      avatars.push({ sx: px - camX, sy: py - camY, portrait: heroRef.current.portrait ?? 0,
        local: true, name: userRef.current?.username ?? heroRef.current.name, alpha: 1, uid: localUid });
      avatars.sort((a, b) => a.sy - b.sy);

      // Pass 1: avatars
      avatars.forEach(e => drawAvatar(e));

      // Pass 2: speech bubbles on top
      const nowTs = Date.now();
      bubblesRef.current.forEach((b, uid) => { if (b.expiresAt <= nowTs) bubblesRef.current.delete(uid); });
      avatars.forEach(e => {
        const b = bubblesRef.current.get(e.uid);
        if (b && b.expiresAt > nowTs) drawBubble(e, b.text);
      });

      // HUD
      ctx.font = '700 10px "Share Tech Mono",monospace';
      const hudText = `● ${remotesRef.current.size + 1} ONLINE`;
      ctx.textAlign = 'right';
      const hudW = ctx.measureText(hudText).width + 16;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(cw - hudW - 4, 6, hudW, 18);
      ctx.fillStyle = CYAN; ctx.fillText(hudText, cw - 8, 19);

      const hint = 'WASD / arrows / touch';
      ctx.textAlign = 'left';
      const hintW = ctx.measureText(hint).width + 16;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(4, 6, hintW, 18);
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillText(hint, 12, 19);

      // Joystick
      const j = joystick.current;
      if (j.active) {
        const jR = 40;
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.beginPath(); ctx.arc(j.sx, j.sy, jR, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(j.sx + j.dx * jR, j.sy + j.dy * jR, 18, 0, Math.PI * 2);
        ctx.fillStyle = ACCENT; ctx.fill();
        ctx.restore();
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const MOVE = new Set(['w','a','s','d','W','A','S','D','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
    const dn = (e: KeyboardEvent) => { if (!chatFocus.current && MOVE.has(e.key)) e.preventDefault(); keysRef.current.add(e.key); };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  // ── Touch joystick ────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0], r = canvasRef.current!.getBoundingClientRect();
    joystick.current = { active: true, sx: t.clientX - r.left, sy: t.clientY - r.top, dx: 0, dy: 0 };
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0], r = canvasRef.current!.getBoundingClientRect();
    const ddx = t.clientX - r.left - joystick.current.sx;
    const ddy = t.clientY - r.top  - joystick.current.sy;
    const len = Math.sqrt(ddx * ddx + ddy * ddy);
    if (len < 5) { joystick.current.dx = 0; joystick.current.dy = 0; return; }
    const s = Math.min(len, 40) / 40;
    joystick.current.dx = (ddx / len) * s;
    joystick.current.dy = (ddy / len) * s;
  }, []);
  const onTouchEnd = useCallback(() => {
    joystick.current = { active: false, sx: 0, sy: 0, dx: 0, dy: 0 };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050508' }}>

      {/* Canvas area */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', touchAction: 'none' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      </div>

      {/* Chat panel */}
      <div style={{
        flexShrink: 0, height: 160,
        background: '#080810',
        borderTop: '1px solid rgba(255,45,120,0.2)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Error banner */}
        {chatErr && (
          <div style={{
            flexShrink: 0, padding: '3px 10px',
            background: 'rgba(255,45,120,0.12)',
            borderBottom: '1px solid rgba(255,45,120,0.3)',
            fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
            color: '#ff2d78',
          }}>
            ⚠ {chatErr}
          </div>
        )}

        {/* Message list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {msgs.length === 0 && !chatErr && (
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
              {lang === 'en' ? 'No messages yet. Say hi!' : 'Brak wiadomości. Napisz coś!'}
            </span>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, lineHeight: 1.4 }}>
              <span style={{ color: '#ff2d78', marginRight: 5 }}>{m.username}:</span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{m.text}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => { chatFocus.current = true; }}
            onBlur={() => { chatFocus.current = false; }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMsg(); } }}
            placeholder={lang === 'en' ? 'Type a message...' : 'Napisz wiadomość...'}
            maxLength={200}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,45,120,0.2)', outline: 'none',
              color: '#fff', padding: '5px 10px',
              fontFamily: "'Share Tech Mono',monospace", fontSize: 11,
            }}
          />
          <button
            onClick={sendMsg}
            style={{
              background: 'rgba(255,45,120,0.12)', color: '#ff2d78',
              border: '1px solid rgba(255,45,120,0.35)', cursor: 'pointer',
              padding: '5px 14px', fontFamily: "'Orbitron',monospace",
              fontSize: 9, fontWeight: 700,
            }}
          >
            {lang === 'en' ? 'SEND' : 'WYŚLIJ'}
          </button>
        </div>
      </div>
    </div>
  );
}
