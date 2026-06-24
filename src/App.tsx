import { useState, useEffect } from 'react';
import { TrendingUp, LogOut, FileText, Bell, MessageSquare } from 'lucide-react';

// Import Pages
import Login from './page/Login';
import Dashboard from './page/Dashboard';
import WorksBoard from './page/WorksBoard';
import Notices from './page/Notices';
import Chat from './page/Chat';
import TaskDetailModal from './page/TaskDetailModal';
import CreateTaskModal from './page/CreateTaskModal';
import Profile from './page/Profile';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://l-backend-production-ff32.up.railway.app/api';

interface User {
  id: string;
  _id?: string;
  username: string;
  name: string;
  role: string;
  whatsapp?: string;
  imageUrl?: string;
}

interface Task {
  _id: string;
  title: string;
  taskType: 'regular' | 'reminder-sir' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  status: 'pending' | 'completed';
  assignedTo?: {
    _id: string;
    name: string;
    username: string;
  };
  completedBy?: {
    name: string;
  };
  completedAt?: string;
  description?: string;
  remarks?: string;
  nextFollowup?: string;
  comments: Array<{
    authorName: string;
    authorRole: string;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('staff2_token'));
  const [user, setUser] = useState<User | null>(null);

  // Router State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'reminders' | 'chat' | 'profile'>('dashboard');

  // Shared Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Selected Task for Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Create Task Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' | 'warning' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch current user if token exists
  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  useEffect(() => {
    if (user && user.role === 'staff2') {
      fetchTasks();
      fetchReminders();
      fetchUnreadCount();
      
      // Poll unread chat counts
      const chatInterval = setInterval(() => {
        fetchUnreadCount();
      }, 5000);
      return () => clearInterval(chatInterval);
    }
  }, [user]);

  // Fetch tasks on activeTab change
  useEffect(() => {
    if (user && user.role === 'staff2' && activeTab === 'tasks') {
      fetchTasks();
    }
  }, [activeTab, user]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user.role !== 'staff2') {
          showToast('Access denied: Office Staff 2 required.', 'danger');
          handleLogout();
        } else {
          setUser(data.user);
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      handleLogout();
    }
  };

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem('staff2_token', newToken);
    setToken(newToken);
    setUser(newUser);
    showToast('Logged in successfully!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('staff2_token');
    setToken(null);
    setUser(null);
    setActiveTab('dashboard');
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const staff2Tasks = data.filter((t: any) => t.assignedTo?._id === user?._id || t.assignedTo?.username === 'staff2' || !t.assignedTo);
        setTasks(staff2Tasks);
        
        // Update selected task in modal if open
        if (selectedTask) {
          const updated = staff2Tasks.find((t: Task) => t._id === selectedTask._id);
          if (updated) {
            setSelectedTask(updated);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await fetch(`${API_BASE}/reminders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/messages/unread/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        let count = 0;
        Object.values(data).forEach((val: any) => {
          count += val;
        });
        setUnreadCount(count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledgeReminder = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/reminders/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchReminders();
        showToast('Notice acknowledged successfully!', 'success');
      } else {
        showToast('Failed to acknowledge notice', 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render Page Content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            tasks={tasks}
            reminders={reminders}
            onNavigate={setActiveTab}
            onOpenTaskDetails={setSelectedTask}
            onAcknowledgeReminder={handleAcknowledgeReminder}
          />
        );
      case 'tasks':
        return (
          <WorksBoard 
            tasks={tasks}
            onOpenTaskDetails={setSelectedTask}
            onOpenCreateTask={() => setIsCreateModalOpen(true)}
          />
        );
      case 'reminders':
        return (
          <Notices 
            reminders={reminders}
            onAcknowledgeReminder={handleAcknowledgeReminder}
            apiBase={API_BASE}
            token={token!}
            showToast={showToast}
            onRefresh={fetchReminders}
          />
        );
      case 'chat':
        return (
          <Chat 
            token={token}
            user={user}
            apiBase={API_BASE}
            showToast={showToast}
            onUnreadCountChange={fetchUnreadCount}
          />
        );
      case 'profile':
        return (
          <Profile 
            token={token}
            user={user}
            apiBase={API_BASE}
            onProfileUpdate={setUser}
            showToast={showToast}
          />
        );
      default:
        return <div>Page Not Found</div>;
    }
  };

  if (!token) {
    return <Login apiBase={API_BASE} onLoginSuccess={handleLoginSuccess} />;
  }

  // Pending count for sidebar badges
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
  const pendingNoticesCount = reminders.filter(r => r.status === 'pending').length;

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Sidebar Layout */}
      <aside className="sidebar" style={{ borderRight: '1px solid rgba(124, 58, 237, 0.1)' }}>
        <div>
          <h2 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>LABOUR PRO</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Staff 2 Desk</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`nav-link btn-secondary ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <TrendingUp size={18} /> Desk Overview
          </button>
          <button 
            onClick={() => setActiveTab('tasks')} 
            className={`nav-link btn-secondary ${activeTab === 'tasks' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <FileText size={18} /> Works & Follow-ups
            {pendingTasksCount > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 'auto', padding: '2px 8px' }}>
                {pendingTasksCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('reminders')} 
            className={`nav-link btn-secondary ${activeTab === 'reminders' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <Bell size={18} /> MD Notices
            {pendingNoticesCount > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 'auto', padding: '2px 8px' }}>
                {pendingNoticesCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`nav-link btn-secondary ${activeTab === 'chat' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <MessageSquare size={18} /> Chat with Owner
            {unreadCount > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 'auto', padding: '2px 8px' }}>
                {unreadCount}
              </span>
            )}
          </button>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div 
            onClick={() => setActiveTab('profile')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '16px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'var(--transition-smooth)',
              border: activeTab === 'profile' ? '1px solid var(--accent-primary)' : '1px solid transparent',
              background: activeTab === 'profile' ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
            }}
          >
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.name} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'S2'}
              </div>
            )}
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Office Staff 2</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', padding: '10px' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Task Details Modal Overlay */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          token={token}
          user={user}
          apiBase={API_BASE}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={fetchTasks}
          showToast={showToast}
        />
      )}

      {/* Create Task Modal Overlay */}
      {isCreateModalOpen && (
        <CreateTaskModal 
          token={token}
          user={user}
          apiBase={API_BASE}
          onClose={() => setIsCreateModalOpen(false)}
          onTaskCreated={() => {
            fetchTasks();
            setIsCreateModalOpen(false);
          }}
          showToast={showToast}
        />
      )}

      {/* Toast Notification overlay */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <span>✅</span>}
            {toast.type === 'danger' && <span>❌</span>}
            {toast.type === 'warning' && <span>⚠️</span>}
            {toast.type === 'info' && <span>ℹ️</span>}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
