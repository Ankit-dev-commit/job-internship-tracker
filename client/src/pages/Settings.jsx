import { useState, useEffect } from 'react';
import { authFetch } from '../utils/auth';

const initialFormState = {
  name: '',
  email: '',
  college: '',
  degree: '',
  graduation_year: '',
  skills: '',
  linkedin: '',
  github: '',
  portfolio: '',
};

function Settings() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/profile');
      if (!response.ok) {
        throw new Error(`Failed to load profile (Status ${response.status})`);
      }
      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        college: data.college || '',
        degree: data.degree || '',
        graduation_year: data.graduation_year !== null && data.graduation_year !== undefined ? String(data.graduation_year) : '',
        skills: data.skills || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        portfolio: data.portfolio || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        college: profile.college || '',
        degree: profile.degree || '',
        graduation_year: profile.graduation_year !== null && profile.graduation_year !== undefined ? String(profile.graduation_year) : '',
        skills: profile.skills || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        portfolio: profile.portfolio || '',
      });
    }
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and Email are required.');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      college: formData.college.trim() || null,
      degree: formData.degree.trim() || null,
      graduation_year: formData.graduation_year ? parseInt(formData.graduation_year, 10) : null,
      skills: formData.skills.trim() || null,
      linkedin: formData.linkedin.trim() || null,
      github: formData.github.trim() || null,
      portfolio: formData.portfolio.trim() || null,
    };

    try {
      const response = await authFetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to update profile (Status ${response.status})`);
      }

      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        college: data.college || '',
        degree: data.degree || '',
        graduation_year: data.graduation_year !== null && data.graduation_year !== undefined ? String(data.graduation_year) : '',
        skills: data.skills || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        portfolio: data.portfolio || '',
      });
      setFormSuccess('Profile updated successfully!');
    } catch (err) {
      setFormError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your profile, preferences, and account configuration.</p>
      </header>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Profile &amp; Account</h2>
          <span className="section-hint">Personalized information for your applications</span>
        </div>

        {formSuccess && (
          <div className="alert alert-success">
            {formSuccess}
          </div>
        )}

        {error && !loading && (
          <div className="state-message error-message">
            Error: {error}
          </div>
        )}

        {loading && (
          <div className="state-message">
            Loading profile...
          </div>
        )}

        {!loading && profile && (
          <>
            <div className="profile-overview">
              <div className="profile-avatar">
                {getInitials(profile.name)}
              </div>
              <div className="profile-details-summary">
                <h3 className="profile-name">{profile.name}</h3>
                <span className="profile-email">{profile.email}</span>
                {profile.created_at && (
                  <span className="profile-member-since">
                    Member since {new Date(profile.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className="form-wrapper">
              <div className="form-header">
                <h3 className="form-title">Edit Profile Information</h3>
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
                    <label htmlFor="name">Name *</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. john@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="college">College / University</label>
                    <input
                      id="college"
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      placeholder="e.g. Stanford University"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="degree">Degree / Major</label>
                    <input
                      id="degree"
                      type="text"
                      name="degree"
                      value={formData.degree}
                      onChange={handleChange}
                      placeholder="e.g. B.S. in Computer Science"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="graduation_year">Graduation Year</label>
                    <input
                      id="graduation_year"
                      type="number"
                      name="graduation_year"
                      value={formData.graduation_year}
                      onChange={handleChange}
                      placeholder="e.g. 2026"
                      min="1980"
                      max="2040"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="linkedin">LinkedIn</label>
                    <input
                      id="linkedin"
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="github">GitHub</label>
                    <input
                      id="github"
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="portfolio">Portfolio</label>
                    <input
                      id="portfolio"
                      type="url"
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="skills">Skills</label>
                    <textarea
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      rows="3"
                      placeholder="e.g. JavaScript, React, Node.js, Python, PostgreSQL, AWS"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleReset}
                    disabled={submitting}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default Settings;
