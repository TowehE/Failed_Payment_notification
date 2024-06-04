const inSufficientFundEmail = (firstName) => {
    const paymentGatewayLink = 'https://paymentgateway-nrlz.onrender.com/start-payment';
  
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    </head>
  <body>
    <div class="container">
      <h1>Insufficient Balance Notification</h1>
      <p>Dear ${firstName},</p>
      <p>Your account balance is insufficient. Please add funds to avoid any disruption to your services.</p>
      <a href="${paymentGatewayLink}">Fund wallet</a>
    </div>
  </body>
  </html>
  `;
  };
  
  module.exports = { inSufficientFundEmail };
  
  