module.exports = async function handler(req, res) {
  console.log('Test API called');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json({ 
    success: true, 
    message: "Vercel API is working!",
    timestamp: new Date().toISOString()
  });
} 