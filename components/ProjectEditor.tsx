
import React, { useState, useRef, ChangeEvent } from 'react';
import { SurveyProject, Question, DemographicQuestion } from '../types';
import SurveyStats from './SurveyStats';
import { 
  BarChart2Icon, MessageSquareIcon, SettingsIcon, PlusCircleIcon, 
  EditIcon, Trash2Icon, SaveIcon, XCircleIcon, UploadCloudIcon, ImageIcon, UsersIcon, LoaderIcon,
  CuteLoadingBear, CuteSuccessCat
} from './icons';

interface ProjectEditorProps {
  project: SurveyProject;
  updateProject: (id: string, updates: Partial<SurveyProject>) => Promise<void>;
  onBack: () => void;
}

type EditorTab = 'dashboard' | 'questions' | 'demographics' | 'settings';

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, updateProject, onBack }) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('dashboard');
  
  const TabContent = () => {
    switch (activeTab) {
      case 'questions':
        return <QuestionManager project={project} updateProject={updateProject} />;
      case 'demographics':
        return <DemographicsManager project={project} updateProject={updateProject} />;
      case 'settings':
        return <ProjectSettings project={project} updateProject={updateProject} />;
      case 'dashboard':
      default:
        return <SurveyStats surveyTitle={project.title} questions={project.questions} demographicQuestions={project.demographicQuestions || []} responses={project.responses} />;
    }
  };

  const tabs: { id: EditorTab; label: string; labelMobile: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'แดชบอร์ด', labelMobile: 'สถิติ', icon: BarChart2Icon },
    { id: 'questions', label: 'จัดการคำถาม', labelMobile: 'คำถาม', icon: MessageSquareIcon },
    { id: 'demographics', label: 'ข้อมูลผู้ตอบ', labelMobile: 'ประชากร', icon: UsersIcon },
    { id: 'settings', label: 'ตั้งค่า', labelMobile: 'ตั้งค่า', icon: SettingsIcon },
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
        กลับหน้ารายการ
      </button>
      
      <div className="bg-white p-4 md:p-8 rounded-[40px] shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-10">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate pr-4">{project.title}</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">สถานะระบบ</span>
            <button 
              onClick={() => updateProject(project.id, { isOpen: !project.isOpen })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${project.isOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}
              aria-label={`เปลี่ยนสถานะเป็น ${project.isOpen ? 'ปิด' : 'เปิด'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${project.isOpen ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 mb-8 overflow-hidden">
          <nav className="-mb-px flex space-x-0 md:space-x-6 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 whitespace-nowrap py-4 px-3 border-b-2 font-black text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="inline md:hidden">{tab.labelMobile}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="min-h-[400px]">
          <TabContent />
        </div>
      </div>
    </div>
  );
};

const DemographicsManager: React.FC<Pick<ProjectEditorProps, 'project' | 'updateProject'>> = ({ project, updateProject }) => {
  const [questions, setQuestions] = useState<DemographicQuestion[]>(project.demographicQuestions || []);
  const [editingQuestion, setEditingQuestion] = useState<DemographicQuestion | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = () => {
    updateProject(project.id, { demographicQuestions: questions });
    alert('บันทึกการเปลี่ยนแปลงแล้ว');
  };

  const addOrUpdateQuestion = (question: DemographicQuestion) => {
    if (isAdding) {
      setQuestions([...questions, { ...question, id: `dq${Date.now()}` }]);
    } else if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? question : q));
    }
    setIsAdding(false);
    setEditingQuestion(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำถามนี้?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    setEditingQuestion(null);
  };

  const startEditing = (question: DemographicQuestion) => {
    setEditingQuestion(question);
    setIsAdding(false);
  };

  const cancelEditing = () => {
    setIsAdding(false);
    setEditingQuestion(null);
  };
  
  return (
    <div className="space-y-6">
       <p className="text-slate-500">จัดการคำถามเกี่ยวกับข้อมูลทั่วไปของผู้ตอบแบบสอบถาม เช่น เพศ อายุ หรือสถานภาพ</p>
       {questions.map(q => (
         <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <p className="font-black text-slate-800">{q.label}</p>
              <p className="text-xs text-slate-500 font-bold">ตัวเลือก: {q.options.join(', ')} {q.includeOther && ', อื่นๆ'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
               <button onClick={() => startEditing(q)} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"><EditIcon className="w-5 h-5"/></button>
               <button onClick={() => handleDelete(q.id)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200"><Trash2Icon className="w-5 h-5"/></button>
            </div>
         </div>
       ))}
      
       {(isAdding || editingQuestion) && (
         <QuestionForm 
            question={editingQuestion}
            onSave={addOrUpdateQuestion}
            onCancel={cancelEditing}
         />
       )}

      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        {!isAdding && !editingQuestion && (
            <button onClick={startAdding} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-200 rounded-xl font-black text-sm hover:bg-indigo-50">
              <PlusCircleIcon className="w-5 h-5"/> เพิ่มคำถามใหม่
            </button>
        )}
        <div className="flex-grow"></div>
        <button onClick={handleSave} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700">
            <SaveIcon className="w-5 h-5"/> บันทึกการเปลี่ยนแปลง
        </button>
      </div>
    </div>
  );
};

const QuestionForm: React.FC<{ question: DemographicQuestion | null, onSave: (q: DemographicQuestion) => void, onCancel: () => void }> = ({ question, onSave, onCancel }) => {
    const [label, setLabel] = useState(question?.label || '');
    const [options, setOptions] = useState(question?.options.join(', ') || '');
    const [includeOther, setIncludeOther] = useState(question?.includeOther || false);

    const handleSubmit = () => {
        if (!label.trim() || !options.trim()) {
            alert('กรุณากรอกชื่อคำถามและตัวเลือก');
            return;
        }
        onSave({
            id: question?.id || '',
            label,
            options: options.split(',').map(s => s.trim()).filter(Boolean),
            includeOther
        });
    };

    return (
        <div className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-3xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <h4 className="font-black text-indigo-900">{question ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}</h4>
            <div>
                <label className="text-sm font-bold text-slate-600 mb-1 block">ชื่อคำถาม (เช่น เพศ)</label>
                <input type="text" value={label} onChange={e => setLabel(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg font-bold" />
            </div>
            <div>
                <label className="text-sm font-bold text-slate-600 mb-1 block">ตัวเลือก (คั่นด้วยเครื่องหมาย ,)</label>
                <input type="text" value={options} onChange={e => setOptions(e.target.value)} placeholder="เช่น ชาย, หญิง, ไม่ระบุ" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg font-bold" />
            </div>
            <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="includeOther" checked={includeOther} onChange={e => setIncludeOther(e.target.checked)} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="includeOther" className="font-bold text-slate-700">มีตัวเลือก "อื่นๆ" สำหรับกรอกเอง</label>
            </div>
            <div className="flex gap-3 pt-2">
                <button onClick={handleSubmit} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl">บันทึก</button>
                <button onClick={onCancel} className="px-6 py-3 bg-slate-200 text-slate-600 font-black rounded-xl">ยกเลิก</button>
            </div>
        </div>
    );
};


const QuestionManager: React.FC<Pick<ProjectEditorProps, 'project' | 'updateProject'>> = ({ project, updateProject }) => {
    const [questions, setQuestions] = useState<Question[]>(project.questions);
    const [editingQuestion, setEditingQuestion] = useState<{id: string, text: string} | null>(null);
    const [newQuestionText, setNewQuestionText] = useState('');

    const handleAddQuestion = () => {
        if (newQuestionText.trim()) {
            const newQ: Question = { id: `q${Date.now()}`, text: newQuestionText.trim() };
            const updatedQuestions = [...questions, newQ];
            setQuestions(updatedQuestions);
            updateProject(project.id, { questions: updatedQuestions });
            setNewQuestionText('');
        }
    };
    
    const handleUpdateQuestion = () => {
        if (!editingQuestion || !editingQuestion.text.trim()) return;
        const updatedQuestions = questions.map(q => q.id === editingQuestion.id ? { ...q, text: editingQuestion.text.trim() } : q);
        setQuestions(updatedQuestions);
        updateProject(project.id, { questions: updatedQuestions });
        setEditingQuestion(null);
    };

    const handleDeleteQuestion = (id: string) => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำถามนี้?')) {
            const updatedQuestions = questions.filter(q => q.id !== id);
            setQuestions(updatedQuestions);
            updateProject(project.id, { questions: updatedQuestions });
        }
    };

    return (
        <div className="space-y-6">
            {questions.map((q, index) => (
                <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                    {editingQuestion?.id === q.id ? (
                        <input 
                            type="text"
                            value={editingQuestion.text}
                            onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                            className="flex-grow px-4 py-2 bg-white border border-indigo-300 rounded-lg font-bold"
                            autoFocus
                        />
                    ) : (
                        <p className="font-bold text-slate-800"><span className="font-black text-indigo-500 mr-3">{index+1}.</span>{q.text}</p>
                    )}
                    <div className="flex items-center gap-2 flex-shrink-0">
                       {editingQuestion?.id === q.id ? (
                         <>
                            <button onClick={handleUpdateQuestion} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><SaveIcon className="w-5 h-5"/></button>
                            <button onClick={() => setEditingQuestion(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><XCircleIcon className="w-5 h-5"/></button>
                         </>
                       ) : (
                         <>
                            <button onClick={() => setEditingQuestion({id: q.id, text: q.text})} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200"><Trash2Icon className="w-5 h-5"/></button>
                         </>
                       )}
                    </div>
                </div>
            ))}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t-2 border-dashed border-slate-200">
                <input 
                    type="text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="พิมพ์คำถามใหม่ที่นี่..."
                    className="w-full sm:flex-grow px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                />
                <button onClick={handleAddQuestion} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700">
                    <PlusCircleIcon className="w-5 h-5"/> เพิ่มคำถาม
                </button>
            </div>
        </div>
    )
}

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Reduced MAX_WIDTH to 450 to prevent "Cell content > 50000 chars" error in Google Sheets
        const MAX_WIDTH = 450; 
        const scaleSize = MAX_WIDTH / img.width;
        const width = (img.width > MAX_WIDTH) ? MAX_WIDTH : img.width;
        const height = (img.width > MAX_WIDTH) ? img.height * scaleSize : img.height;
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.6 quality
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(dataUrl);
        } else {
            reject(new Error("Canvas context is null"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const ProjectSettings: React.FC<Pick<ProjectEditorProps, 'project' | 'updateProject'>> = ({ project, updateProject }) => {
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description);
    const [coverImage, setCoverImage] = useState<string | null | undefined>(project.coverImage);
    const [isProcessingImg, setIsProcessingImg] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        if (isProcessingImg || isSaving) return;
        
        setIsSaving(true);
        try {
            await updateProject(project.id, { title, description, coverImage });
            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
            }, 2500);
        } catch (error: any) {
            // Alert user with specific error message
            alert(error.message || 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsProcessingImg(true);
            try {
                // Resize and compress image before setting state
                const compressedImage = await resizeImage(file);
                setCoverImage(compressedImage);
            } catch (error) {
                console.error("Error processing image:", error);
                alert("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ");
            } finally {
                setIsProcessingImg(false);
                // Reset file input so the same file can be selected again if needed
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };
    
    return (
        <div className="space-y-8 relative">
            {/* Loading / Success Overlay */}
            {(isSaving || saveSuccess) && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white p-12 rounded-[48px] shadow-2xl text-center max-w-sm w-full mx-4 border-4 border-indigo-50 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                         {saveSuccess ? (
                             <>
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                                <div className="mb-6 flex justify-center"><CuteSuccessCat /></div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">บันทึกสำเร็จ!</h3>
                                <p className="text-slate-500 font-bold">ข้อมูลของคุณถูกอัปเดตเรียบร้อยแล้ว</p>
                             </>
                         ) : (
                             <>
                                <div className="mb-6 flex justify-center"><CuteLoadingBear /></div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">กำลังบันทึก...</h3>
                                <p className="text-indigo-500 font-bold animate-pulse">รอสักครู่นะ ระบบกำลังทำงาน</p>
                             </>
                         )}
                    </div>
                </div>
            )}

            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200/80">
                <h3 className="text-xl font-black text-slate-800 mb-6">ข้อมูลทั่วไป</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">ชื่อหัวข้อประเมิน</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">คำอธิบาย</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-28 px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold" />
                    </div>
                </div>
            </div>
            
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200/80">
                <h3 className="text-xl font-black text-slate-800 mb-6">รูปภาพหน้าปก</h3>
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-1/2 h-52 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
                        {isProcessingImg ? (
                           <div className="flex flex-col items-center gap-2">
                              <LoaderIcon className="w-8 h-8 text-indigo-500 animate-spin" />
                              <span className="text-xs font-bold text-indigo-500">กำลังประมวลผล...</span>
                           </div>
                        ) : coverImage ? (
                            <img src={coverImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="w-12 h-12 text-slate-300"/>
                        )}
                    </div>
                    <div className="w-full md:w-1/2 space-y-4 text-center md:text-left">
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                         <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isProcessingImg}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-slate-800 border-2 border-slate-200 rounded-xl font-black hover:bg-slate-100 disabled:opacity-50"
                         >
                           <UploadCloudIcon className="w-5 h-5"/> อัปโหลดรูปใหม่
                         </button>
                         <button 
                            onClick={() => setCoverImage(null)} 
                            disabled={!coverImage || isProcessingImg}
                            className="w-full text-rose-500 font-bold hover:bg-rose-50 py-2 rounded-lg disabled:opacity-50"
                         >
                           ลบรูปภาพ
                         </button>
                         <p className="text-xs text-slate-400">ระบบจะย่อขนาดรูปภาพให้อัตโนมัติ</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleSave} 
                    disabled={isProcessingImg || isSaving}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessingImg ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5"/>}
                    {isProcessingImg ? 'กำลังประมวลผล...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
            </div>
        </div>
    )
}

export default ProjectEditor;
