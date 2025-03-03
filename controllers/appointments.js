const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Dentist = require('../models/Dentist');
const { sendEmailReminder } = require('../services/mail');


exports.getAppointments = async(req, res, next) => {
    let query;

    // users can only see their appointments
    if (req.user.role !== 'admin') {
        query = Appointment.find({ user: req.user.id }).populate({
            path: 'dentist',
            select: 'name yearOfEx areaOfExpertise'
        });
    } else { // if admin, can see all
        if (req.params.dentistId) {
            console.log(req.params.dentistId);
            query = Appointment.find({ dentist: req.params.dentistId , status:"upcoming"}).populate({
                path: 'dentist',
                select: 'name yearOfEx areaOfExpertise'
            });
        } else {
            query = Appointment.find().populate({
                path: 'dentist',
                select: 'name yearOfEx areaOfExpertise'
            });
        }
    }

    try {
        const appointments = await query;
        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot find Appointment" });
    }
};

exports.getAppointment = async(req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id).populate({
            path: 'dentist',
            select: 'name yearOfEx areaOfExpertise'
        });
        if (!appointment) { return res.status(404).json({ success: false, message: `No appointment with the id of ${req.params.id}` }); }
        res.status(200).json({ success: true, data: appointment });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot find Appointment" });
    }
};

exports.addAppointment = async(req, res, next) => {
    try {
        req.body.dentist = req.params.dentistId;
        const dentist = await Dentist.findById(req.params.dentistId);

        if (!dentist) {
            return res.status(404).json({
                success: false,
                message: `No dentist with the id of ${req.params.dentistId}`
            });
        }

        // add user ID to req.body  
        req.body.user = req.user.id;

        // const now = new Date();
        // const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);  
        // console.log("localTime  time:", localTime );

        const matchAppointment = await Appointment.findOne({ 
            apptDate: req.body.apptDate, 
            dentist: req.body.dentist 
        });
        
        if(matchAppointment){
            return res.status(400).json({ success: false, message: `The Doctor is not avalible at this time that you have booked` });  
        }
        
        // Check for existed appointment  
        const existedAppointments = await Appointment.find({ user: req.user.id });

        const user = await User.findById({ _id: req.user.id });
        console.log(user)

        if (existedAppointments.length >= 100 && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} has already made 1 appointments` });
        }

        const appointment = await Appointment.create(req.body);

        sendEmailReminder(appointment, user);
        res.status(200).json({ success: true, data: appointment });

    } catch (err) {
        console.log(err);
        if (err.errors && err.errors.apptDate) {
            console.log(err.errors.apptDate.message);
            res.status(400).json({ success: false, message: err.errors.apptDate.message });
        } else {
            console.log(err);
            res.status(400).json({ success: false, message: "Cannot create Appointment" });

        }
    }
};

exports.updateAppointment = async(req, res, next) => {
    try {
        let appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: `No appointment with the id of ${req.params.id}`
            });
        }

        // Make sure user is the appointment owner  
        if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this appointment` });
        }
        appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: appointment });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot update Appointment" });
    }
};


exports.deleteAppointment = async(req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: `No appointment with the id of ${req.params.id}`
            });
        }

        // Make sure user is the appointment owner  
        if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this appointment` });
        }

        await appointment.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot delete Appointment" });
    }
};

exports.updatePastAppointmentsStatus = async() => {
    const time = new Date();
    const now = new Date(time.getTime() + 7 * 60 * 60 * 1000); 
    try {
        await Appointment.updateMany({ apptDate: { $lt: now } }, { $set: { status: 'completed' } });
    } catch (error) {
        console.error('Error updating past appointments status:', error);
    }
};  

const { updatePastAppointmentsStatus } = require('./appointments');


const updateInterval = setInterval(async () => {  
    try {  
        await updatePastAppointmentsStatus();  
        console.log('Appointment statuses updated successfully');  
    } catch (error) {  
        console.error('Error updating appointment statuses:', error);  
    }  
}, 1*1000);
// }, 60000*60*24);