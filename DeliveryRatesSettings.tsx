import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, MapPin, Loader2, Search } from 'lucide-react';
import { supabase } from './supabaseClient';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const GOVERNORATES = [
  "بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "دهوك", 
  "الأنبار", "بابل", "كربلاء", "النجف", "صلاح الدين", "ديالى", 
  "واسط", "ميسان", "المثنى", "الديوانية", "ذي قار", "كركوك"
];

interface DeliveryRatesSettingsProps {
  userId: string;
}

export const DeliveryRatesSettings = ({ userId }: DeliveryRatesSettingsProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRates();
  }, [userId]);

  const fetchRates = async () => {
    try {
      const { data, error } = await supabase!
        .from('delivery_rates')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const ratesMap: Record<string, number> = {};
      GOVERNORATES.forEach(gov => {
          const found = data?.find((r: any) => r.governorate === gov);
          ratesMap[gov] = found ? found.price : 0;
      });

      setRates(ratesMap);
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (gov: string, value: string) => {
    const numVal = parseFloat(value.replace(/,/g, ''));
    setRates(prev => ({
        ...prev,
        [gov]: isNaN(numVal) ? 0 : numVal
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const upsertData = Object.entries(rates).map(([gov, price]) => ({
        user_id: userId,
        governorate: gov,
        price: price
      }));

      const { error } = await supabase!
        .from('delivery_rates')
        .upsert(upsertData, { onConflict: 'user_id,governorate' });

      if (error) throw error;
      alert('تم حفظ أسعار التوصيل بنجاح');
    } catch (error) {
      console.error('Error saving rates:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const filteredGovernorates = GOVERNORATES.filter(gov => gov.includes(searchTerm));

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="w-full max-w-6xl mx-auto pb-32 pt-2 px-2 md:px-4">
       
       {/* Sticky Header Actions - Ultra Compact */}
       <div className="sticky top-0 z-20 bg-[#F3F4F6]/95 backdrop-blur-xl py-2 mb-2 -mx-2 px-2 md:mx-0 md:px-0 flex items-center justify-between gap-2 shadow-sm md:shadow-none border-b md:border-b-0 border-gray-200 md:bg-transparent">
             <div className="flex-1 relative">
                <Search className="absolute right-2.5 top-2 text-slate-400" size={14} />
                <input 
                   placeholder="بحث..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pr-8 pl-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 text-[11px] shadow-sm"
                />
             </div>
             
             <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70 text-[10px]"
            >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                <span>حفظ</span>
            </button>
       </div>

       {/* Grid Layout - Ultra High Density (3 cols on mobile) */}
       <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {filteredGovernorates.map((gov) => (
             <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={gov}
                className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col gap-1 hover:border-emerald-200 transition-colors group focus-within:ring-2 focus-within:ring-emerald-500/20"
             >
                {/* Header */}
                <div className="flex items-center gap-1">
                   <div className="w-5 h-5 rounded-full bg-gray-50 group-hover:bg-emerald-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 font-bold text-[9px] shrink-0 transition-colors">
                      {gov[0]}
                   </div>
                   <span className="font-bold text-slate-700 text-[10px] truncate">{gov}</span>
                </div>
                
                {/* Input Field */}
                <div className="relative">
                   <input 
                      type="text"
                      inputMode="numeric"
                      value={rates[gov] === 0 ? '' : rates[gov]?.toLocaleString()}
                      placeholder="0"
                      onChange={(e) => handleRateChange(gov, e.target.value)}
                      className="w-full h-7 px-1.5 bg-gray-50 border border-gray-100 rounded-md focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 dir-ltr text-xs text-center shadow-inner"
                   />
                </div>
             </motion.div>
          ))}
       </div>

       {filteredGovernorates.length === 0 && (
           <div className="text-center py-8 text-slate-400 text-[10px]">
               <p className="font-bold">لا توجد نتائج</p>
           </div>
       )}
    </div>
  );
};
