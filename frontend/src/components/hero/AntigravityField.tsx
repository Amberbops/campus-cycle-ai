import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

const PARTICLES = [
  { x: '9%', y: '28%', size: 9, color: 'teal', delay: 0 },
  { x: '18%', y: '70%', size: 5, color: 'violet', delay: 0.7 },
  { x: '78%', y: '24%', size: 6, color: 'amber', delay: 1.2 },
  { x: '88%', y: '64%', size: 11, color: 'teal', delay: 0.35 },
  { x: '72%', y: '78%', size: 4, color: 'violet', delay: 1.5 },
  { x: '30%', y: '18%', size: 4, color: 'amber', delay: 0.95 },
];

const COLORS = {
  teal: 'rgba(45, 212, 191, 0.8)',
  violet: 'rgba(167, 139, 250, 0.8)',
  amber: 'rgba(251, 191, 36, 0.75)',
};

export function AntigravityField() {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 50, damping: 18 });
  const springY = useSpring(pointerY, { stiffness: 50, damping: 18 });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth - 0.5) * 34);
      pointerY.set((event.clientY / window.innerHeight - 0.5) * 24);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [pointerX, pointerY]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ x: springX, y: springY }}
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-400/10 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
      <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-slate-700/50" />
      {PARTICLES.map((particle) => (
        <motion.span
          key={`${particle.x}-${particle.y}`}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: COLORS[particle.color as keyof typeof COLORS],
            boxShadow: `0 0 ${particle.size * 2}px ${COLORS[particle.color as keyof typeof COLORS]}`,
          }}
          animate={{ y: [0, -18, 4, 0], x: [0, 7, -4, 0], rotate: [0, 90, 180, 360] }}
          transition={{ duration: 7 + particle.delay, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </motion.div>
  );
}