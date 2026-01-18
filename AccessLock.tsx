import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, ShieldCheck, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

const VALID_CODES = [
  "WARED-VIP-1001",
  "WARED-VIP-2024",
  "WARED-VIP-3382",
  "WARED-VIP-4471",
  "WARED-VIP-5590",
  "WARED-VIP-6615",
  "WARED-VIP-7738",
  "WARED-VIP-8842",
  "WARED-VIP-9903",
  "WARED-VIP-5050"
];

const LOGO_URL = "http://ratibni.net/wp-content/uploads/2026/01/Untitled-design.png";

interface AccessLockProps {
  onUnlock: () => void;
}

export const AccessLock = ({ onUnlock }: AccessLockProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay for better UX
    setTimeout(() => {
      if (VALID_CODES.includes(code.trim().toUpperCase())) {
        localStorage.setItem('wared_access_granted', 'true');
        onUnlock();
      } else {
        setError('كود الشراء غير صحيح، يرجى التأكد والمحاولة مرة أخرى');
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] bg-emerald-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8 relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 mb-6 relative">
                 <img src={LOGO_URL} className="w-full h-full object-contain opacity-20" alt="Logo" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                        <Lock size={32} strokeWidth={2.5} />
                    </div>
                 </div>
            </div>
            
            <h1 className="text-2xl font-black text-slate-800 mb-2">تفعيل النسخة</h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
              هذا التطبيق محمي. يرجى إدخال كود الشراء الخاص بك لفتح النظام والبدء في الاستخدام.
            </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider">كود الشراء</label>
                <div className="relative">
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 pointer-events-none">
                        <KeyRound size={20} />
                    </div>
                    <input 
                        type="text"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase());
                            setError('');
                        }}
                        placeholder="WARED-XXXX-XXXX"
                        className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-mono text-lg font-bold text-center text-slate-800 tracking-wider placeholder:tracking-normal placeholder:font-sans transition-all"
                    />
                </div>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-500 text-xs font-bold mt-2 mr-2"
                    >
                        <AlertCircle size={14} />
                        {error}
                    </motion.div>
                )}
            </div>

            <button 
                type="submit"
                disabled={loading || !code}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 size={24} className="animate-spin" />
                        جاري التحقق...
                    </>
                ) : (
                    <>
                        <ShieldCheck size={24} />
                        تفعيل والدخول
                    </>
                )}
            </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-xs text-slate-400 font-medium">
                تواجه مشكلة في التفعيل؟ <a href="https://wa.me/9647734382514" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline">تواصل مع الدعم الفني</a>
            </p>
        </div>
      </motion.div>
    </div>
  );
};
