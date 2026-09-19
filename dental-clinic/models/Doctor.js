const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true
    },
    clinicName: {
        type: String,
        default: 'SmileCare Clinic'
    },
    specialization: {
        type: String,
        required: [true, 'Specialization is required']
    },
    experience: {
        type: Number,
        required: [true, 'Experience years is required']
    },
    rating: {
        type: Number,
        default: 4.9
    },
    reviewsCount: {
        type: Number,
        default: 85
    },
    qualification: {
        type: String,
        default: 'BDS, MDS'
    },
    availability: {
        type: String,
        default: 'Mon - Sat (10:00 AM - 7:00 PM)'
    },
    consultationFee: {
        type: Number,
        default: 500
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
