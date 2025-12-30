import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Phone, 
  Calendar, 
  FileText,
  ChevronLeft,
  Briefcase,
  Loader2,
  Save,
  X
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { Supplier, SupplierLedgerEntry } from './types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface SuppliersManagerProps {
  userId: string;
  suppliers: Supplier[];
  ledger: SupplierLedgerEntry[];
  onUpdate: () => void;
}

export const SuppliersManager = ({ userId, suppliers, ledger, onUpdate }: SuppliersManagerProps) => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'PURCHASE' | 'PAYMENT'>('PURCHASE');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Calculations ---
  const getSupplierBalance = (supplierId: string) => {
    return ledger
      .filter(entry => entry.supplier_id === supplierId)
      .reduce((acc, curr) => {
        return curr.transaction_type === 'PURCHASE' 
          ? acc + curr.amount 
          : acc - curr.amount;
      }, 0);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone.includes(searchTerm)
  );

  // --- Sub-Components ---

  const AddSupplierModal = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const { error } = await supabase!.from('suppliers').insert([{ user_id: userId, name, phone }]);
        if (error) throw error;
        onUpdate();
        setIsAddSupplierOpen(false);
      } catch (err) {
        console.error(err);
        alert('حدث خطأ');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
         <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">إضافة مورد جديد</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
               <input placeholder="اسم المورد / المكتب" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" required />
               <input placeholder="رقم الهاتف" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold dir-ltr text-right" required />
               <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setIsAddSupplierOpen(false)} className="flex-1 py-3 text-slate-500 font-bold">إلغاء</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">{loading ? 'جاري...' : 'حفظ'}</button>
               </div>
            </form>
         </motion.div>
      </div>
    );
  };

  const AddTransactionModal = () => {
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSupplier) return;
      setLoading(true);
      
      const numAmount = parseFloat(amount.replace(/,/g, ''));
      
      try {
        const { error } = await supabase!.from('supplier_ledger').insert([{
            user_id: userId,
            supplier_id: selectedSupplier.id,
            transaction_type: transactionType,
            amount: numAmount,
            notes,
            transaction_date: date
        }]);
        if (error) throw error;
        onUpdate();
        setIsTransactionModalOpen(false);
      } catch (err) {
        console.error(err);
        alert('حدث خطأ');
      } finally {
        setLoading(false);
      }
    };

    const isPurchase = transactionType === 'PURCHASE';

    return (
      <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
         <motion.div initial={{y: 100, opacity: 0}} animate={{y: 0, opacity: 1}} className="bg-white rounded-[2rem] p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className={cn("text-xl font-black", isPurchase ? "text-red-600" : "text-emerald-600")}>
                        {isPurchase ? 'تسجيل مسواك (دين)' : 'تسجيل دفعة (واصل)'}
                    </h3>
                    <p className="text-sm text-slate-400 font-bold">{selectedSupplier?.name}</p>
                </div>
                <button onClick={() => setIsTransactionModalOpen(false)} className="bg-gray-50 p-2 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">المبلغ</label>
                  <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-slate-400 font-black text-2xl dir-ltr text-right" required />
               </div>
               
               <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">التاريخ</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none font-bold text-slate-700" required />
               </div>

               <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">ملاحظات (قائمة، تفاصيل)</label>
                  <input placeholder="..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none font-bold" />
               </div>

               <button 
                  type="submit" 
                  disabled={loading} 
                  className={cn("w-full py-4 text-white rounded-2xl font-bold text-lg shadow-lg mt-4", isPurchase ? "bg-red-500 shadow-red-500/20" : "bg-emerald-600 shadow-emerald-500/20")}
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'حفظ العملية'}
               </button>
            </form>
         </motion.div>
      </div>
    );
  };

  // --- Main Render ---

  // 1. Ledger Detail View
  if (selectedSupplier) {
      const supplierLedger = ledger
        .filter(e => e.supplier_id === selectedSupplier.id)
        .sort((a,b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
      
      const balance = getSupplierBalance(selectedSupplier.id);

      return (
        <div className="bg-white min-h-[80vh] rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col relative">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white">
                <button onClick={() => setSelectedSupplier(null)} className="flex items-center gap-1 text-slate-300 hover:text-white mb-4 text-sm font-bold">
                    <ChevronLeft size={16} />
                    رجوع للقائمة
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-black">{selectedSupplier.name}</h2>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                            <Phone size={14} />
                            <span className="dir-ltr">{selectedSupplier.phone}</span>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 font-bold mb-1">الرصيد الحالي (مطلوب)</p>
                        <p className={cn("text-3xl font-black dir-ltr font-mono", balance > 0 ? "text-red-400" : "text-emerald-400")}>
                            {balance.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-100 bg-gray-50/50">
                <button 
                    onClick={() => { setTransactionType('PURCHASE'); setIsTransactionModalOpen(true); }}
                    className="flex items-center justify-center gap-2 bg-white border border-red-100 text-red-600 py-3 rounded-xl font-bold shadow-sm hover:bg-red-50 transition-colors"
                >
                    <div className="bg-red-100 p-1 rounded-full"><ArrowUpRight size={16} /></div>
                    مسواك جديد
                </button>
                <button 
                    onClick={() => { setTransactionType('PAYMENT'); setIsTransactionModalOpen(true); }}
                    className="flex items-center justify-center gap-2 bg-white border border-emerald-100 text-emerald-600 py-3 rounded-xl font-bold shadow-sm hover:bg-emerald-50 transition-colors"
                >
                    <div className="bg-emerald-100 p-1 rounded-full"><ArrowDownLeft size={16} /></div>
                    تسديد دفعة
                </button>
            </div>

            {/* Ledger List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {supplierLedger.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">لا توجد حركات مسجلة</div>
                ) : (
                    supplierLedger.map(entry => {
                        const isPurchase = entry.transaction_type === 'PURCHASE';
                        return (
                            <div key={entry.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl">
                                <div className="flex items-start gap-3">
                                    <div className={cn("mt-1 p-2 rounded-xl", isPurchase ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500")}>
                                        {isPurchase ? <Briefcase size={20} /> : <Save size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">
                                            {isPurchase ? 'شراء مواد' : 'تسديد مبلغ'}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                                            <Calendar size={12} />
                                            {new Date(entry.transaction_date).toLocaleDateString('ar-IQ')}
                                        </p>
                                        {entry.notes && <p className="text-xs text-slate-400 mt-1">{entry.notes}</p>}
                                    </div>
                                </div>
                                <div className={cn("text-lg font-black dir-ltr", isPurchase ? "text-red-600" : "text-emerald-600")}>
                                    {isPurchase ? '+' : '-'}{entry.amount.toLocaleString()}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {isTransactionModalOpen && <AddTransactionModal />}
        </div>
      );
  }

  // 2. Suppliers List View
  return (
    <div className="space-y-6 pb-24">
       {/* Header */}
       <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <Users size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-800">إدارة الموردين</h2>
                <p className="text-slate-500 mt-1">سجل ديون ومستحقات المكاتب والمذاخر.</p>
             </div>
          </div>
          <button 
            onClick={() => setIsAddSupplierOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            إضافة مورد
          </button>
       </div>

       {/* Search */}
       <div className="relative">
          <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
          <input 
             placeholder="بحث عن مورد..." 
             className="w-full pr-12 pl-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 shadow-sm"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
          />
       </div>

       {/* List Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => {
             const balance = getSupplierBalance(supplier.id);
             return (
                <motion.div 
                    key={supplier.id}
                    layoutId={supplier.id}
                    onClick={() => setSelectedSupplier(supplier)}
                    className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-slate-400 font-bold text-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {supplier.name[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{supplier.name}</h3>
                                <p className="text-xs text-slate-400 font-medium dir-ltr">{supplier.phone}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center relative z-10">
                        <span className="text-xs font-bold text-slate-500">الرصيد الحالي</span>
                        {balance === 0 ? (
                            <span className="text-emerald-600 font-black text-sm bg-emerald-100 px-2 py-1 rounded-lg">خالص</span>
                        ) : (
                            <span className="text-red-500 font-black text-lg dir-ltr">{balance.toLocaleString()}</span>
                        )}
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 border-2 border-indigo-500 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </motion.div>
             );
          })}
       </div>

       {isAddSupplierOpen && <AddSupplierModal />}
    </div>
  );
};