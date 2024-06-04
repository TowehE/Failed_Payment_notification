const userModel = require("../models/userModel")
const walletModel = require("../models/walletModel")
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

        const phoneNumber = user.phoneNumber;
        // Send SMS notification
        client.messages.create({
            body: msg,
            from: process.env.twiliomobileNumber,
            to: phoneNumber
        })
            .then(message => {
                console.log('Message sent successfully:', message.sid);
            })
            .catch(error => {
                console.error('Failed to send message:', error);
                return res.status(500).json({
                    message: "Failed to send notification: " + error.message,
                });
            });

        return res.status(200).json({
            message: 'Deposit sent successfully'
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        });
    }
}