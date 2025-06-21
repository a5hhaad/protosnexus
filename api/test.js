const { Pool } = require('pg');

// Netlify function handler for testing Neon DB connection
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
    if (!process.env.DATABASE_URL) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'DATABASE_URL environment variable not set',
          status: 'Environment variable missing',
          instructions: 'Please set your Neon DATABASE_URL in Netlify environment variables'
        })
      };
    }

    console.log('🔄 Testing Neon PostgreSQL connection...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 1,
      connectionTimeoutMillis: 5000,
    });
    
    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    client.release();
    await pool.end();
    
    console.log('✅ Neon PostgreSQL connection successful!');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Neon PostgreSQL connection successful!',
        status: 'Connected',
        timestamp: new Date().toISOString(),
        database_time: result.rows[0].current_time,
        postgres_version: result.rows[0].postgres_version.split(' ')[0] + ' ' + result.rows[0].postgres_version.split(' ')[1],
        provider: 'Neon Serverless PostgreSQL'
      })
    };
  } catch (error) {
    console.error('❌ Neon PostgreSQL connection test failed:', error);
    
    let errorDetails = error.message;
    let troubleshooting = [];
    
    // Provide specific troubleshooting based on error type
    if (error.code === 'ECONNREFUSED') {
      troubleshooting.push('Check if your Neon database is active');
      troubleshooting.push('Verify the DATABASE_URL is correct');
    } else if (error.code === 'ENOTFOUND') {
      troubleshooting.push('Check your DATABASE_URL hostname');
      troubleshooting.push('Ensure your Neon database endpoint is correct');
    } else if (error.message.includes('password authentication failed')) {
      troubleshooting.push('Check your database username and password');
      troubleshooting.push('Verify your Neon database credentials');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      troubleshooting.push('Check if the database name in your URL is correct');
      troubleshooting.push('Ensure the database exists in your Neon project');
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Neon PostgreSQL connection failed',
        details: errorDetails,
        status: 'Connection failed',
        provider: 'Neon Serverless PostgreSQL',
        troubleshooting: troubleshooting,
        timestamp: new Date().toISOString()
      })
    };
  }
};
