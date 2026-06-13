import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Neon data-stream columns + hex node grid
export default function CyberpunkBg() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 14, 22);
    camera.lookAt(0, 0, 0);

    // ── HEX GRID NODES ─────────────────────────────────────────────
    // Generate hex grid positions on the XZ plane
    const HEX_R = 1.2;
    const HEX_ROWS = 12;
    const HEX_COLS = 20;

    type NodeInfo = { pos: THREE.Vector3; color: number; phase: number };
    const nodes: NodeInfo[] = [];

    const palette = [
      0xff2d78, // pink
      0x00f5ff, // cyan
      0x9d4edd, // purple
      0xffd700, // gold
      0x00ff88, // green
    ];

    for (let row = -HEX_ROWS / 2; row < HEX_ROWS / 2; row++) {
      for (let col = -HEX_COLS / 2; col < HEX_COLS / 2; col++) {
        const x = col * HEX_R * 1.73 + (row % 2) * HEX_R * 0.866;
        const z = row * HEX_R * 1.5;
        nodes.push({
          pos: new THREE.Vector3(x, 0, z),
          color: palette[Math.floor(Math.random() * palette.length)],
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // Node dots
    const nodeGeo = new THREE.BufferGeometry();
    const nodePos = new Float32Array(nodes.length * 3);
    const nodeCol = new Float32Array(nodes.length * 3);
    nodes.forEach((n, i) => {
      nodePos[i * 3]     = n.pos.x;
      nodePos[i * 3 + 1] = n.pos.y;
      nodePos[i * 3 + 2] = n.pos.z;
      const c = new THREE.Color(n.color);
      nodeCol[i * 3]     = c.r * 0.3;
      nodeCol[i * 3 + 1] = c.g * 0.3;
      nodeCol[i * 3 + 2] = c.b * 0.3;
    });
    nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute('color',    new THREE.Float32BufferAttribute(nodeCol, 3));
    const nodeMat = new THREE.PointsMaterial({
      size: 0.14, vertexColors: true,
      transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const nodeMesh = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodeMesh);

    // ── GRID LINES (connect adjacent nodes) ────────────────────────
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    const DIST_THRESH = HEX_R * 1.9;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].pos.distanceTo(nodes[j].pos) < DIST_THRESH) {
          linePositions.push(nodes[i].pos.x, 0, nodes[i].pos.z);
          linePositions.push(nodes[j].pos.x, 0, nodes[j].pos.z);
          const ci = new THREE.Color(nodes[i].color);
          const cj = new THREE.Color(nodes[j].color);
          lineColors.push(ci.r * 0.08, ci.g * 0.08, ci.b * 0.08);
          lineColors.push(cj.r * 0.08, cj.g * 0.08, cj.b * 0.08);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color',    new THREE.Float32BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // ── ENERGY PACKETS (flowing glowing dots on lines) ────────────
    const PACKET_COUNT = 60;
    type Packet = { ni: number; nj: number; t: number; speed: number; color: THREE.Color };
    const adjacentPairs: Array<[number, number]> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].pos.distanceTo(nodes[j].pos) < DIST_THRESH) {
          adjacentPairs.push([i, j]);
        }
      }
    }

    const packets: Packet[] = Array.from({ length: PACKET_COUNT }, () => {
      const pair = adjacentPairs[Math.floor(Math.random() * adjacentPairs.length)];
      return {
        ni: pair[0], nj: pair[1], t: Math.random(),
        speed: 0.008 + Math.random() * 0.014,
        color: new THREE.Color(palette[Math.floor(Math.random() * palette.length)]),
      };
    });

    const packetGeo = new THREE.BufferGeometry();
    const packetPos = new Float32Array(PACKET_COUNT * 3);
    const packetCol = new Float32Array(PACKET_COUNT * 3);
    packetGeo.setAttribute('position', new THREE.Float32BufferAttribute(packetPos, 3));
    packetGeo.setAttribute('color',    new THREE.Float32BufferAttribute(packetCol, 3));
    const packetMat = new THREE.PointsMaterial({
      size: 0.28, vertexColors: true,
      transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Points(packetGeo, packetMat));

    // ── VERTICAL GLOWING COLUMNS (data rain effect, above the grid) ─
    const COL_COUNT = 60;
    const PARTICLES_PER_COL = 10;
    const TOTAL_RAIN = COL_COUNT * PARTICLES_PER_COL;

    type ColInfo = { x: number; z: number; speed: number; color: THREE.Color };
    const columns: ColInfo[] = Array.from({ length: COL_COUNT }, () => ({
      x: (Math.random() - 0.5) * 24,
      z: (Math.random() - 0.5) * 20,
      speed: 0.08 + Math.random() * 0.12,
      color: new THREE.Color(palette[Math.floor(Math.random() * palette.length)]),
    }));

    const rainPos = new Float32Array(TOTAL_RAIN * 3);
    const rainCol = new Float32Array(TOTAL_RAIN * 3);
    const rainY   = new Float32Array(TOTAL_RAIN);

    for (let c = 0; c < COL_COUNT; c++) {
      for (let p = 0; p < PARTICLES_PER_COL; p++) {
        const i = c * PARTICLES_PER_COL + p;
        rainPos[i * 3]     = columns[c].x;
        rainPos[i * 3 + 1] = 8 + Math.random() * 20;
        rainPos[i * 3 + 2] = columns[c].z;
        rainY[i] = rainPos[i * 3 + 1];
        const t = p / (PARTICLES_PER_COL - 1); // head=0, tail=1
        const brightness = (1 - t) * 0.9 + 0.05;
        rainCol[i * 3]     = columns[c].color.r * brightness;
        rainCol[i * 3 + 1] = columns[c].color.g * brightness;
        rainCol[i * 3 + 2] = columns[c].color.b * brightness;
      }
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rainPos, 3));
    rainGeo.setAttribute('color',    new THREE.Float32BufferAttribute(rainCol, 3));
    const rainMat = new THREE.PointsMaterial({
      size: 0.12, vertexColors: true,
      transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Points(rainGeo, rainMat));

    // ── HORIZON GLOW ────────────────────────────────────────────────
    const horizonGeo = new THREE.PlaneGeometry(40, 0.8);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0xff2d78, transparent: true, opacity: 0.07,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.rotation.x = Math.PI / 2;
    horizon.position.set(0, 0, -8);
    scene.add(horizon);

    // ── RESIZE ──────────────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ── ANIMATION LOOP ───────────────────────────────────────────────
    let rafId = 0;
    let frame = 0;
    const nodeColAttr   = nodeGeo.getAttribute('color') as THREE.BufferAttribute;
    const packetPosAttr = packetGeo.getAttribute('position') as THREE.BufferAttribute;
    const packetColAttr = packetGeo.getAttribute('color') as THREE.BufferAttribute;
    const rainPosAttr   = rainGeo.getAttribute('position') as THREE.BufferAttribute;

    const animate = () => {
      if (document.hidden) { rafId = requestAnimationFrame(animate); return; }
      rafId = requestAnimationFrame(animate);
      frame++;

      // Pulse node brightness with phase
      for (let i = 0; i < nodes.length; i++) {
        const pulse = 0.12 + 0.18 * Math.abs(Math.sin(frame * 0.018 + nodes[i].phase));
        const c = new THREE.Color(nodes[i].color);
        nodeColAttr.array[i * 3]     = c.r * pulse;
        nodeColAttr.array[i * 3 + 1] = c.g * pulse;
        nodeColAttr.array[i * 3 + 2] = c.b * pulse;
      }
      nodeColAttr.needsUpdate = true;

      // Move energy packets along edges
      for (let k = 0; k < PACKET_COUNT; k++) {
        const pkt = packets[k];
        pkt.t += pkt.speed;
        if (pkt.t > 1) {
          pkt.t = 0;
          const pair = adjacentPairs[Math.floor(Math.random() * adjacentPairs.length)];
          pkt.ni = pair[0]; pkt.nj = pair[1];
          pkt.color = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
        }
        const a = nodes[pkt.ni].pos;
        const b = nodes[pkt.nj].pos;
        packetPosAttr.array[k * 3]     = a.x + (b.x - a.x) * pkt.t;
        packetPosAttr.array[k * 3 + 1] = a.y;
        packetPosAttr.array[k * 3 + 2] = a.z + (b.z - a.z) * pkt.t;
        const glow = 0.7 + 0.3 * Math.sin(frame * 0.04 + k);
        packetColAttr.array[k * 3]     = pkt.color.r * glow;
        packetColAttr.array[k * 3 + 1] = pkt.color.g * glow;
        packetColAttr.array[k * 3 + 2] = pkt.color.b * glow;
      }
      packetPosAttr.needsUpdate = true;
      packetColAttr.needsUpdate = true;

      // Fall data rain
      for (let i = 0; i < TOTAL_RAIN; i++) {
        const col = Math.floor(i / PARTICLES_PER_COL);
        rainPosAttr.array[i * 3 + 1] -= columns[col].speed;
        if (rainPosAttr.array[i * 3 + 1] < -2) {
          rainPosAttr.array[i * 3 + 1] = 22 + Math.random() * 8;
        }
      }
      rainPosAttr.needsUpdate = true;

      // Slow camera drift
      camera.position.x = Math.sin(frame * 0.004) * 1.5;
      camera.position.z = 22 + Math.sin(frame * 0.006) * 1.0;
      camera.lookAt(0, 0, 0);

      // Horizon pulse
      horizonMat.opacity = 0.05 + 0.04 * Math.sin(frame * 0.02);

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
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
