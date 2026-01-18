import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, MoreVertical, Smartphone, Monitor, RefreshCw, ArrowUp } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // State to toggle manual instructions if native install fails
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(checkStandalone);
    if (checkStandalone) return;

    // 2. Detect Platform
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    // 3. Event Listener for Native Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true); // Auto-show if event fires
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Check if event was already captured globally
    if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
        setShow(true);
    }

    // 5. Force show after delay even if event didn't fire (so we can show the button that leads to instructions)
    const timer = setTimeout(() => {
        if (!checkStandalone) setShow(true);
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Native Install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
        setShow(false);
      }
    } else {
        // Fallback: Show instructions
        setShowManual(true);
    }
  };

  if (isStandalone || !show) return null;

  return (
    <AnimatePresence>
      
      {/* --- Visual Arrow Pointer for Android/Manual Install --- */}
      {showManual && !isIOS && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="fixed top-2 left-4 z-[10000] flex flex-col items-center pointer-events-none"
        >
            <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-xl mb-1 border border-white/20 whitespace-nowrap">
                اضغط هنا
            </div>
            <ArrowUp size={36} className="text-slate-900 drop-shadow-md" strokeWidth={3} />
        </motion.div>
      )}

      <div className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-none p-4 pb-6">
        <motion.div
           initial={{ y: "100%", opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: "100%", opacity: 0 }}
           transition={{ type: "spring", damping: 25, stiffness: 300 }}
           className="w-full max-w-md bg-white p-6 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border border-emerald-100 pointer-events-auto relative"
        >
            <button 
                onClick={() => setShow(false)} 
                className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors p-2"
            >
                <X size={20} />
            </button>

            <div className="flex items-start gap-4">
                <img 
                    src="http://ratibni.net/wp-content/uploads/2026/01/Untitled-design.png" 
                    alt="Wared Logo" 
                    className="w-16 h-16 object-contain shrink-0" 
                />
                <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-lg">تثبيت التطبيق</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
                        تثبيت "وارد" للوصول السريع بدون انترنت.
                    </p>

                    {/* --- Unified Install Button --- */}
                    {/* Always show this button first */}
                    {!showManual && (
                         <button 
                            onClick={handleInstallClick}
                            className="mt-4 w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            تثبيت الآن
                        </button>
                    )}

                    {/* --- Manual Instructions (Revealed if native prompt fails) --- */}
                    {showManual && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200"
                        >
                            {isIOS ? (
                                <div className="space-y-3 text-xs font-bold text-slate-600">
                                    <div className="flex items-center justify-between">
                                        <span>1. اضغط على مشاركة</span>
                                        <Share size={16} className="text-blue-500" />
                                    </div>
                                    <div className="h-px bg-gray-200"></div>
                                    <div className="flex items-center justify-between">
                                        <span>2. اختر "إضافة للصفحة الرئيسية"</span>
                                        <PlusSquare size={16} className="text-slate-800" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 text-xs font-bold text-slate-600">
                                     <p className="text-emerald-600 mb-2">اتبع السهم الموجود في الأعلى:</p>
                                     <div className="flex items-center justify-between">
                                        <span>1. اضغط على الثلاث نقاط (القائمة)</span>
                                        <MoreVertical size={16} className="text-slate-500" />
                                    </div>
                                    <div className="h-px bg-gray-200"></div>
                                    <div className="flex items-center justify-between">
                                        <span>2. اختر "إضافة إلى الشاشة الرئيسية"</span>
                                        <Smartphone size={16} className="text-slate-800" />
                                    </div>
                                </div>
                            )}
                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full mt-3 py-2 text-slate-400 font-bold text-[10px] flex items-center justify-center gap-1 hover:text-emerald-600"
                            >
                                <RefreshCw size={12} />
                                حاول مرة أخرى (تحديث)
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
