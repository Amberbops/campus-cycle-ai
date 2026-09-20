import { motion } from 'framer-motion';

const PARTICLES = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  angle: (index / 28) * Math.PI * 2,
  distance: 42 + (index % 5) * 13,
  color: ['#2dd4bf', '#5eead4', '#facc15', '#a78bfa', '#f8fafc'][index % 5],
  size: 4 + (index % 3) * 2,
}));

export function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden="true">
      {PARTICLES.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute left-1/2 top-1/2 rounded-sm"
          style={{ width: particle.size, height: particle.size * 1.8, backgroundColor: particle.color }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0.4 }}
          animate={{
            opacity: 0,
            x: Math.cos(particle.angle) * particle.distance,
            y: Math.sin(particle.angle) * particle.distance,
            rotate: 360 + particle.id * 18,
            scale: 1,
          }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}