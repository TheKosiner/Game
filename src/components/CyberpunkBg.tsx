import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// 3-D floating node network — camera slowly orbits around it
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
    const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 200);

    const palette = [0xff2d78, 0x00f5ff, 0x9d4edd, 0xffd700, 0x00ff88];

    // ── NODES scattered in 3-D space ──────────────────────────────────
    const NODE_COUNT = 180;
    type NodeInfo = { pos: THREE.Vector3; color: number; phase: number };
    const nodes: NodeInfo[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      // Use spherical distribution so they form a cloud
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 4 + Math.random() * 11; // radius 4..15
      nodes.push({
        pos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ),
        color: palette[Math.floor(Math.random() * palette.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Node dots
    const nodeGeo = new THREE.BufferGeometry();
    const nodePos = new Float32Array(NODE_COUNT * 3);
    const nodeCol = new Float32Array(NODE_COUNT * 3);
    nodes.forEach((n, i) => {
      nodePos.set([n.pos.x, n.pos.y, n.pos.z], i * 3);
      const c = new THREE.Color(n.color);
      nodeCol.set([c.r * 0.35, c.g * 0.35, c.b * 0.35], i * 3);
    });
    nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute('color',    new THREE.Float32BufferAttribute(nodeCol, 3));
    const nodeMat = new THREE.PointsMaterial({
      size: 0.22, vertexColors: true,
      transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Points(nodeGeo, nodeMat));

    // ── EDGES connecting nearby nodes ─────────────────────────────────
    const DIST = 7.5;
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    const adjacentPairs: Array<[number, number]> = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (nodes[i].pos.distanceTo(nodes[j].pos) < DIST) {
          adjacentPairs.push([i, j]);
          linePositions.push(...[nodes[i].pos.x, nodes[i].pos.y, nodes[i].pos.z]);
          linePositions.push(...[nodes[j].pos.x, nodes[j].pos.y, nodes[j].pos.z]);
          const ci = new THREE.Color(nodes[i].color);
          const cj = new THREE.Color(nodes[j].color);
          lineColors.push(ci.r * 0.07, ci.g * 0.07, ci.b * 0.07);
          lineColors.push(cj.r * 0.07, cj.g * 0.07, cj.b * 0.07);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color',    new THREE.Float32BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // ── ENERGY PACKETS flowing along edges ────────────────────────────
    const PACKET_COUNT = 55;
    type Packet = { ni: number; nj: number; t: number; speed: number; color: THREE.Color };
    const packets: Packet[] = Array.from({ length: PACKET_COUNT }, () => {
      const pair = adjacentPairs[Math.floor(Math.random() * adjacentPairs.length)];
      return {
        ni: pair[0], nj: pair[1], t: Math.random(),
        speed: 0.009 + Math.random() * 0.013,
        color: new THREE.Color(palette[Math.floor(Math.random() * palette.length)]),
      };
    });

    const packetGeo = new THREE.BufferGeometry();
    const packetPos = new Float32Array(PACKET_COUNT * 3);
    const packetCol = new Float32Array(PACKET_COUNT * 3);
    packetGeo.setAttribute('position', new THREE.Float32BufferAttribute(packetPos, 3));
    packetGeo.setAttribute('color',    new THREE.Float32BufferAttribute(packetCol, 3));
    const packetMat = new THREE.PointsMaterial({
      size: 0.38, vertexColors: true,
      transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Points(packetGeo, packetMat));

    // ── BACKGROUND STARS ──────────────────────────────────────────────
    const STAR_COUNT = 300;
    const starPos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 25 + Math.random() * 30;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.08, color: 0xffffff,
      transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── RESIZE ────────────────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ── ANIMATION ─────────────────────────────────────────────────────
    let rafId = 0;
    let frame = 0;
    const nodeColAttr   = nodeGeo.getAttribute('color') as THREE.BufferAttribute;
    const packetPosAttr = packetGeo.getAttribute('position') as THREE.BufferAttribute;
    const packetColAttr = packetGeo.getAttribute('color') as THREE.BufferAttribute;

    const animate = () => {
      if (document.hidden) { rafId = requestAnimationFrame(animate); return; }
      rafId = requestAnimationFrame(animate);
      frame++;

      // Pulse node brightness
      for (let i = 0; i < NODE_COUNT; i++) {
        const pulse = 0.15 + 0.2 * Math.abs(Math.sin(frame * 0.016 + nodes[i].phase));
        const c = new THREE.Color(nodes[i].color);
        nodeColAttr.array[i * 3]     = c.r * pulse;
        nodeColAttr.array[i * 3 + 1] = c.g * pulse;
        nodeColAttr.array[i * 3 + 2] = c.b * pulse;
      }
      nodeColAttr.needsUpdate = true;

      // Move energy packets
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
        packetPosAttr.array[k * 3 + 1] = a.y + (b.y - a.y) * pkt.t;
        packetPosAttr.array[k * 3 + 2] = a.z + (b.z - a.z) * pkt.t;
        const glow = 0.65 + 0.35 * Math.sin(frame * 0.05 + k);
        packetColAttr.array[k * 3]     = pkt.color.r * glow;
        packetColAttr.array[k * 3 + 1] = pkt.color.g * glow;
        packetColAttr.array[k * 3 + 2] = pkt.color.b * glow;
      }
      packetPosAttr.needsUpdate = true;
      packetColAttr.needsUpdate = true;

      // Orbit camera around the node cloud
      const t = frame * 0.003;
      camera.position.set(
        Math.sin(t) * 22,
        Math.sin(t * 0.47) * 7,
        Math.cos(t) * 22,
      );
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
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
