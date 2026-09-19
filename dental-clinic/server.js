require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { connectDB, isDBConnected, initialDoctors } = require('./config/db');
const { sendBookingConfirmationEmail } = require('./utils/emailService');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'smilecare_jwt_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// In-Memory Fallback Stores (if database is unavailable)
let memoryUsers = [
    {
        id: 'USR-101',
        name: 'Rahul Verma',
        email: 'rahul@example.com',
        phone: '+91 98765 43210',
        password: bcrypt.hashSync('password123', 10),
        role: 'patient',
        createdAt: new Date().toISOString()
    },
    {
        id: 'USR-ADMIN',
        name: 'Dr. Vinay (Admin)',
        email: 'admin@smilecare.com',
        phone: '+91 98000 11223',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        createdAt: new Date().toISOString()
    }
];

let memoryDoctors = [...initialDoctors];

let memoryAppointments = [
    {
        appointmentId: 'APT-1001',
        id: 'APT-1001',
        userId: 'USR-101',
        userEmail: 'rahul@example.com',
        patientName: 'Rahul Verma',
        phone: '+91 98765 43210',
        doctorId: 1,
        doctorName: 'Dr. Vinay Sharma',
        date: '2026-09-22',
        timeSlot: '11:00 AM',
        serviceType: 'Teeth Cleaning & Polishing',
        notes: 'Regular checkup & mild sensitivity',
        status: 'Confirmed',
        consultationFee: 500,
        amountPaid: 500,
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        transactionId: 'TXN-84920194',
        createdAt: new Date().toISOString()
    }
];

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. Please login to continue.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (isDBConnected()) {
            const dbUser = await User.findById(decoded.id).select('-password');
            if (dbUser) {
                req.user = {
                    id: dbUser._id.toString(),
                    name: dbUser.name,
                    email: dbUser.email,
                    phone: dbUser.phone,
                    role: dbUser.role || 'patient'
                };
                return next();
            }
        }

        // Check in-memory store
        const memUser = memoryUsers.find(u => u.id === decoded.id || u.email === decoded.email);
        if (!memUser) {
            return res.status(401).json({ message: 'User session expired or not found. Please log in again.' });
        }

        req.user = {
            id: memUser.id,
            name: memUser.name,
            email: memUser.email,
            phone: memUser.phone,
            role: memUser.role || 'patient'
        };
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' });
    }
};

// Admin Role Check Middleware
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }
    next();
};

// Root Healthcheck & Status
app.get('/', (req, res) => {
    res.json({
        status: 'Online',
        service: 'SmileCare Dental Clinic Backend',
        database: isDBConnected() ? 'MongoDB (Active & Connected)' : 'In-Memory Fallback (Active)',
        timestamp: new Date().toISOString()
    });
});

// ================= AUTH ROUTES ================= //

// User Sign Up
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields (name, email, phone, password) are required.' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (isDBConnected()) {
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
            }
        } else {
            const existingUser = memoryUsers.find(u => u.email === normalizedEmail);
            if (existingUser) {
                return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let userResponse = null;
        let userId = null;

        if (isDBConnected()) {
            const newUser = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                phone: phone.trim(),
                password: hashedPassword,
                role: 'patient'
            });
            userId = newUser._id.toString();
            userResponse = {
                id: userId,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role
            };
        } else {
            userId = `USR-${Date.now().toString().slice(-4)}`;
            const newUser = {
                id: userId,
                name: name.trim(),
                email: normalizedEmail,
                phone: phone.trim(),
                password: hashedPassword,
                role: 'patient',
                createdAt: new Date().toISOString()
            };
            memoryUsers.push(newUser);
            userResponse = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role
            };
        }

        const token = jwt.sign(
            { id: userId, email: userResponse.email, name: userResponse.name, role: userResponse.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: userResponse
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide both email and password.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = null;
        let userId = null;

        if (isDBConnected()) {
            user = await User.findOne({ email: normalizedEmail });
            if (user) userId = user._id.toString();
        }

        if (!user) {
            user = memoryUsers.find(u => u.email === normalizedEmail);
            if (user) userId = user.id;
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const role = user.role || 'patient';

        const token = jwt.sign(
            { id: userId, email: user.email, name: user.name, role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: userId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Get Current Logged-in User Profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// ================= DOCTORS ROUTES ================= //

// Get all doctors
app.get('/api/doctors', async (req, res) => {
    try {
        if (isDBConnected()) {
            const dbDoctors = await Doctor.find().sort({ id: 1 });
            if (dbDoctors.length > 0) {
                return res.json(dbDoctors);
            }
        }
        res.json(memoryDoctors);
    } catch (err) {
        console.error('Fetch doctors error:', err);
        res.json(memoryDoctors);
    }
});

// Get doctor by ID
app.get('/api/doctors/:id', async (req, res) => {
    const id = req.params.id;

    try {
        if (isDBConnected()) {
            const dbDoctor = await Doctor.findOne({ id: Number(id) });
            if (dbDoctor) return res.json(dbDoctor);
        }

        const doctor = memoryDoctors.find((doc) => doc.id == id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching doctor details' });
    }
});

// Get Booked Time Slots for a Doctor on a Specific Date (Slot Collision Prevention API)
app.get('/api/doctors/:id/booked-slots', async (req, res) => {
    try {
        const doctorId = Number(req.params.id);
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date parameter is required.' });
        }

        let bookedSlots = [];

        if (isDBConnected()) {
            const activeAppointments = await Appointment.find({
                doctorId,
                date,
                status: { $ne: 'Cancelled' }
            }).select('timeSlot');
            bookedSlots = activeAppointments.map(a => a.timeSlot);
        } else {
            bookedSlots = memoryAppointments
                .filter(a => a.doctorId === doctorId && a.date === date && a.status !== 'Cancelled')
                .map(a => a.timeSlot);
        }

        res.json({
            doctorId,
            date,
            bookedSlots
        });
    } catch (err) {
        console.error('Fetch booked slots error:', err);
        res.status(500).json({ message: 'Failed to retrieve booked slots.' });
    }
});

// Add a new doctor (Admin Only)
app.post('/api/doctors', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, specialization, experience, consultationFee, availability, qualification, clinicName, image } = req.body;

        if (!name || !specialization || !experience) {
            return res.status(400).json({ message: 'Name, specialization, and experience are required.' });
        }

        const nextId = Date.now();
        const doctorData = {
            id: nextId,
            name: name.trim(),
            specialization: specialization.trim(),
            experience: Number(experience),
            consultationFee: Number(consultationFee) || 600,
            availability: availability || 'Mon - Sat (10:00 AM - 6:00 PM)',
            qualification: qualification || 'BDS, MDS',
            clinicName: clinicName || 'SmileCare Specialist Wing',
            rating: 5.0,
            reviewsCount: 1,
            image: image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'
        };

        if (isDBConnected()) {
            const dbDoc = await Doctor.create(doctorData);
            return res.status(201).json({ message: 'Doctor added successfully to database!', doctor: dbDoc });
        }

        memoryDoctors.push(doctorData);
        res.status(201).json({ message: 'Doctor added successfully!', doctor: doctorData });
    } catch (err) {
        console.error('Add doctor error:', err);
        res.status(500).json({ message: 'Failed to add doctor.' });
    }
});

// Delete a doctor (Admin Only)
app.delete('/api/doctors/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (isDBConnected()) {
            await Doctor.deleteOne({ id });
        }
        memoryDoctors = memoryDoctors.filter(d => d.id !== id);

        res.json({ message: 'Doctor removed successfully from clinic roster.' });
    } catch (err) {
        console.error('Delete doctor error:', err);
        res.status(500).json({ message: 'Failed to delete doctor.' });
    }
});

// ================= APPOINTMENTS ROUTES ================= //

// Get appointments
app.get('/api/appointments', async (req, res) => {
    const { userId } = req.query;

    try {
        if (isDBConnected()) {
            const filter = userId ? { userId } : {};
            const dbAppointments = await Appointment.find(filter).sort({ createdAt: -1 });
            const formatted = dbAppointments.map(apt => ({
                id: apt.appointmentId,
                ...apt.toObject()
            }));
            return res.json(formatted);
        }

        if (userId) {
            const userAppointments = memoryAppointments.filter(apt => apt.userId === userId);
            return res.json(userAppointments);
        }
        res.json(memoryAppointments);
    } catch (err) {
        console.error('Fetch appointments error:', err);
        res.json(memoryAppointments);
    }
});

// Book a new appointment (Protected + Slot Collision Guard + Payment Gateway + Email Receipt)
app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { patientName, phone, doctorId, date, timeSlot, serviceType, notes, paymentMethod } = req.body;

        if (!patientName || !phone || !doctorId || !date || !timeSlot) {
            return res.status(400).json({
                message: 'Please fill in all required fields (patient name, phone, doctor, date, time slot).'
            });
        }

        let doctorName = 'Clinic Specialist';
        let consultationFee = 500;

        if (isDBConnected()) {
            const doc = await Doctor.findOne({ id: Number(doctorId) });
            if (doc) {
                doctorName = doc.name;
                consultationFee = doc.consultationFee || 500;
            }
        } else {
            const doc = memoryDoctors.find(d => d.id == doctorId);
            if (doc) {
                doctorName = doc.name;
                consultationFee = doc.consultationFee || 500;
            }
        }

        // ================= SLOT COLLISION PREVENTION ================= //
        let isSlotAlreadyTaken = false;
        if (isDBConnected()) {
            const collision = await Appointment.findOne({
                doctorId: Number(doctorId),
                date,
                timeSlot,
                status: { $ne: 'Cancelled' }
            });
            if (collision) isSlotAlreadyTaken = true;
        } else {
            const collision = memoryAppointments.find(
                a => a.doctorId === Number(doctorId) && a.date === date && a.timeSlot === timeSlot && a.status !== 'Cancelled'
            );
            if (collision) isSlotAlreadyTaken = true;
        }

        if (isSlotAlreadyTaken) {
            return res.status(409).json({
                message: `The ${timeSlot} time slot for ${doctorName} on ${date} has already been reserved by another patient. Please choose a different time slot or date.`
            });
        }

        // ================= PAYMENT GATEWAY PROCESSING ================= //
        const selectedPaymentMethod = paymentMethod || 'UPI';
        const paymentStatus = selectedPaymentMethod === 'Pay at Clinic' ? 'Pending' : 'Paid';
        const transactionId = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
        const appointmentId = `APT-${1000 + (isDBConnected() ? (await Appointment.countDocuments()) : memoryAppointments.length) + 1}`;

        const appointmentData = {
            id: appointmentId,
            appointmentId,
            userId: req.user.id,
            userEmail: req.user.email,
            patientName: patientName.trim(),
            phone: phone.trim(),
            doctorId: Number(doctorId),
            doctorName,
            date,
            timeSlot,
            serviceType: serviceType || 'General Dental Consultation',
            notes: notes || 'None',
            status: 'Confirmed',
            consultationFee,
            amountPaid: consultationFee,
            paymentMethod: selectedPaymentMethod,
            paymentStatus,
            transactionId,
            createdAt: new Date().toISOString()
        };

        let savedAppointment = null;

        if (isDBConnected()) {
            const newDbAppointment = await Appointment.create(appointmentData);
            savedAppointment = {
                id: newDbAppointment.appointmentId,
                ...newDbAppointment.toObject()
            };
        } else {
            memoryAppointments.unshift(appointmentData);
            savedAppointment = appointmentData;
        }

        // ================= EMAIL RECEIPT NOTIFICATION ================= //
        // Trigger automated email confirmation in background
        sendBookingConfirmationEmail(savedAppointment).catch(err => {
            console.error('Email notification background error:', err.message);
        });

        res.status(201).json({
            message: 'Appointment booked successfully! Payment processed & confirmation email sent.',
            appointment: savedAppointment
        });
    } catch (err) {
        console.error('Booking error:', err);
        res.status(500).json({ message: 'Failed to process appointment booking.' });
    }
});

// Update appointment status (Admin Only)
app.put('/api/appointments/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { status } = req.body;

        if (!['Confirmed', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be Confirmed, Completed, or Cancelled.' });
        }

        if (isDBConnected()) {
            const updated = await Appointment.findOneAndUpdate(
                { appointmentId },
                { status },
                { new: true }
            );
            if (!updated) {
                return res.status(404).json({ message: 'Appointment not found in database.' });
            }
            return res.json({ message: `Status updated to ${status}`, appointment: updated });
        }

        const target = memoryAppointments.find(a => a.id === appointmentId || a.appointmentId === appointmentId);
        if (!target) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }
        target.status = status;

        res.json({ message: `Status updated to ${status}`, appointment: target });
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ message: 'Failed to update appointment status.' });
    }
});

// Start Server & Connect Database
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    await connectDB();
});