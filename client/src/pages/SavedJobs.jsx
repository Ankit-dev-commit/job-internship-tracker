import { useState, useEffect } from 'react';
import { authFetch } from '../utils/auth';

const initialFormState = {
  company: '',
  position: '',
  job_type: '',
  location: '',
  salary: '',
  job_url: '',
  deadline: '',
  notes: '',
};

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

function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const fetchSavedJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/saved-jobs');
      if (!response.ok) {
        throw new Error(`Failed to fetch saved jobs (Status ${response.status})`);
      }
      const data = await response.json();
      setSavedJobs(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
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

  const handleStartEdit = (job) => {
    setEditingId(job.id);
    setFormData({
      company: job.company || '',
      position: job.position || '',
      job_type: job.job_type || '',
      location: job.location || '',
      salary: job.salary || '',
      job_url: job.job_url || '',
      deadline: formatDateForInput(job.deadline),
      notes: job.notes || '',
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
    setSubmitting(true);

    const isEditing = editingId !== null;
    const endpoint = isEditing
      ? `/api/saved-jobs/${editingId}`
      : '/api/saved-jobs';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await authFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} saved job (Status ${response.status})`);
      }

      setFormSuccess(
        isEditing
          ? 'Saved job updated successfully!'
          : 'Job saved successfully!'
      );
      setFormData(initialFormState);
      setEditingId(null);
      setShowForm(false);
      fetchSavedJobs();
    } catch (err) {
      setFormError(err.message || `Failed to ${isEditing ? 'update' : 'save'} job`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, company, position) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${position}" at ${company} from your saved jobs?`
    );
    if (!confirmed) return;

    setDeletingId(id);
    setFormError(null);
    setFormSuccess(null);

    try {
      const response = await authFetch(`/api/saved-jobs/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to delete saved job (Status ${response.status})`);
      }

      setFormSuccess('Saved job removed successfully!');
      fetchSavedJobs();
    } catch (err) {
      setFormError(err.message || 'Failed to delete saved job');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Saved Jobs</h1>
        <p className="page-subtitle">Bookmark and track jobs you intend to apply to.</p>
      </header>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Saved Jobs ({savedJobs.length})</h2>
          {!showForm && (
            <button
              type="button"
              className="btn-add-application"
              onClick={handleStartAdd}
            >
              + Add Saved Job
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
                {editingId !== null ? 'Edit Saved Job' : 'Add Saved Job'}
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
                <div className="form-group">
                  <label htmlFor="company">Company *</label>
                  <input
                    id="company"
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g. Amazon"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="position">Position *</label>
                  <input
                    id="position"
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="e.g. Cloud Support Associate Intern"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="job_type">Job Type</label>
                  <select
                    id="job_type"
                    name="job_type"
                    value={formData.job_type}
                    onChange={handleChange}
                  >
                    <option value="">Select Job Type (Optional)</option>
                    <option value="INTERNSHIP">INTERNSHIP</option>
                    <option value="FULL_TIME">FULL_TIME</option>
                    <option value="PART_TIME">PART_TIME</option>
                    <option value="CONTRACT">CONTRACT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Bangalore, IN (or Remote)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="salary">Salary / Stipend</label>
                  <input
                    id="salary"
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="e.g. ₹80,000/month or $120,000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="job_url">Job URL</label>
                  <input
                    id="job_url"
                    type="url"
                    name="job_url"
                    value={formData.job_url}
                    onChange={handleChange}
                    placeholder="https://example.com/job"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    id="deadline"
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
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
                    placeholder="Referral contact, key qualifications, resume keywords, etc."
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
                    ? (editingId !== null ? 'Saving Changes...' : 'Saving Job...')
                    : (editingId !== null ? 'Save Changes' : 'Save Job')}
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
            Loading saved jobs...
          </div>
        )}

        {error && !loading && (
          <div className="state-message error-message">
            Error: {error}
          </div>
        )}

        {!loading && !error && savedJobs.length === 0 && (
          <div className="state-message empty-state">
            No saved jobs found. Click "+ Add Saved Job" above to bookmark jobs you want to apply for.
          </div>
        )}

        {!loading && !error && savedJobs.length > 0 && (
          <div className="applications-list-container">
            {savedJobs.map((job) => (
              <div key={job.id} className="application-row-card">
                <div className="row-top">
                  <div className="row-heading">
                    <h3 className="app-position">{job.position}</h3>
                    <div className="app-company">{job.company}</div>
                  </div>
                  <div className="row-actions">
                    {job.job_type && (
                      <span className="job-type-badge">
                        {job.job_type}
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => handleStartEdit(job)}
                      disabled={deletingId === job.id}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDelete(job.id, job.company, job.position)}
                      disabled={deletingId === job.id}
                    >
                      {deletingId === job.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="row-metadata">
                  {job.job_type && (
                    <div className="meta-item">
                      <span className="meta-label">Job Type:</span>
                      <span className="meta-value">{job.job_type}</span>
                    </div>
                  )}

                  <div className="meta-item">
                    <span className="meta-label">Location:</span>
                    <span className="meta-value">{job.location || 'Not Specified'}</span>
                  </div>

                  {job.salary && (
                    <div className="meta-item">
                      <span className="meta-label">Salary:</span>
                      <span className="meta-value">{job.salary}</span>
                    </div>
                  )}

                  {job.deadline && (
                    <div className="meta-item">
                      <span className="meta-label">Deadline:</span>
                      <span className="meta-value">{new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  )}

                  {job.job_url && (
                    <div className="meta-item">
                      <span className="meta-label">Link:</span>
                      <a
                        href={job.job_url.startsWith('http') ? job.job_url : `https://${job.job_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="job-link"
                      >
                        View Job Posting ↗
                      </a>
                    </div>
                  )}
                </div>

                {job.notes && (
                  <div className="row-notes">
                    <span className="notes-label">Notes:</span>
                    {job.notes}
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

export default SavedJobs;
