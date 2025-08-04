module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({
    message: "Hello from Vercel API!",
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
}; 