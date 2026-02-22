import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banner } from '../types';
import { Trash2, Megaphone } from 'lucide-react';

export const BannerCarousel: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchBanners = () => {
    fetch('/api/banners')
      .then(res => res.json())
      .then(setBanners)
      .catch(err => console.error("Banner Load Error:", err));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000); // 6 seconds for better readability
    return () => clearInterval(timer);
  }, [banners]);

  const deleteBanner = async (id: number) => {
    if (!window.confirm("Remove this announcement?")) return;
    await fetch(`/api/banners/${id}`, { method: 'DELETE' });
    fetchBanners();
  };

  if (banners.length === 0) return (
    <div className="w-full h-48 rounded-2xl bg-slate-900/50 border border-dashed border-white/10 flex items-center justify-center">
      <p className="text-slate-500 text-sm">No active announcements</p>
    </div>
  );

  return (
    <div className="relative w-full h-56 md:h-64 overflow-hidden rounded-3xl mb-8 group shadow-2xl shadow-emerald-500/5">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {/* Banner Image with subtle zoom effect */}
          <img
            src={banners[currentIndex].image_url}
            alt={banners[currentIndex].title}
            className="w-full h-full object-cover transform transition-transform duration-10000 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />

          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/40 to-transparent" />
          
          {/* Text Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-2"
            >
              <span className="bg-emerald-500 text-[#0A0E1A] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                Zenith Update
              </span>
            </motion.div>
            <h3 className="text-white font-display font-bold text-xl md:text-2xl leading-tight max-w-lg">
              {banners[currentIndex].title}
            </h3>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <button 
              onClick={() => deleteBanner(banners[currentIndex].id)}
              className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all backdrop-blur-md"
            >
              <Trash2 size={18} />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Dynamic Indicators */}
      <div className="absolute bottom-6 right-8 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
