import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  Sparkles,
  AlertCircle,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  ArrowRight,
  ArrowLeft,
  MailCheck,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { API_BASE } from '../config';

const ALL_TIME_SLOTS = [
  '10:00 AM',
  '11:30 AM',
  '02:00 PM',
  '04:30 PM',
  '06:30 PM'
];

export default function BookingModal({
  isOpen,
  onClose,
  selectedDoctor,
  doctors,
  onBookingSuccess,
  currentUser,
  token,
  onRequireAuth
}) {
  const dialogRef = useRef(null);
  const [step, setStep] = useState(1); // 1 = Details, 2 = Payment Gateway
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    doctorId: '',
    date: '',
    timeSlot: '10:00 AM',
    serviceType: 'General Dental Consultation',
    notes: '',
    paymentMethod: 'UPI',
    upiId: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  });

  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  // Sync selected doctor and prefill user info
  useEffect(() => {
    if (selectedDoctor) {
      setFormData(prev => ({
        ...prev,
        doctorId: selectedDoctor.id,
        patientName: currentUser?.name || prev.patientName,
        phone: currentUser?.phone || prev.phone,
        serviceType: selectedDoctor.specialization.includes('Orthodontist')
          ? 'Braces & Clear Aligners'
          : selectedDoctor.specialization.includes('Pediatric')
          ? 'Pediatric Dental Checkup'
          : 'Dental Checkup & Scaling'
      }));
    } else if (doctors && doctors.length > 0 && !formData.doctorId) {
      setFormData(prev => ({
        ...prev,
        doctorId: doctors[0].id,
        patientName: currentUser?.name || prev.patientName,
        phone: currentUser?.phone || prev.phone
      }));
    }
  }, [selectedDoctor, doctors, currentUser]);

  // Fetch booked slots whenever doctor or date changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!formData.doctorId || !formData.date) {
        setBookedSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const res = await fetch(`${API_BASE}/api/doctors/${formData.doctorId}/booked-slots?date=${formData.date}`);
        const data = await res.json();
        if (res.ok && data.bookedSlots) {
          setBookedSlots(data.bookedSlots);
          // If the currently chosen slot is already booked, auto-select the first free slot
          if (data.bookedSlots.includes(formData.timeSlot)) {
            const firstAvailable = ALL_TIME_SLOTS.find(slot => !data.bookedSlots.includes(slot));
            if (firstAvailable) {
              setFormData(prev => ({ ...prev, timeSlot: firstAvailable }));
            }
          }
        }
      } catch (err) {
        console.error('Error loading booked slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [formData.doctorId, formData.date]);

  // Dialog management with light-dismiss fallback per modern-web-guidance
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      setStep(1);
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
        handleClose();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);
    return () => dialog.removeEventListener('click', handleBackdropClick);
  }, [isOpen]);

  const handleClose = () => {
    setConfirmedAppointment(null);
    setError('');
    setStep(1);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!token) {
      setError('Please sign in first to schedule an appointment.');
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (!formData.date) {
      setError('Please select an appointment date.');
      return;
    }

    if (bookedSlots.includes(formData.timeSlot)) {
      setError(`The ${formData.timeSlot} slot has already been booked. Please pick an available slot.`);
      return;
    }

    setError('');
    setStep(2); // Move to Payment Gateway step
  };

  const handleFinalPaymentAndBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientName: formData.patientName,
          phone: formData.phone,
          doctorId: formData.doctorId,
          date: formData.date,
          timeSlot: formData.timeSlot,
          serviceType: formData.serviceType,
          notes: formData.notes,
          paymentMethod: formData.paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          // Slot conflict error
          setStep(1);
          setBookedSlots(prev => [...prev, formData.timeSlot]);
          throw new Error(data.message || 'This slot is already filled.');
        }
        if (res.status === 401 || res.status === 403) {
          if (onRequireAuth) onRequireAuth();
          throw new Error('Your session expired. Please sign in again.');
        }
        throw new Error(data.message || 'Payment processing failed');
      }

      setConfirmedAppointment(data.appointment);
      if (onBookingSuccess) {
        onBookingSuccess(data.appointment);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong while booking.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const activeDoctor = doctors.find(d => d.id == formData.doctorId) || selectedDoctor || doctors[0];
  const feeAmount = activeDoctor?.consultationFee || 500;

  return (
    <dialog
      ref={dialogRef}
      className="booking-modal"
      closedby="any"
      aria-labelledby="bookingModalTitle"
      onClose={handleClose}
    >
      <div className="modal-header">
        <div>
          <h3 id="bookingModalTitle">
            {confirmedAppointment
              ? 'Appointment Confirmed!'
              : step === 2
              ? 'Secure Payment Gateway'
              : 'Book Dental Consultation'}
          </h3>
          <p>
            {confirmedAppointment
              ? 'Receipt & appointment token issued'
              : step === 2
              ? `Pay Consultation Fee for ${activeDoctor?.name || 'Doctor'}`
              : 'Select specialist, date, and available time slot'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="close-btn"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>

      <div className="modal-body">
        {/* Step Indicator */}
        {!confirmedAppointment && (
          <div className="checkout-step-indicator">
            <div className={`step-bubble ${step === 1 ? 'active' : 'completed'}`}>
              <span>1</span> Consultation Details
            </div>
            <div className="step-connector"></div>
            <div className={`step-bubble ${step === 2 ? 'active' : ''}`}>
              <span>2</span> Payment Gateway (₹{feeAmount})
            </div>
          </div>
        )}

        {error && (
          <div className="auth-error-banner" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {confirmedAppointment ? (
          /* ================= SUCCESS CONFIRMATION RECEIPT ================= */
          <div className="success-card">
            <div className="success-icon">
              <CheckCircle size={36} />
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Payment Successful & Appointment Booked!</h4>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Your consultation slot has been locked with our specialist.
            </p>

            {/* Email Notification Notice */}
            <div className="email-sent-badge">
              <MailCheck size={18} color="#059669" />
              <span>
                Confirmation email & payment receipt sent to <strong>{currentUser?.email}</strong>
              </span>
            </div>

            {/* Itemized Receipt */}
            <div className="receipt-box" style={{ marginTop: '16px' }}>
              <div className="receipt-row">
                <span style={{ color: 'var(--muted)' }}>Appointment Token ID</span>
                <strong style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
                  {confirmedAppointment.appointmentId || confirmedAppointment.id}
                </strong>
              </div>
              <div className="receipt-row">
                <span style={{ color: 'var(--muted)' }}>Transaction ID</span>
                <strong style={{ fontFamily: 'monospace' }}>
                  {confirmedAppointment.transactionId || 'TXN-DIRECT'}
                </strong>
              </div>
              <div className="receipt-row">
                <span style={{ color: 'var(--muted)' }}>Patient Name</span>
                <span>{confirmedAppointment.patientName}</span>
              </div>
              <div className="receipt-row">
                <span style={{ color: 'var(--muted)' }}>Doctor Assigned</span>
                <span>{confirmedAppointment.doctorName}</span>
              </div>
              <div className="receipt-row">
                <span style={{ color: 'var(--muted)' }}>Schedule</span>
                <span><strong>{confirmedAppointment.date}</strong> at {confirmedAppointment.timeSlot}</span>
              </div>
              <div className="receipt-row">
                <span style={{ color: 'var(--muted)' }}>Payment Method</span>
                <span>{confirmedAppointment.paymentMethod}</span>
              </div>
              <div className="receipt-row" style={{ borderTop: '1.5px dashed #bae6fd', paddingTop: '8px', marginTop: '8px' }}>
                <strong style={{ color: '#0369a1' }}>Amount Paid</strong>
                <strong style={{ color: '#0369a1', fontSize: '1.1rem' }}>
                  ₹{confirmedAppointment.amountPaid || feeAmount} (PAID ✅)
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            >
              Done & Return to Clinic
            </button>
          </div>
        ) : step === 1 ? (
          /* ================= STEP 1: APPOINTMENT DETAILS ================= */
          <form onSubmit={handleProceedToPayment}>
            <div className="form-group">
              <label className="form-label" htmlFor="doctorId">Select Specialist Doctor</label>
              <select
                id="doctorId"
                name="doctorId"
                className="form-select"
                value={formData.doctorId}
                onChange={handleChange}
                required
              >
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialization} (Fee: ₹{doc.consultationFee})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="patientName">Patient Full Name</label>
                <input
                  type="text"
                  id="patientName"
                  name="patientName"
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.patientName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Mobile Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="date">Appointment Date</label>
              <input
                type="date"
                id="date"
                name="date"
                min={today}
                className="form-input"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Time Slot Selector with Slot Collision Prevention */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Select Time Slot {loadingSlots && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>(Checking availability...)</span>}
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {bookedSlots.length > 0 ? `${bookedSlots.length} slot(s) booked` : 'All slots open'}
                </span>
              </div>

              <div className="time-slot-grid">
                {ALL_TIME_SLOTS.map(slot => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = formData.timeSlot === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      className={`time-slot-pill ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, timeSlot: slot }))}
                    >
                      <Clock size={14} />
                      <span>{slot}</span>
                      {isBooked ? (
                        <span className="slot-booked-tag">Booked</span>
                      ) : isSelected ? (
                        <CheckCircle size={13} color="white" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="serviceType">Treatment / Consultation Reason</label>
              <select
                id="serviceType"
                name="serviceType"
                className="form-select"
                value={formData.serviceType}
                onChange={handleChange}
              >
                <option value="General Dental Consultation">General Dental Consultation</option>
                <option value="Teeth Cleaning & Scaling">Teeth Cleaning & Scaling</option>
                <option value="Root Canal Treatment (RCT)">Root Canal Treatment (RCT)</option>
                <option value="Braces & Clear Aligners">Braces & Clear Aligners</option>
                <option value="Teeth Whitening & Smile Makeover">Teeth Whitening & Smile Makeover</option>
                <option value="Dental Implants">Dental Implants</option>
                <option value="Tooth Pain / Emergency">Tooth Pain / Emergency</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">Symptoms / Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                rows="2"
                className="form-textarea"
                placeholder="Mention any existing dental pain or previous medical conditions..."
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>

            <button type="submit" className="form-submit-btn">
              Continue to Payment (₹{feeAmount}) <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          /* ================= STEP 2: PAYMENT GATEWAY CHECKOUT ================= */
          <form onSubmit={handleFinalPaymentAndBooking}>
            {/* Consultation Fee Order Summary */}
            <div className="payment-order-summary">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Doctor Consultation:</span>
                <strong>{activeDoctor?.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Schedule:</span>
                <span>{formData.date} at {formData.timeSlot}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Total Consultation Fee:</span>
                <strong style={{ fontSize: '1.3rem', color: '#0284c7' }}>₹{feeAmount}</strong>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Choose Payment Method</label>
              <div className="payment-methods-grid">
                <label className={`payment-method-card ${formData.paymentMethod === 'UPI' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={formData.paymentMethod === 'UPI'}
                    onChange={handleChange}
                  />
                  <div className="pay-card-content">
                    <QrCode size={20} color="#0284c7" />
                    <div>
                      <div className="pay-title">UPI / QR (Instant)</div>
                      <div className="pay-sub">GPay, PhonePe, Paytm, BHIM</div>
                    </div>
                  </div>
                </label>

                <label className={`payment-method-card ${formData.paymentMethod === 'Debit/Credit Card' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Debit/Credit Card"
                    checked={formData.paymentMethod === 'Debit/Credit Card'}
                    onChange={handleChange}
                  />
                  <div className="pay-card-content">
                    <CreditCard size={20} color="#0d9488" />
                    <div>
                      <div className="pay-title">Debit / Credit Card</div>
                      <div className="pay-sub">Visa, MasterCard, RuPay</div>
                    </div>
                  </div>
                </label>

                <label className={`payment-method-card ${formData.paymentMethod === 'Net Banking' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Net Banking"
                    checked={formData.paymentMethod === 'Net Banking'}
                    onChange={handleChange}
                  />
                  <div className="pay-card-content">
                    <Building2 size={20} color="#d97706" />
                    <div>
                      <div className="pay-title">Net Banking</div>
                      <div className="pay-sub">HDFC, SBI, ICICI, Axis</div>
                    </div>
                  </div>
                </label>

                <label className={`payment-method-card ${formData.paymentMethod === 'Pay at Clinic' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Pay at Clinic"
                    checked={formData.paymentMethod === 'Pay at Clinic'}
                    onChange={handleChange}
                  />
                  <div className="pay-card-content">
                    <Wallet size={20} color="#64748b" />
                    <div>
                      <div className="pay-title">Pay at Clinic</div>
                      <div className="pay-sub">Cash or Card on Arrival</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Conditional Sub-inputs for payment methods */}
            {formData.paymentMethod === 'UPI' && (
              <div className="payment-sub-box">
                <label className="form-label">Enter UPI ID</label>
                <input
                  type="text"
                  name="upiId"
                  className="form-input"
                  placeholder="e.g. rahul@okhdfcbank"
                  value={formData.upiId}
                  onChange={handleChange}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                  A payment request of ₹{feeAmount} will be triggered to your UPI App.
                </p>
              </div>
            )}

            {formData.paymentMethod === 'Debit/Credit Card' && (
              <div className="payment-sub-box">
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    className="form-input"
                    placeholder="4532 •••• •••• 8921"
                    maxLength={19}
                    value={formData.cardNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-row">
                  <div>
                    <label className="form-label">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      name="cardExpiry"
                      className="form-input"
                      placeholder="12/28"
                      maxLength={5}
                      value={formData.cardExpiry}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">CVV</label>
                    <input
                      type="password"
                      name="cardCvv"
                      className="form-input"
                      placeholder="•••"
                      maxLength={3}
                      value={formData.cardCvv}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontSize: '0.8rem', margin: '16px 0 20px', background: '#f0fdf4', padding: '10px', borderRadius: '8px' }}>
              <Lock size={15} />
              <span>256-Bit SSL Encrypted Healthcare Payment Gateway</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="form-submit-btn"
                style={{ flex: 2, marginTop: 0 }}
                disabled={loading}
              >
                {loading ? (
                  'Authorizing Payment...'
                ) : (
                  <>
                    <Sparkles size={18} /> Pay ₹{feeAmount} & Confirm
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
