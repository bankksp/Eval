
import React, { useState } from 'react';
import useSurveyData from './hooks/useSurveyData';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel';
import SurveyForm from './components/SurveyForm';
import { Footer } from './components/Footer';
import ProjectGrid from './components/ProjectGrid';
import { SurveyProject } from './types';
import AdminLogin from './components/AdminLogin';
import { CuteLoaderIcon } from './components/icons';

type ViewState = 'home' | 'survey' | 'admin';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState<boolean>(false);
  const { loading, projects, addProject, updateProject, deleteProject, submitResponse } = useSurveyData();

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleStartSurvey = (projectId: string) => {
    setSelectedProjectId(projectId);
    setView('survey');
  };

  const handleAdminView = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setShowAdminPrompt(true);
    }
  };

  const handleGoHome = () => {
    setView('home');
    setSelectedProjectId(null);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowAdminPrompt(false);
    setView('admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
         <CuteLoaderIcon className="w-16 h-16 text-indigo-500" />
         <p className="text-slate-500 font-bold animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header 
        title={selectedProject ? selectedProject.title : "ระบบประเมินความพึงพอใจ"} 
        view={view}
        onGoHome={handleGoHome}
        onAdminView={handleAdminView} 
      />

      {showAdminPrompt && (
        <AdminLogin 
          onSuccess={handleAdminLoginSuccess} 
          onCancel={() => setShowAdminPrompt(false)}
        />
      )}

      <main className="container mx-auto px-4 py-8">
        {view === 'home' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                ร่วมเป็นส่วนหนึ่งใน<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">การพัฒนาบริการ</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                เลือกหัวข้อที่คุณต้องการประเมินเพื่อให้เรานำไปปรับปรุงคุณภาพให้ดียิ่งขึ้น
              </p>
            </div>
            
            <ProjectGrid 
              projects={projects} 
              onSelect={handleStartSurvey} 
            />
          </div>
        )}

        {view === 'survey' && selectedProject && (
          <div className="animate-in slide-in-from-bottom-8 duration-700">
            <SurveyForm 
              project={selectedProject} 
              onSubmit={(answers, demographics, comment) => {
                submitResponse(selectedProject.id, answers, demographics, comment);
              }}
              onBack={handleGoHome}
            />
          </div>
        )}

        {view === 'admin' && isAdminAuthenticated && (
          <AdminPanel
            projects={projects}
            addProject={addProject}
            updateProject={updateProject}
            deleteProject={deleteProject}
            onBack={handleGoHome}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
