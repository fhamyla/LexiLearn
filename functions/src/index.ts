/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import * as nodemailer from "nodemailer";
import * as functions from "firebase-functions";

setGlobalOptions({maxInstances: 10});

// Configure the email transport using environment variables
const gmailEmail = process.env.GMAIL_EMAIL ||
  functions.config().gmail?.email;
const gmailPassword = process.env.GMAIL_PASSWORD ||
  functions.config().gmail?.password;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

export const sendOtpEmail = onCall(async (request) => {
  const {email, otp} = request.data as {email: string; otp: string};

  if (!gmailEmail || !gmailPassword) {
    logger.error("Gmail credentials not configured");
    return {success: false, message: "Email service not configured"};
  }

  const mailOptions = {
    from: `LexiLearn <${gmailEmail}>`,
    to: email,
    subject: "Your LexiLearn OTP Code",
    text: "Your OTP code is: " + otp +
      "\n\nThis code will expire in 5 minutes.",
    html:
      "<div style=\"font-family: Arial, sans-serif; max-width: 600px; " +
      "margin: 0 auto;\">" +
      "<h2 style=\"color: #4F8EF7;\">LexiLearn OTP Verification</h2>" +
      "<p>Your OTP code is:</p>" +
      "<h1 style=\"color: #4F8EF7; font-size: 32px; " +
      "letter-spacing: 8px; " +
      "text-align: center;\">" +
      otp + "</h1>" +
      "<p>This code will expire in 5 minutes.</p>" +
      "<p>If you didn't request this code, please ignore this email.</p>" +
      "</div>",
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP sent to ${email}`);
    return {success: true, message: "OTP sent to email"};
  } catch (error) {
    logger.error("Error sending email:", error);
    return {success: false, message: "Failed to send OTP"};
  }
});
