import React from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  Wallet, 
  Hourglass, 
  Coins, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  BarChart3,
  MapPin,
  Briefcase
} from 'lucide-react';
import { Order } from './types';

interface DashboardStatsProps {
  stats: {
    cash: number;
    pending: number;
    net: number;
    totalDebt?: number; // Added optional prop
  };
  orders: Order[];
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
};

export const DashboardStats = ({ stats, orders }: DashboardStatsProps) => {
  
  // Calculate specific metrics for the Bento Grid
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
  
  const governorates = orders.reduce((acc, curr) => {
     acc[curr.governorate] = (acc[curr.governorate] || 0) + 1;
     return acc;
  }, {} as Record<string, number>);
  
  const topGovernorate = Object.entries(governorates).sort((a,b) => b[1] - a[1])[0];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex justify-between items-end mb-4">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">لوحة المعلومات</h2>
           <p className="text-slate-500 mt-1 font-medium">نظرة عامة على أداء المتجر اليوم.</p>
        </div>
        <div className="hidden md:flex gap-2">
            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-gray-100 text-slate-500 flex items-center gap-1">
                <Activity size={14} className="text-emerald-500" />
                آخر تحديث: الآن
            </span>
        </div>
      </motion.div>

      {/* --- Bento Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* 1. Main Highlight: Net Profit (Large Card) */}
        <motion.div 
            variants={item}
            className="col-span-1 md:col-span-2 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
        >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Coins size={120} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                        <TrendingUp size={20} className="text-emerald-200" />
                    </div>
                    <span className="font-bold text-lg">صافي الأرباح</span>
                </div>
                <h3 className="text-5xl font-black tracking-tight mb-2 dir-ltr font-mono">
                    {stats.net.toLocaleString()} <span className="text-2xl opacity-60">IQD</span>
                </h3>
                <p className="text-emerald-100 font-medium opacity-80 max-w-sm leading-relaxed">
                   أداء ممتاز! الأرباح تشير إلى نمو مستمر. تأكد من متابعة المصاريف التشغيلية.
                </p>
            </div>
            {/* Decorative Circles */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </motion.div>

        {/* 2. Cash In Hand */}
        <motion.div 
            variants={item}
            className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
        >
            <div className="flex justify-between items-start">
                <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                    <Wallet size={24} className="text-emerald-600" />
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <ArrowDownLeft size={12} />
                    مستلم
                </span>
            </div>
            <div>
                <p className="text-slate-500 font-bold text-sm mb-1">الرصيد المستلم</p>
                <h4 className="text-2xl font-black text-slate-800 dir-ltr font-mono">{stats.cash.toLocaleString()}</h4>
            </div>
        </motion.div>

        {/* 3. Pending with Courier */}
        <motion.div 
            variants={item}
            className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
        >
            <div className="flex justify-between items-start">
                <div className="p-3 bg-orange-50 rounded-2xl group-hover:bg-orange-100 transition-colors">
                    <Hourglass size={24} className="text-orange-600" />
                </div>
                <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <ArrowUpRight size={12} />
                    معلق
                </span>
            </div>
            <div>
                <p className="text-slate-500 font-bold text-sm mb-1">بذمة المندوب</p>
                <h4 className="text-2xl font-black text-slate-800 dir-ltr font-mono">{stats.pending.toLocaleString()}</h4>
            </div>
        </motion.div>

        {/* 4. Total Debt (New Card) */}
        {stats.totalDebt !== undefined && (
             <motion.div 
                variants={item}
                className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
            >
                <div className="flex justify-between items-start">
                    <div className="p-3 bg-red-50 rounded-2xl group-hover:bg-red-100 transition-colors">
                        <Briefcase size={24} className="text-red-600" />
                    </div>
                    <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <ArrowUpRight size={12} />
                        ديون
                    </span>
                </div>
                <div>
                    <p className="text-slate-500 font-bold text-sm mb-1">ديون الموردين</p>
                    <h4 className="text-2xl font-black text-slate-800 dir-ltr font-mono">{stats.totalDebt.toLocaleString()}</h4>
                </div>
            </motion.div>
        )}

        {/* 5. Order Stats Row (Spans 2 columns on small screens) */}
        <motion.div 
            variants={item}
            className="col-span-1 md:col-span-2 bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden"
        >
             <div className="flex items-center justify-between relative z-10 h-full">
                 <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <Package size={20} className="text-blue-300" />
                        </div>
                        <span className="text-slate-300 font-bold">إجمالي الطلبات</span>
                     </div>
                     <div className="text-4xl font-black font-mono">{totalOrders}</div>
                     <div className="flex gap-4">
                         <div>
                             <p className="text-xs text-slate-400 font-bold">نسبة التوصيل</p>
                             <p className="text-emerald-400 font-bold">{deliveryRate}%</p>
                         </div>
                         <div className="w-px bg-white/10 h-8"></div>
                         <div>
                             <p className="text-xs text-slate-400 font-bold">الأكثر طلباً</p>
                             <p className="text-blue-400 font-bold truncate max-w-[100px]">
                                {topGovernorate ? topGovernorate[0] : '-'}
                             </p>
                         </div>
                     </div>
                 </div>
                 
                 {/* Visual Chart Graphic (CSS only) */}
                 <div className="h-24 w-32 flex items-end gap-1 opacity-50">
                     <div className="w-1/4 bg-blue-500 rounded-t-lg h-[40%]"></div>
                     <div className="w-1/4 bg-blue-400 rounded-t-lg h-[70%]"></div>
                     <div className="w-1/4 bg-emerald-500 rounded-t-lg h-[100%] shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                     <div className="w-1/4 bg-blue-600 rounded-t-lg h-[60%]"></div>
                 </div>
             </div>
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-slate-900 via-transparent to-transparent z-0"></div>
        </motion.div>

        {/* 6. Geographic Insight */}
        <motion.div 
            variants={item}
            className="col-span-1 md:col-span-2 bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
        >
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                     <MapPin size={20} />
                 </div>
                 <h4 className="font-bold text-slate-800">أعلى المناطق نشاطاً</h4>
             </div>
             
             <div className="space-y-4">
                 {Object.entries(governorates)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([city, count], idx) => (
                        <div key={city} className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-400 w-4">0{idx + 1}</span>
                            <div className="flex-1">
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-700">{city === 'Baghdad' ? 'بغداد' : city}</span>
                                    <span className="text-slate-500">{count} طلب</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(count / totalOrders) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className={`h-full rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-indigo-300'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                  {orders.length === 0 && <p className="text-slate-400 text-sm text-center">لا توجد بيانات كافية</p>}
             </div>
        </motion.div>

      </div>
    </motion.div>
  );
};