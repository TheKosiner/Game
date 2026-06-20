import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useLangStore } from '../store/langStore';

interface Props {
  streakDays: number;
  streakMilestone: 'epic' | 'legendary' | null;
  chestGems: number;
  gemsAdded: number;
  onClose: () => void;
}

function cyclePos(streak: number): number {
  const pos = streak % 5;
  return pos === 0 ? 5 : pos;
}

const CSS = `
@keyframes sm-fire {
  0%,100% { transform: scale(1) rotate(-4deg); filter: drop-shadow(0 0 12px #ff6600); }
  50%      { transform: scale(1.22) rotate(4deg); filter: drop-shadow(0 0 24px #ff4400); }
}
@keyframes sm-chest-bounce {
  0%,100% { transform: translateY(0) scale(1); }
  35%      { transform: translateY(-14px) scale(1.1); }
  65%      { transform: translateY(5px) scale(0.95); }
}
@keyframes sm-sparkle {
  0%   { opacity: 0; transform: scale(0.4) rotate(0deg); }
  50%  { opacity: 1; transform: scale(1.3) rotate(180deg); }
  100% { opacity: 0; transform: scale(0.8) rotate(360deg); }
}
@keyframes sm-gem-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes sm-bar {
  from { width: 0%; }
}
@keyframes sm-pulse-border {
  0%,100% { box-shadow: 0 0 20px var(--mc)44, inset 0 0 20px rgba(0,0,0,0.5); }
  50%      { box-shadow: 0 0 40px var(--mc)88, inset 0 0 20px rgba(0,0,0,0.5); }
}
`;

export default function StreakModal({ streakDays, streakMilestone, chestGems, gemsAdded, onClose }: Props) {
  const isEn = useLangStore(s => s.lang) === 'en';
  const [showChest, setShowChest] = useState(false);
  const [opened, setOpened] = useState(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);

  const isLegendary  = streakMilestone === 'legendary';
  const isEpic       = streakMilestone === 'epic';
  const hasMilestone = isEpic || isLegendary;
  const pos          = cyclePos(streakDays);
  const nextMile     = hasMilestone ? (isLegendary ? 20 : 5) : (pos < 5 ? 5 - pos : 0);

  const mainColor = isLegendary ? '#ffd700' : isEpic ? '#a855f7' : '#ff2d78';
  const palette: [number,number,number][] = isLegendary
    ? [[1,0.84,0],[1,0.5,0],[0.9,0.3,0],[1,1,0.4]]
    : isEpic
    ? [[0.66,0.33,0.97],[0.9,0.2,0.9],[0,0.96,1],[0.8,0.4,1]]
    : [[1,0.18,0.47],[0,0.96,1],[0.62,0.31,0.93],[1,0.84,0]];

  // Three.js particles
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = window.innerWidth, h = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
    camera.position.z = 5;

    const COUNT = 350;
    const positions  = new Float32Array(COUNT * 3);
    const colors     = new Float32Array(COUNT * 3);
    const velocities = Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.01,
    }));

    for (let i = 0; i < COUNT; i++) {
      const r = Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.random() * Math.PI;
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      const b = 0.5 + Math.random() * 0.5;
      colors[i*3] = c[0]*b; colors[i*3+1] = c[1]*b; colors[i*3+2] = c[2]*b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.055, vertexColors: true,
      transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    gsap.to(mat, { opacity: 0.9, duration: 0.8, ease: 'power2.out' });

    let rafId = 0, frame = 0;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      frame++;
      for (let i = 0; i < COUNT; i++) {
        posAttr.array[i*3]   += velocities[i].x;
        posAttr.array[i*3+1] += velocities[i].y;
        posAttr.array[i*3+2] += velocities[i].z;
      }
      posAttr.needsUpdate = true;
      pts.rotation.y += 0.002;
      pts.rotation.x += 0.001;
      if (frame > 70) mat.opacity = Math.max(0.15, mat.opacity - 0.0008);
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GSAP card entry
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, scale: 0.72, filter: 'blur(18px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power3.out', delay: 0.1 },
    );
  }, []);

  useEffect(() => {
    if (hasMilestone) {
      const t = setTimeout(() => setShowChest(true), 750);
      return () => clearTimeout(t);
    }
  }, [hasMilestone]);

  return (
    <>
      <style>{CSS}</style>
      {/* Fullscreen overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(10,0,30,0.96) 0%, rgba(2,0,10,0.98) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
        onClick={onClose}
      >
        {/* Three.js canvas */}
        <div ref={mountRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            `linear-gradient(${mainColor}18 1px, transparent 1px), linear-gradient(90deg, ${mainColor}18 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        {/* Scanlines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
        }} />

        {/* Card */}
        <div
          ref={cardRef}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: 400,
            background: 'linear-gradient(160deg, rgba(8,4,24,0.97) 0%, rgba(4,2,16,0.99) 100%)',
            border: `1px solid ${mainColor}55`,
            boxShadow: `0 0 40px ${mainColor}22, 0 0 80px ${mainColor}0a, inset 0 0 30px rgba(0,0,0,0.6)`,
            padding: '28px 24px 24px',
            display: 'flex', flexDirection: 'column', gap: 20,
            opacity: 0,
          } as React.CSSProperties}
        >
          {/* Neon corner accents */}
          {[
            { top: 0, left: 0, borderTop: `2px solid ${mainColor}`, borderLeft: `2px solid ${mainColor}` },
            { top: 0, right: 0, borderTop: `2px solid ${mainColor}`, borderRight: `2px solid ${mainColor}` },
            { bottom: 0, left: 0, borderBottom: `2px solid ${mainColor}`, borderLeft: `2px solid ${mainColor}` },
            { bottom: 0, right: 0, borderBottom: `2px solid ${mainColor}`, borderRight: `2px solid ${mainColor}` },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 16, height: 16, ...s }} />
          ))}

          {/* Header: fire + number */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, lineHeight: 1, display: 'inline-block', animation: 'sm-fire 0.85s ease-in-out infinite' }}>
              🔥
            </div>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 52, fontWeight: 900, lineHeight: 1,
              color: mainColor,
              textShadow: `0 0 20px ${mainColor}, 0 0 40px ${mainColor}88`,
              marginTop: 6,
              letterSpacing: '-0.02em',
            }}>
              {streakDays}
            </div>
            <p style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11, letterSpacing: '0.25em',
              color: `${mainColor}cc`,
              marginTop: 4,
              textTransform: 'uppercase',
            }}>
              {isEn
                ? `day${streakDays === 1 ? '' : 's'} in a row`
                : streakDays === 1 ? 'dzień z rzędu' : 'dni z rzędu'}
            </p>
          </div>

          {/* 5-day cycle progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {[1,2,3,4,5].map(i => {
                const filled = i <= pos;
                const isMile = i === 5;
                const dotColor = isMile ? '#ffd700' : mainColor;
                return (
                  <div key={i} style={{
                    width: 38, height: 38,
                    borderRadius: 4,
                    background: filled
                      ? `linear-gradient(135deg, ${dotColor}33, ${dotColor}66)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${filled ? dotColor : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: filled ? `0 0 12px ${dotColor}66, inset 0 0 8px ${dotColor}22` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: isMile ? 18 : 13,
                    color: filled ? dotColor : 'rgba(255,255,255,0.15)',
                    transition: 'all 0.3s',
                  }}>
                    {isMile ? '🏆' : filled ? '✓' : i}
                  </div>
                );
              })}
            </div>

            {/* Bar */}
            <div style={{
              height: 6, borderRadius: 3, overflow: 'hidden',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                height: '100%',
                width: `${(pos / 5) * 100}%`,
                background: pos === 5
                  ? `linear-gradient(90deg, ${mainColor}, #ffd700)`
                  : `linear-gradient(90deg, ${mainColor}88, ${mainColor})`,
                boxShadow: `0 0 8px ${mainColor}`,
                animation: 'sm-bar 0.7s ease-out',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', right: 0, top: -1, bottom: -1, width: 3,
                  background: '#fff', boxShadow: `0 0 6px #fff, 0 0 12px ${mainColor}`,
                }} />
              </div>
            </div>

            <p style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9, letterSpacing: '0.15em',
              color: hasMilestone ? mainColor : 'rgba(255,255,255,0.35)',
              textAlign: 'center',
              textTransform: 'uppercase',
            }}>
              {hasMilestone
                ? (isEn ? '★ Milestone reached!' : '★ Kamień milowy!')
                : (isEn ? `${nextMile} more day${nextMile===1?'':'s'} to epic chest` : `Jeszcze ${nextMile} ${nextMile===1?'dzień':'dni'} do skrzynki`)}
            </p>
          </div>

          {/* Gem reward */}
          {gemsAdded > 0 && <div style={{
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.18)',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 0 16px rgba(0,229,255,0.05)',
          }}>
            <span style={{ fontSize: 20 }}>💎</span>
            <span style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 15, fontWeight: 700,
              color: '#00e5ff',
              textShadow: '0 0 12px #00e5ff',
            }}>+{gemsAdded}</span>
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.1em',
            }}>
              {isEn ? 'GEMS' : 'KLEJNOTÓW'}
            </span>
            {streakDays > 1 && (
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 9, color: 'rgba(255,255,255,0.25)',
              }}>
                {isEn ? '+ streak bonus' : '+ bonus serii'}
              </span>
            )}
          </div>}

          {/* Milestone chest */}
          {hasMilestone && showChest && !opened && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{
                fontSize: 64,
                animation: 'sm-chest-bounce 1.1s ease-in-out infinite',
                cursor: 'pointer',
                filter: `drop-shadow(0 0 20px ${mainColor}) drop-shadow(0 0 40px ${mainColor}88)`,
                lineHeight: 1,
              }}
                onClick={() => setOpened(true)}
              >
                {isLegendary ? '👑' : '🎁'}
              </div>
              <p style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 11, fontWeight: 700,
                color: mainColor,
                textShadow: `0 0 12px ${mainColor}`,
                letterSpacing: '0.1em',
              }}>
                {isLegendary
                  ? (isEn ? '⚡ LEGENDARY CHEST' : '⚡ LEGENDARNA SKRZYNKA')
                  : (isEn ? '✦ EPIC CHEST' : '✦ EPICKA SKRZYNKA')}
              </p>
              <p style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em',
              }}>
                {isEn ? 'TAP TO OPEN' : 'KLIKNIJ ABY OTWORZYĆ'}
              </p>
            </div>
          )}

          {/* Chest opened */}
          {hasMilestone && opened && (
            <div style={{ textAlign: 'center', animation: 'sm-gem-pop 0.5s ease-out' }}>
              <div style={{ fontSize: 40, animation: 'sm-sparkle 0.7s ease-out 3', display: 'inline-block' }}>✨</div>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 36, fontWeight: 900,
                color: mainColor,
                textShadow: `0 0 20px ${mainColor}, 0 0 40px ${mainColor}88`,
                marginTop: 6,
              }}>
                +{chestGems} 💎
              </div>
              <p style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em',
                marginTop: 8,
              }}>
                {isEn ? 'GEMS ADDED TO ACCOUNT' : 'KLEJNOTY DODANE DO KONTA'}
              </p>
            </div>
          )}

          {/* Continue button */}
          {(!hasMilestone || opened) && (
            <button
              onClick={onClose}
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
                padding: '12px',
                background: `linear-gradient(135deg, ${mainColor}22, ${mainColor}11)`,
                border: `1px solid ${mainColor}55`,
                color: mainColor,
                textShadow: `0 0 8px ${mainColor}`,
                cursor: 'pointer',
                marginTop: 4,
                transition: 'all 0.2s',
                textTransform: 'uppercase',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = `${mainColor}22`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${mainColor}44`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${mainColor}22, ${mainColor}11)`;
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {isEn ? '▶ Continue' : '▶ Kontynuuj'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
