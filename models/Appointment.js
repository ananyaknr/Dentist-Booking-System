const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    apptDate: {
        type: Date,
        required: true,
        validate: {  
            validator: function(value) {  
                return value.getMinutes() === 0 && value.getSeconds() === 0;  
            },  
            message: 'Appointment time must be on the hour (e.g., 10:00, 11:00, etc.).'  
        }  
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