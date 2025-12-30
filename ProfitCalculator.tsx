import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  DollarSign, 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Info,
  ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const ProfitCalculator = () => {
  // Inputs
  const [costPrice, setCostPrice] = useState('');
  const [currency, setCurrency] = useState<'IQD' | 'USD'>('IQD');
  const [exchangeRate, setExchangeRate] = useState('1500');
  const [expenses, setExpenses] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  // Results
  const [result, setResult] = useState({
    finalCostIQD: 0,
    totalExpenses: 0,
    netProfit: 0,
    margin: 0,
    roi: 0
  });

  useEffect(() => {
    calculate();
  }, [costPrice, currency, exchangeRate, expenses, sellingPrice]);

  const calculate = () => {
    const cost = parseFloat(costPrice.replace(/,/g, '')) || 0;
    const rate = parseFloat(exchangeRate.replace(/,/g, '')) || 1500;
    const otherExp = parseFloat(expenses.replace(/,/g, '')) || 0;
    const sell = parseFloat(sellingPrice.replace(/,/g, '')) || 0;

    // Step 1: Normalize Cost
    let normalizedCost = cost;
    if (currency === 'USD') {
      normalizedCost = cost * rate;
    }

    // Step 2: Total Cost
    const totalExp = normalizedCost + otherExp;

    // Step 3: Profit
    const profit = sell - totalExp;

    // Step 4: Margin & ROI
    const marginPercent = sell > 0 ? (profit / sell) * 100 : 0;
    const roiPercent = totalExp > 0 ? (profit / totalExp) * 100 : 0;

    setResult({
      finalCostIQD: normalizedCost,
      totalExpenses: totalExp,
      netProfit: profit,
      margin: marginPercent,
      roi: roiPercent
    });
  };

  const getStatusTheme = () => {
    if (result.netProfit < 0) return 'loss';
    if (result.margin < 15) return 'warning';
    return 'success';
  };

  const theme = {
    loss: {
      bg: 'bg-red-500',
      lightBg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-100',
      gradient: 'from-red-500 to-orange-600',
      icon: TrendingDown,
      label: 'خسارة'
    },
    warning: {
      bg: 'bg-yellow-500',
      lightBg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-100',
      gradient: 'from-yellow-400 to-orange-500',
      icon: AlertTriangle,
      label: 'ربح منخفض'
    },
    success: {
      bg: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      gradient: 'from-emerald-500 to-teal-600',
      icon: TrendingUp,
      label: 'ربح ممتاز'
    }
  }[getStatusTheme()];

  const StatusIcon = theme.icon;

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <Calculator size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800">حاسبة الأرباح</h2>
                <p className="text-slate-500 mt-1">محاكاة تكاليف المنتجات وتحديد هامش الربح بدقة.</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* --- Inputs Section --- */}
        <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
                
                {/* Cost Price */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-slate-500">سعر الشراء (التكلفة)</label>
                        
                        {/* Currency Toggle */}
                        <div className="bg-gray-100 p-1 rounded-xl flex text-xs font-bold">
                            <button 
                                onClick={() => setCurrency('IQD')}
                                className={cn("px-3 py-1.5 rounded-lg transition-all", currency === 'IQD' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                            >
                                IQD
                            </button>
                            <button 
                                onClick={() => setCurrency('USD')}
                                className={cn("px-3 py-1.5 rounded-lg transition-all", currency === 'USD' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                            >
                                USD
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <input 
                            type="number"
                            value={costPrice}
                            onChange={(e) => setCostPrice(e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800 text-lg transition-all dir-ltr text-right placeholder:text-right"
                        />
                         <div className="absolute top-3.5 left-4 text-xs font-bold text-slate-400 pointer-events-none">
                            {currency}
                        </div>
                    </div>
                </div>

                {/* Exchange Rate (Conditional) */}
                <AnimatePresence>
                    {currency === 'USD' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                <label className="text-xs font-bold text-blue-500 mb-2 block flex items-center gap-1">
                                    <RefreshCcw size={12} />
                                    سعر الصرف (1 دولار = ؟ دينار)
                                </label>
                                <input 
                                    type="number"
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none font-bold text-slate-700 text-center dir-ltr"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Other Expenses */}
                <div>
                    <label className="text-sm font-bold text-slate-500 mb-2 block">مصاريف أخرى (توصيل، إعلانات، تغليف)</label>
                    <div className="relative">
                        <input 
                            type="number"
                            value={expenses}
                            onChange={(e) => setExpenses(e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800 text-lg transition-all dir-ltr text-right placeholder:text-right"
                        />
                        <div className="absolute top-3.5 left-4 text-xs font-bold text-slate-400 pointer-events-none">IQD</div>
                    </div>
                </div>

                <div className="h-px bg-gray-100 my-2"></div>

                {/* Selling Price */}
                <div>
                    <label className="text-sm font-bold text-slate-800 mb-2 block">سعر البيع المقترح</label>
                    <div className="relative">
                        <input 
                            type="number"
                            value={sellingPrice}
                            onChange={(e) => setSellingPrice(e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-white text-xl transition-all dir-ltr text-right placeholder:text-right shadow-lg"
                        />
                        <div className="absolute top-4.5 left-4 text-xs font-bold text-slate-400 pointer-events-none">IQD</div>
                    </div>
                </div>

            </div>
        </div>

        {/* --- Results Section --- */}
        <div className="lg:col-span-7 space-y-6">
            
            {/* Main Result Card */}
            <div className={cn("rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden transition-all duration-500 bg-gradient-to-br", theme.gradient)}>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2 opacity-90">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <StatusIcon size={24} className="text-white" />
                            </div>
                            <span className="font-bold text-lg">{theme.label}</span>
                        </div>
                        <div className="text-right opacity-80">
                            <p className="text-xs font-bold">هامش الربح</p>
                            <p className="text-2xl font-black font-mono">{result.margin.toFixed(1)}%</p>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <p className="text-emerald-100 text-sm font-bold mb-2">صافي الربح المتوقع</p>
                        <h3 className="text-6xl font-black tracking-tighter dir-ltr font-mono">
                            {result.netProfit.toLocaleString()} <span className="text-2xl opacity-60">IQD</span>
                        </h3>
                    </div>

                    {/* Cost Breakdown Bar */}
                    <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
                        <div className="flex justify-between text-xs font-bold mb-2 opacity-80">
                            <span>التكلفة الكلية: {result.totalExpenses.toLocaleString()}</span>
                            <span>سعر البيع: {parseFloat(sellingPrice || '0').toLocaleString()}</span>
                        </div>
                        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden flex">
                            {/* Cost Segment */}
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((result.totalExpenses / parseFloat(sellingPrice || '1')) * 100, 100)}%` }}
                                className="h-full bg-white/90"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Background Decor */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute top-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-xs text-slate-400 font-bold mb-1">تكلفة الشراء (IQD)</p>
                     <p className="text-lg font-black text-slate-700 dir-ltr">{result.finalCostIQD.toLocaleString()}</p>
                 </div>
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-xs text-slate-400 font-bold mb-1">المصاريف المضافة</p>
                     <p className="text-lg font-black text-slate-700 dir-ltr">{parseFloat(expenses || '0').toLocaleString()}</p>
                 </div>
                 <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-xs text-slate-400 font-bold mb-1">العائد على الاستثمار (ROI)</p>
                     <p className={cn("text-lg font-black dir-ltr", result.roi > 0 ? "text-emerald-600" : "text-red-500")}>
                        {result.roi.toFixed(1)}%
                     </p>
                 </div>
            </div>

            {/* Advice / Alert Section */}
            {sellingPrice && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("p-5 rounded-2xl border flex gap-4", theme.lightBg, theme.border)}
                >
                    <Info className={cn("shrink-0", theme.text)} />
                    <div className="text-sm">
                        <p className={cn("font-bold mb-1", theme.text)}>تحليل النظام:</p>
                        {result.netProfit <= 0 ? (
                            <p className="text-slate-600">أنت تبيع بخسارة! سعر البيع أقل من التكلفة الكلية. يجب رفع السعر أو تقليل المصاريف فوراً.</p>
                        ) : result.margin < 15 ? (
                            <p className="text-slate-600">هامش الربح منخفض ({result.margin.toFixed(1)}%). أي مصاريف إضافية غير متوقعة قد تؤدي إلى خسارة. يُفضل أن يكون الهامش فوق 20%.</p>
                        ) : result.margin < 30 ? (
                            <p className="text-slate-600">هامش ربح جيد وصحي. تأكد من ثبات سعر الصرف إذا كنت تشتري بالدولار.</p>
                        ) : (
                            <p className="text-slate-600">هامش ربح ممتاز! لديك مساحة كافية لعمل خصومات أو عروض ترويجية لزيادة المبيعات.</p>
                        )}
                    </div>
                </motion.div>
            )}

        </div>
      </div>
    </div>
  );
};