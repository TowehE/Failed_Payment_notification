
const inSufficientFundEmail = (firstName) => {
    return `
 
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stripe Payment</title>
  <script src="(link unavailable)"></script>
</head>
<body>
  <form id="payment-form">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
    <label for="amount">Amount (in cents):</label>
    <input type="number" id="amount" name="amount" required>
    <div id="card-element" class="payment-element"><!-- A Stripe Element will be inserted here. --></div>
    <button type="submit" id="submit">Pay</button>
    <div id="error-message"></div>
  </form>
  <script>
    const stripe = Stripe('pk_test_51PFkKSP2sPHCjntau9AfkYQI44fFbqf79XwAtnbQPTcivCCZ1kpecPKNFk0HoRrj2wZw9rWjDwdVK8b9H19JQbPR00o361EaRI');
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const amount = document.getElementById('amount').value;
      const { clientSecret } = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount }),
        url: '/create-payment-intent',
      }).then(r => r.json());
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });
      const { error, paymentIntent } = result;
      if (error) {
        document.getElementById('error-message').textContent = error.message;
        // Send request to webhook endpoint for error
        fetch('/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.message }),
        });
      } else {
        document.getElementById('error-message').textContent = 'Payment successful!';
        // Send request to webhook endpoint for successful payment
        fetch('/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntent: paymentIntent }),
        });
      }
    });
  </script>
</body>
</html>

    `;
};

module.exports = { inSufficientFundEmail };
