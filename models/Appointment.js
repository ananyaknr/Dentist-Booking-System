const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    apptDate: {
        type: Date,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    dentist: {
        type: mongoose.Schema.ObjectId,
        ref: 'Dentist'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {  
        type: String,  
        enum: ['completed', 'cancelled', 'upcoming'],  
        default: 'upcoming'  
    } 
});

module.exports = mongoose.model('Appointment', AppointmentSchema);