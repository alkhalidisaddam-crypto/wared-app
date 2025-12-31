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
       <div className="sticky top-0 z-20 bg-[#F3F4F6]/95 backdrop-blur-xl py-2 mb-4 -mx-2 px-2 md:mx-0 md:px-0 flex items-center justify-between gap-3 shadow-sm md:shadow-none border-b md:border-b-0 border-gray-200 md:bg-transparent">
             <div className="flex-1 relative">
                <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
                <input 
                   placeholder="بحث..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pr-9 pl-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 text-xs shadow-sm"
                />
             </div>
             
             <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70 text-xs"
            >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>حفظ التغييرات</span>
            </button>
       </div>

       {/* Vertical List Layout - Merged Style */}
       <div className="flex flex-col gap-3">
          {filteredGovernorates.map((gov) => (
             <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={gov}
                className="relative group"
             >
                <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 hover:border-emerald-300">
                    
                    {/* City Name Section (Inside, Right) */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 shrink-0 min-w-[110px] justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-700 transition-colors">
                        <span className="font-bold text-slate-700 text-sm group-hover:text-emerald-700 transition-colors">{gov}</span>
                    </div>

                    {/* Input Section */}
                    <div className="flex-1 relative">
                        <input 
                            type="text"
                            inputMode="numeric"
                            value={rates[gov] === 0 ? '' : rates[gov]?.toLocaleString()}
                            placeholder="0"
                            onChange={(e) => handleRateChange(gov, e.target.value)}
                            className="w-full h-full bg-transparent border-none outline-none px-4 font-bold text-slate-800 dir-ltr text-right text-lg placeholder:text-slate-300"
                        />
                    </div>
                    
                    {/* Suffix */}
                    <div className="px-4 text-xs font-bold text-slate-400 shrink-0">
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
