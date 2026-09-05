import React, { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  stagger?: boolean;
}

export default function AnimatedShow({ children, delay = 0, className = "", stagger = false }: Props) {
  const reduce = useReducedMotion();

  // Only `y` is animated. Opacity is never touched, so the content is fully
  // readable from the first paint: if hydration hiccups or the animation
  // never runs, nothing is left stranded invisible.
  return (
    <motion.div
      initial={reduce ? false : { y: stagger ? 16 : 24 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
