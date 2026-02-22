import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { Video, X, Users, Check, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoCallProps {
  meetingId: string;
  userName: string;
  onLeave: () => void;
  isTrainer: boolean;
  userId: number;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoCall: React.FC<VideoCallProps> = ({ meetingId, userName, onLeave, isTrainer, userId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [invitedIds, setInvitedIds] = useState<number[]>([]);

  // 1. Sync Live Status to Backend & Firebase
  const updateLiveState = async (active: boolean, invited: number[] = []) => {
    try {
      await fetch('/api/live-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meeting_id: meetingId, 
          is_active: active ? 1 : 0,
          invited_students: invited
        })
      });
    } catch (err) {
      console.error("Failed to sync live state:", err);
    }
  };

  useEffect(() => {
    if (isTrainer) {
      fetch('/api/students').then(res => res.json()).then(setStudents);
      // Initial broadcast that class is live
      updateLiveState(true);
    }
    
    return () => { if (isTrainer) updateLiveState(false); };
  }, [isTrainer]);

  useEffect(() => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

    if (jitsiApiRef.current) jitsiApiRef.current.dispose();

    const domain = 'meet.ffmuc.net'; // Reliable free Jitsi instance
    const options = {
      roomName: `AdiJEE_Zenith_${meetingId}`, 
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: true,
        disableDeepLinking: true,
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'chat', 'raisehand', 
          'videoquality', 'tileview', 'sharescreen', 'hangup'
        ],
      },
      interfaceConfigOverwrite: {
        MOBILE_APP_PROMO: false,
        SHOW_JITSI_WATERMARK: false,
      },
      userInfo: { displayName: isTrainer ? `Educator: ${userName}` : userName },
    };

    jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
    jitsiApiRef.current.addEventListeners({
      videoConferenceLeft: onLeave,
      readyToClose: onLeave
    });

    return () => jitsiApiRef.current?.dispose();
  }, [meetingId]);

  const toggleInvite = (sid: number) => {
    const newInvited = invitedIds.includes(sid) 
      ? invitedIds.filter(id => id !== sid) 
      : [...invitedIds, sid];
    setInvitedIds(newInvited);
    updateLiveState(true, newInvited);
  };

  return (
    <div className="fixed inset-0 bg-[#0A0E1A] flex flex-col z-[100] font-sans">
      {/* Header Bar */}
      <div className="h-16 bg-[#111827]/80 backdrop-blur-xl flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
             <div className="absolute w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-20" />
             <Radio className="text-emerald-500 z-10" size={18} />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">AdiJEE Live Studio</h2>
            <p className="text-[10px] text-slate-500 font-medium">Session ID: {meetingId.split('-')[0]}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isTrainer && (
            <button 
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all"
            >
              <Users size={14} /> Manage Students ({invitedIds.length})
            </button>
          )}
          <button 
            onClick={onLeave}
            className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="flex-1 bg-black overflow-hidden" ref={containerRef} />

      {/* Invite Modal (Framer Motion) */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111827] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-3xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-lg font-bold">Invite to Class</h3>
                <button onClick={() => setShowInviteModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {students.map(student => (
                  <div 
                    key={student.id} 
                    onClick={() => toggleInvite(student.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                      invitedIds.includes(student.id) 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className={`text-sm font-medium ${invitedIds.includes(student.id) ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {student.name}
                    </span>
                    {invitedIds.includes(student.id) ? (
                      <Check className="text-emerald-500" size={18} />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-700" />
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowInviteModal(false)}
                className="w-full mt-8 bg-emerald-500 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
              >
                Continue Session
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoCall;
