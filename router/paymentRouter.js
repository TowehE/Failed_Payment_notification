const express = require('express');
const router = express.Router();
const { paymentIntent, webhook, startPayment } = require('../controller/paymentGateway');

// Route to create a payment intent
router.post('/create-payment-intent', paymentIntent);

// Route to handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

// Route to serve the payment form
router.get('/start-payment', startPayment);

module.exports = router;
