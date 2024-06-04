**Automatic Balance Deduction and Notification System**


This project implements a system for automatically deducting funds from user balances and sending notifications if their balance is insufficient.

**Features:**

•	Scheduled 20 minutes to runs cron job to automatically deducts a fixed amount from all user balances every 10 minutes.
• Automatically deducts a fixed amount from user balances at regular intervals.
•	User notification based on preferred method (phone or email).
•	SMS notifications via Twilio (requires Twilio account and credentials).
•	Email notifications via Nodemailer (requires email configuration).




**Technology Stack:**
  •	Node.js (assumed)
  •	Libraries: Express.js
  •	Database: monogoDb
 • JWT (JSON Web Tokens) for authentication
  •bcrypt for password hashing
  •Nodemailer for sending emails
  •Joi Schema for data validation




**Requirements**

•	UserAuthentication
•	User model with attributes like balance and notificationPreference
•	Function (in insufficientfundHTML.js) to generate HTML template for email notification
•	Twilio account (for SMS notifications)
•	Email service provider and credentials (for email notifications)

**Setup:**

1.	Clone or download the project.
2.	Install dependencies: npm install 
3.	Configure environment variables in .env file: 
o	twiliomobileNumber: Your mobile number for SMS notifications.
o	twilioAccountSid and twilioAuthToken: Twilio account credentials.
o	Email configuration (service, user, and emailPassword).
4.	Update inSufficientFundEmail function in insufficientfundHTML.js 

Usage:
1.	Start the scheduled job: npm run dev

