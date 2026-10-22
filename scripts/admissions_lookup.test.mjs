import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleAdmissionsLookup,
  clearAdmissionsLookupCacheForTests
} from './admissions_lookup.mjs';

const year = 2026;
const officialUrl = 'https://hust.edu.vn/tuyen-sinh/2026';
const officialChunk = {
  web: {
    uri: officialUrl,
    title: 'hust.edu.vn'
  }
};

function majorData(overrides = {}) {
  return {
    headline: 'Ngành phù hợp',
    directAnswer: 'Có thể cân nhắc công nghệ thông tin.',
    strengthsEvaluation: 'Điểm Toán là lợi thế.',
    risksAndBottlenecks: 'Cần xem thêm sở thích thực tế.',
    majors: [{
      name: 'Công nghệ thông tin',
      codeTT09: '7480201',
      sector: 'Công nghệ',
      year,
      admissionsCombos: ['A01'],
      sourceUrl: officialUrl,
      comboSourceUrl: officialUrl,
      whyFit: 'Phù hợp với điểm Toán và thế mạnh người dùng.'
    }],
    ...overrides
  };
}

function schoolData(overrides = {}) {
  return {
    headline: 'Trường phù hợp',
    summary: 'Kết quả tra cứu theo ngành và tổ hợp.',
    scoreAnalysis: 'Điểm cần so với mốc chính thức cùng thang.',
    budgetNote: 'Học phí chỉ hiện khi có nguồn đúng năm.',
    schools: [{
      name: 'Đại học Bách khoa Hà Nội',
      institutionCode: 'HUST',
      province: 'Hà Nội',
      programName: 'Công nghệ thông tin',
      majorCode: '7480201',
      combinationCode: 'A01',
      programYear: year,
      programSourceUrl: officialUrl,
      cutoffScore: 27.5,
      cutoffYear: year,
      cutoffSourceUrl: officialUrl,
      tuitionAnnualMillions: 35,
      tuitionYear: year,
      tuitionSourceUrl: officialUrl,
      whyFit: 'Địa điểm phù hợp và điểm trong khoảng tham khảo.'
    }],
    ...overrides
  };
}

function geminiResponse(data, chunks = [officialChunk]) {
  const evidence = [];
  for (const major of data?.majors || []) {
    evidence.push(`${major.name} ${major.codeTT09} ${major.year}`);
    evidence.push(`${major.codeTT09} ${major.year} ${(major.admissionsCombos || []).join(' ')}`);
  }
  for (const school of data?.schools || []) {
    evidence.push(`${school.name} ${school.programName} ${school.majorCode} ${school.combinationCode} ${school.programYear}`);
    if (school.cutoffScore != null) evidence.push(`${school.name} ${school.cutoffScore} ${school.cutoffYear} ${school.majorCode} ${school.combinationCode}`);
    if (school.tuitionAnnualMillions != null) evidence.push(`${school.name} ${school.tuitionAnnualMillions} ${school.tuitionYear} ${school.majorCode} ${school.combinationCode}`);
  }
  return {
    candidates: [{
      content: { parts: [{ text: JSON.stringify(data) }] },
      groundingMetadata: {
        groundingChunks: chunks,
        groundingSupports: evidence.map(text => ({ segment: { text }, groundingChunkIndices: [0] }))
      }
    }]
  };
}

function groqResponse(summary = 'Đã sắp xếp theo tiêu chí người dùng.') {
  return {
    choices: [{
      message: {
        content: JSON.stringify({
          summary,
          items: [{ findingIndex: 0, whyFit: 'Phù hợp với tiêu chí bạn nhập.' }]
        })
      }
    }]
  };
}

function mockProviders({ gemini = geminiResponse(majorData()), groq = groqResponse(), delayMs = 0, geminiStatus = 200, groqStatus = 200 } = {}) {
  const stats = { calls: 0, active: 0, maxActive: 0, geminiBodies: [], geminiHeaders: [], groqHeaders: [] };
  globalThis.fetch = async (url, options = {}) => {
    stats.calls++;
    stats.active++;
    stats.maxActive = Math.max(stats.maxActive, stats.active);
    try {
      if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));
      if (String(url).includes('generativelanguage.googleapis.com')) {
        const request = JSON.parse(options.body);
        stats.geminiBodies.push(request);
        stats.geminiHeaders.push(options.headers);
        assert.ok(Array.isArray(request.tools), 'Gemini search grounding must be enabled');
        assert.ok(request.tools.some(tool => tool.google_search), 'Google Search tool must be used');
        return new Response(JSON.stringify(gemini), { status: geminiStatus, headers: { 'Content-Type': 'application/json' } });
      }
      assert.ok(String(url).includes('api.groq.com'), 'Only Gemini and Groq should be called');
      stats.groqHeaders.push(options.headers);
      return new Response(JSON.stringify(groq), { status: groqStatus, headers: { 'Content-Type': 'application/json' } });
    } finally {
      stats.active--;
    }
  };
  return stats;
}

const env = { GEMINI_API_KEY: 'test-gemini-key', GROQ_API_KEY: 'test-groq-key' };
const majorBody = (interests = 'thích máy tính') => ({
  analysisType: 'majors', academicYear: year, careerInterests: interests,
  careerStrengths: 'giỏi toán', scores: { math: 9 }, aptitudeScores: {}
});
const schoolBody = (overrides = {}) => ({
  analysisType: 'universities', academicYear: year,
  studentProfile: {
    interests: 'thích máy tính', strengths: 'giỏi toán', scores: { math: 9 },
    aptitudeScores: {}, major: { name: 'Công nghệ thông tin', codeTT09: '7480201' },
    selectedCombination: 'A01', userEnteredExpectedScore: 27,
    maxAnnualTuitionMillions: 40, preferredStudyRegion: 'BAC', preferredProvince: 'Hà Nội'
  },
  ...overrides
});

beforeEach(() => {
  clearAdmissionsLookupCacheForTests();
});

afterEach(() => {
  delete globalThis.fetch;
});

test('tra cứu ngành dùng Google Search, xác minh nguồn chính thức và bỏ qua majorCatalog cũ', async () => {
  const stats = mockProviders({ gemini: geminiResponse(majorData()) });
  const result = await handleAdmissionsLookup({ body: majorBody(), env });
  assert.equal(result.status, 200);
  assert.equal(result.data.provider, 'verified-search');
  assert.equal(result.data.analysis.recommendedMajors[0].codeTT09, '7480201');
  assert.equal(result.data.analysis.recommendedMajors[0].verificationStatus, 'VERIFIED');
  assert.equal(result.data.analysis.recommendedMajors[0].source.domain, 'hust.edu.vn');
  assert.equal(stats.geminiBodies.length, 1);
  assert.ok(!JSON.stringify(stats.geminiBodies[0]).includes('majorCatalog'));
  assert.ok(!JSON.stringify(stats.geminiBodies[0]).includes('test-gemini-key'));
  assert.equal(stats.geminiHeaders[0]['x-goog-api-key'], env.GEMINI_API_KEY);
  assert.equal(stats.groqHeaders[0].Authorization, `Bearer ${env.GROQ_API_KEY}`);
});

test('tra cứu trường không phụ thuộc schoolCatalog và chỉ hiện dữ kiện đúng ngành/tổ hợp/năm', async () => {
  const stats = mockProviders({ gemini: geminiResponse(schoolData()) });
  const result = await handleAdmissionsLookup({ body: schoolBody(), env });
  assert.equal(result.status, 200);
  const school = result.data.analysis.recommendedSchools[0];
  assert.equal(school.programStatus, 'VERIFIED');
  assert.equal(school.cutoffBenchmark, 27.5);
  assert.equal(school.cutoffYear, year);
  assert.equal(school.tuitionAnnualMillions, 35);
  assert.equal(school.citations[0].domain, 'hust.edu.vn');
  assert.ok(!JSON.stringify(stats.geminiBodies[0]).includes('schoolCatalog'));
});

test('sai mã tổ hợp làm dữ kiện trường, điểm và học phí thành chưa xác minh', async () => {
  mockProviders({ gemini: geminiResponse(schoolData({ schools: [{
    ...schoolData().schools[0], combinationCode: 'D01'
  }] })) });
  clearAdmissionsLookupCacheForTests();
  const mismatch = await handleAdmissionsLookup({ body: schoolBody(), env });
  assert.equal(mismatch.status, 200);
  assert.equal(mismatch.data.analysis.recommendedSchools.length, 0);
  assert.ok(mismatch.data.analysis.warnings.some(warning => warning.includes('đúng ngành, tổ hợp')));
});

test('nguồn bên thứ ba hoặc URL không thuộc nguồn grounding không được xác minh', async () => {
  mockProviders({
    gemini: geminiResponse(majorData({ majors: [{ ...majorData().majors[0], sourceUrl: 'https://example.com/facts' }] }), [
      { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/example', title: 'example.com' } }
    ])
  });
  const result = await handleAdmissionsLookup({ body: majorBody(), env });
  assert.equal(result.status, 200);
  assert.equal(result.data.analysis.recommendedMajors.length, 0);
  assert.ok(result.data.analysis.warnings.length > 0);
});

test('URL chính thức nhưng không phải đúng trang trong grounding không được xác minh', async () => {
  const fakeOfficialPage = 'https://hust.edu.vn/tuyen-sinh/2026/khong-ton-tai';
  mockProviders({ gemini: geminiResponse(majorData({
    majors: [{ ...majorData().majors[0], sourceUrl: fakeOfficialPage, comboSourceUrl: officialUrl }]
  })) });
  const result = await handleAdmissionsLookup({ body: majorBody('thích thiết kế'), env });
  assert.equal(result.data.analysis.recommendedMajors.length, 0);
});

test('không có grounding support gắn với nguồn thì mã ngành không được xác minh', async () => {
  const response = geminiResponse(majorData());
  response.candidates[0].groundingMetadata.groundingSupports = [];
  mockProviders({ gemini: response });
  const result = await handleAdmissionsLookup({ body: majorBody('thích thiết kế'), env });
  assert.equal(result.data.analysis.recommendedMajors.length, 0);
});

test('năm cũ không được hiển thị như điểm chuẩn hoặc học phí hiện hành', async () => {
  const stale = schoolData({ schools: [{
    ...schoolData().schools[0], programYear: year - 1, cutoffYear: year - 1, tuitionYear: year - 1
  }] });
  mockProviders({ gemini: geminiResponse(stale) });
  const result = await handleAdmissionsLookup({ body: schoolBody(), env });
  assert.equal(result.data.analysis.recommendedSchools.length, 0);
  assert.ok(result.data.analysis.warnings.some(warning => warning.includes('đúng ngành, tổ hợp')));
});

test('hai kết quả cùng trường nhưng mốc điểm khác nhau được đánh dấu mâu thuẫn', async () => {
  const first = schoolData().schools[0];
  const second = { ...first, cutoffScore: 26.5 };
  mockProviders({ gemini: geminiResponse(schoolData({ schools: [first, second] })) });
  const result = await handleAdmissionsLookup({ body: schoolBody({ preferredProvince: 'Hà Nội' }), env });
  const school = result.data.analysis.recommendedSchools[0];
  assert.equal(school.cutoffStatus, 'CONFLICT');
  assert.equal(school.cutoffBenchmark, null);
  assert.ok(result.data.analysis.warnings.some(warning => warning.includes('mâu thuẫn')));
});

test('API 504 được trả thành trạng thái timeout dễ hiểu', async () => {
  mockProviders({ geminiStatus: 504 });
  const result = await handleAdmissionsLookup({ body: majorBody('thích thiết kế'), env });
  assert.equal(result.status, 504);
  assert.equal(result.data.code, 'LOOKUP_TIMEOUT');
});

test('không cấu hình Groq vẫn trả dữ kiện đã xác minh và cảnh báo chuẩn hóa dự phòng', async () => {
  mockProviders({ gemini: geminiResponse(majorData()) });
  const result = await handleAdmissionsLookup({ body: majorBody('thích âm nhạc'), env: { GEMINI_API_KEY: env.GEMINI_API_KEY } });
  assert.equal(result.status, 200);
  assert.equal(result.data.normalizer, 'deterministic');
  assert.equal(result.data.analysis.recommendedMajors.length, 1);
  assert.ok(result.data.analysis.warnings.some(warning => warning.includes('Groq')));
});

test('Gemini 401 và 503 được phân loại thành lỗi cấu hình và dịch vụ bận', async () => {
  for (const [status, code] of [[401, 'LOOKUP_AUTH_ERROR'], [503, 'LOOKUP_SERVICE_BUSY']]) {
    clearAdmissionsLookupCacheForTests();
    mockProviders({ geminiStatus: status, gemini: { error: { message: 'provider error' } } });
    const result = await handleAdmissionsLookup({ body: majorBody(`thử ${status}`), env });
    assert.equal(result.status, status);
    assert.equal(result.data.code, code);
  }
});

test('Gemini hết quota thì chuyển sang biến DAM kế tiếp và ưu tiên khóa vừa chạy thành công', async () => {
  const primaryKey = 'test-primary-key';
  const backupKey = 'test-backup-key';
  const duplicateKey = 'test-primary-key';
  const usedKeys = [];
  const capturedLogs = [];
  const originalInfo = console.info;
  console.info = message => capturedLogs.push(String(message));
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes('generativelanguage.googleapis.com')) {
      const apiKey = options.headers['x-goog-api-key'];
      usedKeys.push(apiKey);
      if (apiKey === primaryKey) {
        return new Response(JSON.stringify({ error: { status: 'RESOURCE_EXHAUSTED' } }), {
          status: 429, headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(geminiResponse(majorData())), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(groqResponse()), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const keyEnv = { GEMINI_API_KEY: primaryKey, DAM11: backupKey, DAM7: duplicateKey, Dam10: 'test-backup-two-key', GROQ_API_KEY: env.GROQ_API_KEY };
    const first = await handleAdmissionsLookup({ body: majorBody('fail over request one'), env: keyEnv });
    const second = await handleAdmissionsLookup({ body: majorBody('fail over request two'), env: keyEnv });
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.deepEqual(usedKeys, [primaryKey, backupKey, backupKey]);
    assert.ok(capturedLogs.some(message => message.includes('"fromAlias":"GEMINI_API_KEY"') && message.includes('"toAlias":"DAM11"')));
    assert.ok(capturedLogs.every(message => !message.includes(primaryKey) && !message.includes(backupKey)));
  } finally {
    console.info = originalInfo;
  }
});

test('truy vấn lặp dùng cache và không gửi Gemini/Groq lần hai', async () => {
  const stats = mockProviders({ gemini: geminiResponse(majorData()) });
  const first = await handleAdmissionsLookup({ body: majorBody(), env });
  const second = await handleAdmissionsLookup({ body: majorBody(), env });
  assert.equal(first.data.fromCache, false);
  assert.equal(second.data.fromCache, true);
  assert.equal(stats.calls, 2);
});

test('bốn yêu cầu độc lập chạy đồng thời mà không đưa hồ sơ vào log', async () => {
  const stats = mockProviders({ gemini: geminiResponse(majorData()), delayMs: 10 });
  const capturedLogs = [];
  const originalLog = console.info;
  console.info = message => capturedLogs.push(String(message));
  let results;
  try {
    const requests = ['a', 'b', 'c', 'd'].map(value => handleAdmissionsLookup({ body: majorBody(`thích máy tính ${value}`), env }));
    results = await Promise.all(requests);
  } finally {
    console.info = originalLog;
  }
  assert.equal(results.length, 4);
  assert.ok(results.every(result => result.status === 200));
  assert.equal(stats.calls, 8);
  assert.ok(stats.maxActive >= 4, 'the server should not serialize independent lookups');
  assert.ok(capturedLogs.every(message => !message.includes('thích máy tính')));
  const logEntries = capturedLogs.map(message => JSON.parse(message));
  assert.ok(logEntries.every(entry => entry.timestamp && entry.status === 'ok'));
  assert.ok(logEntries.every(entry => entry.sourceUrls.includes(officialUrl)));
});

test('API key thiếu hoặc provider trả lỗi được báo rõ, không có kết quả dựng sẵn', async () => {
  const missingKey = await handleAdmissionsLookup({ body: majorBody(), env: {} });
  assert.equal(missingKey.status, 503);
  assert.equal(missingKey.data.code, 'GEMINI_NOT_CONFIGURED');

  mockProviders({ geminiStatus: 429, gemini: { error: { status: 'RESOURCE_EXHAUSTED', message: 'quota' } } });
  clearAdmissionsLookupCacheForTests();
  const limited = await handleAdmissionsLookup({ body: majorBody('lần khác'), env });
  assert.equal(limited.status, 429);
  assert.equal(limited.data.code, 'LOOKUP_RATE_LIMIT');
  assert.equal(limited.data.success, false);
  assert.match(limited.data.error, /HTTP 429 \(RESOURCE_EXHAUSTED\)/);
  assert.match(limited.data.error, /cùng project không cộng dồn hạn mức/);
});
