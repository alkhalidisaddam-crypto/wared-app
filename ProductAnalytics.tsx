import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown,
  AlertCircle
} from 'lucide-react';
import { Order } from './types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface ProductAnalyticsProps {
  orders: Order[];
}

interface ProductStat {
  name: string;
  total: number;
  delivered: number;
  returned: number;
  returnRate: number;
  successRate: number;
}

export const ProductAnalytics = ({ orders }: ProductAnalyticsProps) => {

  const productStats = useMemo(() => {
    const stats: Record<string, ProductStat> = {};

    orders.forEach(order => {
        // Normalize product name (trim and lowercase for grouping)
        const rawName = order.product?.trim();
        if (!rawName) return;
        
        const key = rawName.toLowerCase();

        if (!stats[key]) {
            stats[key] = {
                name: rawName, // Keep original casing for display
                total: 0,
                delivered: 0,
                returned: 0,
                returnRate: 0,
                successRate: 0
            };
        }

        stats[key].total += 1;
        if (order.status === 'delivered') stats[key].delivered += 1;
        if (order.status === 'returned') stats[key].returned += 1;
    });

    // Calculate rates
    return Object.values(stats).map(stat => ({
        ...stat,
        returnRate: stat.total > 0 ? (stat.returned / stat.total) * 100 : 0,
        successRate: stat.total > 0 ? (stat.delivered / stat.total) * 100 : 0
    }));

  }, [orders]);

  // 1. The Stars (Most Delivered)
  const topSellers = [...productStats]
    .sort((a, b) => b.delivered - a.delivered)
    .slice(0, 3);

  // 2. The Burners (Highest Return Rate, min 5 orders to be relevant)
  const highReturns = [...productStats]
    .filter(p => p.total >= 5 && p.returnRate > 0)
    .sort((a, b) => b.returnRate - a.returnRate)
    .slice(0, 3);

  if (topSellers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- Top Sellers Card --- */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100"
        >
            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <ThumbsUp size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-lg">المنتجات الأكثر مبيعاً</h4>
                    <p className="text-xs text-slate-400">المنتجات ذات أعلى نسبة توصيل ناجح</p>
                </div>
            </div>

            <div className="space-y-5">
                {topSellers.map((product, idx) => (
                    <div key={idx} className="relative">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                                    idx === 0 ? "bg-amber-400" : "bg-slate-200 text-slate-500"
                                )}>
                                    {idx + 1}
                                </span>
                                <div>
                                    <h5 className="font-bold text-slate-700 text-sm">{product.name}</h5>
                                    <span className="text-[10px] text-slate-400 font-medium">تم توصيل {product.delivered} قطعة</span>
                                </div>
                            </div>
                            <span className="font-black text-emerald-600 dir-ltr">{product.successRate.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                            <div 
                                style={{ width: `${product.successRate}%` }}
                                className="h-full bg-emerald-500 rounded-full"
                            />
                        </div>
                    </div>
                ))}
                {topSellers.length === 0 && <p className="text-slate-400 text-sm text-center">لا توجد بيانات كافية</p>}
            </div>
        </motion.div>

        {/* --- High Returns Card --- */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100"
        >
            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                    <ThumbsDown size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-lg">المنتجات ذات المرتجع العالي</h4>
                    <p className="text-xs text-slate-400">انتبه! هذه المنتجات تسبب خسارة في التوصيل</p>
                </div>
            </div>

            <div className="space-y-5">
                {highReturns.map((product, idx) => (
                    <div key={idx} className="relative">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-red-50 text-red-500 rounded-lg">
                                    <AlertTriangle size={14} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                        {product.name}
                                        {product.returnRate > 30 && (
                                            <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5" title="نسبة مرتجع خطرة">
                                                <AlertCircle size={8} /> خطر
                                            </span>
                                        )}
                                    </h5>
                                    <span className="text-[10px] text-slate-400 font-medium">راجع {product.returned} من أصل {product.total}</span>
                                </div>
                            </div>
                            <span className="font-black text-red-500 dir-ltr">{product.returnRate.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                            <div 
                                style={{ width: `${product.returnRate}%` }}
                                className="h-full bg-red-500 rounded-full"
                            />
                        </div>
                    </div>
                ))}
                
                {highReturns.length === 0 && (
                    <div className="text-center py-8 text-emerald-600/60 bg-emerald-50/50 rounded-2xl border border-emerald-100 border-dashed">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-bold">أداء المنتجات ممتاز!</p>
                        <p className="text-xs opacity-80 mt-1">لا توجد منتجات ذات نسبة مرتجع عالية حالياً.</p>
                    </div>
                )}
            </div>
        </motion.div>

    </div>
  );
};