import React from 'react';
import { CalendarCheck, Clock, User, Phone, CheckCircle, Plus } from 'lucide-react';

export default function AppointmentsView({ appointments, onNewBookingClick, onRefresh }) {
  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div className="appointments-container">
        <div className="appointments-header">
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark)' }}>
              Clinic Appointments Dashboard
            </h2>
            <p className="appointments-count">
              Showing {appointments.length} active scheduled appointments
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={onRefresh}
            >
              Refresh
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={onNewBookingClick}
            >
              <Plus size={16} /> Book New Appointment
            </button>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <CalendarCheck size={48} color="var(--muted)" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--slate)' }}>No Appointments Yet</h3>
            <p style={{ color: 'var(--muted)', marginTop: '6px', fontSize: '0.9rem' }}>
              Be the first patient to schedule a consultation with our dental experts.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '20px' }}
              onClick={onNewBookingClick}
            >
              Book Now
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Token ID</th>
                  <th>Patient Info</th>
                  <th>Doctor Assigned</th>
                  <th>Schedule</th>
                  <th>Treatment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id}>
                    <td>
                      <strong style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {apt.id}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--dark)' }}>{apt.patientName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{apt.phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate)' }}>{apt.doctorName}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        {apt.date}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {apt.timeSlot}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.88rem', color: 'var(--slate)' }}>
                        {apt.serviceType}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge">
                        <CheckCircle size={12} /> Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
