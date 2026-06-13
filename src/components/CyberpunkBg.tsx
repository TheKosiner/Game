import { useEffect, useRef } from 'react';

// Slow, gentle CSS-based animated background — no Three.js overhead
export default function CyberpunkBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    // Palette
    const COLORS = ['#ff2d78', '#00f5ff', '#9d4edd', '#ffd700', '#00ff88'];

    // ── NODES ──
    const NODE_COUNT = 55;
    type Node = { x: number; y: number; vx: number; vy: number; r: number; color: string; alpha: number; phase: number };

    function mkNode(): Node {
      return {
        x:     Math.random() * W,
        y:     Math.random() * H,
        vx:    (Math.random() - 0.5) * 0.22,
        vy:    (Math.random() - 0.5) * 0.22,
        r:     1.5 + Math.random() * 2.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      };
    }

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, mkNode);

    // ── CONNECT threshold ──
    const THRESH = Math.min(W, H) * 0.22;

    let frame = 0;
    let rafId = 0;

    const draw = () => {
      if (document.hidden) { rafId = requestAnimationFrame(draw); return; }
      rafId = requestAnimationFrame(draw);
      frame++;

      ctx.clearRect(0, 0, W, H);

      // Move nodes & bounce
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < THRESH) {
            const opacity = (1 - d / THRESH) * 0.12;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = nodes[i].color;
            ctx.globalAlpha = opacity;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const pulse = 0.5 + 0.5 * Math.sin(frame * 0.018 + n.phase);
        const alpha = n.alpha * (0.5 + 0.5 * pulse);

        // Soft glow
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        grad.addColorStop(0, n.color + '44');
        grad.addColorStop(1, n.color + '00');
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    draw();

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
      // Re-scatter nodes inside new bounds
      for (const n of nodes) {
        n.x = Math.random() * W;
        n.y = Math.random() * H;
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.55 }}
    />
  );
}
