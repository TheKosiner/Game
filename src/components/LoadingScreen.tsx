import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import logoImg from '../assets/logo.webp';

export default function LoadingScreen({ text }: { text: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLImageElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);

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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
    camera.position.z = 5;

    // Central burst particles
    const COUNT = 350;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const velocities = Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * 0.025,
      y: (Math.random() - 0.5) * 0.025,
      z: (Math.random() - 0.5) * 0.015,
    }));

    const palette = [
      [1.0, 0.18, 0.47],
      [0.0, 0.96, 1.0],
      [0.62, 0.31, 0.93],
    ];
    for (let i = 0; i < COUNT; i++) {
      const r = Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.random() * Math.PI;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      const b = 0.6 + Math.random() * 0.4;
      colors[i * 3] = c[0] * b; colors[i * 3 + 1] = c[1] * b; colors[i * 3 + 2] = c[2] * b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.045, vertexColors: true,
      transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    // Fade particles in
    gsap.to(mat, { opacity: 0.9, duration: 0.8, ease: 'power2.out' });

    // ── GSAP title + subtitle ────────────────────────────────────
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, scale: 0.6, filter: 'blur(16px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out', delay: 0.15 },
      );
    }
    if (subtitleRef.current) {
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.55 },
      );
    }

    // Dots pulse stagger
    const dots = dotRefs.current.filter(Boolean) as HTMLSpanElement[];
    gsap.to(dots, {
      opacity: 0.2,
      repeat: -1,
      yoyo: true,
      duration: 0.5,
      stagger: 0.18,
      ease: 'sine.inOut',
      delay: 0.6,
    });

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
      pts.rotation.y += 0.002;
      pts.rotation.x += 0.001;
      // Fade out particles slowly as they spread
      if (frame > 60) mat.opacity = Math.max(0.3, mat.opacity - 0.0008);
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
      background: 'radial-gradient(ellipse at 50% 60%, #080016 0%, #040408 55%, #000003 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Three.js canvas */}
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(rgba(255,45,120,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,120,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <img
          ref={titleRef}
          src={logoImg}
          alt="GlitchSoul"
          style={{
            width: 220, height: 'auto',
            filter: 'drop-shadow(0 0 32px rgba(140,60,255,0.8)) drop-shadow(0 0 64px rgba(0,200,255,0.35))',
            opacity: 0,
          }}
        />

        {/* Loading indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <p
            ref={subtitleRef}
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 11, letterSpacing: '0.3em',
              color: '#ff2d78',
              textShadow: '0 0 12px #ff2d78',
              opacity: 0, margin: 0,
              textTransform: 'uppercase',
            }}
          >
            {text}
          </p>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <span
                key={i}
                ref={el => { dotRefs.current[i] = el; }}
                style={{
                  display: 'block',
                  width: i === 2 ? 10 : 6,
                  height: i === 2 ? 10 : 6,
                  background: i === 2 ? '#ff2d78' : '#9d4edd',
                  boxShadow: i === 2 ? '0 0 12px #ff2d78' : '0 0 8px #9d4edd',
                  opacity: 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
