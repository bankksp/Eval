
import React, { useState, useMemo } from 'react';
import { SurveyProject, Answer, SatisfactionLevel } from '../types';
import { FaceFrownIcon, FaceIcon, FaceMehIcon, FaceSmileIcon, FaceGrinIcon, SendIcon, MessageSquareIcon, UsersIcon, CuteLoadingBear, CuteSuccessCat, ChevronDownIcon } from './icons';
import SurveyCoverImage from './SurveyCoverImage';

interface SurveyFormProps {
  project: SurveyProject;
  onSubmit: (answers: Answer[], demographics: Record<string, string>, comment?: string) => void;
  onBack: () => void;
}

const satisfactionOptions = [
  { level: 1, label: 'น้อยที่สุด', Icon: FaceFrownIcon, color: 'text-rose-500', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', activeRing: 'ring-rose-500', shadow: 'shadow-rose-100', bgSelected: 'bg-rose-500', textSelected: 'text-white' },
  { level: 2, label: 'น้อย', Icon: FaceMehIcon, color: 'text-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', activeRing: 'ring-orange-500', shadow: 'shadow-orange-100', bgSelected: 'bg-orange-500', textSelected: 'text-white' },
  { level: 3, label: 'ปานกลาง', Icon: FaceIcon, color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', activeRing: 'ring-amber-500', shadow: 'shadow-amber-100', bgSelected: 'bg-amber-500', textSelected: 'text-white' },
  { level: 4, label: 'มาก', Icon: FaceSmileIcon, color: 'text-lime-500', bgColor: 'bg-lime-50', borderColor: 'border-lime-200', activeRing: 'ring-lime-500', shadow: 'shadow-lime-100', bgSelected: 'bg-lime-500', textSelected: 'text-white' },
  { level: 5, label: 'มากที่สุด', Icon: FaceGrinIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', activeRing: 'ring-emerald-500', shadow: 'shadow-emerald-100', bgSelected: 'bg-emerald-500', textSelected: 'text-white' },
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
    <div className="max-w-4xl mx-auto space-y-10">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
         กลับหน้าเลือกหัวข้อ
      </button>

      {project.coverImage && <SurveyCoverImage src={project.coverImage} />}

      <div className="text-center space-y-4 px-4 pb-4">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          {project.title}
        </h2>
        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
          {project.description}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-12">
        
        {/* ส่วนที่ 1: ข้อมูลทั่วไป (Demographics) - Redesigned to Dropdowns */}
        {project.demographicQuestions.length > 0 && (
           <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-lg shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                   <UsersIcon className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">ส่วนที่ 1: ข้อมูลทั่วไป</h3>
                   <p className="text-sm text-slate-500 font-medium">กรุณาเลือกข้อมูลที่ตรงกับตัวท่าน</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {project.demographicQuestions.map(q => (
                  <div key={q.id} className="group">
                    <label htmlFor={q.id} className="block text-sm font-bold text-slate-700 mb-2 group-hover:text-indigo-600 transition-colors">
                      {q.label} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id={q.id}
                        value={demographics[q.id] || ''}
                        onChange={(e) => handleDemographicChange(q.id, e.target.value)}
                        className={`w-full appearance-none px-4 py-3.5 bg-slate-50 border-2 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer ${
                          demographics[q.id] ? 'border-indigo-500 bg-white text-indigo-900' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <option value="" disabled className="text-slate-400">กรุณาเลือก...</option>
                        {q.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        {q.includeOther && <option value="อื่นๆ">อื่นๆ (โปรดระบุ)</option>}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                        <ChevronDownIcon className="w-5 h-5" />
                      </div>
                    </div>
                    
                    {/* Input for "Other" option */}
                    {q.includeOther && demographics[q.id] === 'อื่นๆ' && (
                       <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <input 
                            type="text" 
                            placeholder="โปรดระบุรายละเอียด..." 
                            value={otherValues[q.id] || ''} 
                            onChange={e => setOtherValues(prev => ({...prev, [q.id]: e.target.value}))} 
                            className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
                            autoFocus
                          />
                       </div>
                    )}
                  </div>
                ))}
              </div>
           </div>
        )}
        
        {/* Progress Bar Sticky */}
        <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-lg shadow-indigo-100/20 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
              ส่วนที่ 2: ความพึงพอใจ
            </span>
            <span className="text-xs font-black text-slate-600">
              {answeredCount} / {project.questions.length}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>

        {/* ส่วนที่ 2: คำถาม (Questions) - Redesigned Cards */}
        <div className="space-y-6">
          {project.questions.map((question, index) => (
            <div 
              key={question.id} 
              className={`bg-white p-6 md:p-8 rounded-[24px] border-2 transition-all duration-300 ${
                answers[question.id] 
                  ? 'border-indigo-100 shadow-md shadow-indigo-100/50' 
                  : 'border-slate-100 shadow-sm hover:border-slate-200'
              }`}
            >
              <div className="flex items-start gap-4 mb-6">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-colors ${
                  answers[question.id] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold text-slate-800 leading-snug pt-0.5">
                  {question.text}
                </h3>
              </div>
              
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {satisfactionOptions.map((opt) => {
                  const isSelected = answers[question.id] === opt.level;
                  return (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() => handleAnswerChange(question.id, opt.level as SatisfactionLevel)}
                      className={`group relative flex flex-col items-center justify-center p-2 sm:p-4 rounded-xl transition-all duration-300 ${
                        isSelected 
                          ? `${opt.bgSelected} shadow-lg scale-105` 
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <opt.Icon className={`w-8 h-8 sm:w-10 sm:h-10 mb-2 transition-transform duration-300 ${
                         isSelected ? 'text-white scale-110' : `${opt.color} group-hover:scale-110 opacity-70 group-hover:opacity-100`
                      }`} />
                      <span className={`text-[10px] sm:text-xs font-black uppercase tracking-tight ${
                        isSelected ? 'text-white/90' : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ส่วนที่ 3: ข้อเสนอแนะ */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
           <div className="flex items-center gap-4 mb-6">
             <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                <MessageSquareIcon className="w-5 h-5" />
             </div>
             <h3 className="text-lg font-black text-slate-900">ข้อเสนอแนะเพิ่มเติม</h3>
           </div>
           <textarea
             value={comment}
             onChange={(e) => setComment(e.target.value)}
             placeholder="บอกเล่าประสบการณ์หรือสิ่งที่อยากให้เราปรับปรุง..."
             className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 focus:bg-white transition-all font-medium text-slate-700 resize-none"
           />
        </div>

        <div className="pt-6 pb-20 text-center">
          {submissionError && (
            <div className="text-left p-6 mb-6 bg-rose-50 text-rose-600 font-bold rounded-2xl border border-rose-100 whitespace-pre-line animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-2">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 ข้อผิดพลาด
              </div>
              {submissionError}
            </div>
          )}
          <button
            type="submit"
            disabled={!isFormComplete}
            className="w-full sm:w-auto relative inline-flex items-center justify-center gap-3 px-12 py-5 bg-indigo-600 text-white font-black text-lg rounded-[24px] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-50 disabled:grayscale disabled:shadow-none transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
          >
            <SendIcon className="w-6 h-6" />
            ส่งคำตอบ
          </button>
        </div>
      </form>
    </div>
  );
};

export default SurveyForm;
