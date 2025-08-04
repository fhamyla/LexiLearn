const nodemailer = require("nodemailer");

module.exports = async function handler(req, res) {
  console.log('API endpoint called:', req.method, req.url);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log('Request body:', req.body);
  const { email, otp } = req.body;

  if (!email || !otp) {
    console.log('Missing email or otp');
    return res.status(400).json({ error: "Missing email or otp" });
  }

  // Check if environment variables are set
  console.log('Checking environment variables...');
  console.log('GMAIL_EMAIL exists:', !!process.env.GMAIL_EMAIL);
  console.log('GMAIL_PASSWORD exists:', !!process.env.GMAIL_PASSWORD);
  
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_PASSWORD) {
    console.error('Missing Gmail credentials');
    return res.status(500).json({ 
      success: false, 
      message: "Email service not configured" 
    });
  }

  console.log('Creating email transporter...');
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  try {
    console.log('Sending email to:', email);
    await transporter.sendMail({
      from: `LexiLearn <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: "Your LexiLearn OTP Code",
      text: `Your OTP code is: ${otp}\n\nThis code will expire in 5 minutes.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F8EF7;">LexiLearn OTP Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #4F8EF7; font-size: 32px; letter-spacing: 8px; text-align: center;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>`,
    });
    
    console.log(`OTP sent successfully to ${email}`);
    return res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error('Gmail error:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to send OTP", 
      error: error.message 
    });
  }
} 