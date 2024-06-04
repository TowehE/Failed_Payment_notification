const inSufficientFundEmail = (firstName) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Insufficient Balance Notification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #007bff;
                }
                p {
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Insufficient Balance Notification</h1>
                <p>Dear ${firstName},</p>
                <p>Your account balance is insufficient. Please add funds to avoid any disruption to your services.</p>
            </div>
        </body>
        </html>
    `;
};

module.exports = { inSufficientFundEmail };
