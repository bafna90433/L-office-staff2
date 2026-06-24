import { CheckCircle, Trash2, Plus, Pencil, X, Save } from 'lucide-react';
import { useState } from 'react';
import '../styles/Notices.css';

interface NoticesProps {
  reminders: any[];
  onAcknowledgeReminder: (id: string, targetDate?: string) => void;
  apiBase: string;
  token: string;
  showToast: (msg: string, type: 'success' | 'danger' | 'info') => void;
  onRefresh: () => void;
}

export default function Notices({ reminders, onAcknowledgeReminder, apiBase, token, showToast, onRefresh }: NoticesProps) {
  const [newMessage, setNewMessage] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [noticeDateSelections, setNoticeDateSelections] = useState<Record<string, string>>({});
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [editingMessageValue, setEditingMessageValue] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  const ownerNotices = reminders.filter(r => r.type !== 'self');
  const selfReminders = reminders.filter(r => r.type === 'self');

  const handleAddSelfReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage || !newTargetDate) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/reminders/self`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: newMessage, targetDate: newTargetDate })
      });
      if (res.ok) {
        setNewMessage('');
        setNewTargetDate('');
        onRefresh();
        showToast('Self reminder added!', 'success');
      } else {
        const errData = await res.json();
        showToast(errData.message || 'Failed to add reminder', 'danger');
      }
    } catch (err) {
      showToast('Error connecting to server', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSelfReminder = async (id: string) => {
    if (!window.confirm('Delete this personal reminder?')) return;
    try {
      const res = await fetch(`${apiBase}/reminders/self/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onRefresh();
        showToast('Reminder deleted', 'success');
      } else {
        showToast('Failed to delete', 'danger');
      }
    } catch (err) {
      showToast('Error connecting to server', 'danger');
    }
  };

  const handleStartEditPersonal = (rem: any) => {
    setEditingNoticeId(rem._id);
    setEditingDateValue(formatForDateTimeInput(rem.targetDate));
    setEditingMessageValue(rem.message);
  };

  const handleCancelEdit = () => {
    setEditingNoticeId(null);
    setEditingDateValue('');
    setEditingMessageValue('');
  };

  const handleSavePersonalReminder = async (remId: string) => {
    if (!editingMessageValue.trim()) {
      showToast('Reminder message cannot be empty', 'danger');
      return;
    }
    if (!editingDateValue) {
      showToast('Please select a valid date and time', 'danger');
      return;
    }
    setSavingEdit(true);
    try {
      const localDate = new Date(editingDateValue);
      const isoDate = localDate.toISOString();

      const res = await fetch(`${apiBase}/reminders/self/${remId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: editingMessageValue, targetDate: isoDate })
      });

      if (res.ok) {
        setEditingNoticeId(null);
        setEditingDateValue('');
        setEditingMessageValue('');
        onRefresh();
        showToast('Personal reminder updated!', 'success');
      } else {
        const errData = await res.json();
        showToast(errData.message || 'Failed to update personal reminder', 'danger');
      }
    } catch (err) {
      showToast('Error connecting to server', 'danger');
    } finally {
      setSavingEdit(false);
    }
  };

  const formatForDateTimeInput = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const renderNoticeCard = (rem: any, isSelf: boolean) => {
    const timeDiff = new Date(rem.targetDate).getTime() - Date.now();
    const isUrgent = rem.status === 'pending' && timeDiff <= 10 * 60 * 1000 && timeDiff > -1000 * 60 * 60 * 24;
    const noticeDateValue = noticeDateSelections[rem._id] ?? formatForDateTimeInput(rem.targetDate);
    const isEditingThis = editingNoticeId === rem._id;

    return (
      <div key={rem._id} className={`animate-fade-in notice-card ${isUrgent ? 'urgent-pulse' : ''}`} style={isUrgent ? { border: '2px solid var(--color-danger)' } : {}}>
        <div style={{ flexGrow: 1 }}>
          <div className="notice-meta">
            <span className={`badge ${isUrgent ? 'badge-danger' : 'badge-info'}`} style={{ fontWeight: 700 }}>
              {isUrgent && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#fff', marginRight: '6px', animation: 'blinkDot 1s infinite' }} />}
              Target Date: {new Date(rem.targetDate).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
            {!isSelf && (
              <span className={`badge ${rem.status === 'acknowledged' ? 'badge-success' : 'badge-warning'}`}>
                {rem.status}
              </span>
            )}
            {isSelf && (
              <span className="badge" style={{ background: 'var(--color-primary)', color: 'white' }}>Personal</span>
            )}
          </div>
          
          {isSelf && isEditingThis ? (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '2px', textAlign: 'left' }}>Edit Message</label>
              <input
                type="text"
                className="form-input"
                value={editingMessageValue}
                onChange={e => setEditingMessageValue(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
                placeholder="Remind me to..."
              />
            </div>
          ) : (
            <p className="notice-card-text">{rem.message}</p>
          )}

          {!isSelf && (
            <div className="notice-card-footer">
              Sent by <span style={{ fontWeight: 600 }}>{rem.createdBy?.name || 'Owner'}</span> on {new Date(rem.createdAt).toLocaleDateString('en-GB')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', minWidth: (isSelf && !isEditingThis) ? 'auto' : '220px' }}>
          {isSelf ? (
            isEditingThis ? (
              <>
                <div style={{ width: '100%' }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '6px', textAlign: 'left' }}>
                    ✏️ Edit Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={editingDateValue}
                    onChange={e => setEditingDateValue(e.target.value)}
                    style={{ width: '100%', minWidth: '200px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSavePersonalReminder(rem._id)}
                    disabled={savingEdit || !editingDateValue || !editingMessageValue.trim()}
                    className="btn btn-success notice-action-btn"
                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <Save size={14} /> {savingEdit ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="btn btn-secondary notice-action-btn"
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--border-color)' }}
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleStartEditPersonal(rem)}
                  className="btn btn-secondary notice-action-btn"
                  style={{ padding: '8px', background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
                  title="Edit Reminder"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteSelfReminder(rem._id)}
                  className="btn btn-secondary notice-action-btn"
                  style={{ padding: '8px', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                  title="Delete Reminder"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          ) : rem.status === 'pending' ? (
            <>
              <div style={{ width: '100%' }}>
                <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '6px', textAlign: 'left' }}>Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={noticeDateValue}
                  onChange={e => setNoticeDateSelections(prev => ({ ...prev, [rem._id]: e.target.value }))}
                  style={{ width: '100%', minWidth: '200px' }}
                />
              </div>
              <button 
                onClick={() => {
                  const val = noticeDateSelections[rem._id] || formatForDateTimeInput(rem.targetDate);
                  const localDate = new Date(val);
                  onAcknowledgeReminder(rem._id, localDate.toISOString());
                }} 
                className="btn btn-success notice-action-btn" 
                style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <CheckCircle size={16} /> OK, Got it
              </button>
            </>
          ) : (
            <div className="notice-acknowledged-info">
              <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={16} /> Acknowledged
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                by {rem.acknowledgedBy?.name || 'You'} at {new Date(rem.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

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
      <div className="notices-header">
        <h1 className="notices-title">Notices & Reminders</h1>
        <p className="notices-subtitle">Acknowledge MD notices and manage your own personal reminders.</p>
      </div>

      <div className="glass-panel notices-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Add Personal Reminder</h3>
        <form onSubmit={handleAddSelfReminder} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label className="form-label">Reminder Message</label>
            <input type="text" className="form-input" value={newMessage} onChange={e => setNewMessage(e.target.value)} required placeholder="Remind me to..." />
          </div>
          <div style={{ width: '220px' }}>
            <label className="form-label">Target Date & Time</label>
            <input type="datetime-local" className="form-input" value={newTargetDate} onChange={e => setNewTargetDate(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Plus size={18} /> {submitting ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        <div className="glass-panel notices-panel">
          <h3 style={{ fontSize: '1.25rem' }}>MD Notices</h3>
          <div className="notices-list">
            {ownerNotices.length > 0 ? ownerNotices.map(rem => renderNoticeCard(rem, false)) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No notices from the MD.</div>
            )}
          </div>
        </div>

        <div className="glass-panel notices-panel">
          <h3 style={{ fontSize: '1.25rem' }}>My Personal Reminders</h3>
          <div className="notices-list">
            {selfReminders.length > 0 ? selfReminders.map(rem => renderNoticeCard(rem, true)) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>You don't have any personal reminders.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
