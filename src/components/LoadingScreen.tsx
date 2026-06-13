import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import logoImg from '../assets/logo.webp';

export const LOADING_MIN_MS = 4000; // minimum screen display time

export default function LoadingScreen({ text }: { text: string }) {
  const mountRef    = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLImageElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const barRef      = useRef<HTMLDivElement>(null);
  const [barW, setBarW] = useState(0);

  // Animated progress bar (fake — just looks good)
  useEffect(() => {
    // 0% → 85% in 2s, then holds waiting for real load
    const obj = { pct: 0 };
    const tl = gsap.timeline();
    tl.to(obj, {
      pct: 85,
      duration: 2.0,
      ease: 'power1.inOut',
      onUpdate: () => setBarW(obj.pct),
    });
    tl.to(obj, {
      pct: 100,
      duration: 0.5,
      ease: 'power2.in',
      delay: 0.2,
      onUpdate: () => setBarW(obj.pct),
    });
    return () => { tl.kill(); };
  }, []);

  // Sync bar width ref for GSAP tweens that need the DOM element
  useEffect(() => {
    if (barRef.current) barRef.current.style.width = `${barW}%`;
  }, [barW]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Three.js burst scene ─────────────────────────────────────
    const w = window.innerWidth;
    const h = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
    camera.position.z = 5;

    // Central burst particles
    const COUNT = 450;
    const positions  = new Float32Array(COUNT * 3);
    const colors     = new Float32Array(COUNT * 3);
    const velocities = Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * 0.022,
      y: (Math.random() - 0.5) * 0.022,
      z: (Math.random() - 0.5) * 0.012,
    }));

    const palette = [
      [1.0, 0.18, 0.47],  // pink
      [0.0, 0.96, 1.0],   // cyan
      [0.62, 0.31, 0.93], // purple
      [1.0, 0.84, 0.0],   // gold
    ];
    for (let i = 0; i < COUNT; i++) {
      const r     = Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.random() * Math.PI;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      const b = 0.55 + Math.random() * 0.45;
      colors[i * 3] = c[0] * b; colors[i * 3 + 1] = c[1] * b; colors[i * 3 + 2] = c[2] * b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.05, vertexColors: true,
      transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    // Ring glow
    const ringGeo = new THREE.RingGeometry(1.2, 1.35, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff2d78, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);

    // Outer ring
    const ring2Geo = new THREE.RingGeometry(2.0, 2.08, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    scene.add(ring2);

    // GSAP animations
    gsap.to(mat,   { opacity: 0.85, duration: 0.9, ease: 'power2.out' });
    gsap.to(ringMat,  { opacity: 0.4, duration: 0.7, delay: 0.2, ease: 'power2.out' });
    gsap.to(ring2Mat, { opacity: 0.25, duration: 0.7, delay: 0.35, ease: 'power2.out' });

    if (titleRef.current) {
      gsap.fromTo(titleRef.current,
        { opacity: 0, scale: 0.55, filter: 'blur(20px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', delay: 0.1 },
      );
    }
    if (subtitleRef.current) {
      gsap.fromTo(subtitleRef.current,
        { opacity: 0, y: 16, letterSpacing: '0.8em' },
        { opacity: 1, y: 0, letterSpacing: '0.3em', duration: 0.8, ease: 'power2.out', delay: 0.6 },
      );
    }

    // ── Animation loop ───────────────────────────────────────────
    let rafId = 0;
    let frame = 0;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      frame++;

      for (let i = 0; i < COUNT; i++) {
        posAttr.array[i * 3]     += velocities[i].x;
        posAttr.array[i * 3 + 1] += velocities[i].y;
        posAttr.array[i * 3 + 2] += velocities[i].z;
      }
      posAttr.needsUpdate = true;

      pts.rotation.y += 0.0025;
      pts.rotation.x += 0.0012;

      ring.rotation.z  -= 0.006;
      ring2.rotation.z += 0.003;

      // Pulse rings
      const pulse = 0.3 + 0.12 * Math.sin(frame * 0.04);
      ringMat.opacity  = Math.max(0, Math.min(0.6, pulse));
      ring2Mat.opacity = Math.max(0, Math.min(0.35, pulse * 0.6));

      if (frame > 80) mat.opacity = Math.max(0.25, mat.opacity - 0.0006);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 50% 55%, #0a0018 0%, #050010 40%, #020008 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Three.js canvas */}
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Subtle radial glow behind logo */}
      <div style={{
        position: 'absolute',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(157,78,221,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
        transform: 'translateY(-10%)',
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(rgba(255,45,120,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,120,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
      }} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <img
          ref={titleRef}
          src={logoImg}
          alt="GlitchSoul"
          style={{
            width: 240, height: 'auto',
            filter: 'drop-shadow(0 0 40px rgba(140,60,255,0.9)) drop-shadow(0 0 80px rgba(0,200,255,0.4))',
            opacity: 0,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: 260 }}>
          <p
            ref={subtitleRef}
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 10, letterSpacing: '0.3em',
              color: '#ff2d78',
              textShadow: '0 0 14px #ff2d78, 0 0 28px rgba(255,45,120,0.4)',
              opacity: 0, margin: 0,
              textTransform: 'uppercase',
            }}
          >
            {text}
          </p>

          {/* Progress bar */}
          <div style={{
            width: '100%', height: 2,
            background: 'rgba(255,45,120,0.1)',
            border: '1px solid rgba(255,45,120,0.15)',
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div ref={barRef} style={{
              height: '100%',
              background: 'linear-gradient(90deg, #9d4edd, #ff2d78, #00f5ff)',
              boxShadow: '0 0 8px rgba(255,45,120,0.8), 0 0 16px rgba(0,245,255,0.4)',
              width: '0%',
              transition: 'width 0.1s linear',
              position: 'relative',
            }}>
              {/* Glowing tip */}
              <div style={{
                position: 'absolute', right: 0, top: -2, bottom: -2, width: 4,
                background: '#fff',
                boxShadow: '0 0 6px #fff, 0 0 12px #00f5ff',
              }} />
            </div>
          </div>

          {/* Percent */}
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, color: 'rgba(0,245,255,0.4)',
            letterSpacing: '0.2em',
          }}>
            {Math.round(barW)}%
          </span>
        </div>
      </div>
    </div>
  );
}
