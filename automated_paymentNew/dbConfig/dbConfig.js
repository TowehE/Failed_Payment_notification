// Import the Mongoose library 
const mongoose = require('mongoose');

// Load environment variables from a .env file
require('dotenv').config();

// Retrieve the database connection string from environment variables
const DB = process.env.db;

// Connect to the MongoDB database using Mongoose
mongoose.connect(DB)
.then(() => {
    console.log('Connection to database established successfully');
})
.catch((error) => {
    console.log('Error connecting to database: ' + error.message);
})




