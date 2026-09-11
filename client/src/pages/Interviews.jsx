import { useState, useEffect } from 'react';
import { authFetch } from '../utils/auth';

const initialFormState = {
  application_id: '',
  round: '',
  date: '',
  time: '',
  type: '',
  meeting_link: '',
  result: '',
  notes: '',
};

// Format date string for HTML <input type="date" /> (YYYY-MM-DD)
const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// Format time string for HTML <input type="time" /> (HH:mm)
const formatTimeForInput = (timeStr) => {
  if (!timeStr) return '';
  const match = timeStr.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : timeStr;
};

// Format date for readable display (e.g. "Sep 15, 2026")
const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return '';
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

// Format time for readable display (e.g. "2:00 PM")
const formatTimeForDisplay = (timeStr) => {
  if (!timeStr) return '';
  try {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  } catch {
    return timeStr;
  }
};

// Dynamic badge style matching result value
const getResultBadgeClass = (result) => {
  if (!result) return 'status-default';
  const val = result.toLowerCase().trim();
  if (val === 'scheduled') return 'status-scheduled';
  if (val === 'pending') return 'status-pending';
  if (val === 'selected' || val === 'passed' || val === 'offer') return 'status-selected';
  if (val === 'rejected') return 'status-rejected';
  if (val === 'completed') return 'status-completed';
  return 'status-default';
};

function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const fetchInterviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/interviews');
      if (!response.ok) {
        throw new Error(`Failed to fetch interviews (Status ${response.status})`);
      }
      const data = await response.json();
      setInterviews(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsList = async () => {
    try {
      const response = await authFetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Failed to load applications for dropdown:', err);
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchApplicationsList();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setFormError(null);
    setFormSuccess(null);
    setShowForm(true);
  };

  const handleStartEdit = (interview) => {
    setEditingId(interview.id);
    setFormData({
      application_id: String(interview.application_id || ''),
      round: interview.round || '',
      date: formatDateForInput(interview.date),
      time: formatTimeForInput(interview.time),
      type: interview.type || '',
      meeting_link: interview.meeting_link || '',
      result: interview.result || '',
      notes: interview.notes || '',
    });
    setFormError(null);
    setFormSuccess(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setFormError(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.application_id) {
      setFormError('Please select an application.');
      return;
    }

    setSubmitting(true);
    const isEditing = editingId !== null;
    const endpoint = isEditing
      ? `/api/interviews/${editingId}`
      : '/api/interviews';
    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
      application_id: Number(formData.application_id),
      round: formData.round.trim() || null,
      date: formData.date || null,
      time: formData.time ? `${formData.time}:00`.slice(0, 8) : null,
      type: formData.type.trim() || null,
      meeting_link: formData.meeting_link.trim() || null,
      result: formData.result.trim() || null,
      notes: formData.notes.trim() || null,
    };

    try {
      const response = await authFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'schedule'} interview (Status ${response.status})`);
      }

      setFormSuccess(
        isEditing
          ? 'Interview updated successfully!'
          : 'Interview scheduled successfully!'
      );
      setFormData(initialFormState);
      setEditingId(null);
      setShowForm(false);
      fetchInterviews();
    } catch (err) {
      setFormError(err.message || `Failed to ${isEditing ? 'update' : 'schedule'} interview`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, round, company) => {
    const interviewLabel = round ? `"${round}"` : 'this interview';
    const companyLabel = company ? ` at ${company}` : '';
    const confirmed = window.confirm(
      `Are you sure you want to delete ${interviewLabel}${companyLabel}?`
    );
    if (!confirmed) return;

    setDeletingId(id);
    setFormError(null);
    setFormSuccess(null);

    try {
      const response = await authFetch(`/api/interviews/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to delete interview (Status ${response.status})`);
      }

      setFormSuccess('Interview deleted successfully!');
      fetchInterviews();
    } catch (err) {
      setFormError(err.message || 'Failed to delete interview');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Interviews</h1>
        <p className="page-subtitle">Schedule, track, and prepare for upcoming interview rounds.</p>
      </header>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Interviews ({interviews.length})</h2>
          {!showForm && (
            <button
              type="button"
              className="btn-add-application"
              onClick={handleStartAdd}
            >
              + Add Interview
            </button>
          )}
        </div>

        {formSuccess && (
          <div className="alert alert-success">
            {formSuccess}
          </div>
        )}

        {formError && !showForm && (
          <div className="alert alert-error">
            Error: {formError}
          </div>
        )}

        {showForm && (
          <div className="form-wrapper">
            <div className="form-header">
              <h3 className="form-title">
                {editingId !== null ? 'Edit Interview' : 'Add Interview'}
              </h3>
              <span className="section-hint">* indicates required fields</span>
            </div>

            {formError && (
              <div className="alert alert-error">
                Error: {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="app-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="application_id">Application *</label>
                  <select
                    id="application_id"
                    name="application_id"
                    value={formData.application_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Application</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.company} — {app.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="round">Round</label>
                  <input
                    id="round"
                    type="text"
                    name="round"
                    value={formData.round}
                    onChange={handleChange}
                    placeholder="e.g. Technical Round 1, System Design, HR"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type">Type</label>
                  <input
                    id="type"
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    placeholder="e.g. Video Call, Phone, On-site"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time">Time</label>
                  <input
                    id="time"
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="result">Result</label>
                  <input
                    id="result"
                    type="text"
                    name="result"
                    value={formData.result}
                    onChange={handleChange}
                    placeholder="e.g. Scheduled, Pending, Selected, Rejected"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="meeting_link">Meeting Link</label>
                  <input
                    id="meeting_link"
                    type="url"
                    name="meeting_link"
                    value={formData.meeting_link}
                    onChange={handleChange}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Interviewer names, topics to prepare, questions asked, etc."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? (editingId !== null ? 'Saving Changes...' : 'Adding Interview...')
                    : (editingId !== null ? 'Save Changes' : 'Add Interview')}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && (
          <div className="state-message">
            Loading interviews...
          </div>
        )}

        {error && !loading && (
          <div className="state-message error-message">
            Error: {error}
          </div>
        )}

        {!loading && !error && interviews.length === 0 && (
          <div className="state-message empty-state">
            No interviews found. Click "+ Add Interview" above to track your interview rounds.
          </div>
        )}

        {!loading && !error && interviews.length > 0 && (
          <div className="applications-list-container">
            {interviews.map((interview) => (
              <div key={interview.id} className="application-row-card">
                <div className="row-top">
                  <div className="row-heading">
                    <h3 className="app-position">{interview.round || 'Interview'}</h3>
                    <div className="app-company">
                      {interview.company} — {interview.position}
                    </div>
                  </div>
                  <div className="row-actions">
                    {interview.result && (
                      <span className={`status-badge ${getResultBadgeClass(interview.result)}`}>
                        {interview.result}
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => handleStartEdit(interview)}
                      disabled={deletingId === interview.id}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDelete(interview.id, interview.round, interview.company)}
                      disabled={deletingId === interview.id}
                    >
                      {deletingId === interview.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="row-metadata">
                  {interview.date && (
                    <div className="meta-item">
                      <span className="meta-label">Date:</span>
                      <span className="meta-value">{formatDateForDisplay(interview.date)}</span>
                    </div>
                  )}

                  {interview.time && (
                    <div className="meta-item">
                      <span className="meta-label">Time:</span>
                      <span className="meta-value">{formatTimeForDisplay(interview.time)}</span>
                    </div>
                  )}

                  {interview.type && (
                    <div className="meta-item">
                      <span className="meta-label">Type:</span>
                      <span className="meta-value">{interview.type}</span>
                    </div>
                  )}

                  {interview.meeting_link && (
                    <div className="meta-item">
                      <span className="meta-label">Meeting:</span>
                      <a
                        href={interview.meeting_link.startsWith('http') ? interview.meeting_link : `https://${interview.meeting_link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="job-link"
                      >
                        Join Meeting ↗
                      </a>
                    </div>
                  )}
                </div>

                {interview.notes && (
                  <div className="row-notes">
                    <span className="notes-label">Notes:</span>
                    {interview.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default Interviews;
