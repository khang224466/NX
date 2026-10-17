import React, { createContext, useContext, useState, useMemo } from 'react';
import { Major, Institution, SubjectCombination } from '../types';
import { MAJORS_DATA, INSTITUTIONS_DATA, SUBJECT_COMBINATIONS } from '../data/mockData';

export interface EnrichedInstitution extends Institution {
  campusPhoto: string;
  photoCaption: string;
}

export interface ContingencyPlan {
  status: 'safe' | 'competitive' | 'high_risk';
  analysisHeadline: string;
  analysisDescription: string;
  recommendedPivot?: string;
  safetyMargin?: number;
}

export const ENRICHED_INSTITUTIONS: EnrichedInstitution[] = [
  {
    ...INSTITUTIONS_DATA[0], // HUST
    campusPhoto: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    photoCaption: 'Tòa nhà Thư viện Tạ Quang Bửu & Viện Công nghệ Thông tin - Bách Khoa Hà Nội'
  },
  {
    ...INSTITUTIONS_DATA[1], // BKU
    campusPhoto: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
    photoCaption: 'Khuôn viên Dĩ An & Trung tâm Thí nghiệm Trọng điểm Quốc gia HCMUT'
  },
  {
    ...INSTITUTIONS_DATA[2], // NEU
    campusPhoto: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    photoCaption: 'Tòa nhà Thế kỷ & Viện Đào tạo Công nghệ Kinh tế Số NEU'
  },
  {
    ...INSTITUTIONS_DATA[3], // Cao Thắng
    campusPhoto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    photoCaption: 'Xưởng thực hành Tự động hóa & Trung tâm Đào tạo Kỹ thuật Festo'
  },
  {
    id: 'inst-vinuni',
    code: 'VIN',
    name: 'Đại học VinUniversity (VinUni)',
    shortName: 'VinUni',
    type: 'Đại học tư thục',
    region: 'Miền Bắc',
    city: 'Hà Nội',
    tuitionPerYearMln: 85,
    scholarshipPolicies: 'Học bổng tài năng 50% - 100% học phí toàn khóa do Tập đoàn Vingroup tài trợ.',
    industryPartnerships: ['Cornell University', 'University of Pennsylvania', 'VinAI', 'VinBrain', 'VinFast'],
    programs: [
      {
        majorId: 'major-data-ai',
        majorName: 'Khoa học Máy tính & Trí tuệ Nhân tạo',
        admissionCombinations: ['A00', 'A01', 'D01'],
        benchmark2025: 26.5,
        benchmark2024: 26.0,
        quota: 90
      },
      {
        majorId: 'major-robotics',
        majorName: 'Kỹ thuật Cơ khí & Hệ thống Thông minh',
        admissionCombinations: ['A00', 'A01'],
        benchmark2025: 26.0,
        benchmark2024: 25.5,
        quota: 70
      }
    ],
    campusPhoto: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
    photoCaption: 'Khuôn viên chuẩn quốc tế Quacquarelli Symonds 5 sao - Vinhomes Ocean Park'
  }
];

export interface QuickPreset {
  majorId?: string;
  comboCode?: string;
  institutionId?: string;
  targetScore?: number;
}

export interface UserJourneyContextType {
  selectedComboCode: string;
  selectedCombo: SubjectCombination | string;
  targetScore: number;
  targetRegion: string;
  maxTuition: number;
  selectedMajor: Major;
  selectedInstitution: EnrichedInstitution;
  contingencyPlan: ContingencyPlan;
  selectCombo: (comboCode: string) => void;
  setTargetScore: (score: number) => void;
  setTargetRegion: (region: string) => void;
  setMaxTuition: (tuition: number) => void;
  selectInstitution: (institutionId: string) => void;
  selectMajor: (majorId: string) => void;
  applyQuickPreset: (preset: QuickPreset) => void;
}

const defaultContingency: ContingencyPlan = {
  status: 'safe',
  analysisHeadline: 'Vị Thế Điểm Mục Tiêu An Toàn (+1.2 điểm so với chuẩn 2025)',
  analysisDescription: 'Điểm mục tiêu của bạn nằm trong biên độ an toàn so với dữ liệu tuyển sinh các năm trước. Khuyến nghị tập trung củng cố kiến thức môn thế mạnh và đăng ký thêm phương thức xét học bạ kết hợp.',
  recommendedPivot: 'Kỹ thuật Robot & Tự động hóa',
  safetyMargin: 1.2
};

const defaultContextValue: UserJourneyContextType = {
  selectedComboCode: 'A01',
  selectedCombo: SUBJECT_COMBINATIONS.find(c => c.code === 'A01') || SUBJECT_COMBINATIONS[0],
  targetScore: 26.5,
  targetRegion: 'All',
  maxTuition: 50,
  selectedMajor: MAJORS_DATA[0],
  selectedInstitution: ENRICHED_INSTITUTIONS[0],
  contingencyPlan: defaultContingency,
  selectCombo: () => {},
  setTargetScore: () => {},
  setTargetRegion: () => {},
  setMaxTuition: () => {},
  selectInstitution: () => {},
  selectMajor: () => {},
  applyQuickPreset: () => {}
};

export const UserJourneyContext = createContext<UserJourneyContextType>(defaultContextValue);

export const UserJourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedComboCode, setSelectedComboCode] = useState<string>('A01');
  const [targetScore, setTargetScore] = useState<number>(26.5);
  const [targetRegion, setTargetRegion] = useState<string>('All');
  const [maxTuition, setMaxTuition] = useState<number>(50);
  const [selectedMajorId, setSelectedMajorId] = useState<string>(MAJORS_DATA[0].id);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>(ENRICHED_INSTITUTIONS[0].id);

  const selectedMajor = useMemo(() => {
    return MAJORS_DATA.find(m => m.id === selectedMajorId) || MAJORS_DATA[0];
  }, [selectedMajorId]);

  const selectedInstitution = useMemo(() => {
    return ENRICHED_INSTITUTIONS.find(i => i.id === selectedInstitutionId) || ENRICHED_INSTITUTIONS[0];
  }, [selectedInstitutionId]);

  const selectedCombo = useMemo(() => {
    return SUBJECT_COMBINATIONS.find(c => c.code === selectedComboCode) || SUBJECT_COMBINATIONS[0];
  }, [selectedComboCode]);

  // Compute contingency plan proactively whenever score, target major, or institution changes
  const contingencyPlan = useMemo<ContingencyPlan>(() => {
    const prog = selectedInstitution.programs.find(p => p.majorId === selectedMajor.id) ||
      selectedInstitution.programs[0];

    const benchmark = prog ? prog.benchmark2025 : 26.0;
    const margin = Number((targetScore - benchmark).toFixed(2));

    if (margin >= 0.75) {
      return {
        status: 'safe',
        analysisHeadline: `Vùng An Toàn Vững Chắc (+${margin} điểm so với chuẩn ${prog?.majorName || selectedMajor.name})`,
        analysisDescription: `Mức điểm dự kiến ${targetScore} cao hơn điểm trúng tuyển năm 2025 (${benchmark}). Tỷ lệ trúng tuyển ước tính > 85%. Khuyến nghị đặt làm Nguyện vọng 1 và đăng ký sớm.`,
        recommendedPivot: selectedMajor.adjacentJobs[0] || 'Kỹ thuật viên chuyên sâu',
        safetyMargin: margin
      };
    } else if (margin >= -0.75) {
      return {
        status: 'competitive',
        analysisHeadline: `Vùng Cạnh Tranh Sát Sao (${margin >= 0 ? `+${margin}` : margin} điểm so với chuẩn 2025)`,
        analysisDescription: `Điểm số của bạn tiệm cận điểm chuẩn năm ngoái (${benchmark}). Biến động đề thi có thể làm thay đổi kết quả. Hãy chuẩn bị phương án 2 tại trường cùng khối kỹ thuật hoặc xét tuyển đánh giá tư duy/năng lực.`,
        recommendedPivot: 'Cao đẳng kỹ thuật thực hành hoặc hệ chất lượng cao',
        safetyMargin: margin
      };
    } else {
      return {
        status: 'high_risk',
        analysisHeadline: `Cảnh Báo Vùng Nguy Cơ Điểm Số (${margin} điểm)`,
        analysisDescription: `Điểm mục tiêu ${targetScore} hiện thấp hơn điểm chuẩn 2025 (${benchmark}). Khuyến nghị xây dựng phương án dự phòng chuyển nhánh đào tạo (modular pivot) hoặc chọn phân hiệu/trường kề bên.`,
        recommendedPivot: 'Lộ trình chuyển đổi tín chỉ cao đẳng thực hành sang đại học',
        safetyMargin: margin
      };
    }
  }, [targetScore, selectedInstitution, selectedMajor]);

  const selectCombo = (code: string) => {
    setSelectedComboCode(code);
  };

  const selectInstitution = (instId: string) => {
    setSelectedInstitutionId(instId);
  };

  const selectMajor = (mId: string) => {
    setSelectedMajorId(mId);
  };

  const applyQuickPreset = (preset: QuickPreset) => {
    if (preset.comboCode) setSelectedComboCode(preset.comboCode);
    if (preset.targetScore !== undefined) setTargetScore(preset.targetScore);
    if (preset.institutionId) setSelectedInstitutionId(preset.institutionId);
    if (preset.majorId) setSelectedMajorId(preset.majorId);
  };

  const value: UserJourneyContextType = {
    selectedComboCode,
    selectedCombo,
    targetScore,
    targetRegion,
    maxTuition,
    selectedMajor,
    selectedInstitution,
    contingencyPlan,
    selectCombo,
    setTargetScore,
    setTargetRegion,
    setMaxTuition,
    selectInstitution,
    selectMajor,
    applyQuickPreset
  };

  return (
    <UserJourneyContext.Provider value={value}>
      {children}
    </UserJourneyContext.Provider>
  );
};

export const useUserJourney = (): UserJourneyContextType => {
  return useContext(UserJourneyContext);
};
