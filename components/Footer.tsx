
import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-white mt-12">
            <div className="container mx-auto px-4 py-6 text-center text-slate-500">
                <p>&copy; {new Date().getFullYear()} Satisfaction Survey App. All rights reserved.</p>
                <p className="text-sm mt-2">พัฒนาโดย นันทพัทธ์ แสงสุดตา โรงเรียนกาฬสินธุ์ปัญญานุกูล</p>
            </div>
        </footer>
    );
};
