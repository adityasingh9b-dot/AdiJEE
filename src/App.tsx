import React, { useState, useEffect } from 'react';
import { User, Banner, Announcement, ContentItem, Payment, LiveClass } from './types';
import { 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare, 
  CreditCard, 
  Video, 
  Bell, 
  Plus, 
  Check, 
  X, 
  FileText,
  Users,
  LogOut,
  Trash2,
  Phone,
  Lock,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BannerCarousel } from './components/BannerCarousel';
import { DoubtBot } from './components/DoubtBot';
import { PaymentSection } from './components/PaymentSection';
import VideoCall from './components/VideoCall';

export default function App() {

const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [notification, setNotification] = useState<{ message: string, meeting_id: string } | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);
const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Login Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  

useEffect(() => {
  if (user?.role === 'admin' && activeTab === 'payments') {
    fetch('/api/admin/all-payments') // Make sure backend has this route!
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllPayments(data);
      })
      .catch(err => console.error("Error fetching admin payments:", err));
  }
}, [activeTab, user]);

  // WebSocket Connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', userId: user.id }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'class:started') {
        setNotification({ message: data.message, meeting_id: data.meeting_id });
      } else if (data.type === 'class:ended') {
        setNotification(null);
      }
    };

    return () => ws.close();
  }, [user]);

  // Auth Simulation
  useEffect(() => {
    const savedUser = localStorage.getItem('adijee_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (data) {
        setUser(data);
        localStorage.setItem('adijee_user', JSON.stringify(data));
      } else {
        alert('Invalid phone number or password');
      }
    } catch (err) {
      alert('Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('adijee_user');
  };

useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Parallel fetching for performance
        const [bannersRes, announcementsRes, liveClassRes] = await Promise.all([
          fetch('/api/banners'),
          fetch('/api/announcements'),
          fetch('/api/live-class')
        ]);

        setBanners(await bannersRes.json());
        setAnnouncements(await announcementsRes.json());
        setLiveClass(await liveClassRes.json());

        // Role-based fetches
        if (user.role === 'admin') {
          const stdRes = await fetch('/api/students');
          setStudents(await stdRes.json());
          
          // Only fetch all payments if on payment tab to save bandwidth
          if (activeTab === 'payments') {
            const payRes = await fetch('/api/admin/all-payments');
            const payData = await payRes.json();
            if (Array.isArray(payData)) setAllPayments(payData);
          }
        }

        
        // ❌ Purana code:
// const contentRes = await fetch(`/api/content/${user.id}`);

// ✅ Naya Fixed code:
const contentRes = await fetch(`/api/content?userId=${user.id}`);
const contentData = await contentRes.json();
if (Array.isArray(contentData)) {
  setContent(contentData);
} else {
  setContent([]); // Fallback agar data na mile
}

      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    fetchData(); 
    const interval = setInterval(fetchData, 10000); // 10s is safer than 5s for mobile data
    return () => clearInterval(interval);
  }, [user, activeTab]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass p-8 rounded-3xl neon-border text-center"
        >
          <div className="mb-8">
            <div className="w-20 h-20 bg-brand-accent rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <span className="text-brand-primary text-4xl font-display font-black">Z</span>
            </div>
            <h1 className="text-3xl font-display font-black text-white">AdiJEE</h1>
            <p className="text-slate-400">Zenith of JEE Excellence</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-accent transition-colors"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-accent transition-colors"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-brand-accent hover:opacity-90 text-brand-primary py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoggingIn ? 'Logging in...' : 'Login as Student'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6 pb-24">
      <BannerCarousel />
      
      {/* Live Class Status */}
      {liveClass?.is_active ? (
        <div className="bg-brand-secondary/20 border border-brand-secondary p-4 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div>
                <p className="text-sm font-bold text-white">Live Class Active</p>
                <p className="text-xs text-slate-400">Join the session now</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveMeetingId(liveClass.meeting_id)}
              className="bg-brand-secondary text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90"
            >
              Join Now
            </button>
          </div>
          
          {user.role === 'admin' && (
            <button 
              onClick={async () => {
                if (!liveClass || !confirm('Are you sure you want to end the class?')) return;
                try {
                  await fetch('/api/live-class', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      meeting_id: liveClass.meeting_id, 
                      is_active: 0 
                    })
                  });
                  const res = await fetch('/api/live-class');
                  const data = await res.json();
                  setLiveClass(data);
                } catch (err) {
                  console.error("Failed to end class:", err);
                  alert("Failed to end class. Please try again.");
                }
              }}
              className="w-full bg-red-500/20 text-red-500 py-2 rounded-xl text-xs font-bold border border-red-500/30 hover:bg-red-500/30 transition-colors"
            >
              End Class for All
            </button>
          )}
        </div>
      ) : user.role === 'admin' && (
        <div className="space-y-3">
          {!showStudentSelector ? (
            <button 
              onClick={() => setShowStudentSelector(true)}
              className="w-full glass p-4 rounded-2xl flex items-center justify-center gap-2 text-brand-accent font-bold border-dashed border-brand-accent/50"
            >
              <Video size={20} /> Start Live Class
            </button>
          ) : (
            <div className="glass p-4 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">Select Students</h4>
                <button onClick={() => setShowStudentSelector(false)} className="text-xs text-slate-400">Cancel</button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 no-scrollbar">
                {students.map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedStudents([...selectedStudents, s.id]);
                        else setSelectedStudents(selectedStudents.filter(id => id !== s.id));
                      }}
                      className="accent-brand-accent"
                    />
                    <span className="text-sm">{s.name}</span>
                  </label>
                ))}
              </div>
              <button 
                onClick={async () => {
                  if (selectedStudents.length === 0) {
                    alert('Please select at least one student.');
                    return;
                  }
                  const mid = `AdiJEE_Live_${Math.random().toString(36).substring(7)}`;
                  await fetch('/api/live-class', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      meeting_id: mid, 
                      is_active: 1,
                      invited_students: selectedStudents
                    })
                  });
                  setActiveMeetingId(mid);
                  fetch('/api/live-class').then(res => res.json()).then(setLiveClass);
                  setShowStudentSelector(false);
                  setSelectedStudents([]);
                }}
                className="w-full bg-brand-accent text-brand-primary py-3 rounded-xl font-bold"
              >
                Start Class & Notify
              </button>
            </div>
          )}
        </div>
      )}


{/* Announcements Section Fixed */}
      <div className="glass p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Bell size={18} className="text-brand-highlight" /> Announcements
          </h3>
          {user.role === 'admin' && (
            <button 
              onClick={() => {
                const msg = prompt('Enter announcement:');
                if (msg) {
                  fetch('/api/announcements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: msg }) // Fixed: changed 'content' to 'text'
                  });
                  // Refresh auto-polling se apne aap ho jayega
                }
              }}
              className="text-xs text-brand-accent"
            >
              + New
            </button>
          )}
        </div>
        <div className="space-y-3">
          {announcements.slice(0, 5).map(a => (
            <div key={a.id} className="relative group bg-white/5 p-3 rounded-xl border-l-2 border-brand-highlight">
              <div className="pr-8">
                <p className="text-sm">{a.text || a.content}</p>
                <p className="text-[10px] text-slate-500 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>

              {/* Delete Button - Only for Admin */}
              {user.role === 'admin' && (
                <button
                  onClick={async () => {
                    if (confirm('Delete this announcement?')) {
                      const res = await fetch(`/api/announcements/${a.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        setAnnouncements(prev => prev.filter(item => item.id !== a.id));
                      }
                    }
                  }}
                  className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-2">No announcements yet.</p>
          )}
        </div>
      </div>


      {/* Quick Access */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => setActiveTab('content')}
          className="glass p-4 rounded-2xl flex flex-col items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <div className="w-10 h-10 bg-brand-accent/20 rounded-xl flex items-center justify-center text-brand-accent">
            <BookOpen size={20} />
          </div>
          <span className="text-xs font-bold">Materials</span>
        </div>
        <div 
          onClick={() => setActiveTab('bot')}
          className="glass p-4 rounded-2xl flex flex-col items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <div className="w-10 h-10 bg-brand-secondary/20 rounded-xl flex items-center justify-center text-brand-secondary">
            <MessageSquare size={20} />
          </div>
          <span className="text-xs font-bold">Ask Bot</span>
        </div>
      </div>

{/* Banner Management (Admin Only) */}
{user.role === 'admin' && (
  <div className="glass p-4 rounded-2xl">
    {/* Hidden Input for Image Selection */}
    <input 
      type="file" 
      ref={bannerInputRef} 
      className="hidden" 
      accept="image/*"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingBanner(true);
        const formData = new FormData();
        
        formData.append('file', file);
        formData.append('upload_preset', 'adijee_payments'); 
        formData.append('cloud_name', 'do7jfmqqf');

        try {
          const res = await fetch("https://api.cloudinary.com/v1_1/do7jfmqqf/image/upload", {
            method: "POST",
            body: formData
          });
          
          const data = await res.json();
          
          if (data.secure_url) {
            const imageUrl = data.secure_url;
            
            const backendRes = await fetch('/api/banners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                title: ``,
                image_url: imageUrl 
              })
            });

            if (backendRes.ok) {
              const updated = await fetch('/api/banners').then(r => r.json());
              setBanners(updated);
            }
          } else {
            alert("Cloudinary Error: " + (data.error?.message || "Check preset settings"));
          }
        } catch (err) {
          console.error("Upload process error:", err);
          alert("Network error!");
        } finally {
          setIsUploadingBanner(false);
          if (bannerInputRef.current) bannerInputRef.current.value = ''; 
        }
      }}
    />

    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display font-bold flex items-center gap-2">
        <Video size={18} className="text-brand-accent" /> Banner Management ({banners.length}/5)
      </h3>
      {banners.length < 5 && (
        <button 
          onClick={() => bannerInputRef.current?.click()}
          disabled={isUploadingBanner}
          className={`text-xs font-bold ${isUploadingBanner ? 'text-gray-500' : 'text-brand-accent'}`}
        >
          {isUploadingBanner ? 'Uploading...' : '+ Add Banner'}
        </button>
      )}
    </div>

    <div className="space-y-2">
      {banners.map(b => (
        <div key={b.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl overflow-hidden">
          <div className="flex-1">
            <img 
              src={b.image_url} 
              className="w-full h-16 object-cover rounded-lg border border-white/10" 
              referrerPolicy="no-referrer" 
              alt="Banner Preview"
            />
          </div>
          <button 
            onClick={() => {
              if (confirm('Delete this banner?')) {
                fetch(`/api/banners/${b.id}`, { method: 'DELETE' })
                  .then(() => fetch('/api/banners').then(res => res.json()).then(setBanners));
              }
            }}
            className="ml-3 text-red-500 p-3 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      
      {banners.length === 0 && !isUploadingBanner && (
        <p className="text-[10px] text-center text-gray-500 py-2">No banners uploaded yet.</p>
      )}
    </div>
  </div>
)}

{/* User Management (Admin Only) */}
{user.role === 'admin' && (
  <div className="glass p-4 rounded-2xl">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display font-bold flex items-center gap-2">
        <Users size={18} className="text-brand-accent" /> Student Management
      </h3>
      <button 
        onClick={() => {
          const name = prompt('Student Name:');
          const phone = prompt('Phone Number:');
          const password = prompt('Password:');
          if (name && phone && password) {
            fetch('/api/users', { // Note: Make sure your server has a POST /api/users or change to /api/register
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, phone, password, role: 'student' })
            }).then(res => {
              if (res.ok) fetch('/api/students').then(r => r.json()).then(setStudents);
              else alert('Failed to add student');
            });
          }
        }}
        className="text-xs text-brand-accent"
      >
        + Add Student
      </button>
    </div>
    <div className="space-y-2">
      {students.map(s => (
        <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
          <div>
            <p className="text-sm font-bold">{s.name}</p>
            <p className="text-[10px] text-slate-500">{s.phone}</p>
          </div>
          <button 
            onClick={async () => {
              if (confirm(`Are you sure? This will remove ${s.name} from Firebase permanently.`)) {
                try {
                  // Fixed: Changing /api/users to /api/students to match your server.ts
                  // Student Management delete fix
const response = await fetch(`/api/students/${s.id}`, { method: 'DELETE' });
if (response.ok) {
    setStudents(prev => prev.filter(std => std.id !== s.id)); // Use 'prev' here too!
} else {
                    alert("Failed to delete from server");
                  }
                } catch (err) {
                  console.error("Delete error:", err);
                }
              }
            }}
            className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      {students.length === 0 && (
        <p className="text-center text-xs text-slate-500 py-4">No students found.</p>
      )}
    </div>
  </div>
)}
    </div>
  );

const renderContent = () => (
  <div className="space-y-6 pb-24">
    {/* Hidden Input for Cloudinary Upload */}
    <input 
      type="file" 
      ref={fileInputRef} 
      className="hidden" 
      accept="image/*"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const title = prompt('Enter Chapter/Title:');
        const subject = prompt('Enter Subject (Physics/Chemistry/Maths):', 'Physics');
        const type = prompt('Type (note/practice_sheet):', 'note');

        if (!title || !subject) {
          alert("All fields are required!");
          return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'adijee_payments'); 
        formData.append('cloud_name', 'do7jfmqqf');

        try {
          const cloudRes = await fetch("https://api.cloudinary.com/v1_1/do7jfmqqf/image/upload", {
            method: "POST",
            body: formData
          });
          const cloudData = await cloudRes.json();

          if (cloudData.secure_url) {
            await fetch('/api/content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                title, 
                type, 
                file_url: cloudData.secure_url,
                subject, 
                student_id: null 
              })
            });
            
            // Refresh content after upload
            const res = await fetch(`/api/content?userId=${user?.id}`);
            const data = await res.json();
            if (Array.isArray(data)) setContent(data);
          }
        } catch (err) {
          alert("Upload failed! Check your connection.");
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }}
    />

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {selectedSubject && (
          <button 
            onClick={() => setSelectedSubject(null)} 
            className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <h2 className="text-2xl font-display font-bold text-white">
          {selectedSubject ? selectedSubject : "Study Materials"}
        </h2>
      </div>
      
      {user.role === 'admin' && (
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-brand-accent text-brand-primary p-2 rounded-xl shadow-lg shadow-brand-accent/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      )}
    </div>

    {!selectedSubject ? (
      /* --- FOLDER VIEW --- */
      <div className="grid grid-cols-2 gap-4">
        {['Physics', 'Chemistry', 'Maths'].map((sub) => (
          <div 
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className="glass p-6 rounded-[2rem] flex flex-col items-center gap-3 border border-white/5 hover:border-brand-accent/40 transition-all cursor-pointer group active:scale-95"
          >
            <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-brand-primary transition-all duration-500 shadow-inner">
              <BookOpen size={32} />
            </div>
            <span className="font-bold text-sm tracking-tight">{sub}</span>
            <div className="px-3 py-1 bg-white/5 rounded-full">
               <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                {content.filter(c => c.subject === sub).length} Items
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      /* --- FILE VIEW --- */
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {['note', 'practice_sheet'].map(type => (
          <div key={type} className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
              <span className="w-1 h-1 bg-brand-accent rounded-full" />
              {type === 'note' ? 'Chapter Notes' : 'Practice Sheets'}
            </h3>
            <div className="grid gap-3">
              {content
                .filter(c => c.subject === selectedSubject && c.type === type)
                .map(c => (
                <div key={c.id} className="glass p-4 rounded-3xl flex items-center justify-between border border-white/5 group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-black/20 rounded-2xl overflow-hidden border border-white/10 shadow-inner relative">
                      <img 
                        src={c.file_url} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
                        alt="Preview" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <FileText size={16} className="text-white/20 group-hover:opacity-0 transition-opacity" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight mb-1 group-hover:text-brand-accent transition-colors">
                        {c.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Added {new Date(c.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open(c.file_url, '_blank')}
                    className="h-10 px-5 bg-brand-accent/10 text-brand-accent rounded-2xl text-xs font-bold hover:bg-brand-accent hover:text-brand-primary transition-all active:scale-90"
                  >
                    View
                  </button>
                </div>
              ))}
              {content.filter(c => c.subject === selectedSubject && c.type === type).length === 0 && (
                <div className="py-8 text-center glass rounded-3xl border-dashed border-white/5">
                  <p className="text-xs text-slate-600 italic">No {type.replace('_', ' ')}s yet.</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const renderAdminPayments = () => (
  <div className="space-y-6 pb-24">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-display font-bold text-white">Fee Verifications</h2>
      <span className="text-[10px] bg-brand-accent/20 text-brand-accent px-2 py-1 rounded-full font-bold">
        {allPayments.length} Total
      </span>
    </div>

    <div className="space-y-4">
      {allPayments.length === 0 ? (
        <div className="glass p-10 rounded-3xl border border-white/5 text-center">
          <p className="text-slate-500">No screenshots found in database.</p>
        </div>
      ) : (
        allPayments.map(p => {
          // CROSS-CHECK LOGIC: Agar p.student_name nahi hai, toh students array se dhoondo
          const studentProfile = students.find(s => s.id === p.student_id);
          const finalName = p.student_name || studentProfile?.name || 'Unknown Student';
          const finalPhone = p.student_phone || studentProfile?.phone || 'No Phone';

          return (
            <div key={p.id} className="glass p-4 rounded-3xl border border-white/10 space-y-4 bg-gradient-to-b from-white/5 to-transparent">
              
              {/* Header: Student Info & Delete */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-accent rounded-2xl flex items-center justify-center text-brand-primary font-black shadow-lg shadow-brand-accent/20">
                    {finalName[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight leading-none mb-1">
                      {finalName}
                    </h4>
                    <p className="text-[11px] text-brand-accent font-medium">
                      {finalPhone}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    if(!p.id) return alert("Error: Payment ID missing!");
                    if(confirm(`Delete record for ${finalName}?`)) {
                      try {
                        const res = await fetch(`/api/payments/${p.id}`, { method: 'DELETE' });
                        const data = await res.json();
                        if(data.success) {
                          setAllPayments(prev => prev.filter(item => item.id !== p.id));
                        } else {
                          alert("Error: " + (data.error || "Could not delete"));
                        }
                      } catch (err) {
                        alert("Network error: Server not responding");
                      }
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Screenshot Preview */}
              <div 
                className="relative group cursor-pointer overflow-hidden rounded-2xl border border-white/10"
                onClick={() => window.open(p.screenshot_url, '_blank')}
              >
                <img 
                  src={p.screenshot_url} 
                  alt="Payment" 
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white bg-white/20 backdrop-blur-md px-3 py-2 rounded-full border border-white/20">
                    Tap to Full View
                  </span>
                </div>
              </div>

              {/* Footer: Date & Amount */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Upload Date</span>
                  <span className="text-xs text-white font-medium">
                    {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Fees Paid</span>
                  <span className="text-lg font-black text-emerald-400">₹{p.amount || '500'}</span>
                </div>
              </div>

            </div>
          );
        })
      )}
    </div>
  </div>
);

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {activeMeetingId && (
        <VideoCall 
          meetingId={activeMeetingId}
          userName={user.name}
          isTrainer={user.role === 'admin'}
          userId={user.id}
          onLeave={() => setActiveMeetingId(null)}
        />
      )}
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeTab !== 'dashboard' && (
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-display font-black text-white">AdiJEE</h1>
            <p className="text-[10px] text-brand-accent uppercase tracking-[0.2em]">Owned by an #IITian!!!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold">{user.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-white">
            <LogOut size={18} />
          </button>
        </div>
      </header>

 {/* Main Content Area */}
      <main className="flex-1 px-6 overflow-y-auto no-scrollbar relative">
        {/* Floating Live Class Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="fixed top-6 left-6 right-6 z-50 glass p-4 rounded-2xl neon-border flex items-center justify-between gap-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-secondary/20 rounded-xl flex items-center justify-center text-brand-secondary">
                  <Video size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Live Class Started!</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{notification.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setActiveMeetingId(notification.meeting_id);
                    setNotification(null);
                  }}
                  className="bg-brand-accent text-brand-primary px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Join
                </button>
                <button 
                  onClick={() => setNotification(null)}
                  className="text-slate-400 p-2 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content Switching */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'content' && renderContent()}
            {activeTab === 'bot' && <DoubtBot />}
            {activeTab === 'payments' && (
              user.role === 'admin' 
                ? renderAdminPayments() 
                : <PaymentSection user={user} /> 
            )}
          </motion.div>
        </AnimatePresence>
      </main>

     {/* Bottom Navigation - Fixed and Floating */}
      <div className="fixed bottom-8 left-0 right-0 z-50 px-6 pointer-events-none">
        <nav className="max-w-md mx-auto w-full glass rounded-3xl p-2 flex items-center justify-around neon-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === 'content'} 
            onClick={() => setActiveTab('content')} 
            icon={<BookOpen size={20} />} 
            label="Study" 
          />
          <NavButton 
            active={activeTab === 'bot'} 
            onClick={() => setActiveTab('bot')} 
            icon={<MessageSquare size={20} />} 
            label="Doubt" 
          />
          <NavButton 
            active={activeTab === 'payments'} 
            onClick={() => setActiveTab('payments')} 
            icon={<CreditCard size={20} />} 
            label={user.role === 'admin' ? "Verify" : "Fees"} 
          />
        </nav>
      </div>
    </div>
  );
}

// NavButton Component - Isko bhi thoda refine kiya hai
function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
        active 
          ? 'text-brand-accent bg-brand-accent/10 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <div className={`${active ? 'animate-pulse-slow' : ''}`}>
        {icon}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>
        {label}
      </span>
    </button>
  );
}
