import { 
  CheckCircle, 
  AlertCircle, 
  Bell, 
  FileText, 
  ChevronRight
} from 'lucide-react';
import '../styles/Dashboard.css';

interface Task {
  _id: string;
  title: string;
  taskType: 'regular' | 'reminder-sir' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  status: 'pending' | 'completed';
  completedBy?: {
    name: string;
  };
  completedAt?: string;
  description?: string;
  remarks?: string;
  nextFollowup?: string;
  comments: any[];
  createdAt: string;
}

interface DashboardProps {
  tasks: Task[];
  reminders: any[];
  onNavigate: (tab: 'dashboard' | 'tasks' | 'reminders' | 'chat') => void;
  onOpenTaskDetails: (task: Task) => void;
  onAcknowledgeReminder: (id: string) => void;
}

export default function Dashboard({ 
  tasks, 
  reminders,
  onNavigate, 
  onOpenTaskDetails, 
  onAcknowledgeReminder 
}: DashboardProps) {
  // Counts
  const totalTasksCount = tasks.length;
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const sirRemindersCount = tasks.filter(t => t.taskType === 'reminder-sir' && t.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <style>{`
        @keyframes urgentPulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
          70% { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        .urgent-pulse {
          animation: urgentPulse 2s infinite;
        }
        @keyframes blinkDot {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Staff 2 Dashboard</h1>
        <p className="dashboard-subtitle">Track daily works, follow-ups, and reminders assigned by MD/Owner.</p>
      </div>

      {/* Glowing Notice Banner */}
      {reminders.filter(r => r.status === 'pending').map(rem => {
        const timeDiff = new Date(rem.targetDate).getTime() - Date.now();
        const isUrgent = timeDiff <= 10 * 60 * 1000;
        
        return (
          <div 
            key={rem._id} 
            className={`glass-panel animate-fade-in notice-banner ${isUrgent ? 'urgent-pulse' : ''}`}
            style={{ 
              border: isUrgent ? '2px solid var(--color-danger)' : undefined
            }}
          >
            <div>
              <div className="notice-badge">
                <Bell size={16} /> Important Notice from MD
              </div>
              <p className="notice-text">{rem.message}</p>
              <p className="notice-date" style={{ fontSize: '0.8rem', color: isUrgent ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: isUrgent ? 600 : 'normal' }}>
                {isUrgent && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)', marginRight: '6px', animation: 'blinkDot 1s infinite' }} />}
                Target Date: {new Date(rem.targetDate).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', hour12: true }).toUpperCase()}
              </p>
            </div>
            <button onClick={() => onAcknowledgeReminder(rem._id)} className="btn btn-success" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              OK, Got it
            </button>
          </div>
        );
      })}

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Total Assigned Works</span>
            <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="stat-value">{totalTasksCount}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Overall imported from excel</p>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div className="stat-header">
            <span>Pending Follow-ups</span>
            <AlertCircle size={20} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{pendingTasksCount}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Awaiting action / followup</p>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div className="stat-header">
            <span>Completed Tasks</span>
            <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{completedTasksCount}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Finished or closed jobs</p>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div className="stat-header">
            <span>Reminders for Sir</span>
            <Bell size={20} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{sirRemindersCount}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Urgent pending reminders</p>
        </div>
      </div>

      {/* Quick Overview Board */}
      <div className="dashboard-board-split">
        {/* Recent Tasks */}
        <div className="glass-panel recent-tasks-panel">
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Recent Active Follow-ups</h3>
            <button 
              onClick={() => onNavigate('tasks')} 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              View All Board
            </button>
          </div>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Work Heading</th>
                  <th>Type</th>
                  <th>Next Followup</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.filter(t => t.status === 'pending').slice(0, 5).map((task) => (
                  <tr key={task._id}>
                    <td style={{ fontWeight: 600 }}>{task.title}</td>
                    <td>
                      <span className={`badge ${
                        task.taskType === 'reminder-sir' ? 'badge-warning' :
                        task.taskType === 'custom' ? 'badge-info' : 'badge-success'
                      }`}>
                        {task.taskType === 'reminder-sir' ? 'sir reminder' : task.taskType}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {task.nextFollowup || 'Not scheduled'}
                    </td>
                    <td>
                      <button 
                        onClick={() => onOpenTaskDetails(task)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}
                      >
                        Update <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {tasks.filter(t => t.status === 'pending').length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                      No active pending tasks. Excellent job!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lulu Status */}
        <div className="glass-panel lulu-stations-panel">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>LULU Stations Status</h3>
          <div className="lulu-list">
            {tasks.filter(t => t.title.toLowerCase().startsWith('lulu station')).map(task => (
              <div 
                key={task._id} 
                onClick={() => onOpenTaskDetails(task)} 
                className="lulu-item"
              >
                <div className="flex-between">
                  <span className="lulu-station-name">
                    {task.title.replace('LULU Station Followup - ', '')}
                  </span>
                  <span className={`badge ${task.status === 'completed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                    {task.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {task.remarks || 'No remarks'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
