const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Configure your email service (use environment variables for production)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

app.post('/notify', async (req, res) => {
  const { email, productTitle, productUrl, oldPrice, newPrice } = req.body;
  if (!email || !productTitle || !productUrl || !oldPrice || !newPrice) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: `Price Drop Alert: ${productTitle}`,
      html: `<h2>Price Drop Alert!</h2>
        <p><b>${productTitle}</b> has dropped in price.</p>
        <p>Old Price: <b>₹${oldPrice}</b><br>New Price: <b>₹${newPrice}</b></p>
        <p><a href="${productUrl}">View Product</a></p>`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('FineDeal Email Notification Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
