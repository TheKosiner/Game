import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CyberpunkBg() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 0, 0);

    // ── Grid floor (perspective tron grid scrolling toward viewer) ──
    const GRID_W = 32;
    const GRID_D = 40;
    const positions: number[] = [];
    const colors: number[] = [];

    // Horizontal lines (along X axis, varying Z)
    for (let z = 0; z <= GRID_D; z++) {
      const t = z / GRID_D;
      const r = 1.0 - t * 0.7;
      positions.push(-GRID_W / 2, 0, z - GRID_D / 2 + 2);
      positions.push( GRID_W / 2, 0, z - GRID_D / 2 + 2);
      colors.push(0.0, r * 0.18, r * 0.35);
      colors.push(0.0, r * 0.18, r * 0.35);
    }
    // Vertical lines (along Z axis, varying X)
    for (let x = 0; x <= GRID_W; x++) {
      const t = Math.abs(x - GRID_W / 2) / (GRID_W / 2);
      const fade = 1.0 - t * 0.6;
      positions.push(x - GRID_W / 2, 0, -GRID_D / 2 + 2);
      positions.push(x - GRID_W / 2, 0,  GRID_D / 2 + 2);
      colors.push(0.0, fade * 0.14, fade * 0.28);
      colors.push(0.0, fade * 0.04, fade * 0.08);
    }

    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    gridGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const gridMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7 });
    const gridMesh = new THREE.LineSegments(gridGeo, gridMat);
    gridMesh.rotation.x = -Math.PI * 0.08;
    gridMesh.position.y = -2.5;
    scene.add(gridMesh);

    // ── Particles ────────────────────────────────────────────────
    const PARTICLE_COUNT = 200;
    const pPositions = new Float32Array(PARTICLE_COUNT * 3);
    const pColors    = new Float32Array(PARTICLE_COUNT * 3);
    const pSpeeds    = new Float32Array(PARTICLE_COUNT);

    const palette = [
      [1.0, 0.18, 0.47],  // pink #ff2d78
      [0.0, 0.96, 1.0],   // cyan #00f5ff
      [0.62, 0.31, 0.93], // purple #9d4edd
      [1.0, 0.84, 0.0],   // gold #ffd700
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pPositions[i * 3]     = (Math.random() - 0.5) * 20;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      pSpeeds[i] = 0.002 + Math.random() * 0.006;
      const c = palette[Math.floor(Math.random() * palette.length)];
      const brightness = 0.5 + Math.random() * 0.5;
      pColors[i * 3]     = c[0] * brightness;
      pColors[i * 3 + 1] = c[1] * brightness;
      pColors[i * 3 + 2] = c[2] * brightness;
    }

    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPositions, 3));
    ptGeo.setAttribute('color',    new THREE.Float32BufferAttribute(pColors, 3));
    const ptMat = new THREE.PointsMaterial({
      size: 0.055, vertexColors: true,
      transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const particles = new THREE.Points(ptGeo, ptMat);
    scene.add(particles);

    // ── Pink horizon glow ────────────────────────────────────────
    const horizonGeo = new THREE.PlaneGeometry(30, 1.5);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0xff2d78, transparent: true, opacity: 0.06,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.rotation.x = -Math.PI * 0.08;
    horizon.position.set(0, -2.5, -6);
    scene.add(horizon);

    // ── Vertical neon pillars ────────────────────────────────────
    const pillarColors = [0xff2d78, 0x00f5ff, 0x9d4edd];
    const pillars: THREE.Mesh[] = [];
    [-8, -4, 0, 4, 8].forEach((x, i) => {
      const geo = new THREE.PlaneGeometry(0.04, 12);
      const mat = new THREE.MeshBasicMaterial({
        color: pillarColors[i % 3], transparent: true, opacity: 0.08,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0, -10);
      scene.add(mesh);
      pillars.push(mesh);
    });

    // ── Scan line ────────────────────────────────────────────────
    const scanGeo = new THREE.PlaneGeometry(30, 0.08);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const scan = new THREE.Mesh(scanGeo, scanMat);
    scene.add(scan);
    let scanY = 8;

    // ── Resize ───────────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ── Animation loop ───────────────────────────────────────────
    let frame = 0;
    let rafId = 0;
    const posAttr = ptGeo.getAttribute('position') as THREE.BufferAttribute;

    const animate = () => {
      if (document.hidden) {
        rafId = requestAnimationFrame(animate);
        return;
      }
      rafId = requestAnimationFrame(animate);
      frame++;

      // Scroll grid forward slowly
      gridMesh.position.z = (frame * 0.04) % 1.25;

      // Float particles upward, wrap
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        posAttr.array[i * 3 + 1] += pSpeeds[i];
        if (posAttr.array[i * 3 + 1] > 7) {
          posAttr.array[i * 3 + 1] = -7;
        }
      }
      posAttr.needsUpdate = true;

      // Scan line sweep downward
      scanY -= 0.04;
      if (scanY < -8) scanY = 8;
      scan.position.set(0, scanY, -2);

      // Pulse horizon glow
      horizonMat.opacity = 0.04 + 0.03 * Math.sin(frame * 0.02);

      // Pulse pillars
      pillars.forEach((p, i) => {
        (p.material as THREE.MeshBasicMaterial).opacity =
          0.05 + 0.04 * Math.sin(frame * 0.018 + i * 1.2);
      });

      // Slow camera drift
      camera.position.x = Math.sin(frame * 0.003) * 0.4;
      camera.position.y = 3 + Math.sin(frame * 0.005) * 0.2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
