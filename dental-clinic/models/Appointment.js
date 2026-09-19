const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    doctorId: {
        type: Number,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: [true, 'Appointment date is required']
    },
    timeSlot: {
        type: String,
        required: [true, 'Time slot is required']
    },
    serviceType: {
        type: String,
        default: 'General Dental Consultation'
    },
    notes: {
        type: String,
        default: 'None'
    },
    status: {
        type: String,
        enum: ['Confirmed', 'Completed', 'Cancelled'],
        default: 'Confirmed'
    },
    // Payment Gateway & Transaction details
    consultationFee: {
        type: Number,
        default: 500
    },
    amountPaid: {
        type: Number,
        default: 500
    },
    paymentMethod: {
        type: String,
        enum: ['UPI', 'Debit/Credit Card', 'Net Banking', 'Pay at Clinic'],
        default: 'UPI'
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Pending'],
        default: 'Paid'
    },
    transactionId: {
        type: String,
        default: ''
    },
    paymentDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
