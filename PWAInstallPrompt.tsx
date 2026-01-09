import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, MoreVertical, Smartphone, Monitor, RefreshCw, ArrowRight } from 'lucide-react';

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
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100">
                    <Download size={28} />
                </div>
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
                                     <p className="text-emerald-600 mb-2">التثبيت التلقائي غير مدعوم حالياً.</p>
                                     <div className="flex items-center justify-between">
                                        <span>1. اضغط على القائمة (الثلاث نقاط)</span>
                                        <MoreVertical size={16} className="text-slate-500" />
                                    </div>
                                    <div className="h-px bg-gray-200"></div>
                                    <div className="flex items-center justify-between">
                                        <span>2. اختر "تثبيت التطبيق"</span>
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
