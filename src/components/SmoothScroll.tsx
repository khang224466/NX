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
    // Khởi tạo Lenis với quán tính vật lý (Momentum Scrolling) êm dịu, phản hồi tức thì
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential decay curve
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      syncTouch: false, // Để Windows Touchpad & chuột cảm ứng cuộn tự nhiên, không giật
      autoResize: true
    });

    // Đồng bộ trạng thái cuộn với GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Vòng lặp RAF độc lập dùng performance.now() chuẩn xác của trình duyệt
    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Tự động căn chỉnh kích thước scroll buffer khi zoom hoặc resize cửa sổ
    const handleResize = () => {
      lenis.resize();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Gắn Lenis vào biến toàn cục để các component (Canvas, Parallax) đồng bộ vị trí cuộn
    (window as any).__lenis = lenis;

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete (window as any).__lenis;
    };
  }, []);

  return <>{children}</>;
};
