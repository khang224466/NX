import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

interface ScrollParallaxProps {
  children: React.ReactNode;
  speed?: number; // e.g. -0.5 for moving up faster, 0.3 for moving down slower
  className?: string;
  horizontal?: number; // Optional horizontal drift
  rotate?: number; // Optional subtle tilt on scroll
  offset?: ["start end" | "start start" | "center end", "end start" | "end end"];
}

export const ScrollParallax: React.FC<ScrollParallaxProps> = ({
  children,
  speed = 0.3,
  className = '',
  horizontal = 0,
  rotate = 0,
  offset = ["start end", "end start"],
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset,
  });

  // Calculate parallax translation range (scaled to pixels based on speed factor)
  const yRange = [-100 * speed, 100 * speed];
  const xRange = horizontal ? [-50 * horizontal, 50 * horizontal] : [0, 0];
  const rotRange = rotate ? [-rotate, rotate] : [0, 0];

  const rawY = useTransform(scrollYProgress, [0, 1], yRange);
  const rawX = useTransform(scrollYProgress, [0, 1], xRange);
  const rawRot = useTransform(scrollYProgress, [0, 1], rotRange);

  // Apply physical spring damping to ensure butter-smooth inertial motion
  const y = useSpring(rawY, { stiffness: 150, damping: 25, mass: 0.6 });
  const x = useSpring(rawX, { stiffness: 150, damping: 25, mass: 0.6 });
  const r = useSpring(rawRot, { stiffness: 150, damping: 25, mass: 0.6 });

  return (
    <motion.div
      ref={ref}
      style={{ y, x, rotate: r }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
};
