const mongoose = require('mongoose')

// Transaction Model
const TransactionSchema = new mongoose.Schema({
    email: { type: String, required: true },
    paymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;