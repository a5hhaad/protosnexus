const { MongoClient } = require('mongodb');

// Netlify function handler
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (!process.env.MONGODB_URI) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'MONGODB_URI environment variable not set',
          status: 'Environment variable missing'
        })
      };
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    // Test the connection
    const db = client.db('candidateDB');
    await db.command({ ping: 1 });
    
    await client.close();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'MongoDB Atlas connection successful!',
        status: 'Connected',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'MongoDB connection failed',
        details: error.message,
        status: 'Connection failed'
      })
    };
  }
};
