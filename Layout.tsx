import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Wallet, 
  Menu, 
  LogOut, 
  Settings, 
  User, 
  Bell,
  Home,
  List,
  Calculator,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children?: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  userEmail?: string;
}

export const Layout = ({ children, activeTab, setActiveTab, onLogout, userEmail }: LayoutProps) => {
  
  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home, desktopIcon: LayoutDashboard },
    { id: 'orders', label: 'الطلبات', icon: List, desktopIcon: Package },
    { id: 'suppliers', label: 'الموردين', icon: Users, desktopIcon: Users }, // Added
    { id: 'wallet', label: 'المحفظة', icon: Wallet, desktopIcon: Wallet },
    { id: 'calculator', label: 'الحاسبة', icon: Calculator, desktopIcon: Calculator },
    { id: 'settings', label: 'الإعدادات', icon: Settings, desktopIcon: Settings },
    { id: 'more', label: 'المزيد', icon: Menu, desktopIcon: null, isMobileOnly: true, hidden: true },
  ];

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      
      {/* --- Desktop Floating Sidebar --- */}
      <motion.aside 
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden md:flex fixed right-4 top-4 bottom-4 w-72 bg-slate-900 rounded-[2.5rem] shadow-2xl z-50 flex-col p-6 text-white overflow-hidden"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-gradient-to-br from-emerald-400 to-teal-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">وارد</h1>
            <p className="text-xs text-slate-400 font-medium">نظام إدارة الطلبات</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.filter(item => !item.isMobileOnly && !item.hidden).map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.desktopIcon || item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "bg-white/10 text-white shadow-inner font-bold" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                   <motion.div 
                     layoutId="activeTabIndicator"
                     className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full"
                   />
                )}
                {Icon && <Icon size={22} className={cn("transition-colors", isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-white")} />}
                <span className="text-base">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="mt-auto pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2 bg-slate-800/50 p-3 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {userEmail?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-white truncate">المتجر</p>
               <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 py-3 rounded-2xl transition-all text-sm font-bold"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
        
        {/* Background Decor */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </motion.aside>


      {/* --- Main Content Wrapper --- */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        "md:mr-80 p-4 md:p-8" // Margin for desktop sidebar
      )}>
        {/* Mobile Header (Top Bar) */}
        <div className="md:hidden flex justify-between items-center mb-6 pt-2">
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 p-2 rounded-xl">
                    <LayoutDashboard size={20} className="text-white"/>
                </div>
                <h1 className="text-xl font-black text-slate-800">وارد</h1>
            </div>
            <div className="flex gap-3">
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-slate-600 relative">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                    <User size={18} />
                </div>
            </div>
        </div>

        {/* Content Render */}
        <div className="max-w-7xl mx-auto">
            {children}
        </div>
        
        {/* Spacer for Bottom Nav */}
        <div className="h-24 md:hidden"></div>
      </main>


      {/* --- Mobile Bottom Navigation --- */}
      <nav className="md:hidden fixed bottom-5 left-4 right-4 h-16 bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.1)] border border-gray-100 flex justify-between items-center px-6 z-50 mx-auto max-w-sm">
            {navItems.filter(i => !i.hidden).map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className="relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0"
                    >
                         {isActive && (
                            <motion.div 
                                layoutId="mobileActiveBlob"
                                className="absolute -top-6 w-8 h-8 bg-emerald-500/10 rounded-full blur-xl"
                            />
                        )}
                        <motion.div
                            animate={{ 
                                y: isActive ? -2 : 0,
                                color: isActive ? '#10b981' : '#94a3b8'
                            }}
                            className={cn("p-1.5 rounded-xl transition-colors", isActive ? "bg-emerald-50" : "")}
                        >
                            {item.icon && <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
                        </motion.div>
                        {isActive && (
                            <motion.span 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-[9px] font-bold text-emerald-600 absolute -bottom-1.5 whitespace-nowrap"
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </button>
                )
            })}
      </nav>
    </div>
  );
};
