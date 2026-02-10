import React, { useState } from 'react';
import { LockIcon } from './icons';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const ADMIN_PASSWORD = 'ksp1234';

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setError('');
      onSuccess();
    } else {
      setError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center border-4 border-slate-100 relative animate-in zoom-in-95 duration-300"
      >
        <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="mx-auto w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-lg">
          <LockIcon className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">เข้าสู่ระบบผู้ดูแล</h2>
        <p className="text-slate-500 font-medium mb-8">กรุณากรอกรหัสผ่านเพื่อเข้าถึงส่วนจัดการระบบ</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full text-center text-xl tracking-widest px-6 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl font-mono focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
            autoFocus
          />
          {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
          <button
            type="submit"
            className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            ยืนยัน
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
