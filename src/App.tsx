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

  // Login Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
    fetch('/api/banners').then(res => res.json()).then(setBanners);
    fetch('/api/announcements').then(res => res.json()).then(setAnnouncements);
    fetch(`/api/content/${user.id}`).then(res => res.json()).then(setContent);
    fetch('/api/live-class').then(res => res.json()).then(setLiveClass);
    
    if (user.role === 'admin') {
      fetch('/api/students').then(res => res.json()).then(setStudents);
      fetch('/api/payments').then(res => res.json()).then(setAllPayments);
    }
  }, [user]);

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

      {/* Announcements */}
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
                    body: JSON.stringify({ content: msg })
                  }).then(() => fetch('/api/announcements').then(res => res.json()).then(setAnnouncements));
                }
              }}
              className="text-xs text-brand-accent"
            >
              + New
            </button>
          )}
        </div>
        <div className="space-y-3">
          {announcements.slice(0, 3).map(a => (
            <div key={a.id} className="bg-white/5 p-3 rounded-xl border-l-2 border-brand-highlight">
              <p className="text-sm">{a.content}</p>
              <p className="text-[10px] text-slate-500 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
            </div>
          ))}
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Video size={18} className="text-brand-accent" /> Banner Management ({banners.length}/5)
            </h3>
            {banners.length < 5 && (
              <button 
                onClick={() => {
                  const title = prompt('Banner Title:');
                  const url = prompt('Image URL:');
                  if (title && url) {
                    fetch('/api/banners', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title, image_url: url })
                    }).then(() => fetch('/api/banners').then(res => res.json()).then(setBanners));
                  }
                }}
                className="text-xs text-brand-accent"
              >
                + Add Banner
              </button>
            )}
          </div>
          <div className="space-y-2">
            {banners.map(b => (
              <div key={b.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <img src={b.image_url} className="w-12 h-8 object-cover rounded" referrerPolicy="no-referrer" />
                  <span className="text-xs font-bold truncate max-w-[150px]">{b.title}</span>
                </div>
                <button 
                  onClick={() => {
                    if (confirm('Delete this banner?')) {
                      fetch(`/api/banners/${b.id}`, { method: 'DELETE' })
                        .then(() => fetch('/api/banners').then(res => res.json()).then(setBanners));
                    }
                  }}
                  className="text-red-500 p-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
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
                  const response = await fetch(`/api/students/${s.id}`, { 
                    method: 'DELETE' 
                  });
                  
                  if (response.ok) {
                    // Update local state so it disappears instantly
                    setStudents(students.filter(student => student.id !== s.id));
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Study Materials</h2>
        {user.role === 'admin' && (
          <button 
            onClick={() => {
              const title = prompt('Title:');
              const type = prompt('Type (note/practice_sheet):') as any;
              const sid = prompt('Student ID (leave blank for all):');
              if (title && type) {
                fetch('/api/content', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    title, 
                    type, 
                    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    student_id: sid ? parseInt(sid) : null
                  })
                }).then(() => fetch(`/api/content/${user.id}`).then(res => res.json()).then(setContent));
              }
            }}
            className="bg-brand-accent text-brand-primary p-2 rounded-xl"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {['note', 'practice_sheet'].map(type => (
          <div key={type} className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              {type === 'note' ? 'Chapter Notes' : 'Practice Sheets'}
            </h3>
            <div className="grid gap-3">
              {content.filter(c => c.type === type).map(c => (
                <div key={c.id} className="glass p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{c.title}</p>
                      <p className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open(c.file_url, '_blank')}
                    className="text-brand-accent text-xs font-bold"
                  >
                    View
                  </button>
                </div>
              ))}
              {content.filter(c => c.type === type).length === 0 && (
                <p className="text-xs text-slate-500 italic">No items available.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdminPayments = () => (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-display font-bold">Payment Monitoring</h2>
      <div className="space-y-4">
        {allPayments.map(p => (
          <div key={p.id} className="glass p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{p.student_name}</p>
                <p className="text-xs text-slate-400">₹{p.amount} • {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                p.status === 'approved' ? 'bg-brand-accent/20 text-brand-accent' : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {p.status}
              </div>
            </div>
            
            <img 
              src={p.screenshot_url} 
              alt="Screenshot" 
              className="w-full h-40 object-cover rounded-xl cursor-pointer"
              onClick={() => window.open(p.screenshot_url, '_blank')}
              referrerPolicy="no-referrer"
            />

            {p.status === 'pending' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    fetch(`/api/payments/${p.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'approved' })
                    }).then(() => fetch('/api/payments').then(res => res.json()).then(setAllPayments));
                  }}
                  className="flex-1 bg-brand-accent text-brand-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Check size={14} /> Approve
                </button>
                <button 
                  className="flex-1 bg-red-500/20 text-red-500 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
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
            <p className="text-[10px] text-brand-accent uppercase tracking-[0.2em]">Zenith Edition</p>
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

      {/* Main Content */}
      <main className="flex-1 px-6 overflow-y-auto no-scrollbar">
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-6 left-6 right-6 z-50 glass p-4 rounded-2xl neon-border flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-secondary/20 rounded-xl flex items-center justify-center text-brand-secondary">
                  <Video size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Live Class Started!</p>
                  <p className="text-[10px] text-slate-400">{notification.message}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setActiveMeetingId(notification.meeting_id);
                    setNotification(null);
                  }}
                  className="bg-brand-accent text-brand-primary px-3 py-2 rounded-xl text-xs font-bold"
                >
                  Join
                </button>
                <button 
                  onClick={() => setNotification(null)}
                  className="text-slate-400 p-2"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'content' && renderContent()}
            {activeTab === 'bot' && <DoubtBot />}
            {activeTab === 'payments' && (user.role === 'admin' ? renderAdminPayments() : <PaymentSection studentId={user.id} />)}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 max-w-[calc(448px-3rem)] mx-auto glass rounded-2xl p-2 flex items-center justify-around neon-border">
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
          label="Fees" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
        active ? 'text-brand-accent bg-brand-accent/10' : 'text-slate-400 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
