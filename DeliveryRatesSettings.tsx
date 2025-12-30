import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, MapPin, Loader2 } from 'lucide-react';
import { supabase } from './supabaseClient';

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

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="w-full max-w-lg mx-auto pb-32 pt-4 px-4">
       
       {/* Header Actions */}
       <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
             <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <MapPin size={20} />
             </div>
             أسعار التوصيل
          </h2>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70 text-sm"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ
          </button>
       </div>

       {/* The Price List Card */}
       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {GOVERNORATES.map((gov) => (
             <div 
                key={gov}
                className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0"
             >
                {/* Label */}
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                      {gov[0]}
                   </div>
                   <span className="font-bold text-slate-700 text-sm">{gov}</span>
                </div>
                
                {/* Input Field */}
                <input 
                   type="text"
                   inputMode="numeric"
                   value={rates[gov] === 0 ? '' : rates[gov].toLocaleString()}
                   placeholder="0"
                   onChange={(e) => handleRateChange(gov, e.target.value)}
                   className="w-24 h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 dir-ltr text-sm"
                />
             </div>
          ))}
       </div>
    </div>
  );
};
