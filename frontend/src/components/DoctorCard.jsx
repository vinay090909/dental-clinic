import React from 'react';
import { Star, Award, Clock, Calendar, CheckCircle2 } from 'lucide-react';

export default function DoctorCard({ doctor, onBookDoctor }) {
  return (
    <div className="doctor-card">
      <div className="doctor-image-box">
        <img
          src={doctor.image || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80"}
          alt={doctor.name}
          className="doctor-image"
          loading="lazy"
        />
        <div className="doctor-badge">
          <CheckCircle2 size={13} color="#34d399" />
          <span>Available Today</span>
        </div>
        <div className="doctor-rating">
          <Star size={14} fill="#f59e0b" color="#f59e0b" />
          <span>{doctor.rating || '4.9'}</span>
          <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.75rem' }}>
            ({doctor.reviewsCount || 85})
          </span>
        </div>
      </div>

      <div className="doctor-body">
        <h3 className="doctor-name">{doctor.name}</h3>
        <p className="doctor-clinic">{doctor.clinicName || "SmileCare Clinic"}</p>
        <p className="doctor-spec">{doctor.specialization}</p>

        <div className="doctor-details-list">
          <div className="doctor-detail-row">
            <Award size={16} color="var(--primary)" />
            <span><strong>{doctor.experience}+ Years</strong> Clinical Experience</span>
          </div>
          <div className="doctor-detail-row">
            <Clock size={16} color="var(--secondary)" />
            <span>{doctor.availability || 'Mon - Sat (10:00 AM - 7:00 PM)'}</span>
          </div>
        </div>

        <div className="doctor-footer">
          <div className="fee-box">
            <span>Consultation</span>
            <strong>₹{doctor.consultationFee || 500}</strong>
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.88rem' }}
            onClick={() => onBookDoctor(doctor)}
          >
            <Calendar size={15} /> Book Slot
          </button>
        </div>
      </div>
    </div>
  );
}
