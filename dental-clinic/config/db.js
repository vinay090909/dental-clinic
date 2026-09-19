const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let isDBConnected = false;
let mongoServer = null;

const initialDoctors = [
    {
        id: 1,
        name: "Dr. Vinay Sharma",
        clinicName: "Vinay Dental Care",
        specialization: "General Dentist & Implantologist",
        experience: 5,
        rating: 4.9,
        reviewsCount: 128,
        qualification: "BDS, MDS - Oral Implantology",
        availability: "Mon - Sat (10:00 AM - 7:00 PM)",
        consultationFee: 500,
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80"
    },
    {
        id: 2,
        name: "Dr. Ananya Verma",
        clinicName: "Verma Smile Clinic",
        specialization: "Orthodontist & Smile Designer",
        experience: 8,
        rating: 4.8,
        reviewsCount: 94,
        qualification: "BDS, MDS - Orthodontics",
        availability: "Tue - Sun (11:00 AM - 8:00 PM)",
        consultationFee: 700,
        image: "https://images.unsplash.com/photo-1594824813629-455b88f34149?w=400&auto=format&fit=crop&q=80"
    },
    {
        id: 3,
        name: "Dr. Rohan Malhotra",
        clinicName: "Metro Dental & Kids Clinic",
        specialization: "Pediatric & Cosmetic Dentist",
        experience: 6,
        rating: 4.9,
        reviewsCount: 112,
        qualification: "BDS, Fellowship in Pediatric Dentistry",
        availability: "Mon - Fri (9:00 AM - 5:00 PM)",
        consultationFee: 600,
        image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80"
    }
];

const seedInitialData = async () => {
    try {
        const Doctor = require('../models/Doctor');
        const User = require('../models/User');
        const Appointment = require('../models/Appointment');

        // Seed Doctors
        const doctorCount = await Doctor.countDocuments();
        if (doctorCount === 0) {
            await Doctor.insertMany(initialDoctors);
            console.log('🌱 Seeded 3 clinic doctors into MongoDB');
        }

        // Seed Demo Patient (rahul@example.com)
        const patientExists = await User.findOne({ email: 'rahul@example.com' });
        if (!patientExists) {
            const patientPassword = await bcrypt.hash('password123', 10);
            await User.create({
                name: 'Rahul Verma',
                email: 'rahul@example.com',
                phone: '+91 98765 43210',
                password: patientPassword,
                role: 'patient'
            });
            console.log('🌱 Seeded Demo Patient: rahul@example.com (pass: password123)');
        }

        // Seed Administrator (admin@smilecare.com)
        const adminExists = await User.findOne({ email: 'admin@smilecare.com' });
        if (!adminExists) {
            const adminPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Dr. Vinay (Admin)',
                email: 'admin@smilecare.com',
                phone: '+91 98000 11223',
                password: adminPassword,
                role: 'admin'
            });
            console.log('🌱 Seeded Master Administrator: admin@smilecare.com (pass: admin123)');
        }

        // Seed Sample Appointment
        const appointmentCount = await Appointment.countDocuments();
        if (appointmentCount === 0) {
            await Appointment.create({
                appointmentId: 'APT-1001',
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
                status: 'Confirmed'
            });
            console.log('🌱 Seeded initial appointment into MongoDB');
        }
    } catch (err) {
        console.error('Data seeding error:', err.message);
    }
};

const connectDB = async () => {
    let mongoURI = process.env.MONGO_URI;

    // 1. If explicit Atlas or external URI is provided, try connecting to it first
    if (mongoURI && (mongoURI.includes('mongodb+srv') || !mongoURI.includes('127.0.0.1'))) {
        try {
            console.log(`⏳ Connecting to external MongoDB cluster...`);
            const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 4000 });
            isDBConnected = true;
            console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
            await seedInitialData();
            return;
        } catch (err) {
            console.log(`⚠️ External MongoDB not reachable (${err.message}). Trying embedded MongoDB...`);
        }
    }

    // 2. Try local MongoDB service if available
    try {
        const localURI = 'mongodb://127.0.0.1:27017/dental_clinic';
        const conn = await mongoose.connect(localURI, { serverSelectionTimeoutMS: 1500 });
        isDBConnected = true;
        console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
        await seedInitialData();
        return;
    } catch (err) {
        // Local service not running, proceed to embedded MongoMemoryServer
    }

    // 3. Start Zero-Config Embedded MongoDB Server
    try {
        console.log('⏳ Starting Zero-Config Embedded MongoDB Engine...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        const conn = await mongoose.connect(uri);
        isDBConnected = true;
        console.log(`✅ Real MongoDB Engine Running & Connected: ${conn.connection.host}`);
        console.log(`📂 Collections, Indexes & BSON documents are active in MongoDB!`);
        await seedInitialData();
    } catch (embeddedErr) {
        console.error('⚠️ Embedded MongoDB failed to start:', embeddedErr.message);
        isDBConnected = false;
        console.log('🚀 Running in smart memory fallback mode');
    }
};

module.exports = {
    connectDB,
    isDBConnected: () => isDBConnected,
    initialDoctors
};
