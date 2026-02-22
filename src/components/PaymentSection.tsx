import React, { useState, useEffect } from 'react';
import { QrCode, Upload, History, CheckCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types'; 
import myQRCode from '../assets/my-qr.jpeg';

interface PaymentSectionProps {
  user: User;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({ user }) => {
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const CLOUD_NAME = "do7jfmqqf";
  const UPLOAD_PRESET = "adijee_payments"; 

  const fetchHistory = () => {
    fetch(`/api/payments/${user.id}`)
      .then(res => res.json())
      .then(setHistory)
      .catch(err => console.error("History fetch failed", err));
  };

  // Run on mount to check if student already has an uploaded SS
  useEffect(() => {
    fetchHistory();
  }, []);

  // Also fetch when history is toggled
  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  // Logic: Disable upload if there is any record in history
  const hasActivePayment = history.length > 0;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'File too large. Max 5MB allowed.' });
      return;
    }

    setUploading(true);
    setStatusMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const cloudData = await cloudRes.json();
      if (!cloudRes.ok) throw new Error(cloudData.error?.message || 'Cloudinary upload failed');

      const dbRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          student_name: user.name,
          student_phone: user.phone,
          amount: 5000,
          screenshot_url: cloudData.secure_url
        })
      });

      if (dbRes.ok) {
        setStatusMsg({ type: 'success', text: 'Proof submitted! Admin will verify soon.' });
        fetchHistory(); // Refresh history to hide the button immediately
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="bg-[#111827] border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={24} /> Tuition Fee
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">JEE Advanced Batch 2026</p>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400"
          >
            <History size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="bg-white p-3 rounded-2xl shadow-inner shadow-black/20">
            <img 
              src={myQRCode} 
              alt="Payment QR" 
              className="w-36 h-36 object-contain"
            />
          </div>
          
          <div className="text-center">
            <span className="text-3xl font-black text-white">₹500/Class</span>
            <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
              UPI ID: <span className="text-emerald-400">acpedwardlivingston-1@oksbi</span>
            </p>
          </div>

          {/* Conditional Rendering for Upload Button */}
          {!hasActivePayment ? (
            <label className="w-full">
              <motion.div 
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 cursor-pointer transition-all ${
                  uploading 
                    ? 'bg-slate-800 text-slate-500' 
                    : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                }`}
              >
                {uploading ? <Clock className="animate-spin" size={20} /> : <Upload size={20} />}
                {uploading ? 'Uploading...' : 'Upload Screenshot'}
              </motion.div>
              <input type="file" className="hidden" onChange={handleUpload} accept="image/*" disabled={uploading} />
            </label>
          ) : (
            <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold flex items-center justify-center gap-3">
              <CheckCircle className="text-emerald-500" size={20} />
              Payment Under Review
            </div>
          )}

          {statusMsg && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 text-xs p-3 rounded-xl w-full border ${
                statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {statusMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {statusMsg.text}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#111827] border border-white/10 p-5 rounded-3xl space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Your Payment History</h4>
              
              <div className="max-h-48 overflow-y-auto space-y-2 no-scrollbar">
                {history.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-600">No transactions yet.</p>
                ) : (
                  history.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                           <QrCode size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">₹{p.amount}</p>
                          <p className="text-[9px] text-slate-500">{new Date(p.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${
                        p.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {p.status || 'pending'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
