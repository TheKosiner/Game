import { gsap } from 'gsap';

/** Animate a panel entering the viewport (stagger children) */
export function animatePanelIn(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(
    el,
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' },
  );
}

/** Animate tab content swap: old slides out left, new slides in right */
export function animateTabIn(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(
    el,
    { opacity: 0, x: 24 },
    { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out' },
  );
}

/** Flash element briefly (button confirm, reward) */
export function animateFlash(el: HTMLElement | null, color = '#ff2d78') {
  if (!el) return;
  gsap.timeline()
    .to(el, { boxShadow: `0 0 24px ${color}`, duration: 0.12, ease: 'power1.in' })
    .to(el, { boxShadow: '0 0 0px transparent', duration: 0.3, ease: 'power1.out' });
}

/** Count a number up from 0 to target (for gold/XP display) */
export function animateCount(
  setter: (v: number) => void,
  from: number,
  to: number,
  duration = 0.8,
) {
  const obj = { val: from };
  gsap.to(obj, {
    val: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => setter(Math.round(obj.val)),
  });
}

/** Stagger-in a list of children */
export function animateListIn(container: HTMLElement | null) {
  if (!container) return;
  const kids = container.children;
  gsap.fromTo(
    kids,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.22, stagger: 0.06, ease: 'power2.out' },
  );
}

/** Loading screen title reveal */
export function animateLoadTitle(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(
    el,
    { opacity: 0, scale: 0.7, filter: 'blur(12px)' },
    { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' },
  );
}

/** Pulsing glow loop (for loading indicator) */
export function animateGlowLoop(el: HTMLElement | null, color = '#ff2d78') {
  if (!el) return;
  return gsap.to(el, {
    textShadow: `0 0 28px ${color}, 0 0 60px ${color}`,
    repeat: -1,
    yoyo: true,
    duration: 0.9,
    ease: 'sine.inOut',
  });
}
