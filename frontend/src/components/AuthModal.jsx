import React, { useState, useRef, useEffect } from 'react';
import { X, Lock, Mail, User, Phone, LogIn, UserPlus, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const dialogRef = useRef(null);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dialog management with light-dismiss per modern-web-guidance
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      setError('');
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (!isDialogContent) {
        onClose();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);
    return () => dialog.removeEventListener('click', handleBackdropClick);
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const payload = mode === 'signup'
      ? formData
      : { email: formData.email, password: formData.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      onAuthSuccess(data.user, data.token);
      setFormData({ name: '', email: '', phone: '', password: '' });
      onClose();
    } catch (err) {
      setError(err.message || 'Network error, please check backend');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setMode('login');
    setFormData({
      name: '',
      email: 'rahul@example.com',
      phone: '',
      password: 'password123'
    });
    setError('');
  };

  const fillAdminCredentials = () => {
    setMode('login');
    setFormData({
      name: '',
      email: 'admin@smilecare.com',
      phone: '',
      password: 'admin123'
    });
    setError('');
  };

  return (
    <dialog
      ref={dialogRef}
      className="booking-modal auth-modal"
      closedby="any"
      aria-labelledby="authModalTitle"
      onClose={onClose}
    >
      <div className="modal-header auth-header">
        <div>
          <h3 id="authModalTitle">
            {mode === 'login' ? 'Patient Sign In' : 'Create Patient Account'}
          </h3>
          <p>
            {mode === 'login'
              ? 'Sign in to schedule your doctor appointment'
              : 'Register in seconds to book and manage appointments'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="close-btn"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>

      <div className="modal-body">
        {/* Mode Switcher Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            <LogIn size={16} /> Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            <UserPlus size={16} /> Create Account
          </button>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="authName">Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="authName"
                    name="name"
                    className="form-input with-left-icon"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="authPhone">Mobile Number</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    id="authPhone"
                    name="phone"
                    className="form-input with-left-icon"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="authEmail">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                id="authEmail"
                name="email"
                className="form-input with-left-icon"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="authPassword">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="authPassword"
                name="password"
                className="form-input with-left-icon"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="form-submit-btn"
            disabled={loading}
          >
            {loading ? (
              'Authenticating...'
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} /> Sign In & Continue Booking
              </>
            ) : (
              <>
                <UserPlus size={18} /> Register & Book Doctor
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-divider">
          <span>OR</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            className="demo-login-btn"
            onClick={fillDemoCredentials}
          >
            <Sparkles size={16} color="var(--primary)" />
            <span>Login as Patient (rahul@example.com)</span>
          </button>

          <button
            type="button"
            className="demo-login-btn admin-demo-btn"
            onClick={fillAdminCredentials}
          >
            <ShieldCheck size={16} color="#d97706" />
            <span>Login as Admin (admin@smilecare.com)</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
