import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  MoreHorizontal,
  Calendar,
  Search,
  Filter,
  Trash2,
  ChevronDown,
  ShieldBan,
  Share2,
  Download,
  LayoutDashboard
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { Order, OrderStatus } from './types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import html2canvas from 'html2canvas';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface OrderListProps {
  orders: Order[];
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
  onDelete: (id: string) => void;
  userId?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'جديد', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Package },
  processing: { label: 'قيد التجهيز', color: 'bg-yellow-50 text-yellow-700 border-yellow-100', icon: Clock },
  out_for_delivery: { label: 'جاري التوصيل', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: Truck },
  delivered: { label: 'تم التوصيل', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  returned: { label: 'راجع', color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle },
};

const ORDER_STATUSES: OrderStatus[] = ['new', 'processing', 'out_for_delivery', 'delivered', 'returned'];

export const OrderList = ({ orders, onStatusChange, onDelete, userId }: OrderListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  
  // State for Invoice Generation
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(order.phone).includes(searchTerm) ||
      String(order.id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Toggle Action Menu
  const toggleAction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveActionId(activeActionId === id ? null : id);
  };

  const handleBlockCustomer = async (order: Order) => {
      const reason = window.prompt(`هل أنت متأكد من حظر الزبون ${order.customer_name}؟\n\nاكتب سبب الحظر:`, "رفض استلام الطلب");
      
      if (reason && userId) {
          try {
              const { error } = await supabase!.from('customer_blacklist').insert([{
                  user_id: userId,
                  phone: order.phone,
                  name: order.customer_name,
                  reason: reason
              }]);
              
              if (error) throw error;
              alert('تمت إضافة الزبون للقائمة السوداء بنجاح');
          } catch (err: any) {
              console.error(err);
              alert('حدث خطأ. ربما هذا الرقم محظور بالفعل.');
          }
      }
  };

  // --- Invoice Sharing Logic ---
  const handleShareInvoice = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveActionId(null);
    setIsGenerating(true);
    setInvoiceOrder(order);

    // Give React a moment to render the hidden invoice div with the new order data
    setTimeout(async () => {
        try {
            const element = document.getElementById('invoice-hidden-template');
            if (!element) return;

            // Generate Image
            const canvas = await html2canvas(element, {
                scale: 2, // High resolution
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setIsGenerating(false);
                    return;
                }

                let copiedToClipboard = false;

                // Try Clipboard API
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    copiedToClipboard = true;
                    alert('تم نسخ صورة الوصل! \n\n1. سيفتح واتساب الآن.\n2. اضغط (لصق) داخل المحادثة.');
                } catch (err) {
                    console.warn("Clipboard write failed, falling back to download", err);
                }

                // If Clipboard failed (e.g., non-HTTPS or Firefox/Safari restrictions), download it
                if (!copiedToClipboard) {
                    const link = document.createElement('a');
                    // SAFELY HANDLE ID SLICING HERE
                    const safeId = String(order.id); 
                    link.download = `invoice_${order.customer_name}_${safeId.slice(0,4)}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                    alert('تم تحميل صورة الوصل! \n\nسيفتح واتساب الآن، قم بإرفاق الصورة من الاستوديو.');
                }

                // Open WhatsApp
                let phone = String(order.phone).replace(/[^0-9]/g, '');
                // Basic Iraqi phone formatting fix
                if (phone.startsWith('07')) phone = '964' + phone.substring(1);
                if (phone.startsWith('7')) phone = '964' + phone;

                window.open(`https://wa.me/${phone}`, '_blank');
                
            }, 'image/png');

        } catch (error) {
            console.error("Invoice generation failed", error);
            alert('حدث خطأ أثناء إنشاء الوصل.');
        } finally {
            setIsGenerating(false);
            // Don't clear invoiceOrder immediately so we don't get a flash of empty content if re-rendering, 
            // but for this flow it's fine.
        }
    }, 100);
  };

  return (
    <div className="space-y-6 relative">
      
      {/* --- Controls Header --- */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100">
          
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث باسم الزبون، الهاتف، أو رقم الوصل..." 
              className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Tabs (Desktop) */}
          <div className="hidden md:flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl overflow-x-auto max-w-full">
            <button 
                onClick={() => setFilterStatus('all')}
                className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap", filterStatus === 'all' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
                الكل
            </button>
            {ORDER_STATUSES.map(status => (
                <button 
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap", filterStatus === status ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                    {statusConfig[status].label}
                </button>
            ))}
          </div>

           {/* Filter Dropdown (Mobile) */}
           <div className="md:hidden w-full relative">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
                className="w-full appearance-none bg-gray-50 border border-gray-100 text-slate-700 py-3 px-4 pr-10 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">كل الطلبات</option>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
              </select>
              <Filter className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
           </div>
      </div>

      <div className="px-2 flex justify-between items-center">
         <h2 className="text-xl font-black text-slate-800">قائمة الطلبات</h2>
         <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-gray-200">
            {filteredOrders.length} نتيجة
         </span>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Search size={48} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">لا توجد نتائج</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">حاول تغيير مصطلحات البحث أو الفلتر.</p>
        </div>
      ) : (
        <>
            {/* --- Desktop Table View --- */}
            <div className="hidden md:block bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-visible">
                <table className="w-full">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-right">
                    <th className="py-5 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">رقم الطلب</th>
                    <th className="py-5 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">الزبون</th>
                    <th className="py-5 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">المنتج</th>
                    <th className="py-5 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">المبلغ</th>
                    <th className="py-5 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">الحالة</th>
                    <th className="py-5 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredOrders.map((order, idx) => {
                    const status = statusConfig[order.status] || statusConfig.new;
                    const StatusIcon = status.icon;
                    return (
                        <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={order.id} 
                        className="group hover:bg-gray-50/50 transition-colors"
                        >
                        <td className="py-4 px-6">
                            <span className="font-mono text-xs font-bold text-slate-400">#{String(order.id).slice(0, 8)}</span>
                        </td>
                        <td className="py-4 px-6">
                            <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{order.customer_name}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {order.governorate}
                            </span>
                            </div>
                        </td>
                        <td className="py-4 px-6">
                            <span className="text-sm font-medium text-slate-600">{order.product}</span>
                        </td>
                        <td className="py-4 px-6">
                            <span className="font-mono font-bold text-slate-800 dir-ltr">
                            {(order.price).toLocaleString()}
                            </span>
                        </td>
                        <td className="py-4 px-6">
                             {/* Custom Select for Status */}
                             <div className="relative group/status">
                                <button className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all hover:brightness-95", status.color)}>
                                    <StatusIcon size={12} />
                                    {status.label}
                                    <ChevronDown size={10} className="opacity-50" />
                                </button>
                                {/* Dropdown Menu */}
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 hidden group-hover/status:block">
                                    {ORDER_STATUSES.map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => onStatusChange(order.id, s)}
                                            className="w-full text-right px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-gray-50 hover:text-emerald-600 transition-colors flex items-center gap-2"
                                        >
                                            <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig[s].color.split(' ')[1].replace('text-', 'bg-'))}></div>
                                            {statusConfig[s].label}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </td>
                        <td className="py-4 px-6">
                             <div className="flex items-center gap-1">
                                <button 
                                    onClick={(e) => handleShareInvoice(order, e)}
                                    className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                    title="مشاركة الوصل (واتساب)"
                                >
                                    <Share2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleBlockCustomer(order)}
                                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="حظر الزبون (القائمة السوداء)"
                                >
                                    <ShieldBan size={16} />
                                </button>
                                <button 
                                    onClick={() => {
                                        if(window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) onDelete(order.id);
                                    }}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="حذف الطلب"
                                >
                                    <Trash2 size={16} />
                                </button>
                             </div>
                        </td>
                        </motion.tr>
                    );
                    })}
                </tbody>
                </table>
            </div>

            {/* --- Mobile View (Cards) --- */}
            <div className="md:hidden space-y-3 pb-24">
                {filteredOrders.map((order, idx) => {
                    const status = statusConfig[order.status] || statusConfig.new;
                    return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={order.id}
                        className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col gap-4 relative overflow-hidden"
                        onClick={() => setActiveActionId(null)} // Close menu on card click
                    >
                        {/* Header: ID and Menu */}
                        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", status.color.split(' ')[1].replace('text-', 'bg-'))}></div>
                                <span className="font-mono text-xs font-bold text-slate-400">#{String(order.id).slice(0, 6)}</span>
                            </div>
                            
                            <div className="relative">
                                <button 
                                    onClick={(e) => toggleAction(order.id, e)}
                                    className="p-1.5 -mr-2 text-slate-400 hover:bg-gray-50 rounded-full"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                
                                <AnimatePresence>
                                    {activeActionId === order.id && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="absolute left-0 top-8 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-30 p-1"
                                        >
                                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-gray-50">تغيير الحالة</div>
                                            {ORDER_STATUSES.map(s => (
                                                <button 
                                                    key={s}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onStatusChange(order.id, s);
                                                        setActiveActionId(null);
                                                    }}
                                                    className="w-full text-right px-3 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center gap-2"
                                                >
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig[s].color.split(' ')[1].replace('text-', 'bg-'))}></div>
                                                    {statusConfig[s].label}
                                                </button>
                                            ))}
                                            <div className="h-px bg-gray-50 my-1"></div>
                                            <button 
                                                onClick={(e) => handleShareInvoice(order, e)}
                                                className="w-full text-right px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-2"
                                            >
                                                <Share2 size={14} />
                                                مشاركة الوصل
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBlockCustomer(order);
                                                    setActiveActionId(null);
                                                }}
                                                className="w-full text-right px-3 py-2 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg flex items-center gap-2"
                                            >
                                                <ShieldBan size={14} />
                                                حظر الزبون
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm('حذف الطلب؟')) onDelete(order.id);
                                                }}
                                                className="w-full text-right px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2"
                                            >
                                                <Trash2 size={14} />
                                                حذف الطلب
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-800 text-lg">{order.customer_name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Phone size={14} />
                                    <span className="dir-ltr">{order.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <MapPin size={14} />
                                    <span>{order.governorate}</span>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-emerald-600 text-lg font-mono dir-ltr">
                                    {(order.price).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-400 text-right">IQD</p>
                            </div>
                        </div>

                        {/* Footer: Product & Status */}
                        <div className="flex items-center justify-between pt-2">
                             <div className="bg-gray-50 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 max-w-[150px] truncate">
                                <Package size={14} className="text-slate-400" />
                                {order.product}
                             </div>
                             <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border", status.color)}>
                                {status.label}
                             </span>
                        </div>
                    </motion.div>
                    )
                })}
            </div>
        </>
      )}

      {/* --- HIDDEN INVOICE TEMPLATE (OFF-SCREEN) --- */}
      {invoiceOrder && (
          <div 
            id="invoice-hidden-template" 
            className="fixed -left-[9999px] top-0 w-[500px] bg-white text-slate-800 p-8 z-[100]"
          >
             {/* Header */}
             <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                <div>
                   <div className="flex items-center gap-2 mb-2 text-emerald-600">
                        <LayoutDashboard size={24} />
                        <h1 className="text-3xl font-black">وارد</h1>
                   </div>
                   <p className="text-sm font-bold text-slate-500">نظام إدارة الطلبات</p>
                </div>
                <div className="text-left">
                    <h2 className="text-2xl font-black text-slate-800">فاتورة طلب</h2>
                    {/* SAFELY HANDLE ID SLICING HERE */}
                    <p className="text-sm font-medium text-slate-500 mt-1 dir-ltr">#{String(invoiceOrder.id).slice(0,8)}</p>
                    <p className="text-sm font-medium text-slate-500">{new Date().toLocaleDateString('ar-IQ')}</p>
                </div>
             </div>

             {/* Customer Details */}
             <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <h3 className="text-sm font-black text-slate-400 uppercase mb-3">تفاصيل الزبون</h3>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <p className="text-xs text-slate-400 mb-1">الاسم</p>
                         <p className="font-bold text-lg">{invoiceOrder.customer_name}</p>
                     </div>
                     <div>
                         <p className="text-xs text-slate-400 mb-1">رقم الهاتف</p>
                         <p className="font-bold text-lg dir-ltr text-right">{invoiceOrder.phone}</p>
                     </div>
                     <div className="col-span-2">
                         <p className="text-xs text-slate-400 mb-1">العنوان</p>
                         <p className="font-bold text-lg">{invoiceOrder.governorate} {invoiceOrder.address ? ` - ${invoiceOrder.address}` : ''}</p>
                     </div>
                 </div>
             </div>

             {/* Items Table */}
             <div className="mb-8">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-800 text-white text-sm">
                            <th className="py-3 px-4 text-right rounded-r-lg">المنتج</th>
                            <th className="py-3 px-4 text-left rounded-l-lg">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="py-4 px-4 font-bold">{invoiceOrder.product}</td>
                            <td className="py-4 px-4 font-bold text-left dir-ltr">{invoiceOrder.price.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td className="py-4 px-4 font-bold text-slate-500">كلفة التوصيل</td>
                            <td className="py-4 px-4 font-bold text-left dir-ltr text-slate-500">{invoiceOrder.delivery_cost.toLocaleString()}</td>
                        </tr>
                         {invoiceOrder.discount > 0 && (
                            <tr>
                                <td className="py-4 px-4 font-bold text-red-500">خصم</td>
                                <td className="py-4 px-4 font-bold text-left dir-ltr text-red-500">-{invoiceOrder.discount.toLocaleString()}</td>
                            </tr>
                         )}
                    </tbody>
                </table>
             </div>

             {/* Total */}
             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex justify-between items-center mb-8">
                 <span className="text-xl font-black text-emerald-800">المجموع الكلي</span>
                 <span className="text-3xl font-black text-emerald-600 dir-ltr">
                    {(invoiceOrder.price + invoiceOrder.delivery_cost - (invoiceOrder.discount || 0)).toLocaleString()} IQD
                 </span>
             </div>

             {/* Footer */}
             <div className="text-center text-slate-400 text-sm font-bold">
                 شكراً لثقتكم بنا ❤️
             </div>
          </div>
      )}

    </div>
  );
};
