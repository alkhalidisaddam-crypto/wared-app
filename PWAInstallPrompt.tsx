import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, MoreVertical, AlertTriangle } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'native' | 'ios' | 'android-manual' | 'other'>('other');
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    // 0. Security Check (PWA requires HTTPS or localhost)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';
    if (!isLocal && !isHttps) {
        setIsSecure(false);
    }

    // 1. Check if already installed (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // 2. Try to capture Native Install Event (Chrome/Android)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('native');
      setShow(true);
    };

    // Check if event was already captured in global scope
    if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
        setPlatform('native');
        setShow(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Platform Detection for Manual Instructions (Fallback)
    // If native prompt doesn't fire within 2 seconds, we assume we need to show manual instructions
    const timer = setTimeout(() => {
        if (!deferredPrompt && !(window as any).deferredPrompt) {
            const ua = window.navigator.userAgent.toLowerCase();
            const isIOS = /iphone|ipad|ipod/.test(ua);
            const isAndroid = /android/.test(ua);

            if (isIOS) {
                setPlatform('ios');
                setShow(true);
            } else if (isAndroid) {
                setPlatform('android-manual');
                setShow(true);
            }
            // We don't force show on desktop to avoid annoyance, unless needed
        }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
      }
      setShow(false);
    }
  };

  if (!show) return null;

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

            {!isSecure && (
                <div className="mb-4 bg-amber-50 text-amber-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-amber-100">
                    <AlertTriangle size={16} />
                    تحذير: التثبيت يتطلب اتصال آمن (HTTPS)
                </div>
            )}

            <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100">
                    <Download size={28} />
                </div>
                <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-lg">تثبيت التطبيق</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
                        قم بتثبيت "وارد" للوصول السريع وأداء أفضل.
                    </p>

                    {/* --- NATIVE INSTALL BUTTON --- */}
                    {platform === 'native' && (
                        <button 
                            onClick={handleInstallClick}
                            className="mt-4 w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            تثبيت الآن
                        </button>
                    )}

                    {/* --- IOS MANUAL INSTRUCTIONS --- */}
                    {platform === 'ios' && (
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

                    {/* --- ANDROID MANUAL INSTRUCTIONS (Fallback) --- */}
                    {platform === 'android-manual' && (
                        <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl text-xs font-bold text-slate-600 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <span>1. اضغط على القائمة (الثلاث نقاط)</span>
                                <MoreVertical size={16} className="text-slate-500" />
                            </div>
                            <div className="h-px bg-gray-200"></div>
                            <div className="flex items-center justify-between">
                                <span>2. اختر "تثبيت التطبيق" أو "الإضافة للشاشة"</span>
                                <Download size={16} className="text-slate-800" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
