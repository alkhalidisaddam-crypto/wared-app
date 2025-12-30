import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save, Tag, DollarSign, FileText } from 'lucide-react';
import { supabase } from './supabaseClient';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
}

export const ExpenseModal = ({ isOpen, onClose, onSuccess, userId }: ExpenseModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'نثريات',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      const amountNum = parseFloat(formData.amount.replace(/,/g, ''));
      if (isNaN(amountNum)) throw new Error("المبلغ غير صحيح");

      const newExpense = {
        user_id: userId,
        title: formData.title,
        amount: amountNum,
        category: formData.category,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase!.from('expenses').insert([newExpense]);
      if (error) throw error;

      onSuccess();
      onClose();
      setFormData({ title: '', amount: '', category: 'نثريات', notes: '' });
      
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('حدث خطأ أثناء إضافة المصروف.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center sm:p-4">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
        >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                    <h3 className="text-xl font-black text-slate-800">صرف جديد</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">تسجيل مصروفات المتجر</p>
                </div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-gray-100 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="p-8 space-y-6 bg-white">
                <form id="addExpenseForm" onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute top-3.5 right-4 text-slate-400 pointer-events-none"><FileText size={18} /></div>
                            <input 
                                required
                                placeholder="عنوان الصرف (مثلاً: إعلانات فيسبوك)"
                                className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute top-3.5 right-4 text-slate-400 pointer-events-none"><DollarSign size={18} /></div>
                            <input 
                                required
                                type="number"
                                placeholder="المبلغ (بالدينار)"
                                className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none font-bold text-slate-700 transition-all dir-ltr text-right placeholder:text-right"
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute top-3.5 right-4 text-slate-400 pointer-events-none"><Tag size={18} /></div>
                            <select 
                                className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none transition-all"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="نثريات">نثريات</option>
                                <option value="إعلانات">إعلانات</option>
                                <option value="شراء مواد">شراء مواد</option>
                                <option value="رواتب">رواتب</option>
                                <option value="إيجار">إيجار</option>
                                <option value="أخرى">أخرى</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>

            <div className="p-6 bg-white border-t border-gray-100">
                <button 
                    type="submit" 
                    form="addExpenseForm"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-500/30 hover:shadow-red-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    تسجيل المصروف
                </button>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}