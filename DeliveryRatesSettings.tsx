import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, MapPin, Loader2, DollarSign, Info } from 'lucide-react';
import { supabase } from './supabaseClient';
import { DeliveryRate } from './types';

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

      // Convert array to object map for easy access
      const ratesMap: Record<string, number> = {};
      
      // Initialize all governorates with 0 or existing value
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
    // Remove non-numeric characters
    const numVal = parseFloat(value.replace(/,/g, ''));
    setRates(prev => ({
        ...prev,
        [gov]: isNaN(numVal) ? 0 : numVal
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare data for upsert
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

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-6 pb-32 space-y-6">
       {/* Header Card - Compact for Mobile */}
       <div className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg md:text-2xl font-black text-slate-800 flex items-center gap-2">
                <MapPin className="text-emerald-500 w-5 h-5 md:w-auto md:h-auto" />
                أسعار التوصيل
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                حدد الأسعار الافتراضية للمحافظات.
            </p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto bg-emerald-600 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-70 text-sm md:text-base"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            حفظ التغييرات
          </button>
       </div>

       {/* List View (Single Column) */}
       <div className="space-y-3">
          {GOVERNORATES.map((gov) => (
             <motion.div 
                key={gov}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4 group hover:border-emerald-200 transition-colors"
             >
                {/* City Info - Added flex-1 to prevent collapse */}
                <div className="flex items-center gap-3 flex-1">
                   <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-slate-400 font-bold group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
                      {gov[0]}
                   </div>
                   <span className="font-bold text-slate-700 text-base">{gov}</span>
                </div>
                
                {/* Input Container - Added ml-3 for mobile spacing */}
                <div className="relative w-32 sm:w-auto sm:min-w-[160px] shrink-0 ml-3">
                   <input 
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rates[gov] === 0 ? '' : rates[gov].toLocaleString()}
                      placeholder="0"
                      onChange={(e) => handleRateChange(gov, e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-800 text-lg text-left dir-ltr transition-all shadow-sm"
                   />
                   <span className="absolute left-3 top-3.5 text-xs text-slate-400 font-bold pointer-events-none">IQD</span>
                </div>
             </motion.div>
          ))}
       </div>
    </div>
  );
};
