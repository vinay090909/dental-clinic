import React from 'react';
import { Sparkles, Phone, CalendarCheck, Stethoscope, LogIn, LogOut, UserCheck, ShieldCheck } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onBookClick,
  appointmentsCount,
  currentUser,
  onOpenAuth,
  onLogout
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="navbar">
      <div className="container nav-content">
        <div className="brand" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <Sparkles size={24} />
          </div>
          <div className="brand-text">
            <h1>SmileCare</h1>
            <span>Dental & Implant Center</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            type="button"
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Stethoscope size={18} /> Our Doctors & Care
          </button>
          
          <button
            type="button"
            className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <CalendarCheck size={18} />
            Clinic Bookings
            {appointmentsCount > 0 && (
              <span className="nav-badge">{appointmentsCount}</span>
            )}
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`nav-link admin-nav-link ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <ShieldCheck size={18} color="#d97706" />
              <span>Admin Portal</span>
              <span className="admin-tag-small">Master</span>
            </button>
          )}
        </nav>

        <div className="nav-cta">
          <div className="emergency-chip">
            <Phone size={16} color="var(--primary)" />
            <div>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Emergency 24/7</span>
              <span>+91 1800-419-DENT</span>
            </div>
          </div>

          {currentUser ? (
            <div className="user-profile-badge">
              <div className="user-avatar-chip">
                {isAdmin ? (
                  <ShieldCheck size={16} color="#d97706" />
                ) : (
                  <UserCheck size={16} color="var(--secondary)" />
                )}
                <span className="user-name">
                  {currentUser.name} {isAdmin && '(Admin)'}
                </span>
              </div>
              <button
                type="button"
                className="btn-logout"
                onClick={onLogout}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-outline"
              onClick={onOpenAuth}
            >
              <LogIn size={16} /> Sign In
            </button>
          )}

          <button type="button" className="btn-primary" onClick={onBookClick}>
            Book Appointment
          </button>
        </div>
      </div>
    </header>
  );
}
