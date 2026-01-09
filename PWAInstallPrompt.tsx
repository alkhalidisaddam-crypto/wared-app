import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if already installed (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // 2. Check if we captured the event early (in index.html)
    if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
        setShow(true);
    }

    // 3. Listen for the event (if it hasn't fired yet)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Handle iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Only show on iOS if it's NOT standalone
    if (isIosDevice && !isStandalone) {
        setIsIOS(true);
        // Delay slightly so user sees the page first
        setTimeout(() => setShow(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null; // Clear global
      }
      setShow(false);
    }
  };

  const handleDismiss = () => {
      setShow(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {/* High Z-Index to appear above Login Screen and Modals */}
      <div className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-none p-4">
        <motion.div
           initial={{ y: "100%", opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: "100%", opacity: 0 }}
           transition={{ type: "spring", damping: 25, stiffness: 300 }}
           className="w-full max-w-md bg-white p-6 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-emerald-100 pointer-events-auto relative"
        >
            <button 
                onClick={handleDismiss} 
                className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors p-1"
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
                        {isIOS 
                            ? "لتجربة أفضل، قم بإضافة التطبيق للشاشة الرئيسية:"
                            : "قم بتثبيت التطبيق على جهازك للوصول السريع والعمل بدون إنترنت."
                        }
                    </p>

                    {isIOS ? (
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
                    ) : (
                        <button 
                            onClick={handleInstallClick}
                            className="mt-4 w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            تثبيت الآن
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
