import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { authFetch } from '../utils/auth';

const formatStatus = (status) => {
  if (!status) return '';
  const statusMap = {
    SAVED: 'Saved',
    APPLIED: 'Applied',
    ASSESSMENT: 'Assessment',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
    REJECTED: 'Rejected',
  };
  return statusMap[status] || status.charAt(0) + status.slice(1).toLowerCase();
};

const formatJobType = (jobType) => {
  if (!jobType) return 'Not Specified';
  const typeMap = {
    INTERNSHIP: 'Internship',
    FULL_TIME: 'Full-Time',
    PART_TIME: 'Part-Time',
    CONTRACT: 'Contract',
  };
  return typeMap[jobType] || jobType;
};

const initialFormState = {
  company: '',
  position: '',
  job_type: '',
  location: '',
  salary: '',
  application_url: '',
  application_date: '',
  deadline: '',
  status: '',
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

function Applications() {
  const { applications, loading, error, fetchApplications } = useOutletContext();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('NEWEST');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== '' ||
    jobTypeFilter !== '' ||
    sortBy !== 'NEWEST';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setJobTypeFilter('');
    setSortBy('NEWEST');
  };

  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const companyMatch = (app.company || '').toLowerCase().includes(q);
          const positionMatch = (app.position || '').toLowerCase().includes(q);
          if (!companyMatch && !positionMatch) {
            return false;
          }
        }

        if (statusFilter && app.status !== statusFilter) {
          return false;
        }

        if (jobTypeFilter && app.job_type !== jobTypeFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          const dateA = new Date(a.application_date || a.created_at || 0).getTime();
          const dateB = new Date(b.application_date || b.created_at || 0).getTime();
          return dateB - dateA;
        }
        if (sortBy === 'OLDEST') {
          const dateA = new Date(a.application_date || a.created_at || 0).getTime();
          const dateB = new Date(b.application_date || b.created_at || 0).getTime();
          return dateA - dateB;
        }
        if (sortBy === 'COMPANY_ASC') {
          return (a.company || '').localeCompare(b.company || '', undefined, { sensitivity: 'base' });
        }
        if (sortBy === 'COMPANY_DESC') {
          return (b.company || '').localeCompare(a.company || '', undefined, { sensitivity: 'base' });
        }
        return 0;
      });
  }, [applications, searchQuery, statusFilter, jobTypeFilter, sortBy]);

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

  const handleStartEdit = (app) => {
    setEditingId(app.id);
    setFormData({
      company: app.company || '',
      position: app.position || '',
      job_type: app.job_type || '',
      location: app.location || '',
      salary: app.salary || '',
      application_url: app.application_url || '',
      application_date: formatDateForInput(app.application_date),
      deadline: formatDateForInput(app.deadline),
      status: app.status || '',
      notes: app.notes || '',
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
      ? `/api/applications/${editingId}`
      : '/api/applications';
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
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'add'} application (Status ${response.status})`);
      }

      setFormSuccess(
        isEditing
          ? 'Application updated successfully!'
          : 'Application added successfully!'
      );
      setFormData(initialFormState);
      setEditingId(null);
      setShowForm(false);
      fetchApplications();
    } catch (err) {
      setFormError(err.message || `Failed to ${isEditing ? 'update' : 'add'} application`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, company, position) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the application for "${position}" at ${company}?`
    );
    if (!confirmed) return;

    setDeletingId(id);
    setFormError(null);
    setFormSuccess(null);

    try {
      const response = await authFetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to delete application (Status ${response.status})`);
      }

      setFormSuccess('Application deleted successfully!');
      fetchApplications();
    } catch (err) {
      setFormError(err.message || 'Failed to delete application');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Applications</h1>
        <p className="page-subtitle">Track and manage your submitted applications.</p>
      </header>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Applications ({applications.length})</h2>
          {!showForm && (
            <button
              type="button"
              className="btn-add-application"
              onClick={handleStartAdd}
            >
              + Add Application
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
                {editingId !== null ? 'Edit Application' : 'Add Application'}
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
                    placeholder="e.g. Google"
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
                    placeholder="e.g. Software Engineering Intern"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="job_type">Job Type *</label>
                  <select
                    id="job_type"
                    name="job_type"
                    value={formData.job_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Job Type</option>
                    <option value="INTERNSHIP">INTERNSHIP</option>
                    <option value="FULL_TIME">FULL_TIME</option>
                    <option value="PART_TIME">PART_TIME</option>
                    <option value="CONTRACT">CONTRACT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="SAVED">SAVED</option>
                    <option value="APPLIED">APPLIED</option>
                    <option value="ASSESSMENT">ASSESSMENT</option>
                    <option value="INTERVIEW">INTERVIEW</option>
                    <option value="OFFER">OFFER</option>
                    <option value="REJECTED">REJECTED</option>
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
                  <label htmlFor="salary">Salary</label>
                  <input
                    id="salary"
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="e.g. ₹90,000/month"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="application_url">Application URL</label>
                  <input
                    id="application_url"
                    type="url"
                    name="application_url"
                    value={formData.application_url}
                    onChange={handleChange}
                    placeholder="https://example.com/job"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="application_date">Application Date</label>
                  <input
                    id="application_date"
                    type="date"
                    name="application_date"
                    value={formData.application_date}
                    onChange={handleChange}
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
                    placeholder="Referrals, interview topics, application details, etc."
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
                    ? (editingId !== null ? 'Saving Changes...' : 'Adding Application...')
                    : (editingId !== null ? 'Save Changes' : 'Add Application')}
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
            Loading applications...
          </div>
        )}

        {error && !loading && (
          <div className="state-message error-message">
            Error: {error}
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <>
            <div className="filter-toolbar">
              <div className="filter-search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="filter-search-input"
                  placeholder="Search by company or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search applications"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-controls-group">
                <div className="filter-select-wrapper">
                  <label htmlFor="filter-status" className="filter-label">Status</label>
                  <select
                    id="filter-status"
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="SAVED">Saved</option>
                    <option value="APPLIED">Applied</option>
                    <option value="ASSESSMENT">Assessment</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="OFFER">Offer</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label htmlFor="filter-job-type" className="filter-label">Job Type</label>
                  <select
                    id="filter-job-type"
                    className="filter-select"
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                  >
                    <option value="">All Job Types</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label htmlFor="filter-sort" className="filter-label">Sort</label>
                  <select
                    id="filter-sort"
                    className="filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="NEWEST">Newest First</option>
                    <option value="OLDEST">Oldest First</option>
                    <option value="COMPANY_ASC">Company A-Z</option>
                    <option value="COMPANY_DESC">Company Z-A</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn-clear-filters"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="filter-summary-bar">
              <span className="filter-count">
                Showing {filteredApplications.length} of {applications.length} {applications.length === 1 ? 'application' : 'applications'}
              </span>
            </div>
          </>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="state-message empty-state">
            No applications found. Add your first application above to start tracking.
          </div>
        )}

        {!loading && !error && applications.length > 0 && filteredApplications.length === 0 && (
          <div className="state-message empty-state">
            <p style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>
              No applications match your filters.
            </p>
            <button
              type="button"
              className="btn-clear-filters"
              onClick={handleClearFilters}
              style={{ alignSelf: 'center' }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {!loading && !error && filteredApplications.length > 0 && (
          <div className="applications-list-container">
            {filteredApplications.map((app) => (
              <div key={app.id} className="application-row-card">
                <div className="row-top">
                  <div className="row-heading">
                    <h3 className="app-position">{app.position}</h3>
                    <div className="app-company">{app.company}</div>
                  </div>
                  <div className="row-actions">
                    <span className={`status-badge status-${(app.status || 'saved').toLowerCase()}`}>
                      {formatStatus(app.status)}
                    </span>
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => handleStartEdit(app)}
                      disabled={deletingId === app.id}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDelete(app.id, app.company, app.position)}
                      disabled={deletingId === app.id}
                    >
                      {deletingId === app.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="row-metadata">
                  <div className="meta-item">
                    <span className="meta-label">Job Type:</span>
                    <span className="meta-value">{formatJobType(app.job_type)}</span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Location:</span>
                    <span className="meta-value">{app.location || 'Not Specified'}</span>
                  </div>

                  {app.salary && (
                    <div className="meta-item">
                      <span className="meta-label">Salary:</span>
                      <span className="meta-value">{app.salary}</span>
                    </div>
                  )}

                  {app.application_date && (
                    <div className="meta-item">
                      <span className="meta-label">Applied:</span>
                      <span className="meta-value">{new Date(app.application_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  {app.deadline && (
                    <div className="meta-item">
                      <span className="meta-label">Deadline:</span>
                      <span className="meta-value">{new Date(app.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {app.notes && (
                  <div className="row-notes">
                    <span className="notes-label">Notes:</span>
                    {app.notes}
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

export default Applications;
