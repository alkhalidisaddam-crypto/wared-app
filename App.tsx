import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { Order, OrderStatus, Expense, Supplier, Campaign, SupplierLedgerEntry } from './types';
import { SupabaseClient } from '@supabase/supabase-js';
import { Layout } from './Layout';
import { DashboardStats } from './DashboardStats';
import { OrderList } from './OrderList';
import { AddOrderModal } from './AddOrderModal';
import { ExpenseModal } from './ExpenseModal';
import { DeliveryRatesSettings } from './DeliveryRatesSettings';
import { CampaignManager } from './CampaignManager';
import { BlacklistManager } from './BlacklistManager';
import { CampaignStats } from './CampaignStats';
import { ProfitCalculator } from './ProfitCalculator';
import { SuppliersManager } from './SuppliersManager';
import { ProductAnalytics } from './ProductAnalytics';
import { Loader2, Plus, TrendingDown, DollarSign, MapPin, Megaphone, ShieldBan, PenLine, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

// --- Simplified Setup Screen ---
const SetupScreen = () => <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">System Setup Required</div>;

export default function App() {
  if (!supabase) return <SetupScreen />; 
  const client = supabase as SupabaseClient;

  // --- State ---
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'suppliers' | 'wallet' | 'settings' | 'more' | 'calculator'>('home');
  const [settingsTab, setSettingsTab] = useState<'delivery' | 'campaigns' | 'blacklist'>('delivery');
  
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ledger, setLedger] = useState<SupplierLedgerEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  // UI State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null); // State for editing orders
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null); // State for editing expenses
  
  // Auth State
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [registerStoreName, setRegisterStoreName] = useState('');
  const [authError, setAuthError] = useState<string|null>(null);

  // Fetch Logic
  useEffect(() => {
    client.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, [client]);

  const fetchData = useCallback(async () => {
      if(!session) return;
      setLoading(true);
      try {
        const [o, e, s, l, c] = await Promise.all([
            client.from('orders').select('*').order('created_at', { ascending: false }),
            client.from('expenses').select('*').order('created_at', { ascending: false }),
            client.from('suppliers').select('*'),
            client.from('supplier_ledger').select('*'),
            client.from('campaigns').select('*').eq('is_active', true)
        ]);
        if(o.data) setOrders(o.data);
        if(e.data) setExpenses(e.data);
        if(s.data) setSuppliers(s.data);
        if(l.data) setLedger(l.data);
        if(c.data) setCampaigns(c.data);
      } catch (e) {
        console.error("Fetch error", e);
      } finally {
        setLoading(false);
      }
  }, [session, client]);

  useEffect(() => { 
      if (session) fetchData(); 
  }, [session]);

  // Auth Handler
  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      const email = `${phoneNumber.replace(/\D/g,'')}@wared.app`;
      try {
          if(authMode === 'signup') {
              const { data, error } = await client.auth.signUp({ email, password, options: { data: { store_name: registerStoreName } } });
              if(error) throw error;
              if(data.user) await client.from('profiles').insert([{ id: data.user.id, store_name: registerStoreName, phone: phoneNumber }]);
          } else {
              const { error } = await client.auth.signInWithPassword({ email, password });
              if(error) throw error;
          }
      } catch(err: any) { setAuthError(err.message); }
  };

  const handleLogout = async () => {
    await client.auth.signOut();
    window.location.reload();
  };

  // Actions
  const handleUpdateStatus = async (id: string, newStatus: OrderStatus) => {
    try {
        // Optimistic update
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        
        const { error } = await client.from('orders').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
    } catch (err) {
        console.error("Error updating status", err);
        fetchData(); // Revert on error
    }
  };

  const handleToggleCollected = async (id: string, currentStatus: boolean) => {
    try {
        // Optimistic update
        setOrders(prev => prev.map(o => o.id === id ? { ...o, is_collected: !currentStatus } : o));
        
        const { error } = await client.from('orders').update({ is_collected: !currentStatus }).eq('id', id);
        if (error) throw error;
    } catch (err) {
        console.error("Error updating collection status", err);
        fetchData(); // Revert
    }
  };

  // --- EDIT ORDER FUNCTION ---
  const handleEditOrder = (order: Order) => {
      setOrderToEdit(order);
      setIsOrderModalOpen(true);
  };

  // --- DELETE ORDER FUNCTION ---
  const handleDeleteOrder = async (id: string) => {
      try {
          // Optimistic update
          setOrders(prev => prev.filter(o => o.id !== id));
          
          const { error } = await client.from('orders').delete().eq('id', id);
          if (error) throw error;
      } catch (err) {
          console.error("Error deleting order", err);
          alert("فشل حذف الطلب، يرجى المحاولة مرة أخرى");
          fetchData(); // Restore data
      }
  };

  // --- EXPENSE FUNCTIONS ---
  const handleEditExpense = (expense: Expense) => {
      setExpenseToEdit(expense);
      setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    try {
        setExpenses(prev => prev.filter(e => e.id !== id));
        const { error } = await client.from('expenses').delete().eq('id', id);
        if (error) throw error;
    } catch (err) {
        console.error("Error deleting expense", err);
        fetchData();
    }
  };

  // Stats Calculation
  const stats = useMemo(() => {
      const delivered = orders.filter(o => o.status === 'delivered');
      
      // 1. Cash in Hand (Received from Courier): 
      // Corrected Logic: Price is the Item Price (Net). 
      // The driver keeps delivery_cost. The merchant receives Price - Discount.
      const cash = delivered.filter(o => o.is_collected).reduce((sum, o) => sum + (o.price - (o.discount||0)), 0);
      
      // 2. Pending (With Driver - Total Cash): 
      // The driver collects (Price + Delivery - Discount) from customer.
      const pendingOrders = delivered.filter(o => !o.is_collected);
      const pending = pendingOrders.reduce((sum, o) => sum + (o.price + o.delivery_cost - (o.discount||0)), 0);
      
      // 2.1 Pending Net (What Merchant Expects):
      // Merchant expects: Price - Discount (Driver keeps delivery).
      const pendingNet = pendingOrders.reduce((sum, o) => sum + (o.price - (o.discount||0)), 0);

      // 3. Total Expenses (Global)
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      // 4. Net Profit Logic
      // Revenue is just the Price (because Delivery is pass-through to driver).
      const collectedOrders = delivered.filter(o => o.is_collected);
      const revenueFromCollected = collectedOrders.reduce((sum, o) => sum + (o.price - (o.discount||0)), 0);
      const costOfGoodsSold = collectedOrders.reduce((sum, o) => sum + (o.cost_price || 0), 0);
      
      // Net = Revenue - COGS - Expenses
      const net = revenueFromCollected - costOfGoodsSold - totalExpenses;
      
      // Calculate Total Supplier Debt
      const totalSupplierDebt = ledger.reduce((acc, curr) => {
         return curr.transaction_type === 'PURCHASE' ? acc + curr.amount : acc - curr.amount;
      }, 0);
      
      return { cash, pending, pendingNet, net, totalExpenses, totalDebt: totalSupplierDebt };
  }, [orders, expenses, ledger]);


  // --- Render ---

  if (loading && !session) return <div className="flex h-screen items-center justify-center bg-[#F3F4F6]"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>;

  if (!session) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-4">
              <div className="w-full max-w-sm bg-white p-10 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-gray-100">
                  <div className="text-center mb-8">
                      <div className="inline-block p-3 rounded-2xl bg-emerald-50 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600"></div>
                      </div>
                      <h1 className="text-3xl font-black text-slate-800">وارد</h1>
                      <p className="text-slate-400 mt-2 font-medium">سجل دخولك للمتابعة</p>
                  </div>
                  
                  {authError && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">{authError}</div>}
                  
                  <form onSubmit={handleAuth} className="space-y-4">
                      {authMode === 'signup' && (
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 mr-2">اسم المتجر</label>
                              <input className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all" placeholder="مثال: متجر بغداد" value={registerStoreName} onChange={e => setRegisterStoreName(e.target.value)} required />
                          </div>
                      )}
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 mr-2">رقم الهاتف</label>
                          <input className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all dir-ltr" placeholder="0770..." value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 mr-2">كلمة المرور</label>
                          <input type="password" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                      </div>
                      
                      <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/30 text-white py-3.5 rounded-2xl font-bold text-lg transition-all transform active:scale-95 mt-4">
                          {authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
                      </button>
                  </form>
                  
                  <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full mt-6 text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors">
                      {authMode === 'login' ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
                  </button>
              </div>
          </div>
      );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onLogout={handleLogout}
      userEmail={session.user.email}
    >
        {activeTab === 'home' && (
            <div className="space-y-8 pb-24">
                <DashboardStats stats={stats} orders={orders} />
                <ProductAnalytics orders={orders} />
                <CampaignStats orders={orders} campaigns={campaigns} />
                
                {/* --- Recent Expenses on Home Tab --- */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                                <TrendingDown size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg">آخر المصروفات</h4>
                                <p className="text-xs text-slate-400">أحدث عمليات الصرف التي تم تسجيلها</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                setExpenseToEdit(null);
                                setIsExpenseModalOpen(true);
                            }}
                            className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            إضافة مصروف
                        </button>
                    </div>

                    <div className="space-y-3">
                        {expenses.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">لا توجد مصروفات مسجلة مؤخراً</div>
                        ) : (
                            expenses.slice(0, 5).map(expense => (
                                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-500 font-bold text-xs shadow-sm">
                                            {expense.category[0]}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-700 text-sm">{expense.title}</h5>
                                            <p className="text-[10px] text-slate-400">{new Date(expense.created_at).toLocaleDateString('ar-IQ')}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-800 dir-ltr text-sm">-{expense.amount.toLocaleString()}</span>
                                </div>
                            ))
                        )}
                        {expenses.length > 5 && (
                             <button onClick={() => setActiveTab('wallet')} className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                                 عرض كل المصروفات
                             </button>
                        )}
                    </div>
                </div>

                <div className="md:hidden fixed bottom-24 left-6 z-40">
                    <button 
                        onClick={() => {
                            setOrderToEdit(null);
                            setIsOrderModalOpen(true);
                        }}
                        className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/40 border border-white/20 active:scale-95 transition-all"
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'orders' && (
            <>
             <OrderList 
                orders={orders} 
                onStatusChange={handleUpdateStatus} 
                onDelete={handleDeleteOrder} 
                onToggleCollected={handleToggleCollected}
                onEdit={handleEditOrder}
                userId={session.user.id}
             />
             <div className="md:hidden fixed bottom-24 left-6 z-40">
                    <button 
                        onClick={() => {
                            setOrderToEdit(null);
                            setIsOrderModalOpen(true);
                        }}
                        className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/40 border border-white/20 active:scale-95 transition-all"
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </button>
             </div>
            </>
        )}

        {activeTab === 'suppliers' && (
            <SuppliersManager 
                userId={session.user.id}
                suppliers={suppliers}
                ledger={ledger}
                onUpdate={fetchData}
            />
        )}

        {activeTab === 'wallet' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-800">المحفظة والمصاريف</h2>
                    <button 
                        onClick={() => {
                            setExpenseToEdit(null);
                            setIsExpenseModalOpen(true);
                        }}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2 hover:bg-red-100 transition-colors"
                    >
                        <Plus size={16} />
                        صرف جديد
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-50 rounded-2xl text-red-500"><TrendingDown size={24} /></div>
                            <h3 className="font-bold text-slate-500">مجموع المصاريف</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-800 dir-ltr">{stats.totalExpenses.toLocaleString()} <span className="text-lg text-slate-400 font-medium">IQD</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-[2rem] shadow-xl shadow-emerald-500/20 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/10 rounded-2xl"><DollarSign size={24} /></div>
                            <h3 className="font-bold text-emerald-100">صافي الأرباح (بعد المصاريف)</h3>
                        </div>
                        <p className="text-3xl font-black dir-ltr">{stats.net.toLocaleString()} <span className="text-lg opacity-70 font-medium">IQD</span></p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">سجل المصروفات</h3>
                    {expenses.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            لا توجد مصروفات مسجلة
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {expenses.map(expense => (
                                <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold">
                                            {expense.category[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{expense.title}</h4>
                                            <p className="text-xs text-slate-500">{new Date(expense.created_at).toLocaleDateString('ar-IQ')} • {expense.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-bold text-slate-800 dir-ltr">-{expense.amount.toLocaleString()}</p>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleEditExpense(expense)}
                                                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="تعديل"
                                            >
                                                <PenLine size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="md:hidden fixed bottom-24 left-6 z-40">
                    <button 
                        onClick={() => {
                            setExpenseToEdit(null);
                            setIsExpenseModalOpen(true);
                        }}
                        className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-500/40 border border-white/20 active:scale-95 transition-all"
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </button>
                </div>
             </div>
        )}

        {activeTab === 'calculator' && (
            <ProfitCalculator />
        )}

        {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => setSettingsTab('delivery')}
                        className={clsx(
                            "w-full p-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-4 border text-right group",
                            settingsTab === 'delivery' 
                                ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10 scale-[1.01]" 
                                : "bg-white text-slate-500 hover:text-slate-800 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        <div className={clsx("p-3 rounded-xl transition-colors shrink-0", settingsTab === 'delivery' ? "bg-white/10" : "bg-gray-100 text-slate-400 group-hover:bg-white group-hover:text-emerald-500")}>
                            <MapPin size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-black">أسعار التوصيل</p>
                            <p className={clsx("text-xs font-medium mt-0.5 opacity-80", settingsTab === 'delivery' ? "text-slate-300" : "text-slate-400")}>تحديد تكلفة التوصيل للمحافظات</p>
                        </div>
                        {settingsTab === 'delivery' && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>}
                    </button>

                    <button 
                         onClick={() => setSettingsTab('campaigns')}
                         className={clsx(
                            "w-full p-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-4 border text-right group",
                            settingsTab === 'campaigns' 
                                ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10 scale-[1.01]" 
                                : "bg-white text-slate-500 hover:text-slate-800 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        <div className={clsx("p-3 rounded-xl transition-colors shrink-0", settingsTab === 'campaigns' ? "bg-white/10" : "bg-gray-100 text-slate-400 group-hover:bg-white group-hover:text-blue-500")}>
                            <Megaphone size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-black">إدارة الحملات</p>
                            <p className={clsx("text-xs font-medium mt-0.5 opacity-80", settingsTab === 'campaigns' ? "text-slate-300" : "text-slate-400")}>تحليل أداء الإعلانات والمصادر</p>
                        </div>
                        {settingsTab === 'campaigns' && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>}
                    </button>

                    <button 
                         onClick={() => setSettingsTab('blacklist')}
                         className={clsx(
                            "w-full p-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-4 border text-right group",
                            settingsTab === 'blacklist' 
                                ? "bg-red-500 text-white border-red-500 shadow-xl shadow-red-500/20 scale-[1.01]" 
                                : "bg-white text-slate-500 hover:text-red-500 border-gray-100 hover:border-red-100 hover:bg-red-50"
                        )}
                    >
                        <div className={clsx("p-3 rounded-xl transition-colors shrink-0", settingsTab === 'blacklist' ? "bg-white/10" : "bg-gray-100 text-slate-400 group-hover:bg-white group-hover:text-red-500")}>
                            <ShieldBan size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-black">القائمة السوداء</p>
                            <p className={clsx("text-xs font-medium mt-0.5 opacity-80", settingsTab === 'blacklist' ? "text-white" : "text-slate-400")}>حظر الأرقام غير المرغوب بها</p>
                        </div>
                        {settingsTab === 'blacklist' && <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>}
                    </button>
                </div>

                <div className="pt-2">
                    {settingsTab === 'delivery' && <DeliveryRatesSettings userId={session.user.id} />}
                    {settingsTab === 'campaigns' && <CampaignManager userId={session.user.id} />}
                    {settingsTab === 'blacklist' && <BlacklistManager userId={session.user.id} />}
                </div>
            </div>
        )}

        <div className="hidden md:flex fixed bottom-8 left-8 z-50 items-center gap-4">
             <button 
                onClick={() => {
                    setOrderToEdit(null);
                    setIsOrderModalOpen(true);
                }}
                className="group flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
            >
                <Plus size={20} className="text-emerald-400 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-bold">إضافة طلب جديد</span>
            </button>
        </div>

        <AddOrderModal 
            isOpen={isOrderModalOpen} 
            onClose={() => {
                setIsOrderModalOpen(false);
                setOrderToEdit(null);
            }} 
            onSuccess={fetchData}
            onOpenSettings={() => {
                setActiveTab('settings');
                setSettingsTab('delivery');
            }}
            userId={session.user.id}
            orders={orders}
            orderToEdit={orderToEdit}
        />
        
        <ExpenseModal
            isOpen={isExpenseModalOpen}
            onClose={() => {
                setIsExpenseModalOpen(false);
                setExpenseToEdit(null);
            }}
            onSuccess={fetchData}
            userId={session.user.id}
            expenseToEdit={expenseToEdit}
        />
    </Layout>
  );
}
