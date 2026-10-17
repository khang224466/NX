import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  GraduationCap, 
  ArrowRight, 
  Cpu, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Globe2,
  Atom,
  TrendingUp,
  Award,
  Flame,
  Binary,
  Compass,
  Network,
  Calculator,
  Briefcase
} from 'lucide-react';
import { sfx } from '../services/soundEffects';

interface CinematicIntroProps {
  onComplete: () => void;
  onNavigate?: (tab: string) => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete, onNavigate }) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFinalImpact, setIsFinalImpact] = useState(false);
  const hasTriggeredImpact = useRef(false);

  // 19+ Top Tier Vietnamese Universities, Colleges & Global Tech/Industrial Giants with High-Res Photography
  const stackedEntities = [
    {
      id: 'hust',
      name: 'Đại học Bách Khoa Hà Nội (HUST)',
      short: 'HUST',
      category: 'ĐẠI HỌC CÔNG LẬP TOP 1 KỸ THUẬT',
      stats: '7.980 chỉ tiêu · Điểm chuẩn 27.5 - 28.5',
      focus: 'Vi mạch bán dẫn · Robot & AI · Điều khiển tự động',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
      color: '#f261ac',
      icon: Cpu,
      location: 'Hà Nội',
      rot: -3.5,
      combo: 'A00 · A01',
      branch: 'Kỹ sư Vi mạch & Chip Bán dẫn',
      targetTab: 'combinations',
    },
    {
      id: 'synopsys',
      name: 'Synopsys Semiconductor Vietnam',
      short: 'SYNOPSYS',
      category: 'TẬP ĐOÀN EDA & THIẾT KẾ VI MẠCH SỐ 1 THẾ GIỚI',
      stats: 'Đặt hàng 300 kỹ sư IC Design & Verification',
      focus: 'Lương khởi điểm: 18 - 25 triệu/tháng',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      color: '#835ad6',
      icon: Atom,
      location: 'Khu CNC TP.HCM & Đà Nẵng',
      rot: 3,
      combo: 'Đặt hàng FDI 100%',
      branch: 'Thiết kế Vi mạch Bán dẫn',
      targetTab: 'commissioning',
    },
    {
      id: 'hcmut',
      name: 'ĐH Bách Khoa — ĐHQG TP. Hồ Chí Minh',
      short: 'HCMUT',
      category: 'TRUNG TÂM KỸ THUẬT ĐẦU NGÀNH PHÍA NAM',
      stats: 'Chuẩn ABET Hoa Kỳ · 5.200 chỉ tiêu',
      focus: 'Khoa học Máy tính · Cơ điện tử · Công nghệ Hóa',
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
      color: '#3b63f5',
      icon: GraduationCap,
      location: 'TP. Hồ Chí Minh',
      rot: -2.8,
      combo: 'A00 · A01 · D07',
      branch: 'Rễ Cây Kỹ Thuật 2 Chiều',
      targetTab: 'tree',
    },
    {
      id: 'intel',
      name: 'Intel Products Vietnam (Khu CNC TP.HCM)',
      short: 'INTEL',
      category: 'NHÀ MÁY ĐÓNG GÓI & KIỂM THỬ CHIP LỚN NHẤT',
      stats: 'Bảo trợ 100% phòng Lab bán dẫn & Học bổng STEM',
      focus: 'Kỹ sư Quy trình (Process) & Kỹ sư Thiết bị',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
      color: '#00F0FF',
      icon: Cpu,
      location: 'TP. Thủ Đức, TP.HCM',
      rot: 3.2,
      combo: 'Bảo trợ Lab Bán Dẫn',
      branch: 'Kỹ sư Đóng gói IC',
      targetTab: 'commissioning',
    },
    {
      id: 'vinuni',
      name: 'Đại học VinUniversity (VinUni)',
      short: 'VINUNI',
      category: 'ĐẠI HỌC TINH HOA CHUẨN QUỐC TẾ',
      stats: 'Học bổng tài năng 50% - 100% · Đối tác Cornell & Penn',
      focus: 'Trí tuệ Nhân tạo · Khoa học Sức khỏe · Quản trị',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
      color: '#f59433',
      icon: Award,
      location: 'Gia Lâm, Hà Nội',
      rot: -3.8,
      combo: 'Hồ sơ tài năng + Phỏng vấn',
      branch: 'AI & Khoa học Dữ liệu',
      targetTab: 'tree',
    },
    {
      id: 'viettel',
      name: 'Tập đoàn Công nghiệp - Viễn thông Viettel',
      short: 'VIETTEL',
      category: 'TẬP ĐOÀN CÔNG NGHỆ QUỐC GIA',
      stats: 'Tuyển dụng 500+ Chuyên gia AI, 5G & Vi mạch',
      focus: 'Thu nhập top 5% thị trường VN · Nghiên cứu quốc phòng',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      color: '#00FF88',
      icon: Zap,
      location: 'Hà Nội & Toàn quốc',
      rot: 2.6,
      combo: 'Học bổng R&D Viettel',
      branch: 'Kỹ sư Hệ thống Nhúng 5G',
      targetTab: 'commissioning',
    },
    {
      id: 'neu',
      name: 'Đại học Kinh tế Quốc dân (NEU)',
      short: 'NEU',
      category: 'ĐẠI HỌC KINH TẾ TRỌNG ĐIỂM QUỐC GIA',
      stats: 'Điểm chuẩn 27.2 - 28.1 · Tổ hợp D01, A00, A01',
      focus: 'Logistics Chuỗi Cung Ứng · Khoa học Dữ liệu · Fintech',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      color: '#f261ac',
      icon: TrendingUp,
      location: 'Hà Nội',
      rot: -3.2,
      combo: 'D01 · A00 · A01',
      branch: 'Fintech & Chuỗi Cung Ứng',
      targetTab: 'combinations',
    },
    {
      id: 'samsung',
      name: 'Samsung R&D Vietnam (SRV)',
      short: 'SAMSUNG',
      category: 'TRUNG TÂM NGHIÊN CỨU & PHÁT TRIỂN LỚN NHẤT ĐNÁ',
      stats: 'Trung tâm R&D 220 triệu USD · 2.400 Kỹ sư',
      focus: 'Phần mềm di động · AI Camera · Thuật toán 5G/6G',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      color: '#3b63f5',
      icon: Globe2,
      location: 'Tây Hồ, Hà Nội',
      rot: 3.5,
      combo: 'Chương trình STP Samsung',
      branch: 'Kỹ sư Thuật toán AI Mobile',
      targetTab: 'commissioning',
    },
    {
      id: 'ftu',
      name: 'Đại học Ngoại Thương (FTU)',
      short: 'FTU',
      category: 'THƯƠNG HIỆU ĐÀO TẠO KINH TẾ ĐỐI NGOẠI',
      stats: 'Điểm chuẩn 27.8 - 28.5 · Ngoại ngữ IELTS xét tuyển',
      focus: 'Kinh tế Quốc tế · Thương mại Điện tử Xuyên biên giới',
      image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=80',
      color: '#f59433',
      icon: Award,
      location: 'Hà Nội & TP.HCM',
      rot: -2.4,
      combo: 'D01 · D07 · A01',
      branch: 'Kinh tế & Thương mại Số',
      targetTab: 'combinations',
    },
    {
      id: 'fpt',
      name: 'Đại học FPT (FPT University)',
      short: 'FPT UNI',
      category: 'ĐẠI HỌC TIÊN PHONG CÔNG NGHỆ & ĐỔI MỚI',
      stats: '1 học kỳ thực tập OJT tại doanh nghiệp từ năm 3',
      focus: 'Kỹ thuật Phần mềm · An toàn Thông tin · Thiết kế Vi mạch',
      image: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=1200&q=80',
      color: '#f59433',
      icon: Cpu,
      location: 'Hà Nội, Đà Nẵng, TP.HCM, Cần Thơ, Quy Nhơn',
      rot: 2.8,
      combo: 'A00 · A01 · D01',
      branch: 'Kỹ sư Phần mềm & An toàn Thông tin',
      targetTab: 'tree',
    },
    {
      id: 'vinfast',
      name: 'VinFast Smart Automation Factory',
      short: 'VINFAST',
      category: 'TỔ HỢP SẢN XUẤT XE ĐIỆN & ROBOTICS THÔNG MINH',
      stats: '1.200 Robot ABB hàn tự động hóa 100%',
      focus: 'Kỹ sư Vận hành Robot · Kỹ sư Pin LFP & Quản lý năng lượng',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
      color: '#00FF88',
      icon: Zap,
      location: 'Hải Phòng',
      rot: -3.6,
      combo: 'Đào tạo liên kết VinFast',
      branch: 'Vận hành Robot & Pin Điện',
      targetTab: 'commissioning',
    },
    {
      id: 'rmit',
      name: 'RMIT University Vietnam',
      short: 'RMIT',
      category: 'ĐẠI HỌC QUỐC TẾ HÀNG ĐẦU TỪ ÚC',
      stats: 'Bằng cấp toàn cầu · Môi trường học tập 100% tiếng Anh',
      focus: 'Truyền thông Đa phương tiện · Khoa học Máy tính · Thiết kế',
      image: 'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&w=1200&q=80',
      color: '#f261ac',
      icon: Globe2,
      location: 'TP.HCM & Hà Nội',
      rot: 3.1,
      combo: 'Xét tuyển học bạ + IELTS 6.5',
      branch: 'Thiết kế Game & Multimedia',
      targetTab: 'tree',
    },
    {
      id: 'vng',
      name: 'VNG Corporation (VNG Campus)',
      short: 'VNG',
      category: 'KỲ LÂN CÔNG NGHỆ ĐẦU TIÊN CỦA VIỆT NAM',
      stats: 'Vận hành Zalo với 75+ triệu người dùng thường xuyên',
      focus: 'Hệ thống Phân tán (Distributed Systems) · Cloud & AI LLM',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      color: '#00F0FF',
      icon: Atom,
      location: 'Quận 7, TP.HCM',
      rot: -2.7,
      combo: 'VNG Tech Fresher Program',
      branch: 'Kỹ sư Hệ thống Cloud & Backend',
      targetTab: 'commissioning',
    },
    {
      id: 'caothang',
      name: 'Trường Cao đẳng Kỹ thuật Cao Thắng',
      short: 'CAO THẮNG',
      category: 'CAO ĐẲNG NGHỀ THỰC HÀNH THỰC CHIẾN TOP 1',
      stats: '70% Thực hành xưởng máy · Học phí chỉ 14 triệu/năm',
      focus: 'Bảo trì Cơ điện tử · Điện công nghiệp · Ô tô điện',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      color: '#00FF88',
      icon: Award,
      location: 'Quận 1, TP.HCM',
      rot: 3.4,
      combo: 'Xét tuyển học bạ THPT',
      branch: 'Kỹ thuật viên Cơ điện tử Ô tô',
      targetTab: 'tree',
    },
    {
      id: 'dut',
      name: 'ĐH Bách Khoa — Đại học Đà Nẵng',
      short: 'DUT',
      category: 'TRUNG TÂM KỸ THUẬT TRỌNG ĐIỂM MIỀN TRUNG',
      stats: 'Điểm đến hàng đầu của làn sóng FDI Vi mạch Đà Nẵng',
      focus: 'Kỹ thuật Điều khiển · Vi mạch Bán dẫn · Hệ thống Nhúng',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
      color: '#3b63f5',
      icon: Cpu,
      location: 'Đà Nẵng',
      rot: -3.3,
      combo: 'A00 · A01',
      branch: 'Kỹ thuật Điều khiển & Vi mạch',
      targetTab: 'combinations',
    },
    {
      id: 'marvell',
      name: 'Marvell Technology Vietnam',
      short: 'MARVELL',
      category: 'TẬP ĐOÀN BÁN DẪN ĐIỆN TOÁN ĐÁM MÂY & AI',
      stats: 'Trung tâm Thiết kế Vi mạch hàng đầu thế giới tại VN',
      focus: 'Kỹ sư Thiết kế Chip Quang học & Lưu trữ dữ liệu AI',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      color: '#FFE600',
      icon: Binary,
      location: 'Khu Công viên Phần mềm Quang Trung, TP.HCM',
      rot: 2.2,
      combo: 'Marvell Semiconductor Fellowship',
      branch: 'Kỹ sư Thiết kế Chip Quang Học',
      targetTab: 'commissioning',
    },
    {
      id: 'hcmus',
      name: 'ĐH Khoa học Tự nhiên — ĐHQG TP.HCM',
      short: 'HCMUS',
      category: 'CÁI NÔI KHOA HỌC CƠ BẢN & CÔNG NGHỆ THÔNG TIN',
      stats: 'Đội tuyển Vô địch Lập trình ICPC Châu Á',
      focus: 'Khoa học Máy tính · Trí tuệ Nhân tạo · Toán Tin ứng dụng',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      color: '#00F0FF',
      icon: Atom,
      location: 'Quận 5, TP.HCM',
      rot: -2.9,
      combo: 'A00 · A01 · B00',
      branch: 'Nhà Khoa học Dữ liệu & AI',
      targetTab: 'tree',
    },
    {
      id: 'qualcomm',
      name: 'Qualcomm Vietnam R&D Center',
      short: 'QUALCOMM',
      category: 'TẬP ĐOÀN CÔNG NGHỆ KHÔNG DÂY & CHIP SNAPDRAGON',
      stats: 'Trung tâm R&D đầu tiên của Qualcomm tại Đông Nam Á',
      focus: 'AI on Edge · Camera ISP · Kỹ thuật viên kiểm thử sóng RF',
      image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80',
      color: '#f261ac',
      icon: Flame,
      location: 'Cầu Giấy, Hà Nội',
      rot: 2.7,
      combo: 'Qualcomm Snapdragon Lab Award',
      branch: 'Kỹ sư AI Edge & Xử lý Tín hiệu',
      targetTab: 'commissioning',
    },
    {
      id: 'fptpoly',
      name: 'Trường Cao đẳng FPT Polytechnic',
      short: 'FPT POLY',
      category: 'MÔ HÌNH THỰC HỌC — THỰC NGHIỆP TỐC HÀNH',
      stats: 'Đào tạo 2 năm · 97.7% Có việc làm ngay khi ra trường',
      focus: 'Lập trình Web/Mobile · Thiết kế Đồ họa · Digital Marketing',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      color: '#f59433',
      icon: Zap,
      location: 'Hơn 10 cơ sở toàn quốc',
      rot: 2.5,
      combo: 'Tuyển thẳng bằng tốt nghiệp THPT',
      branch: 'Lập trình viên Frontend/React & Mobile',
      targetTab: 'tree',
    },
  ];

  const totalCards = stackedEntities.length;

  useEffect(() => {
    // Ultra-rapid high-energy card shuffle (90ms per card)
    const interval = setInterval(() => {
      setActiveCardIndex((prev) => {
        if (prev < totalCards - 1) {
          const next = prev + 1;
          sfx.playCardTick(next);

          // Card acceleration riser sound in the final 5 steps
          if (next >= totalCards - 5 && next < totalCards - 1) {
            sfx.playWhoosh((next / totalCards) * 1.5);
          }

          // Check if hitting the final climax card -> TRIGGER MASSIVE SCREEN IMPACT
          if (next === totalCards - 1 && !hasTriggeredImpact.current) {
            hasTriggeredImpact.current = true;
            setIsFinalImpact(true);
            sfx.playImpactSlam();
          }
          return next;
        }
        return prev;
      });
    }, 95);

    // Auto complete after the big final impact slam
    const timer = setTimeout(() => {
      onComplete();
    }, 2350);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        sfx.playImpactSlam();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [totalCards, onComplete]);

  const currentItem = stackedEntities[activeCardIndex];

  // Progressive scale factor: grows from 0.85 up to 1.62 as stack shuffles!
  const progressiveGrowth = 0.85 + Math.pow(activeCardIndex / (totalCards - 1), 1.5) * 0.78;

  const handleInteract = (tab: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.playPillChime();
    sfx.playUiSelect();
    if (onNavigate) {
      onNavigate(tab);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 1.25,
        filter: 'blur(24px)',
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
      }}
      onClick={() => {
        sfx.playImpactSlam();
        onComplete();
      }}
      animate={isFinalImpact ? {
        x: [0, -32, 36, -24, 24, -12, 10, 0],
        y: [0, 24, -30, 20, -14, 8, 0],
      } : {}}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] bg-[#05070B] flex flex-col justify-between p-4 sm:p-8 md:p-12 overflow-hidden select-none cursor-pointer"
    >
      {/* Dynamic Screen Flash / Impact Shockwave on the final smash */}
      <AnimatePresence>
        {isFinalImpact && (
          <motion.div
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 bg-white pointer-events-none z-[120]"
          />
        )}
      </AnimatePresence>

      {/* High-chroma dynamic backdrop aura */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full blur-[140px] pointer-events-none opacity-45 transition-colors duration-200"
        style={{ backgroundColor: currentItem?.color || '#f261ac' }}
      />

      {/* Top High-Octane HUD */}
      <div className="flex items-center justify-between text-xs font-tabular tracking-widest text-[#A1A1AA] uppercase relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f261ac] animate-ping" />
          <span className="text-white font-syne font-black text-sm tracking-wider">
            NEXORA · ECOSYSTEM IMPACT
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-syne uppercase tracking-wider text-white/50 hidden sm:inline">
            Awwwards Concrete Motion Stack · Ảnh Trường & Doanh Nghiệp
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-syne font-bold text-[11px]">
            {activeCardIndex + 1} / {stackedEntities.length}
          </span>
        </div>
      </div>

      {/* CENTERPIECE: Massive In-Your-Face 3D Stack Growing Larger & Smashing into Viewport */}
      <div className="my-auto relative z-10 max-w-4xl mx-auto w-full flex flex-col items-center [perspective:1500px]">
        {/* Kinetic Title */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.85, y: -25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-5 sm:mb-7"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#00F0FF] text-[11px] font-syne font-bold uppercase tracking-widest mb-2.5 hover-jiggle">
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF] animate-spin" />
            <span>Đại Học & Doanh Nghiệp Tuyển Sinh 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-syne font-black text-white tracking-tight leading-[0.95] text-balance">
            HỆ THỐNG GIÁO DỤC <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f261ac] via-[#00F0FF] to-[#00FF88]">
              XẾP CHỒNG ĐỘT PHÁ
            </span>
          </h1>
        </motion.div>

        {/* The Concrete Physical Stack Deck (Progressively Growing Larger & Smashing into Camera!) */}
        <div className="relative w-full h-[360px] sm:h-[400px] flex items-center justify-center">
          {stackedEntities.map((item, index) => {
            const isVisible = index <= activeCardIndex;
            const isTop = index === activeCardIndex;
            const stackDepth = activeCardIndex - index;
            const Icon = item.icon;

            // Target scale grows with activeCardIndex, and surges massively if it's the final impact!
            const itemScale = isTop
              ? (isFinalImpact ? 2.85 : progressiveGrowth * 1.06)
              : Math.max(0.65, progressiveGrowth - stackDepth * 0.06);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 140, scale: 0.75, rotate: item.rot * 2 }}
                animate={{
                  opacity: isVisible ? (stackDepth > 3 ? 0.18 : 1 - stackDepth * 0.15) : 0,
                  y: isVisible ? (isFinalImpact && isTop ? -30 : stackDepth * 6) : 140,
                  scale: isVisible ? itemScale : 0.75,
                  rotate: isVisible ? (isTop ? (isFinalImpact ? item.rot * 0.3 : item.rot) : item.rot * 0.7) : 0,
                  zIndex: isTop ? 50 : index,
                }}
                transition={{
                  type: 'spring',
                  stiffness: isFinalImpact ? 550 : 420,
                  damping: isFinalImpact ? 18 : 26,
                  mass: 0.5,
                }}
                className={`absolute w-full max-w-xl p-5 sm:p-6 rounded-3xl glass-surface-elevated border shadow-[0_25px_80px_rgba(0,0,0,0.85)] transition-all will-change-transform overflow-hidden ${
                  isFinalImpact && isTop ? 'ring-4 ring-white shadow-[0_0_150px_rgba(255,255,255,0.7)]' : ''
                }`}
                style={{
                  borderColor: isTop ? item.color : 'rgba(255, 255, 255, 0.16)',
                  boxShadow: isTop ? `0 25px 100px ${item.color}60` : '0 10px 40px rgba(0,0,0,0.7)',
                }}
              >
                {/* Real Campus / Tech Lab High-Resolution Photo Background Overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover opacity-25 filter brightness-90 contrast-125"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/85 to-transparent" />
                  <div 
                    className="absolute inset-0 opacity-20 mix-blend-screen"
                    style={{ backgroundColor: item.color }}
                  />
                </div>

                {/* Card Content (Relative z-10 for interactivity) */}
                <div className="relative z-10">
                  {/* Header Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                        style={{ backgroundColor: `${item.color}35`, border: `1px solid ${item.color}70` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <span 
                        className="text-[10px] font-syne uppercase tracking-wider px-2.5 py-1 rounded-full font-bold shadow-sm"
                        style={{ backgroundColor: `${item.color}25`, color: item.color }}
                      >
                        {item.category}
                      </span>
                    </div>

                    <span className="text-[11px] font-tabular text-white/70 font-bold">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Main Name & Badge */}
                  <h3 className="font-syne font-black text-xl sm:text-2xl text-white tracking-tight mb-2 flex items-center justify-between">
                    <span className="truncate mr-2">{item.name}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/15 font-tabular text-white font-bold shrink-0">
                      {item.short}
                    </span>
                  </h3>

                  {/* Highlight metric & stats */}
                  <p className="text-xs sm:text-sm font-semibold text-white/95 mb-3.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF88] shrink-0" />
                    <span>{item.stats}</span>
                  </p>

                  {/* INTERACTIVE HOTSPOTS INSIDE THE PHOTO CARD (TUYỂN SINH 2026 & RỄ CÂY 2 CHIỀU) */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {/* Tuyển Sinh 2026 Hotspot */}
                    <button
                      onClick={(e) => handleInteract('combinations', e)}
                      onMouseEnter={() => sfx.playPillChime()}
                      className="hover-jiggle px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#00FF88]/20 border border-white/15 hover:border-[#00FF88]/40 text-[11px] font-syne font-semibold text-[#ECEEF2] flex items-center gap-1.5 transition-all shadow-sm"
                      title="Xem tổ hợp và điểm chuẩn tuyển sinh 2026"
                    >
                      <Calculator className="w-3 h-3 text-[#00FF88]" />
                      <span>{item.combo}</span>
                    </button>

                    {/* Rễ Cây 2 Chiều Hotspot */}
                    <button
                      onClick={(e) => handleInteract('tree', e)}
                      onMouseEnter={() => sfx.playPillChime()}
                      className="hover-jiggle px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#00F0FF]/20 border border-white/15 hover:border-[#00F0FF]/40 text-[11px] font-syne font-semibold text-[#ECEEF2] flex items-center gap-1.5 transition-all shadow-sm"
                      title="Xem bản đồ rễ cây hướng nghiệp 2 chiều"
                    >
                      <Network className="w-3 h-3 text-[#00F0FF]" />
                      <span className="truncate max-w-[190px]">{item.branch}</span>
                    </button>

                    {/* Đặt Hàng Doanh Nghiệp Hotspot */}
                    <button
                      onClick={(e) => handleInteract('commissioning', e)}
                      onMouseEnter={() => sfx.playPillChime()}
                      className="hover-jiggle px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#f261ac]/20 border border-white/15 hover:border-[#f261ac]/40 text-[11px] font-syne font-semibold text-[#ECEEF2] flex items-center gap-1.5 transition-all shadow-sm"
                      title="Xem cam kết đặt hàng từ doanh nghiệp"
                    >
                      <Briefcase className="w-3 h-3 text-[#f261ac]" />
                      <span>FDI & Việc Làm</span>
                    </button>
                  </div>

                  {/* Focus domain badge & location */}
                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-syne">
                    <span className="text-[#A1A1AA] truncate mr-2">
                      {item.focus}
                    </span>
                    <span className="text-white/60 text-[11px] shrink-0 font-tabular">
                      {item.location}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic high-speed ticker */}
        <div className="mt-8 flex items-center gap-3 text-xs font-syne font-bold text-white/70">
          <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
          <span className="tracking-wider uppercase">
            {activeCardIndex + 1} / {stackedEntities.length} ĐƠN VỊ ĐÀO TẠO & DOANH NGHIỆP ĐANG XẾP CHỒNG
          </span>
        </div>
      </div>

      {/* Bottom Bar & Instant Skip */}
      <div className="flex items-center justify-between text-xs font-syne font-bold text-[#A1A1AA] relative z-10">
        <span className="tracking-wider uppercase hidden sm:inline">
          Bản Đồ Rễ Cây Định Hướng Nghề Nghiệp Việt Nam 2026
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            sfx.playImpactSlam();
            onComplete();
          }}
          className="hover:text-white px-5 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all uppercase tracking-wider text-white text-xs font-syne font-black flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ml-auto sm:ml-0"
        >
          <span>Bỏ Qua / Vào Ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
