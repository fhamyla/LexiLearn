const sendOtpHandler = require('./api/send-otp');
const testHandler = require('./api/test');

module.exports = async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  if (pathname === '/api/send-otp') {
    return await sendOtpHandler(req, res);
  } else if (pathname === '/api/test') {
    return await testHandler(req, res);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
}; 