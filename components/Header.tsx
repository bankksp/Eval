
import React from 'react';
import { AdminIcon, UserIcon } from './icons';

interface HeaderProps {
  title: string;
  view: 'home' | 'survey' | 'admin';
  onGoHome: () => void;
  onAdminView: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, view, onGoHome, onAdminView }) => {
  return (
    <header className="sticky top-0 z-[60] bg-white/70 backdrop-blur-2xl border-b border-slate-200/50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={onGoHome}>
          <img 
            src="https://img5.pic.in.th/file/secure-sv1/-15bb7f54b4639a903.png" 
            alt="Logo" 
            className="w-11 h-11 rounded-full object-cover shadow-lg group-hover:scale-105 transition-transform duration-300" 
          />
          <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight truncate max-w-[150px] sm:max-w-none">
            {title}
          </h1>
        </div>
        
        <nav className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/40">
          <button
            onClick={onGoHome}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${view !== 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <UserIcon className="w-4 h-4" />
            <span className="hidden sm:inline">ประเมินผล</span>
          </button>
          <button
            onClick={onAdminView}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${view === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <AdminIcon className="w-4 h-4" />
            <span className="hidden sm:inline">จัดการระบบ</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;