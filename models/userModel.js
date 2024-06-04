const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    }, 
    lastName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    notificationPreference: {
        type: String,
        enum: ['email', 'phone'],   
    },
    token: {
        type: String,
    },
  
    balance: {
        type: Number,
        default: 0,
    },
    blacklist: {
        type: Array,
        default: [],
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'wallet'
    },
  

}, {timestamps: true});

const userModel = mongoose.model('Users', userSchema);

module.exports = userModel;