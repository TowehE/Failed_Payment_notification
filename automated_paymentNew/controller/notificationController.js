const userModel = require ("../models/userModel")
const{inSufficientFundEmail} = require("../insufficientfundHTML")
const jwt = require('jsonwebtoken')
const twilio = require ("twilio")
const { CronJob } = require("cron")
const nodemailer = require("nodemailer")
require('dotenv').config()

// my mobile number
const twiliomobileNumber =process.env.twiliomobileNumber

// Initialize Twilio client
const client = twilio(process.env.twilioAccountSid, 
    process.env.twilioAuthToken);


// Function to send notification
async function sendNotification(user) {
    try {
        if (user.notificationPreference === "phone") {
            // Send SMS notification using Twilio
            await client.messages.create({
                body: 'Your account balance is insufficient.',
                to: user.phoneNumber,
                from: process.env.twiliomobileNumber 
            });
            console.log('SMS notification sent to', user.phoneNumber);
        } else if (user.notificationPreference === "email") {
            // Send email notification
            const transporter = nodemailer.createTransport({
                service:process.env.service,
                 auth: {
                   user: process.env.user,
                   pass: process.env.emailPassword,
                  
                 },
               });
                
            const mailOptions = {
                from: process.env.user,
                to: user.email,
                subject: 'Insufficient Funds',
                html: inSufficientFundEmail(user.firstName,)
            };
            await transporter.sendMail(mailOptions);
            console.log('Email notification sent to', user.email);
        } else {
            console.log('No notification method specified for user', user.userId);
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}



// Scheduled job to automatically deduct money from all user balances
const job = new CronJob('*/5 * * * *', async () => { 
    try {
        console.log('Automatic deduction job started.');
        const users = await userModel.find();

        // Update balances for all users
        for (const user of users) {
            const deductionAmount = 4000;

            if (user.balance < deductionAmount) {
                await sendNotification(user); 
            } else {
                user.balance -= deductionAmount;
                await user.save();
                console.log(`Deducted ${deductionAmount} from user ${user.firstName}. New balance: ${user.balance}`);
            }
        }
        console.log('Automatic deduction completed.');
    } catch (error) {
        console.error('Scheduled job error:', error);
    }
});

module.exports = {
    job
}

