import assert from 'node:assert';
import { 
  processDecisionTurn, 
  mapCareerToMajors, 
  mapMajorToAdmissions 
} from '../src/engine/careerDecisionEngine.ts';
import { detectDomain } from '../src/components/CareerPathwayNavigator.tsx';

console.log('=== KIỂM THỬ KHẮC PHỤC TRIỆT ĐỂ: EM THÍCH ĐỊA LÝ & KHẢO SÁT 4 TRỤ CỘT ===');

// 1. Kiểm tra detectDomain
const domain = detectDomain('em thích địa lý');
console.log('1. detectDomain("em thích địa lý") ->', domain);
assert.strictEqual(domain, 'GEOGRAPHY_EARTH', 'detectDomain phải trả về GEOGRAPHY_EARTH thay vì SOCIAL_MEDIA hay GENERAL');

// 2. Kiểm tra Turn 1: "em thích địa lý"
const turn1 = processDecisionTurn('em thích địa lý');
console.log('2. Turn 1 action:', turn1.action, '| Số nghề:', turn1.suggestedCareers?.length || 0);
assert.strictEqual(turn1.action, 'ASK_QUESTION', 'Turn 1 chưa đủ bằng chứng phải là ASK_QUESTION');
assert.strictEqual(turn1.suggestedCareers?.length || 0, 0, 'Turn 1 không được tạo nghề non');
assert.ok(
  turn1.updatedProfile.statedInterests.some(i => i.includes('Địa lý') || i.includes('GIS')),
  'Profile phải ghi nhận sở thích Địa lý / GIS'
);

// 3. Kiểm tra Turn 2: Đủ 3 trụ cột bằng chứng về Địa lý
let profile = turn1.updatedProfile;
profile.realityCheckAnswer = 'Em sẵn sàng học hỏi thực tế và theo đuổi đam mê nghiêm túc.';
const turn2 = processDecisionTurn(
  'Em học tốt môn Địa lý, thích làm việc với bản đồ số và phân tích không gian đô thị',
  profile
);
console.log('3. Turn 2 action:', turn2.action, '| Số nghề:', turn2.suggestedCareers?.length || 0);
assert.strictEqual(turn2.action, 'CAREER_SHORTLIST', 'Khi đủ 3 trụ cột phải mở CAREER_SHORTLIST');
assert.strictEqual(turn2.suggestedCareers?.length, 3, 'Phải đề xuất đúng 3 nghề mục tiêu');

const careers = turn2.suggestedCareers || [];
console.log('Các nghề đề xuất:', careers.map(c => c.title));

// KIỂM TRA QUAN TRỌNG: TUYỆT ĐỐI KHÔNG CÓ AI ENGINEER HAY IC DESIGN
for (const c of careers) {
  assert.ok(!c.title.includes('Trí Tuệ Nhân Tạo'), `Nghề "${c.title}" không được là AI Engineer`);
  assert.ok(!c.title.includes('Vi Mạch'), `Nghề "${c.title}" không được là IC Design`);
  assert.ok(!c.title.includes('Phần Mềm'), `Nghề "${c.title}" không được là Software Engineer`);
}

// Kiểm tra có đúng nghề Địa lý/GIS/Quy hoạch/Trắc địa
assert.ok(careers.some(c => c.id === 'c_gis_specialist'), 'Phải có Chuyên viên GIS');
assert.ok(careers.some(c => c.id === 'c_urban_planner'), 'Phải có Chuyên viên Quy hoạch Đô thị');
assert.ok(careers.some(c => c.id === 'c_geodesy_engineer'), 'Phải có Kỹ sư Trắc địa - Bản đồ số');

// 4. Kiểm tra Major Mapping cho GIS
const majorMap = mapCareerToMajors('c_gis_specialist');
console.log('4. Major mapping direct majors:', majorMap.directMajors.map(m => m.name));
assert.ok(majorMap.directMajors.some(m => m.code === '7480205'), 'Phải map đến ngành GIS 7480205');
assert.ok(majorMap.directMajors.some(m => m.code === '7520503'), 'Phải map đến ngành Trắc địa 7520503');

// 5. Kiểm tra Admissions Plan cho 7480205
const admissions = mapMajorToAdmissions('7480205');
console.log('5. Admissions options:', admissions.map(a => `${a.schoolCode} - ${a.schoolName}`));
assert.ok(admissions.some(a => a.schoolCode === 'MDA'), 'Phải có Trường ĐH Mỏ - Địa chất');
assert.ok(admissions.some(a => a.schoolCode === 'DMT'), 'Phải có Trường ĐH Tài nguyên & Môi trường');

console.log('🎉 TẤT CẢ 5 ĐIỀU KIỆN KIỂM ĐỊNH ĐỊA LÝ ĐÃ PASS 100%!');
