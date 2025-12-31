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
       
       {/* Sticky Header Actions */}
       <div className="sticky top-0 z-20 bg-[#F3F4F6]/95 backdrop-blur-xl py-4 mb-4 -mx-2 px-2 md:mx-0 md:px-0 flex flex-col gap-3 shadow-sm md:shadow-none border-b md:border-b-0 border-gray-200 md:bg-transparent">
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <div className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-xl text-emerald-600">
                    <MapPin size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-800">أسعار التوصيل</h2>
                    <p className="text-[10px] text-slate-400 font-bold hidden sm:block">حدد تكلفة التوصيل لكل محافظة</p>
                </div>
             </div>
             
             <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70 text-xs sm:text-sm"
            >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>حفظ التغييرات</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
              <Search className="absolute right-3.5 top-3.5 text-slate-400" size={18} />
              <input 
                 placeholder="بحث عن محافظة..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pr-11 pl-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 text-sm shadow-sm"
              />
          </div>
       </div>

       {/* Grid Layout */}
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredGovernorates.map((gov) => (
             <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={gov}
                className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-2 hover:border-emerald-200 transition-colors group focus-within:ring-2 focus-within:ring-emerald-500/20"
             >
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-emerald-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 font-bold text-xs shrink-0 transition-colors">
                      {gov[0]}
                   </div>
                   <span className="font-bold text-slate-700 text-sm truncate">{gov}</span>
                </div>
                
                {/* Input Field */}
                <div className="relative">
                   <input 
                      type="text"
                      inputMode="numeric"
                      value={rates[gov] === 0 ? '' : rates[gov]?.toLocaleString()}
                      placeholder="0"
                      onChange={(e) => handleRateChange(gov, e.target.value)}
                      className="w-full h-12 px-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-black text-slate-800 dir-ltr text-lg text-center shadow-inner"
                   />
                   <span className="absolute left-3 top-4 text-[10px] font-bold text-slate-400 pointer-events-none opacity-50">IQD</span>
                </div>
             </motion.div>
          ))}
       </div>

       {filteredGovernorates.length === 0 && (
           <div className="text-center py-12 text-slate-400">
               <p className="font-bold">لا توجد محافظة بهذا الاسم</p>
           </div>
       )}
    </div>
  );
};
