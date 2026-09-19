import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DoctorCard from './components/DoctorCard';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import AppointmentsView from './components/AppointmentsView';
import AdminPortal from './components/AdminPortal';
import {
  Sparkles,
  ShieldCheck,
  Smile,
  Clock,
  Calendar,
  Phone,
  MapPin,
  HeartHandshake,
  CheckCircle2,
  Stethoscope,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smilecare_token') || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [pendingDoctorAfterAuth, setPendingDoctorAfterAuth] = useState(null);

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const res = await fetch('/api/doctors');
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  };

  // Verify stored token on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('smilecare_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Token expired');
        })
        .then(data => {
          setCurrentUser(data.user);
          setToken(savedToken);
        })
        .catch(() => {
          localStorage.removeItem('smilecare_token');
          setCurrentUser(null);
          setToken(null);
        });
    }

    fetchDoctors();
    fetchAppointments();
  }, []);

  // Protected Booking Trigger:
  // If user is not logged in, prompt Auth Modal first; otherwise open Booking Modal
  const handleOpenBooking = (doctor = null) => {
    const targetDoctor = doctor || doctors[0] || null;

    if (!currentUser) {
      setPendingDoctorAfterAuth(targetDoctor);
      setIsAuthModalOpen(true);
    } else {
      setSelectedDoctor(targetDoctor);
      setIsBookingModalOpen(true);
    }
  };

  // Successful Login/Signup handler
  const handleAuthSuccess = (user, authToken) => {
    setCurrentUser(user);
    setToken(authToken);
    localStorage.setItem('smilecare_token', authToken);
    setIsAuthModalOpen(false);

    // If user was in the middle of booking a doctor, seamlessly proceed to booking modal
    if (pendingDoctorAfterAuth) {
      setSelectedDoctor(pendingDoctorAfterAuth);
      setIsBookingModalOpen(true);
      setPendingDoctorAfterAuth(null);
    }
  };

  // User Logout
  const handleLogout = () => {
    localStorage.removeItem('smilecare_token');
    setCurrentUser(null);
    setToken(null);
  };

  const handleBookingSuccess = (newAppointment) => {
    setAppointments(prev => [newAppointment, ...prev]);
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');

      setAppointments(prev =>
        prev.map(apt => (apt.id === appointmentId || apt.appointmentId === appointmentId)
          ? { ...apt, status: newStatus }
          : apt
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddDoctor = async (doctorData) => {
    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(doctorData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add doctor');

    setDoctors(prev => [...prev, data.doctor]);
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to remove this doctor from the clinic?')) return;
    try {
      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete doctor');

      setDoctors(prev => prev.filter(doc => doc.id !== doctorId));
    } catch (err) {
      alert(err.message);
    }
  };

  const services = [
    {
      title: 'Painless Root Canal',
      desc: 'Advanced rotary endodontics with 3D digital apex locator for zero discomfort.',
      icon: <Activity size={24} />
    },
    {
      title: 'Teeth Whitening & Scaling',
      desc: 'Ultrasonic stain removal and laser teeth whitening for a sparkling bright smile.',
      icon: <Sparkles size={24} />
    },
    {
      title: 'Invisalign & Clear Aligners',
      desc: 'Discreet and painless teeth straightening with customized transparent aligners.',
      icon: <Smile size={24} />
    },
    {
      title: 'Permanent Dental Implants',
      desc: 'Titanium precision implants that look, feel, and function just like natural teeth.',
      icon: <ShieldCheck size={24} />
    }
  ];

  return (
    <div className="app-wrapper">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBookClick={() => handleOpenBooking()}
        appointmentsCount={appointments.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingDoctorAfterAuth(null);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Booking Dialog Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedDoctor={selectedDoctor}
        doctors={doctors}
        onBookingSuccess={handleBookingSuccess}
        currentUser={currentUser}
        token={token}
        onRequireAuth={() => {
          setIsBookingModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {activeTab === 'admin' && currentUser?.role === 'admin' ? (
        <AdminPortal
          appointments={appointments}
          doctors={doctors}
          onUpdateStatus={handleUpdateStatus}
          onAddDoctor={handleAddDoctor}
          onDeleteDoctor={handleDeleteDoctor}
        />
      ) : activeTab === 'appointments' ? (
        <AppointmentsView
          appointments={appointments}
          onNewBookingClick={() => handleOpenBooking()}
          onRefresh={fetchAppointments}
        />
      ) : (
        <main>
          {/* Hero Section */}
          <section className="hero">
            <div className="container">
              <div className="hero-grid">
                <div className="hero-text-content">
                  <div className="badge-tag">
                    <Sparkles size={16} /> Certified Painless Dentistry
                  </div>
                  <h1 className="hero-title">
                    Exceptional Dental Care for your <span>Healthiest Smile</span>
                  </h1>
                  <p className="hero-subtitle">
                    Experience compassionate, high-tech dental care with our specialist dentists.
                    From laser whitening to gentle root canals and orthodontic smile design.
                  </p>

                  <div className="hero-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleOpenBooking()}
                    >
                      <Calendar size={18} /> Schedule Consultation
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        const el = document.getElementById('doctors-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      View Specialists <ArrowRight size={16} />
                    </button>
                  </div>

                  <div className="hero-stats">
                    <div className="stat-item">
                      <h3>12k+</h3>
                      <p>Smiles Restored</p>
                    </div>
                    <div className="stat-item">
                      <h3>100%</h3>
                      <p>Sterilization Safety</p>
                    </div>
                    <div className="stat-item">
                      <h3>4.9★</h3>
                      <p>Patient Satisfaction</p>
                    </div>
                  </div>
                </div>

                <div className="hero-image-side">
                  <div className="hero-card">
                    <div className="hero-img-wrapper">
                      <img
                        src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80"
                        alt="Dental Clinic Treatment"
                        className="hero-img"
                      />
                    </div>
                    <div className="floating-pill">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'var(--success-light)',
                          color: 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircle2 size={22} />
                        </div>
                        <div className="pill-info">
                          <h4>Open 7 Days a Week</h4>
                          <p>Emergency & Walk-ins Welcome</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        onClick={() => handleOpenBooking()}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Services Section */}
          <section className="section" style={{ background: 'white' }}>
            <div className="container">
              <div className="section-header">
                <span className="section-tag">World-Class Dental Care</span>
                <h2 className="section-title">Specialized Dental Treatments</h2>
                <p className="section-subtitle">
                  We blend advanced dental technology with gentle clinical methods to guarantee comfortable, long-lasting results.
                </p>
              </div>

              <div className="services-grid">
                {services.map((srv, idx) => (
                  <div key={idx} className="service-card">
                    <div className="service-icon">
                      {srv.icon}
                    </div>
                    <h3>{srv.title}</h3>
                    <p>{srv.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Doctors Section */}
          <section id="doctors-section" className="section">
            <div className="container">
              <div className="section-header">
                <span className="section-tag">Qualified Medical Specialists</span>
                <h2 className="section-title">Meet Our Expert Dentists</h2>
                <p className="section-subtitle">
                  Our doctors are certified specialists with years of clinical expertise in implants, orthodontics, and cosmetic dentistry.
                </p>
              </div>

              {loadingDoctors ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>Loading doctors from backend server...</p>
                </div>
              ) : (
                <div className="doctors-grid">
                  {doctors.map((doctor) => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      onBookDoctor={handleOpenBooking}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="section" style={{ background: 'white' }}>
            <div className="container">
              <div style={{
                background: 'linear-gradient(135deg, #0284c7, #0f766e)',
                borderRadius: '24px',
                padding: '48px 40px',
                color: 'white',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '32px'
              }}>
                <div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <ShieldCheck size={26} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>5-Step Sterilization</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Class-B autoclave sterilization exceeding hospital hygiene protocols.</p>
                </div>

                <div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <HeartHandshake size={26} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>Transparent Pricing</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>No hidden fees. Upfront consultation estimates before starting treatment.</p>
                </div>

                <div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Clock size={26} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>Zero Wait Guarantee</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Booked slots are strictly prioritized to ensure you are seen on time.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="brand" style={{ marginBottom: '16px' }}>
                <div className="brand-icon">
                  <Sparkles size={24} />
                </div>
                <div className="brand-text">
                  <h2 style={{ color: 'white', fontSize: '1.25rem' }}>SmileCare</h2>
                  <span style={{ color: '#5eead4' }}>Dental & Implant Center</span>
                </div>
              </div>
              <p>
                Providing advanced, gentle, and comprehensive dental solutions to families with precision clinical expertise and cutting-edge technology.
              </p>
            </div>

            <div className="footer-col">
              <h4>Quick Links</h4>
              <p style={{ marginBottom: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>Our Specialists</p>
              <p style={{ marginBottom: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('appointments')}>View Bookings</p>
              <p style={{ marginBottom: '8px', cursor: 'pointer' }} onClick={() => handleOpenBooking()}>Book Appointment</p>
            </div>

            <div className="footer-col">
              <h4>Clinic Hours</h4>
              <p style={{ marginBottom: '6px' }}>Mon - Sat: 9:30 AM - 8:00 PM</p>
              <p style={{ marginBottom: '6px' }}>Sunday: 10:00 AM - 2:00 PM</p>
              <p style={{ color: '#38bdf8' }}>Emergency Desk: 24/7</p>
            </div>

            <div className="footer-col">
              <h4>Contact & Visit</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MapPin size={16} color="#38bdf8" /> 42, Health Avenue, Medical Enclave
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Phone size={16} color="#38bdf8" /> +91 (0) 98765-DENTAL
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            © 2026 SmileCare Dental Clinic. Built with MERN Stack (React + Node + Express).
          </div>
        </div>
      </footer>
    </div>
  );
}
