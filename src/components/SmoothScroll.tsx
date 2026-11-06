import React, { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollProps {
  children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  useEffect(() => {
    // Initialize Lenis with physics-based momentum scrolling
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.15,
      touchMultiplier: 2.0,
      syncTouch: true,
      autoResize: true
    });

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCb);
    // Standard lag smoothing prevents stuttering on frame drop
    gsap.ticker.lagSmoothing(500, 33);

    // Make lenis globally accessible for programmatic smooth scrolls and canvas parallax sync
    (window as any).__lenis = lenis;

    return () => {
      gsap.ticker.remove(tickerCb);
      lenis.destroy();
      delete (window as any).__lenis;
    };
  }, []);

  return <>{children}</>;
};
