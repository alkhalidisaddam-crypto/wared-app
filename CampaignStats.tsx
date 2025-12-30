import React from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, 
  TrendingUp, 
  Facebook, 
  Instagram, 
  Video, 
  Globe, 
  MessageCircle,
  LayoutGrid,
  ArrowUp
} from 'lucide-react';
import { Order, Campaign } from './types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface CampaignStatsProps {
  orders: Order[];
  campaigns: Campaign[];
}

const PLATFORM_ICONS: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Video,
  snapchat: MessageCircle,
  google: Globe,
  other: LayoutGrid
};

export const CampaignStats = ({ orders, campaigns }: CampaignStatsProps) => {
  
  // 1. Calculate Stats
  const campaignStats = campaigns.map(campaign => {
    const campaignOrders = orders.filter(o => o.campaign_id === campaign.id);
    const count = campaignOrders.length;
    const revenue = campaignOrders.reduce((sum, o) => sum + (o.price - (o.discount || 0)), 0);
    
    return {
      ...campaign,
      count,
      revenue
    };
  }).filter(c => c.count > 0).sort((a, b) => b.count - a.count); // Only show active campaigns with orders

  // Count orders with NO campaign
  const unknownSourceCount = orders.filter(o => !o.campaign_id).length;

  if (campaignStats.length === 0 && unknownSourceCount === 0) return null;

  const maxCount = Math.max(...campaignStats.map(c => c.count), 1);

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
         <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Megaphone size={20} />
         </div>
         <div>
            <h4 className="font-bold text-slate-800 text-lg">أداء الحملات الإعلانية</h4>
            <p className="text-xs text-slate-400">توزيع الطلبات حسب المصدر</p>
         </div>
      </div>

      <div className="space-y-5">
         {campaignStats.map((stat, idx) => {
            const Icon = PLATFORM_ICONS[stat.platform] || LayoutGrid;
            const isTop = idx === 0;
            
            return (
                <div key={stat.id} className="relative">
                    <div className="flex justify-between items-center mb-2 z-10 relative">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md", 
                                stat.platform === 'facebook' ? 'bg-blue-600' :
                                stat.platform === 'instagram' ? 'bg-pink-600' :
                                stat.platform === 'tiktok' ? 'bg-black' :
                                stat.platform === 'snapchat' ? 'bg-yellow-400' :
                                'bg-slate-500'
                            )}>
                                <Icon size={16} />
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                    {stat.name}
                                    {isTop && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><TrendingUp size={10} /> الأعلى</span>}
                                </h5>
                                <p className="text-[10px] text-slate-400 font-mono dir-ltr">{stat.revenue.toLocaleString()} IQD</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="font-black text-slate-800 text-lg">{stat.count}</span>
                             <span className="text-xs text-slate-400 mr-1">طلب</span>
                        </div>
                    </div>
                    
                    {/* Bar Background */}
                    <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(stat.count / maxCount) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn("h-full rounded-full relative", 
                                isTop ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-slate-300"
                            )}
                        >
                             {isTop && <div className="absolute inset-0 bg-white/30 animate-pulse"></div>}
                        </motion.div>
                    </div>
                </div>
            );
         })}

         {unknownSourceCount > 0 && (
             <div className="pt-4 mt-4 border-t border-gray-50 flex justify-between items-center opacity-60">
                <span className="text-xs font-bold text-slate-400">بدون مصدر محدد</span>
                <span className="text-xs font-bold text-slate-500">{unknownSourceCount} طلب</span>
             </div>
         )}

         {campaignStats.length === 0 && (
             <div className="text-center py-8 text-slate-400 text-sm">
                لم يتم ربط أي طلبات بحملات إعلانية بعد.
             </div>
         )}
      </div>
    </motion.div>
  );
};