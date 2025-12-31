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
    <div className="w-full max-w-3xl mx-auto pb-32 pt-2 px-2 md:px-4">
       
       {/* Sticky Header Actions */}
       <div className="sticky top-0 z-20 bg-[#F3F4F6]/95 backdrop-blur-xl py-1 mb-2 -mx-2 px-2 md:mx-0 md:px-0 flex items-center justify-between gap-2 shadow-sm md:shadow-none border-b md:border-b-0 border-gray-200 md:bg-transparent transition-all">
             <div className="flex-1 relative">
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                <input 
                   placeholder="بحث..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pr-6 pl-2 h-6 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 text-[10px] shadow-sm placeholder:text-slate-300"
                />
             </div>
             
             <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-slate-900 text-white px-2 h-6 rounded-md font-bold flex items-center gap-1 shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70 text-[10px] whitespace-nowrap"
            >
                {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                <span>حفظ التغييرات</span>
            </button>
       </div>

       {/* Vertical List Layout - Compact Content */}
       <div className="flex flex-col gap-2 items-start">
          {filteredGovernorates.map((gov) => (
             <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={gov}
                className="relative group"
             >
                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-0.5 shadow-sm transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 hover:border-emerald-300 w-auto">
                    
                    {/* City Name Section (Inside, Right) */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 shrink-0 min-w-[70px] justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-700 transition-colors">
                        <span className="font-bold text-slate-700 text-[11px] group-hover:text-emerald-700 transition-colors">{gov}</span>
                    </div>

                    {/* Input Section (Fixed width to bring IQD closer) */}
                    <div className="relative w-24">
                        <input 
                            type="text"
                            inputMode="numeric"
                            value={rates[gov] === 0 ? '' : rates[gov]?.toLocaleString()}
                            placeholder="0"
                            onChange={(e) => handleRateChange(gov, e.target.value)}
                            className="w-full h-full bg-transparent border-none outline-none px-2 font-bold text-slate-800 dir-ltr text-center text-xs placeholder:text-slate-300"
                        />
                    </div>
                    
                    {/* Suffix */}
                    <div className="px-2 text-[10px] font-bold text-slate-400 shrink-0">
                        IQD
                    </div>
                </div>
             </motion.div>
          ))}
       </div>

       {filteredGovernorates.length === 0 && (
           <div className="text-center py-8 text-slate-400 text-xs">
               <p className="font-bold">لا توجد نتائج</p>
           </div>
       )}
    </div>
  );
};
