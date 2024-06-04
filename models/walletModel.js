const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    amount:{
        type : Number,
        required: true
    },
    balance:{
        type : Number,
        default: 0
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
    }

},{timestamps:true})

const walletModel = mongoose.model('wallet', walletSchema)

module.exports  = walletModel