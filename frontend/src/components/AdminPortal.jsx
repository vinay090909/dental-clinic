import React, { useState } from 'react';
import {
  ShieldCheck,
  CalendarCheck,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Stethoscope,
  DollarSign,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function AdminPortal({
  appointments,
  doctors,
  onUpdateStatus,
  onAddDoctor,
  onDeleteDoctor
}) {
  const [activeSubTab, setActiveSubTab] = useState('appointments'); // 'appointments' or 'doctors'
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    clinicName: 'SmileCare Specialist Wing',
    specialization: '',
    experience: '',
    consultationFee: '600',
    availability: 'Mon - Sat (10:00 AM - 6:00 PM)',
    qualification: 'BDS, MDS',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'
  });
  const [doctorFormError, setDoctorFormError] = useState('');
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);

  // Filtered Appointments
  const filteredAppointments = appointments.filter(apt => {
    if (statusFilter === 'All') return true;
    return apt.status === statusFilter;
  });

  // KPI calculations
  const totalBookings = appointments.length;
  const confirmedCount = appointments.filter(a => a.status === 'Confirmed' || !a.status).length;
  const completedCount = appointments.filter(a => a.status === 'Completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'Cancelled').length;

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.specialization || !newDoctor.experience) {
      setDoctorFormError('Please fill in doctor name, specialization, and experience.');
      return;
    }

    setIsSubmittingDoctor(true);
    setDoctorFormError('');
    try {
      await onAddDoctor({
        ...newDoctor,
        experience: Number(newDoctor.experience),
        consultationFee: Number(newDoctor.consultationFee)
      });
      setShowAddDoctorModal(false);
      setNewDoctor({
        name: '',
        clinicName: 'SmileCare Specialist Wing',
        specialization: '',
        experience: '',
        consultationFee: '600',
        availability: 'Mon - Sat (10:00 AM - 6:00 PM)',
        qualification: 'BDS, MDS',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'
      });
    } catch (err) {
      setDoctorFormError(err.message || 'Failed to add doctor');
    } finally {
      setIsSubmittingDoctor(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Admin Header */}
      <div className="admin-header-banner">
        <div>
          <div className="admin-pill">
            <ShieldCheck size={16} /> Administrator Master Console
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
            Clinic Operations & Roster Control
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            Manage patient bookings, update consultation outcomes, and manage the clinic doctor roster.
          </p>
        </div>

        {/* View Switcher */}
        <div className="admin-tab-controls">
          <button
            type="button"
            className={`admin-subtab ${activeSubTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('appointments')}
          >
            <CalendarCheck size={16} /> All Bookings ({appointments.length})
          </button>
          <button
            type="button"
            className={`admin-subtab ${activeSubTab === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('doctors')}
          >
            <Stethoscope size={16} /> Doctor Roster ({doctors.length})
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-icon-box blue">
            <CalendarCheck size={22} />
          </div>
          <div>
            <div className="kpi-number">{totalBookings}</div>
            <div className="kpi-label">Total Bookings</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box amber">
            <Clock size={22} />
          </div>
          <div>
            <div className="kpi-number">{confirmedCount}</div>
            <div className="kpi-label">Pending / Confirmed</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box green">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="kpi-number">{completedCount}</div>
            <div className="kpi-label">Completed Consultations</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box teal">
            <Stethoscope size={22} />
          </div>
          <div>
            <div className="kpi-number">{doctors.length}</div>
            <div className="kpi-label">Active Doctors</div>
          </div>
        </div>
      </div>

      {/* Subtab: Appointments */}
      {activeSubTab === 'appointments' && (
        <div className="appointments-container" style={{ marginTop: '24px' }}>
          <div className="appointments-header">
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Master Appointment Records</h3>
              <p className="appointments-count">
                Real-time booking ledger across all clinic specialists
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="status-filter-pills">
              {['All', 'Confirmed', 'Completed', 'Cancelled'].map(st => (
                <button
                  key={st}
                  type="button"
                  className={`status-pill-btn ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>
              <p>No appointments match the "{statusFilter}" filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Token ID</th>
                    <th>Patient Name & Contact</th>
                    <th>Doctor</th>
                    <th>Date & Slot</th>
                    <th>Treatment</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(apt => (
                    <tr key={apt.id || apt.appointmentId}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {apt.id || apt.appointmentId}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--dark)' }}>{apt.patientName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{apt.phone}</div>
                        {apt.userEmail && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{apt.userEmail}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{apt.doctorName}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{apt.date}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{apt.timeSlot}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{apt.serviceType}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          apt.status === 'Completed' ? 'completed' :
                          apt.status === 'Cancelled' ? 'cancelled' : 'confirmed'
                        }`}>
                          {apt.status === 'Completed' ? <CheckCircle size={12} /> :
                           apt.status === 'Cancelled' ? <XCircle size={12} /> :
                           <Clock size={12} />}
                          {apt.status || 'Confirmed'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {apt.status !== 'Completed' && (
                            <button
                              type="button"
                              className="btn-status-action complete"
                              title="Mark as Completed"
                              onClick={() => onUpdateStatus(apt.id || apt.appointmentId, 'Completed')}
                            >
                              <CheckCircle size={14} /> Done
                            </button>
                          )}
                          {apt.status !== 'Cancelled' && (
                            <button
                              type="button"
                              className="btn-status-action cancel"
                              title="Cancel Appointment"
                              onClick={() => onUpdateStatus(apt.id || apt.appointmentId, 'Cancelled')}
                            >
                              <XCircle size={14} /> Cancel
                            </button>
                          )}
                          {apt.status === 'Cancelled' && (
                            <button
                              type="button"
                              className="btn-status-action confirm"
                              title="Restore to Confirmed"
                              onClick={() => onUpdateStatus(apt.id || apt.appointmentId, 'Confirmed')}
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subtab: Doctors Management */}
      {activeSubTab === 'doctors' && (
        <div className="appointments-container" style={{ marginTop: '24px' }}>
          <div className="appointments-header">
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Clinic Doctors Roster</h3>
              <p className="appointments-count">
                Add, inspect, or manage dentists visible on the public website
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowAddDoctorModal(true)}
            >
              <Plus size={16} /> Add New Specialist
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Consultation Fee</th>
                  <th>Working Hours</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doc => (
                  <tr key={doc.id || doc._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={doc.image}
                          alt={doc.name}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700 }}>{doc.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{doc.clinicName}</div>
                        </div>
                      </div>
                    </td>
                    <td>{doc.specialization}</td>
                    <td>{doc.experience}+ Years</td>
                    <td>
                      <strong>₹{doc.consultationFee}</strong>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{doc.availability}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-delete-action"
                        title="Remove doctor from clinic roster"
                        onClick={() => onDeleteDoctor(doc.id)}
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-card-custom">
            <div className="modal-header">
              <h3>Add New Clinic Specialist</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowAddDoctorModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleDoctorSubmit} style={{ padding: '24px' }}>
              {doctorFormError && (
                <div className="auth-error-banner" style={{ marginBottom: '14px' }}>
                  <AlertCircle size={16} />
                  <span>{doctorFormError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Doctor Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Kavita Sengupta"
                  value={newDoctor.name}
                  onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Periodontist & Implantologist"
                    value={newDoctor.specialization}
                    onChange={e => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Years of Experience</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 7"
                    value={newDoctor.experience}
                    onChange={e => setNewDoctor({ ...newDoctor, experience: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newDoctor.consultationFee}
                    onChange={e => setNewDoctor({ ...newDoctor, consultationFee: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Availability Schedule</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newDoctor.availability}
                    onChange={e => setNewDoctor({ ...newDoctor, availability: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Profile Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={newDoctor.image}
                  onChange={e => setNewDoctor({ ...newDoctor, image: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowAddDoctorModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                  disabled={isSubmittingDoctor}
                >
                  {isSubmittingDoctor ? 'Adding to Clinic...' : 'Add Doctor to System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
