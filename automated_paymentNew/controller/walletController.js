const userModel = require("../models/userModel")
const walletModel = require("../models/walletModel")
const {sendEmail} = require("../email")
const { inSufficientFundEmail } = require("../insufficientfundHTML")
const jwt = require('jsonwebtoken')
const twilio = require("twilio")
const { CronJob } = require("cron")
const nodemailer = require("nodemailer")
require('dotenv').config()

// my mobile number
const twiliomobileNumber = process.env.twiliomobileNumber

// Initialize Twilio client
const client = twilio(process.env.twilioAccountSid,
    process.env.twilioAuthToken);


//function to get deposit money
exports.deposit = async (req, res) => {
    try {

        // const userId = req.params.userId
        //get the amount in the body
        const { amount, email } = req.body

        const user = await userModel.findOne({email: email.toLowerCase()})
        if (!user) {
            return res.status(404).json({
                message: "user not found",
            })
        }

        //deduct money from withdrawal balance
        const addMoney = user.balance + amount
        user.balance = addMoney
        await user.save()

        //save the transaction 
        const transaction = new walletModel({
            user: user._id,
            amount: `${amount}`,
            balance: addMoney
        })

        await transaction.save()

        // create a notification msg for the sender and save

        // customize the notification msg
        const msg = `hi ${user.firstName} ${user.lastName.slice(0, 1).toUpperCase()}, you just deposited ${amount} to your balance`


            // the email message
            const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #333;">Deposit Notification</h2>
                <p>Dear ${user.firstName} ${user.lastName.slice(0, 1).toUpperCase()}.,</p>
                <p>You have successfully deposited <strong>${amount}</strong> to your balance.</p>
                <p>Current Balance: <strong>${addMoney}</strong></p>
                <p>Thank you for using our service!</p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 0.9em; color: #999;">If you have any questions, please contact our support team.</p>
            </div>
        `;

           // Send notification based on user's preference
    if (user.notificationPreference === 'phone') {
        // Send SMS notification
        const phoneNumber = user.phoneNumber;
        client.messages
          .create({
            body: msg,
            from: process.env.twiliomobileNumber,
            to: phoneNumber,
          })
          .then((message) => {
            console.log('Message sent successfully:', message.sid);
            res.status(200).json({
              message: 'Deposit sent successfully',
            });
          })
          .catch((error) => {
            console.error('Failed to send message:', error);
            return res.status(500).json({
              message: "Failed to send notification: " + error.message,
            });
          });
      } else if (user.notificationPreference === 'email') {
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
            subject: 'Deposit Funds',
           html:html,
        };
        await transporter.sendMail(mailOptions);
    }
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        });
    }
}