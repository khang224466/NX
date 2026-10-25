import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  RIASEC_CODES,
  RIASEC_PROFILE_NOTICE,
  RIASEC_QUESTIONS,
  hasRiasecProfileVariation,
  isValidRiasecAnswer,
  sanitizeRiasecAnswers,
  scoreRiasecAnswers
} from '../services/assessment/recommendationEngine';
import type { RiasecAnswers, RiasecProfile } from '../services/assessment/recommendationEngine';

const STORAGE_KEY = 'nexora_riasec_responses_v1';
const QUESTIONS_PER_PAGE = 6;
const RESPONSE_LABELS = [
  'Rất không thích',
  'Không thích',
  'Phân vân',
  'Thích',
  'Rất thích'
] as const;

const DIMENSION_LABELS: Record<(typeof RIASEC_CODES)[number], string> = {
  R: 'Thực tế',
  I: 'Nghiên cứu',
  A: 'Nghệ thuật',
  S: 'Xã hội',
  E: 'Quản lý',
  C: 'Nghiệp vụ'
};

function readStoredAnswers(): RiasecAnswers {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? sanitizeRiasecAnswers(JSON.parse(stored)) : {};
  } catch {
    return {};
  }
}

export interface RiasecAssessmentProps {
  onProfileChange: (profile: RiasecProfile | null) => void;
}

export const RiasecAssessment: React.FC<RiasecAssessmentProps> = ({ onProfileChange }) => {
  const [answers, setAnswers] = useState<RiasecAnswers>(() => readStoredAnswers());
  const [pageIndex, setPageIndex] = useState(0);
  const [pageError, setPageError] = useState('');
  const callbackRef = useRef(onProfileChange);

  useEffect(() => {
    callbackRef.current = onProfileChange;
  }, [onProfileChange]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // The assessment remains usable when browser storage is unavailable.
    }
    const profile = scoreRiasecAnswers(answers);
    callbackRef.current(profile.isComplete ? profile : null);
  }, [answers]);

  const pageCount = Math.ceil(RIASEC_QUESTIONS.length / QUESTIONS_PER_PAGE);
  const safePageIndex = Math.min(pageIndex, Math.max(0, pageCount - 1));
  const visibleQuestions = useMemo(
    () => RIASEC_QUESTIONS.slice(safePageIndex * QUESTIONS_PER_PAGE, (safePageIndex + 1) * QUESTIONS_PER_PAGE),
    [safePageIndex]
  );
  const profile = useMemo(() => scoreRiasecAnswers(answers), [answers]);
  const profileHasVariation = hasRiasecProfileVariation(profile);
  const pageComplete = visibleQuestions.every((question) => isValidRiasecAnswer(answers[question.id]));
  const progressPercent = RIASEC_QUESTIONS.length
    ? Math.round((profile.answeredCount / RIASEC_QUESTIONS.length) * 100)
    : 0;

  const setResponse = (questionId: string, answer: number) => {
    setAnswers((previous) => ({ ...previous, [questionId]: answer }));
    setPageError('');
  };

  const goNext = () => {
    if (!pageComplete) {
      setPageError('Bạn hãy trả lời đủ 6 câu trong trang này để tiếp tục.');
      return;
    }
    setPageError('');
    setPageIndex((previous) => Math.min(pageCount - 1, previous + 1));
  };

  const handleKeyboardShortcut = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const questionId = target.closest<HTMLElement>('[data-riasec-question]')?.dataset.riasecQuestion;
    if (questionId && /^[1-5]$/.test(event.key)) {
      event.preventDefault();
      setResponse(questionId, Number(event.key));
      return;
    }
    if (event.target === event.currentTarget && event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    }
    if (event.target === event.currentTarget && event.key === 'ArrowLeft') {
      event.preventDefault();
      setPageError('');
      setPageIndex((previous) => Math.max(0, previous - 1));
    }
  };

  const resetAssessment = () => {
    setAnswers({});
    setPageIndex(0);
    setPageError('');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // No action needed when browser storage is unavailable.
    }
  };

  return (
    <details className="rounded-xl border border-slate-700 bg-[#141923] p-4">
      <summary className="cursor-pointer text-base font-semibold text-white">
        Khảo sát sở thích nghề nghiệp RIASEC (60 câu)
        <span className="ml-2 text-sm font-normal text-slate-300">
          {profile.isComplete ? '· Đã hoàn tất' : `· ${profile.answeredCount}/${profile.questionCount} câu`}
        </span>
      </summary>

      <div className="mt-4 space-y-4" onKeyDown={handleKeyboardShortcut}>
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-sm text-amber-100">
          {RIASEC_PROFILE_NOTICE} Kết quả dùng để khám phá sở thích; không phải chẩn đoán hay xác suất thành công.
        </div>

        <div>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Tiến độ trả lời</span>
            <span>{profile.answeredCount}/{profile.questionCount}</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-label="Tiến độ khảo sát RIASEC"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {profile.isComplete && (
          <section className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4" aria-live="polite">
            <h4 className="font-bold text-white">Hồ sơ sở thích đã hoàn tất</h4>
            <p className="mt-1 text-sm text-slate-200">
              {profileHasVariation
                ? <>Các chiều cao hơn trung bình hồ sơ: {profile.dominantDimensions.map((code) => `${code} · ${DIMENSION_LABELS[code]}`).join(' / ')}</>
                : 'Các chiều sở thích hiện khá cân bằng; hệ thống không tự gán một nhóm nổi trội.'}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {RIASEC_CODES.map((code) => (
                <div key={code} className="rounded-lg bg-black/20 px-3 py-2 text-sm text-slate-200">
                  <span className="font-bold text-white">{code} · {DIMENSION_LABELS[code]}</span>
                  <span className="float-right tabular-nums">{profile.scores[code].toFixed(0)}/100</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {visibleQuestions.length > 0 && (
          <>
            <div
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-[#0E1117] p-3 text-sm text-slate-300"
              tabIndex={0}
              aria-label={`Trang ${safePageIndex + 1} trên ${pageCount}. Dùng phím mũi tên trái phải để chuyển trang.`}
            >
              <span>Trang {safePageIndex + 1}/{pageCount}</span>
              <span>Phím 1–5 để chọn mức độ yêu thích</span>
            </div>

            {visibleQuestions.map((question, localIndex) => {
              const questionNumber = safePageIndex * QUESTIONS_PER_PAGE + localIndex + 1;
              return (
                <fieldset
                  key={question.id}
                  data-riasec-question={question.id}
                  className="rounded-xl border border-slate-700 bg-[#0E1117] p-4"
                  aria-keyshortcuts="1 2 3 4 5"
                >
                  <legend className="max-w-full px-1 text-sm font-semibold leading-6 text-white">
                    {questionNumber}. {question.text}
                  </legend>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {RESPONSE_LABELS.map((label, index) => {
                      const value = index + 1;
                      const checked = answers[question.id] === value;
                      return (
                        <label key={value} className="cursor-pointer text-center">
                          <input
                            type="radio"
                            name={question.id}
                            value={value}
                            checked={checked}
                            onChange={() => setResponse(question.id, value)}
                            aria-label={`${label} (${value} trên 5)`}
                            className="peer sr-only"
                          />
                          <span className={`flex min-h-11 items-center justify-center rounded-lg border px-1 text-xs font-semibold transition-colors sm:text-sm ${
                            checked
                              ? 'border-blue-400 bg-blue-600 text-white'
                              : 'border-slate-700 bg-[#141923] text-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300 hover:border-blue-400'
                          }`}>
                            {value}
                          </span>
                          <span className="mt-1 block text-[10px] leading-4 text-slate-400 sm:text-xs">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}

            {pageError && <p role="alert" className="text-sm text-amber-200">{pageError}</p>}

            <div className="flex flex-wrap justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setPageError('');
                  setPageIndex((previous) => Math.max(0, previous - 1));
                }}
                disabled={safePageIndex === 0}
                className="min-h-11 rounded-lg border border-slate-600 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trang trước
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetAssessment}
                  className="min-h-11 rounded-lg border border-slate-600 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Làm lại
                </button>
                {safePageIndex < pageCount - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-500"
                  >
                    Trang tiếp theo
                  </button>
                ) : (
                  <span className="flex min-h-11 items-center rounded-lg bg-slate-800 px-4 text-sm font-semibold text-slate-300">
                    {profile.isComplete ? 'Đã lưu hồ sơ' : 'Trả lời đủ câu để hoàn tất'}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </details>
  );
};
