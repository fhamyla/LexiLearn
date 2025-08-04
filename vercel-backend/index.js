// This file ensures Vercel recognizes this as a Node.js project
// The actual API functions are in the /api directory

module.exports = (req, res) => {
  res.status(200).json({
    message: "Vercel Backend is running",
    endpoints: {
      test: "/api/test",
      sendOtp: "/api/send-otp"
    }
  });
}; 