import assert from 'node:assert/strict';
import { researchSchoolProfile } from './school_profile_research.mjs';

const school = {
  institution_code: 'ABC',
  official_name: 'Trường Đại học Mẫu',
  official_scheme_or_cutoff_url: 'https://mau.edu.vn/tuyen-sinh'
};

const evidence = {
  admissions: 'Năm 2026, trường xét tuyển theo phương thức xét điểm thi tốt nghiệp THPT.',
  cutoff: 'Năm 2025, ngành Khoa học máy tính tổ hợp A00 điểm trúng tuyển 27,5/30 điểm.',
  tuition: 'Học phí năm học 2026–2027 ngành Khoa học máy tính là 32 triệu đồng/năm.',
  scholarships: 'Học bổng Tài năng 2026 dành cho sinh viên đạt thành tích cao, trị giá 20 triệu đồng.'
};

function makeSearchResult(category) {
  return {
    title: 'Thông tin ' + category + ' - Trường Đại học Mẫu',
    url: 'https://mau.edu.vn/' + category,
    content: evidence[category],
    summary: evidence[category],
    snippet: evidence[category],
    authority: 4,
    rerank_score: 2.8,
    date: '2026-10-01T00:00:00Z'
  };
}

function makeMockFetch({ untrusted = false } = {}) {
  const calls = [];
  const mockFetch = async (url, options) => {
    const request = JSON.parse(options.body);
    calls.push({ url: String(url), request, authorization: options.headers.Authorization });

    if (String(url).endsWith('/tools/search')) {
      const query = request.query.toLocaleLowerCase('vi');
      let category = 'admissions';
      if (query.includes('điểm chuẩn')) category = 'cutoff';
      if (query.includes('học phí')) category = 'tuition';
      if (query.includes('học bổng')) category = 'scholarships';
      return new Response(JSON.stringify({
        results: [untrusted
          ? { ...makeSearchResult(category), url: 'https://mau.edu.vn.attacker.example/' + category }
          : makeSearchResult(category)]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const sourceIds = { admissions: 'S1', cutoff: 'S2', tuition: 'S3', scholarships: 'S4' };
    const answer = {
      admissionsYear: '2026',
      admissionMethods: [{
        name: 'Xét điểm thi tốt nghiệp THPT',
        detail: 'Trường sử dụng kết quả kỳ thi tốt nghiệp THPT.',
        sourceId: sourceIds.admissions,
        evidenceQuote: evidence.admissions
      }],
      cutoffFacts: [{
        programName: 'Khoa học máy tính',
        admissionsYear: '2025',
        method: 'Thi tốt nghiệp THPT',
        combination: 'A00',
        score: '27,5',
        scale: '30',
        note: '',
        sourceId: sourceIds.cutoff,
        evidenceQuote: evidence.cutoff
      }, {
        programName: 'Ngành không có nguồn',
        admissionsYear: '2025',
        score: '99',
        sourceId: 'S99',
        evidenceQuote: 'Không có trong nguồn.'
      }, {
        programName: 'Khoa học máy tính',
        admissionsYear: '2025',
        score: '99',
        scale: '30',
        sourceId: sourceIds.cutoff,
        evidenceQuote: evidence.cutoff
      }],
      tuitionFacts: [{
        programName: 'Khoa học máy tính',
        academicYear: '2026–2027',
        amount: '32 triệu đồng/năm',
        unit: 'đồng/năm',
        note: '',
        sourceId: sourceIds.tuition,
        evidenceQuote: evidence.tuition
      }],
      scholarships: [{
        name: 'Học bổng Tài năng',
        detail: 'Dành cho sinh viên có thành tích cao, trị giá 20 triệu đồng.',
        academicYear: '2026',
        status: 'chưa rõ',
        sourceId: sourceIds.scholarships,
        evidenceQuote: evidence.scholarships
      }],
      verificationNotes: []
    };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
  return { calls, mockFetch };
}

const loaders = {
  loadInstitutions: async () => [school],
  loadPolicy: async () => ({ officialHomepage: 'https://mau.edu.vn' })
};

const missingKey = await researchSchoolProfile({
  body: { institutionCode: 'ABC' },
  env: {},
  ...loaders
});
assert.equal(missingKey.status, 503);
assert.match(missingKey.body.error, /DEEPSEEK_API_KEY/);

const { calls, mockFetch } = makeMockFetch();
const result = await researchSchoolProfile({
  body: { institutionCode: 'ABC', majorName: 'Khoa học máy tính', comboCode: 'A00' },
  clientKey: 'deepseek-test-success',
  env: { DAMINFINiTE: 'test-key' },
  fetchImpl: mockFetch,
  ...loaders
});

assert.equal(result.status, 200);
assert.equal(calls.filter((call) => call.url.endsWith('/tools/search')).length, 4);
assert.equal(calls.filter((call) => call.url.endsWith('/chat/completions')).length, 1);
assert.ok(calls.every((call) => call.authorization === 'Bearer test-key'));
assert.ok(calls.filter((call) => call.url.endsWith('/tools/search')).every((call) => call.request.need_content === true));
assert.equal(result.body.data.provider, 'DeepSeek');
assert.equal(result.body.data.model, 'deepseek-flash');
assert.equal(result.body.data.admissionsYear, '2026');
assert.equal(result.body.data.admissionMethods.length, 1);
assert.equal(result.body.data.cutoffFacts.length, 1);
assert.equal(result.body.data.tuitionFacts.length, 1);
assert.equal(result.body.data.scholarships.length, 1);
assert.ok(result.body.data.sources.every((source) => source.url.startsWith('https://mau.edu.vn/')));
assert.equal(result.body.data.cutoffFacts[0].sourceUrl, 'https://mau.edu.vn/cutoff');
assert.equal(result.body.data.tuitionFacts[0].sourceUrl, 'https://mau.edu.vn/tuition');
assert.equal(result.body.data.scholarships[0].sourceUrl, 'https://mau.edu.vn/scholarships');

const { calls: untrustedCalls, mockFetch: untrustedFetch } = makeMockFetch({ untrusted: true });
const untrustedResult = await researchSchoolProfile({
  body: { institutionCode: 'ABC' },
  clientKey: 'deepseek-test-untrusted',
  env: { DEEPSEEK_API_KEY: 'test-key' },
  fetchImpl: untrustedFetch,
  ...loaders
});
assert.equal(untrustedResult.status, 422);
assert.equal(untrustedCalls.filter((call) => call.url.endsWith('/chat/completions')).length, 0);

console.log('school_profile_research: DeepSeek search, official-source filtering, citations, and missing-key checks passed');
