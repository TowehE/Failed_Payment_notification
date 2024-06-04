const userModel = require("../models/userModel")
const walletModel = require("../models/walletModel")
const {sendEmail} = require("../email")
const { inSufficientFundEmail } = require("../insufficientfundHTML")
const jwt = require('jsonwebtoken')
const twilio = require("twilio")
const { CronJob } = require("cron")
const nodemailer = require("nodemailer")
const { validateWallet } = require("../helpers/validator")
require('dotenv').config()

// my mobile number
const twiliomobileNumber = process.env.twiliomobileNumber

// Initialize Twilio client
const client = twilio(process.env.twilioAccountSid,
    process.env.twilioAuthToken);

// Function to handle deposits
exports.deposit = async (req, res) => {
  try {
      // Validate the request body
      const { error } = validateWallet(req.body);
      if (error) {
          return res.status(400).json({
              message: error.details[0].message
          });
      }

      // Extract amount and email from request body
      const { amount, email } = req.body;

      // Validate the amount
      if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
          console.error('Invalid amount:', amount); // Log the invalid amount
          return res.status(400).json({
              message: "Amount must be a valid positive number"
          });
      }

      // Find the user by email
      const user = await userModel.findOne({ email: email.toLowerCase() });
      if (!user) {
          return res.status(404).json({
              message: "User not found",
          });
      }

  
      
      // Validate the user's balance
      if (typeof user.balance !== 'number' || isNaN(user.balance) || !isFinite(user.balance)) {
          console.error('Invalid user balance:', user.balance); // Log the invalid balance
          return res.status(400).json({
              message: "User balance is invalid"
          });
      }

      // Calculate the new balance after deposit
      const addMoney = user.balance + amount;


      // Update user's balance and save
      user.balance = addMoney;
      await user.save();

      // Create a new transaction
      const transaction = new walletModel({
          user: user._id,
          amount: amount,
          balance: user.balance
      });

      // Save the transaction
      await transaction.save();

      // Notification message
      const msg = `Hi ${user.firstName} ${user.lastName.slice(0, 1).toUpperCase()}, you just deposited ${amount} to your balance.`;

      // Email HTML content
      const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #333;">Deposit Notification</h2>
              <p>Dear ${user.firstName} ${user.lastName.slice(0, 1).toUpperCase()}.,</p>
              <p>You have successfully deposited <strong>${amount}</strong> to your balance.</p>
              <p>Current Balance: <strong>${user.balance}</strong></p>
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
                  from: twiliomobileNumber,
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
      } else if (user.notificationPreference === "email") {
          // Send email notification
          const subject = "Deposit Notification";
          sendEmail({
              email: user.email,
              html,
              subject
          }).then(() => {
              res.status(200).json({
                  message: 'Deposit sent successfully',
              });
          }).catch((error) => {
              console.error('Failed to send email:', error);
              return res.status(500).json({
                  message: "Failed to send email notification: " + error.message,
              });
          });
      } else {
          // If no notification preference set
          res.status(200).json({
              message: 'Deposit made successfully, but no notification preference set',
          });
      }
  } catch (error) {
      console.error('Internal Server Error:', error);
      return res.status(500).json({
          message: "Internal Server Error: " + error.message,
      });
  }
};


// function to get balance
exports.getBalance = async (req, res) => {
  try {
      // get user ID from req.params
      const userId = req.params.userId;

      // Find the user  by user ID
      const user = await userModel.findById(userId);

      // If user not found, return appropriate response
      if (!user) {
          return res.status(404).json({
              message: "User not found",
          });
      }

      // get  user  balance
      const balance = user.balance;

      // Return the balance in the response
      return res.status(200).json({
          balance: balance,
      });
  } catch (error) {
      console.error('Internal Server Error:', error);
      return res.status(500).json({
          message: "Internal Server Error: " + error.message,
      });
  }}


exports.withdraw = async (req, res) => {
  try {
      // get user ID from req.params
      const userId = req.params.userId;

      // get amount to withdraw from req.body
      const { amount } = req.body;

      // Find the user  by user ID
      const user = await userModel.findById(userId);

      // If user not found, return appropriate response
      if (!user) {
          return res.status(404).json({
              message: "User not found",
          });
      }

      // Ensure the amount to withdraw is a positive number
      if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
          return res.status(400).json({
              message: "Invalid amount to withdraw",
          });
      }

      // Check if user has sufficient balance
      if (user.balance < amount) {
          return res.status(400).json({
              message: "Insufficient balance",
          });
      }

      // Deduct the withdrawn amount from user's balance
      user.balance -= amount;

      // Save the updated user 
      await user.save();

      // Return success response
      return res.status(200).json({
          message: "Withdrawal successful",
          newBalance: user.balance,
      });
  } catch (error) {
      console.error('Internal Server Error:', error);
      return res.status(500).json({
          message: "Internal Server Error: " + error.message,
      });
  }
};