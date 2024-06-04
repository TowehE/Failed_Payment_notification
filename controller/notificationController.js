const userModel = require ("../models/userModel")
const{inSufficientFundEmail} = require("../insufficientfundHTML")
const jwt = require('jsonwebtoken')
const twilio = require ("twilio")
const { CronJob } = require("cron")
const nodemailer = require("nodemailer")
const { sendEmail } = require("../email")
require('dotenv').config()

// my mobile number
const twiliomobileNumber =process.env.twiliomobileNumber

// Initialize Twilio client
const client = twilio(process.env.twilioAccountSid, 
    process.env.twilioAuthToken);

    // Flag to indicate if the job is currently running
let isJobRunning = false;


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
          
        } else if (user.notificationPreference === "email") {
            // Send email notification
            const subject= "Insuffcient Funds Notification"
            const html = inSufficientFundEmail(user.firstName)
            sendEmail({
                email:user.email,
                html,
                subject
            })
                
        } else {
            console.log('No notification method specified for user', user.userId);
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}





// Scheduled job to automatically deduct money from all user balances
const job = new CronJob('*/10 * * * *', async () => {
  
    // Check if the job is already running
    if (isJobRunning) {
        console.log('Job is already running. Skipping this instance.');
        return;
    }

    try {
        // Set the flag to indicate that the job is running
        isJobRunning = true;
        console.log('Automatic deduction job started.');
        const users = await userModel.find();

        // Update balances for all users
        for (const user of users) {
            const deductionAmount = 15000000;

            if (user.balance < deductionAmount) {
                await sendNotification(user);
            } else {
                user.balance -= deductionAmount;
                await user.save();
              
            }
        }
        console.log('Automatic deduction completed.');
    } catch (error) {
        console.error('Scheduled job error:', error);
    } finally {
        // Reset the flag after job completion
        isJobRunning = false;
    }
    
});

module.exports = {
    job
};