
import React from 'react';
import { SurveyProject } from '../types';

interface ProjectGridProps {
  projects: SurveyProject[];
  onSelect: (id: string) => void;
}

const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {projects.map((project, idx) => (
        <div 
          key={project.id}
          style={{ animationDelay: `${idx * 100}ms` }}
          className="group relative bg-white rounded-[32px] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-2 transition-all duration-500 flex flex-col animate-in fade-in slide-in-from-bottom-4"
        >
          {/* Status Badge */}
          <div className="absolute top-5 right-5 z-20">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-md ${
              project.isOpen 
                ? 'bg-emerald-500/90 text-white' 
                : 'bg-slate-800/90 text-slate-200'
            }`}>
              {project.isOpen ? '● Live' : 'Closed'}
            </div>
          </div>

          {/* Cover Area */}
          <div className="relative h-52 overflow-hidden bg-slate-100">
            {project.coverImage ? (
              <img src={project.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={project.title} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50">
                <svg className="w-16 h-16 text-indigo-200 group-hover:scale-110 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-8 flex-grow flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors">
              {project.title}
            </h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 flex-grow line-clamp-2">
              {project.description}
            </p>

            <button
              onClick={() => project.isOpen && onSelect(project.id)}
              disabled={!project.isOpen}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 ${
                project.isOpen 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {project.isOpen ? (
                <>
                  เข้าประเมินผล
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  ปิดรับข้อมูลชั่วคราว
                </>
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Empty State / Add Suggestion for Admin */}
      {projects.length === 0 && (
        <div className="col-span-full py-32 text-center bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
           <p className="text-slate-400 font-bold text-xl">ยังไม่พบเรื่องที่ต้องการประเมิน</p>
        </div>
      )}
    </div>
  );
};

export default ProjectGrid;
