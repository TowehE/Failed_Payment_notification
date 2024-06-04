// Import the database configuration
require('./dbConfig/dbConfig');

// Import the Express frameworkration
const express = require('express');

// Load environment variables from a .env file
require('dotenv').config();
const { job } = require('./controller/notificationController');
job.start();

const bodyParser = require('body-parser');

const twilio = require('twilio');

// Import the user-defined router for handling user-related routes
const userRouter = require('./router/userRouter');
const wallerRouter = require('./router/walletRouter');
const paymentRouter = require("./router/paymentRouter");

 // Create an instance of the Express application
const app = express();

 // Retrieve the port number from environment variables
const port = process.env.PORT;
const cors = require("cors");

app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to parse JSON request bodies
app.use(express.json());

app.use(cors("*"));


// twilio configuration
const twilioAccountSid = process.env.twilioAccountSid
const twilioAuthToken = process.env.twilioAuthToken
const twiliomobileNumber = process.env.twiliomobileNumber
const client = twilio(twilioAccountSid, twilioAuthToken);

// Middleware to add Twilio client to requests
app.use((req, res, next) => {
    req.twilioClient = client;
    next();
});

// Define a simple GET route at the root of the API that sends a welcome message
app.get('/api/v1', (req, res) => {
    res.send("Welcome to automaated notification API");
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    return res.status(500).send({ error: 'Something went wrong!' });
});

// Use the user-defined router for handling routes prefixed with /api/v1
app.use('/api/v1', userRouter);
app.use('/api/v1', wallerRouter);
app.use('/', paymentRouter);

// Start the Express server and log a message when the server is up and running
app.listen(port, () => {
    console.log(`Server up and running on port: ${port}`);
})




