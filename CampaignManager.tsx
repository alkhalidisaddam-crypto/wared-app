import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Loader2, 
  Facebook, 
  Instagram, 
  Video, 
  Globe, 
  MessageCircle,
  LayoutGrid
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { Campaign } from './types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface CampaignManagerProps {
  userId: string;
}

const PLATFORMS = [
  { id: 'facebook', label: 'فيسبوك', icon: Facebook, color: 'text-blue-600 bg-blue-50' },
  { id: 'instagram', label: 'انستغرام', icon: Instagram, color: 'text-pink-600 bg-pink-50' },
  { id: 'tiktok', label: 'تيك توك', icon: Video, color: 'text-black bg-gray-100' },
  { id: 'snapchat', label: 'سناب شات', icon: MessageCircle, color: 'text-yellow-500 bg-yellow-50' },
  { id: 'google', label: 'جوجل', icon: Globe, color: 'text-green-600 bg-green-50' },
  { id: 'other', label: 'أخرى', icon: LayoutGrid, color: 'text-slate-600 bg-slate-50' },
];

export const CampaignManager = ({ userId }: CampaignManagerProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState('facebook');

  useEffect(() => {
    if (userId) {
      fetchCampaigns();
    }
  }, [userId]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase!
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !userId) return;

    setAdding(true);
    try {
      // Use the passed userId prop which is from the active session
      const newCampaign = {
        user_id: userId,
        name: newName,
        platform: newPlatform,
        is_active: true
      };

      const { data, error } = await supabase!
        .from('campaigns')
        .insert([newCampaign])
        .select();

      if (error) throw error;

      // Optimistic update or refetch
      await fetchCampaigns();

      // Reset Form
      setNewName('');
      setNewPlatform('facebook');
    } catch (error: any) {
      console.error('Error adding campaign:', error.message || error);
      alert(`حدث خطأ أثناء إضافة الحملة: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من أرشفة هذه الحملة؟ لن تظهر في القوائم الجديدة.')) return;
    
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase!
        .from('campaigns')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setCampaigns(campaigns.filter(c => c.id !== id));
    } catch (error: any) {
      console.error('Error deleting campaign:', error.message || error);
      alert(`حدث خطأ أثناء حذف الحملة: ${error.message || 'خطأ غير معروف'}`);
    }
  };

  if (loading && campaigns.length === 0) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Megaphone className="text-emerald-500" />
                    إدارة الحملات الإعلانية
                </h2>
                <p className="text-slate-500 mt-1">تتبع مصادر الطلبات واكتشف أي الإعلانات يحقق مبيعات أكثر.</p>
            </div>

            <form onSubmit={handleAddCampaign} className="w-full md:w-auto flex flex-col md:flex-row gap-3 items-end">
                <div className="w-full md:w-48">
                    <label className="text-xs font-bold text-slate-400 mb-1 block">اسم الحملة</label>
                    <input 
                        type="text"
                        placeholder="مثال: عرض الصيف"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                        required
                    />
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-bold text-slate-400 mb-1 block">المنصة</label>
                    <select 
                        value={newPlatform}
                        onChange={(e) => setNewPlatform(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold appearance-none"
                    >
                        {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                </div>
                <button 
                    type="submit"
                    disabled={adding}
                    className="w-full md:w-auto px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                    إضافة
                </button>
            </form>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {campaigns.map((campaign) => {
                const platform = PLATFORMS.find(p => p.id === campaign.platform) || PLATFORMS[5];
                const Icon = platform.icon;
                
                return (
                    <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", platform.color)}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{campaign.name}</h3>
                                <p className="text-xs text-slate-400 font-medium">{platform.label}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(campaign.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="أرشفة الحملة"
                        >
                            <Trash2 size={18} />
                        </button>
                    </motion.div>
                );
            })}
          </AnimatePresence>
          
          {campaigns.length === 0 && !loading && (
             <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
                <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
                <p>لا توجد حملات نشطة حالياً. أضف حملتك الأولى!</p>
             </div>
          )}
       </div>
    </div>
  );
};