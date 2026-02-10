
import React, { useState } from 'react';
import { SurveyProject } from '../types';
import { PlusCircleIcon, Trash2Icon, StarIcon, AdminIcon, EditIcon, CodeIcon, LoaderIcon } from './icons';
import ProjectEditor from './ProjectEditor';
import EmbedCode from './EmbedCode';

interface AdminPanelProps {
  projects: SurveyProject[];
  addProject: (title: string, description: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<SurveyProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ projects, addProject, updateProject, deleteProject, onBack }) => {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showEmbedInfo, setShowEmbedInfo] = useState(false);

  const activeProject = projects.find(p => p.id === editingProjectId);

  const handleCreateProject = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      await addProject(newTitle, newDesc);
      setIsAdding(false);
      setNewTitle('');
      setNewDesc('');
    } catch (error) {
      console.error("Failed to create project", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('ต้องการลบโครงการนี้ใช่หรือไม่? ข้อมูลโครงการและคำตอบที่บันทึกไว้จะถูกลบอย่างถาวร')) {
        setDeletingId(id);
        try {
            await deleteProject(id);
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการลบโครงการ');
        } finally {
            setDeletingId(null);
        }
    }
  };

  if (activeProject) {
    return (
      <ProjectEditor
        project={activeProject}
        updateProject={updateProject}
        onBack={() => setEditingProjectId(null)}
      />
    );
  }

  return (
    <>
      {showEmbedInfo && <EmbedCode onClose={() => setShowEmbedInfo(false)} />}
      <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">คลังหัวข้อประเมิน</h2>
            <p className="text-slate-500 font-bold text-sm">จัดการหัวข้อและเปิด-ปิดระบบสำรวจความพึงพอใจ</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowEmbedInfo(true)}
              className="bg-white text-slate-700 px-8 py-4 rounded-2xl font-black text-sm shadow-md border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <CodeIcon className="w-5 h-5" />
              วิธีเชื่อมต่อ
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <PlusCircleIcon className="w-5 h-5" />
              สร้างเรื่องใหม่
            </button>
          </div>
        </div>

        {isAdding && (
          <div className="bg-white p-8 rounded-[40px] border-2 border-indigo-500 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black mb-6">สร้างหัวข้อประเมินใหม่</h3>
            <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="ชื่อเรื่อง (เช่น ความพึงพอใจในร้านอาหาร)" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={isCreating}
                />
                <textarea 
                  placeholder="คำอธิบายสั้นๆ..." 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-24"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  disabled={isCreating}
                />
                <div className="flex gap-3">
                  <button 
                    onClick={handleCreateProject}
                    disabled={isCreating || !newTitle.trim()}
                    className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isCreating ? <LoaderIcon className="w-5 h-5 animate-spin" /> : null}
                    {isCreating ? 'กำลังบันทึก...' : 'ยืนยันสร้าง'}
                  </button>
                  <button 
                    onClick={() => setIsAdding(false)}
                    disabled={isCreating}
                    className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl disabled:opacity-70"
                  >ยกเลิก</button>
                </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${project.isOpen ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                    {project.isOpen ? <StarIcon className="w-7 h-7" /> : <AdminIcon className="w-7 h-7" />}
                </div>
                <div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{project.title}</h4>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{project.responses.length} คำตอบ · {project.questions.length} คำถาม</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 mr-6 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ระบบเปิดใช้งาน</span>
                    <button 
                      onClick={() => updateProject(project.id, { isOpen: !project.isOpen })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${project.isOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${project.isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <button 
                  onClick={() => setEditingProjectId(project.id)}
                  className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  aria-label="จัดการโครงการ"
                >
                    <EditIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(project.id)}
                  disabled={deletingId === project.id}
                  className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="ลบโครงการ"
                >
                    {deletingId === project.id ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <Trash2Icon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
