import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldBan, 
  Plus, 
  Trash2, 
  Loader2, 
  Search,
  AlertTriangle,
  Phone,
  User
} from 'lucide-react';
import { supabase } from './supabaseClient';

interface BlacklistEntry {
  id: string;
  phone: string;
  name?: string;
  reason: string;
  created_at: string;
}

interface BlacklistManagerProps {
  userId: string;
}

export const BlacklistManager = ({ userId }: BlacklistManagerProps) => {
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    reason: ''
  });

  useEffect(() => {
    if (userId) fetchBlacklist();
  }, [userId]);

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase!
        .from('customer_blacklist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlacklist(data || []);
    } catch (error) {
      console.error('Error fetching blacklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone.trim() || !formData.reason.trim()) return;

    setAdding(true);
    try {
      const newEntry = {
        user_id: userId,
        phone: formData.phone.trim(),
        name: formData.name.trim(),
        reason: formData.reason.trim()
      };

      const { error } = await supabase!
        .from('customer_blacklist')
        .insert([newEntry]);

      if (error) throw error;

      await fetchBlacklist();
      setFormData({ phone: '', name: '', reason: '' });
      alert('تم حظر الرقم بنجاح');
    } catch (error: any) {
      console.error('Error blocking customer:', error);
      alert('حدث خطأ. ربما هذا الرقم محظور بالفعل.');
    } finally {
      setAdding(false);
    }
  };

  const handleUnblock = async (id: string) => {
    if (!confirm('هل أنت متأكد من إزالة الحظر عن هذا الزبون؟')) return;
    
    try {
      const { error } = await supabase!
        .from('customer_blacklist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBlacklist(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error unblocking:', error);
    }
  };

  const filteredList = blacklist.filter(item => 
    item.phone.includes(searchTerm) || (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && blacklist.length === 0) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-red-500" /></div>;

  return (
    <div className="space-y-6">
       {/* Header & Add Form */}
       <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <ShieldBan className="text-red-500" />
                    القائمة السوداء
                </h2>
                <p className="text-slate-500 mt-1">منع الزبائن المشاكسين من الطلب مرة أخرى.</p>
            </div>
          </div>

          <form onSubmit={handleBlock} className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
             <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Plus size={16} className="text-red-500" />
                حظر رقم جديد
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-1">
                    <input 
                        placeholder="رقم الهاتف (077...)"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm font-bold dir-ltr text-right"
                        required
                    />
                </div>
                <div className="md:col-span-1">
                    <input 
                        placeholder="اسم الزبون (اختياري)"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm font-bold"
                    />
                </div>
                <div className="md:col-span-1">
                    <input 
                        placeholder="سبب الحظر (مطلوب)"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm font-bold"
                        required
                    />
                </div>
                <div className="md:col-span-1">
                    <button 
                        type="submit"
                        disabled={adding}
                        className="w-full px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-red-500/20"
                    >
                        {adding ? <Loader2 size={16} className="animate-spin" /> : <ShieldBan size={18} />}
                        حظر
                    </button>
                </div>
             </div>
          </form>
       </div>

       {/* List */}
       <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 min-h-[400px]">
          <div className="mb-4 relative max-w-md">
             <Search className="absolute right-3 top-3 text-slate-400" size={18} />
             <input 
                placeholder="بحث في المحظورين..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 font-bold text-slate-700"
             />
          </div>

          <div className="space-y-3">
             {filteredList.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    <ShieldBan size={48} className="mx-auto mb-3 opacity-20" />
                    <p>القائمة نظيفة. لا يوجد محظورين.</p>
                </div>
             ) : (
                filteredList.map(entry => (
                    <motion.div 
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-red-200 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                                <ShieldBan size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg dir-ltr text-right">{entry.phone}</h4>
                                <div className="flex items-center gap-2 text-sm">
                                    {entry.name && <span className="font-bold text-slate-600 flex items-center gap-1"><User size={12}/> {entry.name}</span>}
                                    <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1">
                                        <AlertTriangle size={10} /> {entry.reason}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleUnblock(entry.id)}
                            className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="رفع الحظر"
                        >
                            <span className="text-xs font-bold ml-1 hidden md:inline">رفع الحظر</span>
                            <Trash2 size={18} className="inline" />
                        </button>
                    </motion.div>
                ))
             )}
          </div>
       </div>
    </div>
  );
};