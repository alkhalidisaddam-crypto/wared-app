import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save, MapPin, User, Phone, Package, DollarSign, Settings, Truck, Megaphone, Search, ShieldBan, AlertTriangle, Sparkles, PenLine } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Order, Campaign } from './types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenSettings?: () => void;
  userId?: string;
  orders?: Order[];
  orderToEdit?: Order | null;
}

const GOVERNORATES = [
  "بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "دهوك", 
  "الأنبار", "بابل", "كربلاء", "النجف", "صلاح الدين", "ديالى", 
  "واسط", "ميسان", "المثنى", "الديوانية", "ذي قار", "كركوك"
];

export const AddOrderModal = ({ isOpen, onClose, onSuccess, onOpenSettings, userId, orders = [], orderToEdit }: AddOrderModalProps) => {
  const [loading, setLoading] = useState(false);
  const [deliveryRates, setDeliveryRates] = useState<Record<string, number>>({});
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  
  // Autocomplete State
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Risk Detection State
  const [riskStatus, setRiskStatus] = useState<'safe' | 'warning' | 'blocked'>('safe');
  const [riskMessage, setRiskMessage] = useState<string | null>(null);
  const [isCheckingRisk, setIsCheckingRisk] = useState(false);

  // Toast / Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    governorate: 'بغداد',
    address: '',
    product: '',
    price: '', // Product Price
    delivery_cost: '', // Delivery Cost
    notes: '',
    campaign_id: ''
  });

  // Fetch Delivery Rates & Active Campaigns on Mount
  useEffect(() => {
    if (userId && isOpen) {
        const fetchInitialData = async () => {
            // Parallel Fetch
            const [ratesRes, campaignsRes] = await Promise.all([
                supabase!.from('delivery_rates').select('*').eq('user_id', userId),
                supabase!.from('campaigns').select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false })
            ]);
            
            // Handle Rates
            let ratesMap: Record<string, number> = {};
            if (ratesRes.data) {
                ratesRes.data.forEach((r: any) => ratesMap[r.governorate] = r.price);
                setDeliveryRates(ratesMap);
            }

            // Handle Campaigns
            if (campaignsRes.data) {
                setActiveCampaigns(campaignsRes.data);
            }

            // If NOT editing, set default delivery cost
            if (!orderToEdit && formData.governorate === 'بغداد' && ratesMap['بغداد'] && !formData.delivery_cost) {
               setFormData(prev => ({ ...prev, delivery_cost: ratesMap['بغداد'].toString() }));
            }
        };
        fetchInitialData();
    }
  }, [userId, isOpen]);

  // Handle Edit Mode Population
  useEffect(() => {
    if (orderToEdit && isOpen) {
        setFormData({
            customer_name: orderToEdit.customer_name,
            phone: orderToEdit.phone,
            governorate: orderToEdit.governorate,
            address: orderToEdit.address || '',
            product: orderToEdit.product,
            price: orderToEdit.price.toString(),
            delivery_cost: orderToEdit.delivery_cost.toString(),
            notes: '',
            campaign_id: orderToEdit.campaign_id || ''
        });
    } else if (!isOpen) {
        // Reset when closed
        setFormData({
            customer_name: '',
            phone: '',
            governorate: 'بغداد',
            address: '',
            product: '',
            price: '',
            delivery_cost: '',
            notes: '',
            campaign_id: ''
        });
        setRiskStatus('safe');
        setRiskMessage(null);
    }
  }, [orderToEdit, isOpen]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show toast for 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Risk Detection Logic
  const checkCustomerRisk = useCallback(async (phone: string) => {
      if (!phone || phone.length < 10 || !userId) {
          setRiskStatus('safe');
          setRiskMessage(null);
          return;
      }

      // If we are editing and the phone number hasn't changed, don't check risk (it's the same customer)
      if (orderToEdit && orderToEdit.phone === phone) {
           return;
      }

      setIsCheckingRisk(true);
      try {
          // 1. Check Blacklist
          const { data: blacklistData } = await supabase!
              .from('customer_blacklist')
              .select('reason')
              .eq('user_id', userId)
              .eq('phone', phone)
              .maybeSingle();

          if (blacklistData) {
              setRiskStatus('blocked');
              setRiskMessage(`هذا الزبون محظور! السبب: ${blacklistData.reason}`);
              setIsCheckingRisk(false);
              return;
          }

          // 2. Check Order History (Return Rate)
          const { data: historyData } = await supabase!
              .from('orders')
              .select('status')
              .eq('user_id', userId)
              .eq('phone', phone);

          if (historyData && historyData.length > 0) {
              const total = historyData.length;
              const returned = historyData.filter(o => o.status === 'returned').length;
              const returnRate = (returned / total) * 100;

              if (returnRate >= 50 && total >= 2) {
                  setRiskStatus('warning');
                  setRiskMessage(`تحذير: هذا الزبون لديه نسبة راجع عالية (${returned} من ${total} طلبات سابقة)`);
              } else {
                  setRiskStatus('safe');
                  setRiskMessage(null);
              }
          } else {
               setRiskStatus('safe');
               setRiskMessage(null);
          }

      } catch (err) {
          console.error("Risk check failed", err);
      } finally {
          setIsCheckingRisk(false);
      }
  }, [userId, orderToEdit]);

  // Debounce risk check
  useEffect(() => {
      const timer = setTimeout(() => {
          if (formData.phone) checkCustomerRisk(formData.phone);
      }, 800);
      return () => clearTimeout(timer);
  }, [formData.phone, checkCustomerRisk]);


  // Handle Product Input Change for Autocomplete
  const handleProductChange = (val: string) => {
      setFormData({...formData, product: val});
      
      if (val.trim().length > 0) {
          // Extract unique product names from existing orders
          const uniqueProducts = Array.from(new Set(orders.map(o => o.product)))
            .filter(p => p && p.toLowerCase().includes(val.toLowerCase()))
            .slice(0, 10);
          
          setProductSuggestions(uniqueProducts);
          setShowSuggestions(true);
      } else {
          setShowSuggestions(false);
      }
  };

  const selectSuggestion = (val: string) => {
      setFormData({...formData, product: val});
      setShowSuggestions(false);
  };

  // Watch for Governorate Changes to Auto-fill Delivery Cost
  const handleGovernorateChange = (newGov: string) => {
     const rate = deliveryRates[newGov];
     setFormData(prev => ({
         ...prev,
         governorate: newGov,
         delivery_cost: rate ? rate.toString() : prev.delivery_cost // Auto-fill or keep existing if no rate found
     }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (riskStatus === 'blocked') return; // Double check prevention

    setLoading(true);
    try {
      // Validate inputs
      const priceNum = parseFloat(formData.price.replace(/,/g, ''));
      const deliveryNum = parseFloat(formData.delivery_cost.replace(/,/g, '')) || 0;
      
      if (isNaN(priceNum)) throw new Error("سعر المنتج غير صحيح");

      const orderPayload = {
        user_id: userId,
        customer_name: formData.customer_name,
        phone: formData.phone,
        governorate: formData.governorate,
        address: formData.address,
        product: formData.product,
        price: priceNum,
        delivery_cost: deliveryNum, 
        campaign_id: formData.campaign_id || null
      };

      if (orderToEdit) {
         // Update existing
         const { error } = await supabase!
            .from('orders')
            .update(orderPayload)
            .eq('id', orderToEdit.id);
         if (error) throw error;
      } else {
         // Insert new
         const { error } = await supabase!
            .from('orders')
            .insert([{ ...orderPayload, status: 'new', discount: 0 }]);
         if (error) throw error;
      }

      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error saving order:', error);
      alert('حدث خطأ أثناء حفظ الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center sm:p-4">
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
            {/* Header */}
            <div className="flex-none px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-black text-slate-800">
                        {orderToEdit ? 'تعديل الطلب' : 'إضافة طلب جديد'}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">
                        {orderToEdit ? 'تحديث بيانات الطلب الحالي' : 'أدخل تفاصيل الطلب يدوياً'}
                    </p>
                </div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-gray-100 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Toast Message */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-20 left-4 right-4 z-20 bg-emerald-600 text-white p-3 rounded-xl text-sm font-bold shadow-xl flex items-center justify-center gap-2"
                    >
                        <Sparkles size={16} />
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white scrollbar-hide">
                <form id="addOrderForm" onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Customer Info Group */}
                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">معلومات الزبون</label>
                        
                        <div className="relative">
                            <div className="absolute top-3.5 right-4 text-slate-400 pointer-events-none">
                                <User size={18} />
                            </div>
                            <input 
                                required
                                placeholder="اسم الزبون"
                                className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                                value={formData.customer_name}
                                onChange={e => setFormData({...formData, customer_name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="relative">
                                <div className="absolute top-3.5 right-4 text-slate-400 pointer-events-none">
                                    <Phone size={18} />
                                </div>
                                <input 
                                    required
                                    type="tel"
                                    placeholder="رقم الهاتف (077...)"
                                    className={cn(
                                        "w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-slate-700 transition-all dir-ltr text-right placeholder:text-right",
                                        riskStatus === 'blocked' ? "border-red-300 focus:ring-red-500 bg-red-50" :
                                        riskStatus === 'warning' ? "border-yellow-300 focus:ring-yellow-500 bg-yellow-50" :
                                        "focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                    )}
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                                {isCheckingRisk && (
                                    <div className="absolute top-4 left-4">
                                        <Loader2 size={16} className="animate-spin text-slate-400" />
                                    </div>
                                )}
                            </div>

                            {/* Risk Alert Banner */}
                            <AnimatePresence>
                                {riskStatus !== 'safe' && riskMessage && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={cn(
                                            "rounded-xl p-3 flex items-start gap-3 text-sm font-bold border",
                                            riskStatus === 'blocked' ? "bg-red-50 border-red-200 text-red-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"
                                        )}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            {riskStatus === 'blocked' ? <ShieldBan size={18} /> : <AlertTriangle size={18} />}
                                        </div>
                                        <p>{riskMessage}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-2"></div>

                    {/* Location Info */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">العنوان والتوصيل</label>
                            {onOpenSettings && (
                                <button 
                                    type="button" 
                                    onClick={() => { onClose(); onOpenSettings(); }}
                                    className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline"
                                >
                                    <Settings size={12} />
                                    إعداد الأسعار
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative col-span-2 sm:col-span-1">
                                <div className="absolute top-3.5 right-4 text-slate-400 pointer-events-none">
                                    <MapPin size={18} />
                                </div>
                                <select 
                                    className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none transition-all"
                                    value={formData.governorate}
                                    onChange={e => handleGovernorateChange(e.target.value)}
                                >
                                    {GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                                </select>
                                <div className="absolute top-4 left-4 text-slate-400 pointer-events-none">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <input 
                                    placeholder="المنطقة / نقطة دالة"
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-2"></div>

                    {/* Order Details */}
                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">تفاصيل الطلب</label>
                        
                        {/* Smart Product Input with Autocomplete */}
                        <div className="relative" ref={suggestionsRef}>
                            <div className="absolute top-3.5 right-4 text-slate-400 pointer-events-none">
                                <Package size={18} />
                            </div>
                            <input 
                                required
                                placeholder="اسم المنتج / الكمية"
                                className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                                value={formData.product}
                                onChange={e => handleProductChange(e.target.value)}
                                onFocus={() => formData.product && setShowSuggestions(true)}
                                autoComplete="off"
                            />
                            {/* Suggestions Dropdown */}
                            <AnimatePresence>
                                {showSuggestions && productSuggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 max-h-48 overflow-y-auto"
                                    >
                                        <div className="px-3 py-2 bg-gray-50 text-[10px] font-bold text-slate-400 border-b border-gray-100 sticky top-0">
                                            منتجات سابقة
                                        </div>
                                        {productSuggestions.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => selectSuggestion(suggestion)}
                                                className="w-full text-right px-4 py-3 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2"
                                            >
                                                <Search size={14} className="opacity-50" />
                                                {suggestion}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <div className="absolute top-3.5 right-4 text-slate-400 pointer-events-none">
                                    <DollarSign size={18} />
                                </div>
                                <input 
                                    required
                                    type="number"
                                    placeholder="سعر المنتج"
                                    className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-700 transition-all dir-ltr text-right placeholder:text-right"
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: e.target.value})}
                                />
                                <div className="absolute -bottom-5 right-1 text-[10px] text-slate-400 font-bold">بدون توصيل</div>
                            </div>

                            <div className="relative">
                                <div className="absolute top-3.5 right-4 text-slate-400 pointer-events-none">
                                    <Truck size={18} />
                                </div>
                                <input 
                                    required
                                    type="number"
                                    placeholder="سعر التوصيل"
                                    className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-700 transition-all dir-ltr text-right placeholder:text-right"
                                    value={formData.delivery_cost}
                                    onChange={e => setFormData({...formData, delivery_cost: e.target.value})}
                                />
                                <div className="absolute -bottom-5 right-1 text-[10px] text-emerald-500 font-bold">
                                    {deliveryRates[formData.governorate] ? 'تم التحديد تلقائياً' : 'يدوي'}
                                </div>
                            </div>
                        </div>

                         {/* Campaign Selection */}
                         <div className="relative">
                            <div className="absolute top-3.5 right-4 text-slate-400 pointer-events-none">
                                <Megaphone size={18} />
                            </div>
                            <select 
                                className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none transition-all"
                                value={formData.campaign_id}
                                onChange={e => setFormData({...formData, campaign_id: e.target.value})}
                            >
                                <option value="">اختر مصدر الطلب (اختياري)</option>
                                {activeCampaigns.map(camp => (
                                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                                ))}
                            </select>
                            <div className="absolute top-4 left-4 text-slate-400 pointer-events-none">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                        </div>
                    </div>

                </form>
            </div>

            {/* Footer Actions */}
            <div className="flex-none p-6 bg-white border-t border-gray-100 z-10">
                <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-sm font-bold text-slate-500">المجموع الكلي:</span>
                    <span className="text-xl font-black text-emerald-600 dir-ltr">
                        {((parseFloat(formData.price || '0') + parseFloat(formData.delivery_cost || '0')).toLocaleString())} IQD
                    </span>
                </div>
                <button 
                    type="submit" 
                    form="addOrderForm"
                    disabled={loading || riskStatus === 'blocked'}
                    className={cn(
                        "w-full text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed",
                        riskStatus === 'blocked' 
                            ? "bg-slate-400 cursor-not-allowed" 
                            : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30 hover:shadow-emerald-500/40"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            جاري الحفظ...
                        </>
                    ) : riskStatus === 'blocked' ? (
                        <>
                           <ShieldBan size={24} />
                           الزبون محظور
                        </>
                    ) : (
                        <>
                            <Save size={24} />
                            {orderToEdit ? 'تحديث الطلب' : 'حفظ الطلب'}
                        </>
                    )}
                </button>
            </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
