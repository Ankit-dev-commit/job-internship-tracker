import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authFetch, getUser } from '../utils/auth';

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

const getStatusBadgeClass = (status) => {
  const key = (status || '').toLowerCase();
  return `status-badge status-${key}`;
};

const formatJobType = (jobType) => {
  if (!jobType) return null;
  const typeMap = {
    INTERNSHIP: 'Internship',
    FULL_TIME: 'Full-Time',
    PART_TIME: 'Part-Time',
    CONTRACT: 'Contract',
  };
  return typeMap[jobType] || jobType;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const raw = dateStr.split('T')[0];
    const parts = raw.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  } catch {
    return timeStr;
  }
};

const getInitials = (name, email) => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'U';
};

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const TotalAppsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const AppliedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const InterviewStatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const OfferStatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const BookmarkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const LeafIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function Dashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerSearch, setHeaderSearch] = useState('');

  const user = getUser();
  const userName = user?.name ? user.name.trim() : null;
  const userInitials = getInitials(user?.name, user?.email);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const appResponse = await authFetch('/api/applications');
      if (!appResponse.ok) {
        throw new Error(`Failed to load applications (Status ${appResponse.status})`);
      }
      const appData = await appResponse.json();
      setApplications(appData);

      try {
        const interviewResponse = await authFetch('/api/interviews');
        if (interviewResponse.ok) {
          const interviewData = await interviewResponse.json();
          setInterviews(interviewData);
        }
      } catch (err) {
        console.warn('Could not fetch interviews for dashboard:', err);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalApplications = applications.length;
  const totalApplied = applications.filter((app) => app.status === 'APPLIED').length;
  const totalInterviews = applications.filter((app) => app.status === 'INTERVIEW').length;
  const totalOffers = applications.filter((app) => app.status === 'OFFER').length;

  const recentApplications = applications.slice(0, 5);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingInterviews = interviews
    .filter((interview) => {
      if (!interview.date) return false;
      try {
        const rawDate = interview.date.split('T')[0];
        const [y, m, d] = rawDate.split('-').map(Number);
        const itemDate = new Date(y, m - 1, d);
        return itemDate >= today;
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      const dateA = (a.date ? a.date.split('T')[0] : '') + ' ' + (a.time || '00:00');
      const dateB = (b.date ? b.date.split('T')[0] : '') + ' ' + (b.time || '00:00');
      return dateA.localeCompare(dateB);
    })
    .slice(0, 4);

  const handleHeaderSearchSubmit = (e) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      navigate(`/applications?search=${encodeURIComponent(headerSearch.trim())}`);
    } else {
      navigate('/applications');
    }
  };

  return (
    <>
      <header className="page-header">
        <div className="dashboard-header-bar">
          <div className="dashboard-header-intro">
            <h1 className="page-title">
              {userName ? `Welcome back, ${userName}!` : 'Welcome back!'}
            </h1>
            <p className="page-subtitle">
              Track and manage your job and internship applications.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <form onSubmit={handleHeaderSearchSubmit} className="header-search-form">
              <span className="header-search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="header-search-input"
                placeholder="Search applications..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                aria-label="Search applications"
              />
            </form>

            <button
              type="button"
              className="header-notification-btn"
              title="Notifications"
              aria-label="Notifications"
            >
              <BellIcon />
              <span className="notification-dot" />
            </button>

            <div className="header-user-avatar" title={userName || 'Account'}>
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      {loading && (
        <div className="state-message">
          Loading your dashboard...
        </div>
      )}

      {error && !loading && (
        <div className="state-message error-message">
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="stats-row">
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Total Applications</span>
                <div className="stat-icon-wrapper">
                  <TotalAppsIcon />
                </div>
              </div>
              <div className="stat-value">{totalApplications}</div>
              <span className="stat-context">All roles tracked</span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Applied</span>
                <div className="stat-icon-wrapper">
                  <AppliedIcon />
                </div>
              </div>
              <div className="stat-value">{totalApplied}</div>
              <span className="stat-context">In initial review</span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Interviews</span>
                <div className="stat-icon-wrapper">
                  <InterviewStatIcon />
                </div>
              </div>
              <div className="stat-value">{totalInterviews}</div>
              <span className="stat-context">Active interview stages</span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Offers</span>
                <div className="stat-icon-wrapper">
                  <OfferStatIcon />
                </div>
              </div>
              <div className="stat-value">{totalOffers}</div>
              <span className="stat-context">Offers received</span>
            </div>
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-main-col">
              <section className="dashboard-section">
                <div className="section-header">
                  <h2>Quick Actions</h2>
                  <span className="section-hint">Jump into your tasks</span>
                </div>
                <div className="quick-actions-grid">
                  <Link to="/applications" className="quick-action-primary">
                    <div className="action-icon">
                      <PlusIcon />
                    </div>
                    <div className="action-text-group">
                      <span className="action-title">Add Application</span>
                      <span className="action-subtitle">Log a new job submission</span>
                    </div>
                  </Link>

                  <Link to="/applications" className="quick-action-secondary">
                    <div className="action-icon">
                      <FolderIcon />
                    </div>
                    <div className="action-text-group">
                      <span className="action-title">View All Applications</span>
                      <span className="action-subtitle">Browse {totalApplications} tracked roles</span>
                    </div>
                  </Link>

                  <Link to="/interviews" className="quick-action-secondary">
                    <div className="action-icon">
                      <CalendarIcon />
                    </div>
                    <div className="action-text-group">
                      <span className="action-title">Manage Interviews</span>
                      <span className="action-subtitle">Schedule rounds &amp; feedback</span>
                    </div>
                  </Link>

                  <Link to="/saved-jobs" className="quick-action-secondary">
                    <div className="action-icon">
                      <BookmarkIcon />
                    </div>
                    <div className="action-text-group">
                      <span className="action-title">Saved Jobs</span>
                      <span className="action-subtitle">Review bookmarked positions</span>
                    </div>
                  </Link>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="section-header">
                  <h2>Recent Applications</h2>
                  <span className="section-hint">
                    {totalApplications > 0
                      ? `Showing ${recentApplications.length} of ${totalApplications}`
                      : '0 tracked'}
                  </span>
                </div>

                {recentApplications.length === 0 ? (
                  <div className="state-message empty-state">
                    <p style={{ marginBottom: '0.4rem', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      No applications yet
                    </p>
                    <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
                      Add your first application to get started.
                    </p>
                    <Link to="/applications" className="btn-add-application">
                      <PlusIcon />
                      <span>Add Your First Application</span>
                    </Link>
                  </div>
                ) : (
                  <div className="recent-apps-list">
                    {recentApplications.map((app) => (
                      <div key={app.id} className="recent-app-card">
                        <div className="recent-app-main">
                          <div className="recent-app-role">
                            <h3 className="app-position">{app.position}</h3>
                            <span className="app-company">{app.company}</span>
                          </div>
                          <div className="recent-app-badges">
                            {app.job_type && (
                              <span className="job-type-badge">
                                {formatJobType(app.job_type)}
                              </span>
                            )}
                            <span className={getStatusBadgeClass(app.status)}>
                              {formatStatus(app.status)}
                            </span>
                          </div>
                        </div>

                        <div className="recent-app-meta">
                          <span className="meta-item">
                            <span className="meta-label">Date Applied:</span>{' '}
                            <span className="meta-value">
                              {formatDate(app.application_date || app.created_at)}
                            </span>
                          </span>

                          {app.location && (
                            <span className="meta-item">
                              <span className="meta-label">Location:</span>{' '}
                              <span className="meta-value">{app.location}</span>
                            </span>
                          )}

                          {app.salary && (
                            <span className="meta-item">
                              <span className="meta-label">Salary:</span>{' '}
                              <span className="meta-value">{app.salary}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="dashboard-side-col">
              <div className="motivational-card">
                <div className="motivational-header">
                  <span className="motivational-icon">
                    <LeafIcon />
                  </span>
                  <span>Daily Motivation</span>
                </div>
                <blockquote className="motivational-quote-text">
                  &ldquo;A little progress every day adds up to big results.&rdquo;
                </blockquote>
              </div>

              <div className="upcoming-interviews-panel">
                <div className="panel-header-row">
                  <h3 className="panel-title">
                    <CalendarIcon />
                    <span>Upcoming Interviews</span>
                  </h3>
                  <Link to="/interviews" className="panel-view-all-link">
                    View all
                  </Link>
                </div>

                {upcomingInterviews.length === 0 ? (
                  <div className="upcoming-empty-state">
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      No upcoming interviews
                    </p>
                    <p className="empty-subtext">
                      Interviews you schedule will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="upcoming-interview-list">
                    {upcomingInterviews.map((item) => (
                      <div key={item.id} className="upcoming-interview-item">
                        <div className="upcoming-interview-top">
                          <div>
                            <div className="upcoming-company-name">{item.company}</div>
                            <div className="upcoming-role-name">{item.position}</div>
                          </div>
                          {item.round && (
                            <span className="upcoming-round-badge">
                              {item.round}
                            </span>
                          )}
                        </div>

                        <div className="upcoming-meta-chips">
                          {item.date && (
                            <span className="meta-chip">
                              📅 {formatDate(item.date)}
                            </span>
                          )}
                          {item.time && (
                            <span className="meta-chip">
                              ⏰ {formatTime(item.time)}
                            </span>
                          )}
                          {item.type && (
                            <span className="meta-chip">
                              🏷️ {item.type}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="tips-panel">
                <div className="panel-header-row" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '0.85rem' }}>
                  <h3 className="panel-title">
                    <LeafIcon />
                    <span>Tips for Success</span>
                  </h3>
                </div>
                <ul className="tips-list">
                  <li className="tip-item">
                    <span className="tip-check-icon"><CheckIcon /></span>
                    <span>Keep your profile updated</span>
                  </li>
                  <li className="tip-item">
                    <span className="tip-check-icon"><CheckIcon /></span>
                    <span>Prepare for your interviews</span>
                  </li>
                  <li className="tip-item">
                    <span className="tip-check-icon"><CheckIcon /></span>
                    <span>Research about the company</span>
                  </li>
                  <li className="tip-item">
                    <span className="tip-check-icon"><CheckIcon /></span>
                    <span>Practice common questions</span>
                  </li>
                  <li className="tip-item">
                    <span className="tip-check-icon"><CheckIcon /></span>
                    <span>Stay consistent</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  );
}

export default Dashboard;
