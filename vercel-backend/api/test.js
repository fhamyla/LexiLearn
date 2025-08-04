module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json({ 
    success: true, 
    message: "Vercel API is working!",
    timestamp: new Date().toISOString()
  });
}; 