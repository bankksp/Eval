
import React, { useState, useMemo } from 'react';
import { SurveyProject, Answer, SatisfactionLevel } from '../types';
import { FaceFrownIcon, FaceIcon, FaceMehIcon, FaceSmileIcon, FaceGrinIcon, SendIcon, MessageSquareIcon, UsersIcon, CuteLoadingBear, CuteSuccessCat } from './icons';
import SurveyCoverImage from './SurveyCoverImage';

interface SurveyFormProps {
  project: SurveyProject;
  onSubmit: (answers: Answer[], demographics: Record<string, string>, comment?: string) => void;
  onBack: () => void;
}

const satisfactionOptions = [
  { level: 1, label: 'น้อยที่สุด', Icon: FaceFrownIcon, color: 'text-rose-500', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', activeRing: 'ring-rose-500', shadow: 'shadow-rose-100' },
  { level: 2, label: 'น้อย', Icon: FaceMehIcon, color: 'text-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', activeRing: 'ring-orange-500', shadow: 'shadow-orange-100' },
  { level: 3, label: 'ปานกลาง', Icon: FaceIcon, color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', activeRing: 'ring-amber-500', shadow: 'shadow-amber-100' },
  { level: 4, label: 'มาก', Icon: FaceSmileIcon, color: 'text-lime-500', bgColor: 'bg-lime-50', borderColor: 'border-lime-200', activeRing: 'ring-lime-500', shadow: 'shadow-lime-100' },
  { level: 5, label: 'มากที่สุด', Icon: FaceGrinIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', activeRing: 'ring-emerald-500', shadow: 'shadow-emerald-100' },
];

const SurveyForm: React.FC<SurveyFormProps> = ({ project, onSubmit, onBack }) => {
  const [answers, setAnswers] = useState<Record<string, SatisfactionLevel>>({});
  const [demographics, setDemographics] = useState<Record<string, string>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const handleAnswerChange = (questionId: string, level: SatisfactionLevel) => {
    setAnswers(prev => ({ ...prev, [questionId]: level }));
  };
  
  const handleDemographicChange = (qId: string, value: string) => {
    setDemographics(prev => ({ ...prev, [qId]: value }));
  };

  const handleOtherValueChange = (qId: string, text: string) => {
      setOtherValues(prev => ({ ...prev, [qId]: text }));
      if (demographics[qId] !== 'อื่นๆ') {
          handleDemographicChange(qId, 'อื่นๆ');
      }
  };

  const isDemographicsComplete = useMemo(() => {
    return project.demographicQuestions.every(q => demographics[q.id]);
  }, [demographics, project.demographicQuestions]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progressPercent = useMemo(() => (answeredCount / project.questions.length) * 100, [answeredCount, project.questions.length]);
  const isFormComplete = answeredCount === project.questions.length && project.questions.length > 0 && isDemographicsComplete;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    const formattedAnswers: Answer[] = Object.entries(answers).map(([questionId, level]) => ({
      questionId,
      level: level as SatisfactionLevel,
    }));
    
    const finalDemographics: Record<string, string> = {};
    Object.entries(demographics).forEach(([qId, value]) => {
        const question = project.demographicQuestions.find(q => q.id === qId);
        if (question?.includeOther && value === 'อื่นๆ') {
            finalDemographics[qId] = otherValues[qId] || 'อื่นๆ';
        } else {
            finalDemographics[qId] = String(value);
        }
    });

    try {
      await onSubmit(formattedAnswers, finalDemographics, comment);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("Submission failed:", error);
      if (error.message && error.message.includes('Failed to fetch')) {
        setSubmissionError(
          'เกิดข้อผิดพลาดในการเชื่อมต่อ (Failed to fetch) \nโปรดตรวจสอบการตั้งค่า URL ในไฟล์ hooks/useSurveyData.ts ว่าถูกต้องและเป็น URL ล่าสุดจากการ Deploy หรือไม่'
        );
      } else {
        setSubmissionError(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center py-32 animate-in fade-in duration-500 bg-white/50 backdrop-blur-sm rounded-[40px] border border-white/60 shadow-xl">
        <div className="relative mb-6">
            <CuteLoadingBear />
        </div>
        <h2 className="text-3xl font-black text-indigo-900 tracking-tight">กำลังส่งคำตอบ...</h2>
        <p className="text-indigo-600/80 font-bold mt-2 text-lg">อดใจรอสักครู่นะ ระบบกำลังบันทึกข้อมูล</p>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-16 rounded-[48px] shadow-2xl shadow-indigo-100 border border-slate-100 text-center animate-in fade-in zoom-in duration-700 mt-12 overflow-hidden relative">
         {/* Confetti / Background Elements */}
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400"></div>
         
        <div className="mx-auto flex items-center justify-center mb-8 relative">
          <CuteSuccessCat />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">ขอบคุณสำหรับข้อมูล!</h2>
        <p className="text-slate-500 text-xl font-medium mb-12 leading-relaxed">เราได้รับคำตอบสำหรับเรื่อง "{project.title}" เรียบร้อยแล้ว</p>
        <button 
          onClick={onBack}
          className="px-10 py-4 bg-indigo-600 text-white font-black rounded-[24px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 hover:-translate-y-1"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
         กลับหน้าเลือกหัวข้อ
      </button>

      {project.coverImage && <SurveyCoverImage src={project.coverImage} />}

      <div className="text-center space-y-4 px-4">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          {project.title}
        </h2>
        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
          {project.description}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {project.demographicQuestions.length > 0 && (
           <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100/80">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-500"><UsersIcon className="w-6 h-6" /></div>
                <h3 className="text-xl font-black text-slate-900">ส่วนที่ 1: ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม</h3>
              </div>
              <div className="space-y-8">
                {project.demographicQuestions.map(q => (
                  <fieldset key={q.id}>
                    <legend className="font-black text-slate-800 text-lg mb-4">{q.label}</legend>
                    <div className="flex flex-wrap gap-4">
                      {q.options.map(opt => (
                        <div key={opt}>
                          <input type="radio" id={`${q.id}-${opt}`} name={q.id} value={opt} checked={demographics[q.id] === opt} onChange={() => handleDemographicChange(q.id, opt)} className="sr-only peer" />
                          <label htmlFor={`${q.id}-${opt}`} className="block px-6 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 peer-checked:bg-indigo-50 peer-checked:border-indigo-500 peer-checked:text-indigo-700 peer-checked:font-black font-bold cursor-pointer transition-all hover:border-indigo-300">
                            {opt}
                          </label>
                        </div>
                      ))}
                      {q.includeOther && (
                        <div className="flex items-center gap-2 flex-grow">
                          <input type="radio" id={`${q.id}-other`} name={q.id} value="อื่นๆ" checked={demographics[q.id] === 'อื่นๆ'} onChange={() => handleDemographicChange(q.id, 'อื่นๆ')} className="sr-only peer" />
                          <label htmlFor={`${q.id}-other`} className="block px-6 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 peer-checked:bg-indigo-50 peer-checked:border-indigo-500 peer-checked:text-indigo-700 peer-checked:font-black font-bold cursor-pointer transition-all hover:border-indigo-300">
                            อื่นๆ
                          </label>
                          <input type="text" placeholder="โปรดระบุ..." onFocus={() => handleDemographicChange(q.id, 'อื่นๆ')} value={otherValues[q.id] || ''} onChange={e => setOtherValues(prev => ({...prev, [q.id]: e.target.value}))} className="px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold flex-grow focus:border-indigo-500 focus:ring-0 focus:outline-none transition-all disabled:opacity-50" disabled={demographics[q.id] !== 'อื่นๆ'} />
                        </div>
                      )}
                    </div>
                  </fieldset>
                ))}
              </div>
           </div>
        )}
        
        <h3 className="text-xl font-black text-slate-900 text-center pt-8">ส่วนที่ 2: ประเด็นความพึงพอใจ</h3>

        <div className="mb-10 sticky top-24 z-50 bg-white/70 backdrop-blur-xl p-4 md:p-6 rounded-[32px] border border-white shadow-2xl shadow-indigo-100/30">
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">ความคืบหน้าการประเมิน</span>
            </div>
            <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
              {answeredCount} / {project.questions.length} ข้อ
            </span>
          </div>
          <div className="w-full bg-slate-100/50 h-3 rounded-full overflow-hidden border border-slate-200/40">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {project.questions.map((question, index) => (
          <div key={question.id} className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100/80 hover:border-indigo-200 transition-all group/card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
              <span className="flex-shrink-0 w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner group-hover/card:scale-110 transition-transform">
                {index + 1}
              </span>
              <h3 className="text-2xl font-black text-slate-900 leading-snug pt-1">
                {question.text}
              </h3>
            </div>
            
            <div className="grid grid-cols-5 gap-3 sm:gap-6">
              {satisfactionOptions.map((opt) => (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => handleAnswerChange(question.id, opt.level as SatisfactionLevel)}
                  className={`group/opt relative flex flex-col items-center p-4 sm:p-6 rounded-[32px] border-2 transition-all duration-500 ${
                    answers[question.id] === opt.level
                      ? `${opt.borderColor} ${opt.bgColor} ring-[12px] ${opt.activeRing}/10 scale-[1.05] ${opt.shadow}`
                      : 'border-transparent bg-slate-50/50 hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <opt.Icon className={`w-10 h-10 sm:w-16 sm:h-16 mb-4 transition-all duration-500 ${opt.color} ${answers[question.id] === opt.level ? 'scale-110 drop-shadow-md' : 'group-hover/opt:scale-110 grayscale-[0.5] group-hover/opt:grayscale-0'}`} />
                  <span className={`text-[10px] sm:text-xs text-center font-black uppercase tracking-tight sm:tracking-widest ${answers[question.id] === opt.level ? 'text-slate-900' : 'text-slate-400'}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
           <div className="flex items-center gap-4 mb-6">
             <div className="p-3 bg-slate-100 rounded-2xl text-slate-500"><MessageSquareIcon className="w-6 h-6" /></div>
             <h3 className="text-xl font-black text-slate-900">ข้อเสนอแนะเพิ่มเติม</h3>
           </div>
           <textarea
             value={comment}
             onChange={(e) => setComment(e.target.value)}
             placeholder="บอกเล่าประสบการณ์หรือสิ่งที่อยากให้เราปรับปรุง..."
             className="w-full h-40 px-6 py-6 bg-slate-50 border border-slate-100 rounded-[28px] focus:outline-none focus:ring-[12px] focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all font-bold text-lg resize-none"
           />
        </div>

        <div className="pt-10 pb-20 text-center">
          {submissionError && (
            <div className="text-left p-6 mb-6 bg-rose-50 text-rose-600 font-bold rounded-2xl border-2 border-rose-200 whitespace-pre-line animate-in fade-in slide-in-from-top-2">
              {submissionError}
            </div>
          )}
          <button
            type="submit"
            disabled={!isFormComplete}
            className="group relative inline-flex items-center gap-4 px-16 py-6 bg-indigo-600 text-white font-black text-xl rounded-[32px] shadow-2xl shadow-indigo-200/50 hover:bg-indigo-700 disabled:opacity-40 disabled:grayscale transition-all duration-500 transform hover:-translate-y-2 active:scale-95"
          >
            <SendIcon className="w-7 h-7" />
            ส่งคำตอบของคุณ
          </button>
        </div>
      </form>
    </div>
  );
};

export default SurveyForm;
