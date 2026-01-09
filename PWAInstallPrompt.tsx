import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, MoreVertical, Smartphone, Monitor, RefreshCw } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(checkStandalone);
    if (checkStandalone) return;

    // 2. Detect Platform
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsMobile(/android|iphone|ipad|ipod/.test(ua));

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

    // 5. Force show after delay even if event didn't fire (for manual instructions)
    const timer = setTimeout(() => {
        if (!checkStandalone) setShow(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
        setShow(false);
      }
    }
  };
  
  const handleRefresh = () => {
      window.location.reload();
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
                        قم بتثبيت "وارد" على جهازك للوصول السريع وأداء أفضل بدون انترنت.
                    </p>

                    {/* --- 1. Native Install Button (Android/Chrome) --- */}
                    {deferredPrompt && (
                        <button 
                            onClick={handleInstallClick}
                            className="mt-4 w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            تثبيت الآن
                        </button>
                    )}

                    {/* --- 2. iOS Instructions --- */}
                    {!deferredPrompt && isIOS && (
                        <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl text-xs font-bold text-slate-600 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <span>1. اضغط على زر المشاركة</span>
                                <Share size={16} className="text-blue-500" />
                            </div>
                            <div className="h-px bg-gray-200"></div>
                            <div className="flex items-center justify-between">
                                <span>2. اختر "إضافة إلى الصفحة الرئيسية"</span>
                                <PlusSquare size={16} className="text-slate-800" />
                            </div>
                        </div>
                    )}

                    {/* --- 3. Android/Desktop Manual Instructions (If Native Fails) --- */}
                    {!deferredPrompt && !isIOS && (
                        <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl text-xs font-bold text-slate-600 border border-gray-100">
                            <p className="text-center text-slate-400 mb-2">
                                إذا لم يظهر خيار التثبيت في القائمة، يرجى تحديث الصفحة.
                            </p>
                            {isMobile ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span>1. اضغط على خيارات المتصفح (⋮)</span>
                                        <MoreVertical size={16} className="text-slate-500" />
                                    </div>
                                    <div className="h-px bg-gray-200"></div>
                                    <div className="flex items-center justify-between">
                                        <span>2. اختر "تثبيت التطبيق"</span>
                                        <Smartphone size={16} className="text-slate-800" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span>اضغط على أيقونة التثبيت في شريط العنوان</span>
                                    <Monitor size={16} className="text-slate-800" />
                                </div>
                            )}
                             <button 
                                onClick={handleRefresh}
                                className="w-full mt-2 py-2 text-emerald-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                                <RefreshCw size={14} />
                                تحديث الصفحة الآن
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
