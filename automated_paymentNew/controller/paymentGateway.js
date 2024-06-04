require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Transaction = require("../models/paymentModel");
const userModel = require("../models/userModel")
const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint to create a payment intent
const paymentIntent = async (req, res) => {
    const { email, amount, paymentMethodType } = req.body;

    if (!amount || !paymentMethodType) {
        return res.status(400).send({ error: 'Missing required parameters' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            email,
            amount,
            currency: 'usd',
            payment_method_types: [paymentMethodType],
        });

        return res.status(200).send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        return res.status(500).send({
            error: error.message,
        });
    }
};

// Webhook endpoint to handle Stripe events
const webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful:', paymentIntent.id);

            // Save transaction to the database
            const transaction = new Transaction({
                email: paymentIntent.email,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status
            });

            try {
                await transaction.save();

                const user = await userModel.findOne({email: transaction.email})
                if (!user) {
                    return res.status(400).json({
                        message: "User not found for payment"
                    })
                }
    
                user.balance += transaction.amount

                await user.save();

                console.log('Transaction saved to the database');
            } catch (err) {
                console.error('Error saving transaction:', err.message);
            }
            break;
        // Add more cases to handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ received: true });
};

// Serve the payment form
const startPayment = (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Stripe Payment</title>
            <script src="https://js.stripe.com/v3/"></script>
        </head>
        <body>
            <form id="payment-form">
                <div id="card-element"><!-- A Stripe Element will be inserted here. --></div>
                <button type="submit" id="submit">Pay</button>
                <div id="error-message"></div>
            </form>

            <script>
                const stripe = Stripe('your-publishable-key');
                const elements = stripe.elements();
                const cardElement = elements.create('card');
                cardElement.mount('#card-element');

                const form = document.getElementById('payment-form');
                form.addEventListener('submit', async (event) => {
                    event.preventDefault();

                    const { clientSecret } = await fetch('/create-payment-intent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: 5000, paymentMethodType: 'card' }) // Amount in cents
                    }).then(r => r.json());

                    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                        payment_method: {
                            card: cardElement,
                        }
                    });

                    if (error) {
                        document.getElementById('error-message').textContent = error.message;
                    } else {
                        document.getElementById('error-message').textContent = 'Payment successful!';
                    }
                });
            </script>
        </body>
        </html>
    `);
};

module.exports = {
    paymentIntent,
    webhook,
    startPayment,
};
