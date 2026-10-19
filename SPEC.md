# TECHNICAL SPECIFICATION (SPEC.MD)
## Hệ Thống Hướng Nghiệp & Tuyển Sinh Phân Tầng Nexora 2.0 (EXORA Engine)

---

## 1. TECH STACK & KIẾN TRÚC LƯU TRỮ (LOCKED)
- **Frontend**: React 19, Vite 8, TypeScript strict mode, Tailwind CSS v4, Lucide Icons, GSAP & Motion animations.
- **Backend / API**:
  - Node.js ESM serverless endpoints (`/api/ai/counselor/chat`, `/api/ai/counselor/status`).
  - Google GenAI SDK (`@google/genai`) with resilient Gemini multi-model fallback chain (`gemini-3.1-flash-lite`, `gemini-3.5-flash`, `gemini-flash-latest`, `gemini-3.8-flash`).
  - Analytical & Matching Engine: Client-side TypeScript calculation engine (`admissionsCalculationEngine.ts`) with zero-latency local evaluation.
- **Storage & Seed Data**:
  - `seed_data.json`: Bộ câu hỏi O*NET IPSF 60 câu, danh mục mã ngành cấp IV (TT 09/2022 & TT 74/2026), biểu trần học phí NĐ 238/2025/NĐ-CP, và đề án mẫu 4 trường đại học trọng điểm (BKA, NTH, KHA, TCT).

---

## 2. CẤU TRÚC THỰC THỂ DỮ LIỆU (DELIVERABLE 2 & 5)

### 2.1. Hồ Sơ Người Học (Learner Profile & Evidence Accumulator)
```typescript
export interface LearnerRIASEC {
  R: number; // Realistic (Thực tế): 10 - 50
  I: number; // Investigative (Nghiên cứu): 10 - 50
  A: number; // Artistic (Nghệ thuật): 10 - 50
  S: number; // Social (Xã hội): 10 - 50
  E: number; // Enterprising (Quản lý / Khởi nghiệp): 10 - 50
  C: number; // Conventional (Nghiệp vụ / Quy củ): 10 - 50
  dominantCode: string; // e.g. "RIC", "SAE", "IRS"
}

export interface CandidateAcademicScores {
  thptScores: Record<string, number>; // { math: 8.5, physics: 8.0, chemistry: 7.5, english: 9.0... }
  transcriptAvg6HK?: Record<string, number>;
  aptitudeScore?: number; // Điểm HSA, TSA, ĐGNL ĐHQG
  ieltsScore?: number; // e.g. 6.5, 7.0, 7.5
  priorityRegionCode: 'KV1' | 'KV2_NT' | 'KV2' | 'KV3';
  priorityObjectCode: 'DT_0' | 'DT_01' | 'DT_06';
  rawIncentiveBonus: number; // Điểm khuyến khích / giải HSG
}
```

### 2.2. Vị Trí Việc Làm (Occupation Target - Gate 2)
```typescript
export interface TargetOccupation {
  id: string;
  socCode: string; // O*NET SOC Code
  title: string;
  riasecVector: [number, number, number, number, number, number];
  primarySector: string;
  salaryP50: string; // Mức lương trung vị thị trường Việt Nam
  salaryRange: string;
  automationRisk: 'Cực thấp' | 'Thấp' | 'Trung bình' | 'Cao';
  automationRiskPercent: number;
  requiredCompetencies: string[];
  applicableMajorCodes: string[]; // Mã ngành TT 09 / TT 74 tương ứng
}
```

### 2.3. Ngành Đào Tạo & Cơ Sở Giáo Dục (Gate 3 & Gate 4)
```typescript
export interface AuditedMajorProgram {
  programId: string; // e.g. "BKA_IT1", "KHA_KT"
  institutionCode: string; // FK
  majorCodeTT09: string; // 7 chữ số (TT 09/2022)
  majorCodeTT74: string; // 6 chữ số (TT 74/2026)
  majorName: string;
  sectorGroup: string;
  combinations: string[]; // e.g. ["A00", "A01"]
  scale: 'Thang 30' | 'Thang 40' | 'Thang 100';
  benchmark2024: number;
  benchmark2025: number;
  benchmark2026: number;
  tuitionYearEst: string;
  isFreeTuition: boolean;
  freePolicyNote?: string;
}
```

---

## 3. CÔNG THỨC TOÁN HỌC XÉT TUYỂN & MATCHING (DELIVERABLE 3 & 8)

### 3.1. Thuật Toán Giảm Điểm Ưu Tiên Tuyến Tính (Khoản 4 Điều 7 Thông tư 06/2026/TT-BGDĐT)
Khi điểm gốc xét tuyển của thí sinh đạt từ 22.5/30 điểm trở lên:
$$\text{Hệ số giảm} = \frac{30 - \text{Điểm Gốc}}{7.5}$$
$$\text{Điểm ƯT Thực Nhận} = \text{Hệ số giảm} \times \text{Mức ƯT Gốc}$$
- Nếu $\text{Điểm Gốc} < 22.5$: $\text{Điểm ƯT Thực Nhận} = \text{Mức ƯT Gốc}$.
- Nếu $\text{Điểm Gốc} \ge 30.0$: $\text{Điểm ƯT Thực Nhận} = 0$.
- Đảm bảo $\text{Điểm Xét Tuyển Chính Thức} \le 30.0$.

### 3.2. Chuyển Đổi & Quy Chuẩn Thang Điểm
- **Thang 40 (Môn chính nhân hệ số 2)**:
  $$\text{ĐXT}_{40} = (\text{Môn Chính} \times 2 + \text{Môn 2} + \text{Môn 3}) + \text{Điểm Thưởng} + \text{ĐƯT}_{40}$$
  $$\text{Quy đổi về Thang 30}: \text{Điểm}_{30} = \text{Điểm}_{40} \times \frac{3}{4}$$
- **Thang 100 (ĐGNL ĐHQG-HCM, BKA TSA, UEH)**:
  $$\text{ĐXT}_{100} = w_1 \times \text{ĐGNL}_{\text{QĐ100}} + w_2 \times \text{THPT}_{\text{QĐ100}} + w_3 \times \text{HB}_{\text{QĐ100}} + \text{ĐƯT}_{100}$$

### 3.3. Thuật Toán So Khớp RIASEC (Cosine Vector Matching)
$$\text{Interest Fit} = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|} = \frac{\sum_{i=1}^6 u_i v_i}{\sqrt{\sum_{i=1}^6 u_i^2} \sqrt{\sum_{i=1}^6 v_i^2}}$$
- $\vec{u}$: Vector 6 chiều RIASEC của người học.
- $\vec{v}$: Vector 6 chiều chuẩn mực của nghề nghiệp trong danh bạ O*NET.

---

## 4. QUY TẮC PHÂN LUỒNG & GATE-KEEPING (DELIVERABLE 4)

Hệ thống tuân thủ nghiêm ngặt 5 bước EXORA không đảo ngược:
1. **Gate 0 - Gốc Rễ Bản Thân**:
   - Khám phá 6 chiều sở thích RIASEC (O*NET IPSF).
   - Đo lường năng lực học tập và các môn muốn tránh.
2. **Gate 1 - Tự Vấn 1:1 Cùng AI Counselor**:
   - Trò chuyện 1:1 không khuôn mẫu.
   - Mỗi lượt AI chỉ đặt đúng 1 câu hỏi gợi mở, không áp đặt, không nhảy vội đến trường học.
3. **Gate 2 - Vị Trí Việc Làm Mục Tiêu**:
   - Đề xuất Top 3 vị trí việc làm cụ thể (Job Title) dựa trên Vector Fit.
   - Phân tích dải lương thị trường và rủi ro tự động hóa AI.
4. **Gate 3 - Chuyên Ngành Đào Tạo**:
   - Ánh xạ từ việc làm sang 1 hoặc nhiều mã ngành đào tạo cấp IV (TT 09/2022 & TT 74/2026).
5. **Gate 4 - Trường Đại Học & Chiến Lược Nguyện Vọng**:
   - Phân loại 3 tầng nguyện vọng:
     * **Mơ ước (Dream)**: Điểm chuẩn năm trước cao hơn điểm thí sinh 0.5 - 1.5đ.
     * **Vừa sức (Target)**: Điểm chuẩn nằm trong dải $\pm 0.5$đ.
     * **An toàn (Safe)**: Điểm chuẩn thấp hơn điểm thí sinh $\ge 1.5$đ.
   - Kiểm tra ràng buộc tài chính học phí (NĐ 238/2025/NĐ-CP) & chính sách miễn học phí sư phạm (NĐ 116).

---

## 5. BỐ CỤC 4 TAB GIAO DIỆN CHUẨN (DELIVERABLE 5)

- **Tab 1: Cố Vấn 1:1 & Trắc Nghiệm Tâm Trắc (Self-Discovery Engine)**
  - Đánh giá O*NET RIASEC 60 câu với radar chart trực quan.
  - Cửa sổ chat cố vấn nghề nghiệp 1:1 tương tác real-time với AI Counselor.
- **Tab 2: Bản Đồ Nghề Nghiệp & Thị Trường Lao Động (Career & Labor Observatory)**
  - Danh bạ việc làm chuẩn hóa O*NET, dải lương GSO 2026, chỉ số tự động hóa AI.
  - Phân tích lộ trình thăng tiến và kỹ năng cốt lõi cho từng chức danh.
- **Tab 3: Khám Phá Ngành Học & Danh Bạ 300 Trường (Major & University Explorer)**
  - Tra cứu mã ngành cấp IV (TT 09 & TT 74).
  - Tra cứu 300 trường đại học, biểu học phí chuẩn NĐ 238/2025/NĐ-CP, liên kết đề án gốc `.edu.vn`.
- **Tab 4: Bộ Máy Tính Điểm & Chiến Lược 3 Tầng Nguyện Vọng (Admissions & Strategy Engine)**
  - Bộ máy tính điểm tự động áp dụng công thức FML_01 đến FML_22.
  - Giảm trừ điểm ưu tiên chuẩn TT 06/2026.
  - Phân chia danh sách nguyện vọng theo 3 tầng: Mơ ước, Vừa sức, An toàn.

---

## 6. 10 CA KIỂM THỬ NGHIỆM THU CHUẨN (TC-01 ĐẾN TC-10)

| Mã TC | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Kết Quả Kỳ Vọng (Expected Output) |
| :--- | :--- | :--- | :--- |
| **TC-01** | FML_01 Thang 30 không giảm ưu tiên | Toán 7.0, Lý 7.0, Hóa 7.0, KV1 (ƯT 0.75) | Điểm gốc = 21.0 < 22.5 $\rightarrow$ ĐƯT = 0.75 $\rightarrow$ ĐXT = 21.75. |
| **TC-02** | FML_01 Mốc bắt đầu giảm ưu tiên | Toán 7.5, Lý 7.5, Hóa 7.5, KV1 (ƯT 0.75) | Điểm gốc = 22.50 $\rightarrow$ Hệ số = 1.0 $\rightarrow$ ĐƯT = 0.75 $\rightarrow$ ĐXT = 23.25. |
| **TC-03** | FML_01 Điểm cao giảm ưu tiên tuyến tính | Toán 9.0, Lý 9.0, Hóa 9.0, KV1 (ƯT 0.75) | Điểm gốc = 27.0 $\rightarrow$ Hệ số = (30-27)/7.5 = 0.40 $\rightarrow$ ĐƯT = 0.30 $\rightarrow$ ĐXT = 27.30. |
| **TC-04** | FML_01 Điểm trần 30.0 triệt tiêu ưu tiên | Toán 10.0, Lý 10.0, Hóa 10.0, KV1 (ƯT 0.75) | Điểm gốc = 30.0 $\rightarrow$ ĐƯT = 0.00 $\rightarrow$ ĐXT = 30.00 (không vượt trần). |
| **TC-05** | FML_02 Thang 40 nhân đôi môn chính (FTU, HBT) | Toán 9.0, Văn 8.0, Anh 8.5 (Anh x2), KV1 | Điểm gốc 40 = 9 + 8 + 8.5x2 = 34.0 $\rightarrow$ Quy về 30 = 25.5 $\rightarrow$ ĐXT đúng theo quy chế. |
| **TC-06** | FML_14 Thang 100 ĐHBK TP.HCM (QSB) | 70% ĐGNL + 20% THPT + 10% Học bạ | Điểm chuẩn hóa tổng hợp chính xác trên thang 100, sai số $\le 0.01$. |
| **TC-07** | Chính sách miễn học phí Sư phạm (NĐ 116) | Chọn ngành 7140209 (Sư phạm Toán - SPH/SPS) | Học phí = 0 VNĐ/năm, trợ cấp 3.63 triệu/tháng, cảnh báo ràng buộc bồi hoàn NĐ 60/2025. |
| **TC-08** | Khối trường Quân đội & Công an | Chọn ANH, CSH, LAH, HQH, KQH | Học phí = 0 VNĐ, bao cấp 100% ăn ở, đào tạo, điều kiện sơ tuyển lý lịch/sức khỏe. |
| **TC-09** | Khối Y Dược tự chủ (NĐ 238/2025/NĐ-CP) | Chọn ngành Y khoa (YHB, YDS) | Cảnh báo học phí chính xác: Y Hà Nội 24.5 - 62.2 tr; Y Dược TP.HCM 35 - 90 tr/năm. |
| **TC-10** | Học sinh học đều các môn | Khai báo điểm các môn đồng đều (8.0 - 8.5) | Không tự ý áp đặt tổ hợp D01; kích hoạt probing phản xạ năng lượng tư duy. |
