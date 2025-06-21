const { Pool } = require('pg');

let pool = null;

// Initialize PostgreSQL connection pool
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

// Initialize database tables
async function initializeTables() {
  const client = getPool();
  
  try {
    // Create candidates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        candidate_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        position VARCHAR(255),
        experience VARCHAR(255),
        skills TEXT,
        status VARCHAR(100) DEFAULT 'pending',
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        action VARCHAR(100) NOT NULL,
        candidate VARCHAR(255),
        details TEXT,
        user_name VARCHAR(255) DEFAULT 'System'
      )
    `);
    
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing tables:', error);
    throw error;
  }
}

// Netlify function handler
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  let client = null;
    try {
    console.log(`🚀 API Request: ${event.httpMethod} ${event.path}`);
    
    // Initialize tables on first request
    await initializeTables();
    
    const client = getPool();
    const method = event.httpMethod;
    let result;

    switch (method) {
      case 'GET':
        console.log('📋 Fetching all candidates...');
        result = await client.query('SELECT * FROM candidates ORDER BY date_added DESC');
        console.log(`✅ Found ${result.rows.length} candidates`);
        
        // Convert PostgreSQL result to frontend format
        const candidates = result.rows.map(row => ({
          id: row.candidate_id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          position: row.position,
          experience: row.experience,
          skills: row.skills,
          status: row.status,
          dateAdded: row.date_added,
          lastUpdated: row.last_updated
        }));
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(candidates)
        };      case 'POST':
        console.log('➕ Creating new candidate...');
        if (!event.body) {
          throw new Error('Request body is required');
        }
        
        const newCandidate = JSON.parse(event.body);
        const candidateId = Date.now().toString();
        
        console.log('📝 Candidate data:', newCandidate.name);
        
        // Insert new candidate
        await client.query(`
          INSERT INTO candidates (candidate_id, name, email, phone, position, experience, skills, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          candidateId,
          newCandidate.name,
          newCandidate.email,
          newCandidate.phone,
          newCandidate.position,
          newCandidate.experience,
          newCandidate.skills,
          newCandidate.status || 'pending'
        ]);
        
        console.log('✅ Candidate created successfully');
        
        // Log to history
        await client.query(`
          INSERT INTO history (action, candidate, details)
          VALUES ($1, $2, $3)
        `, ['created', newCandidate.name, `Created new candidate: ${newCandidate.name}`]);
        
        // Prepare response data
        const responseData = {
          id: candidateId,
          ...newCandidate,
          dateAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(responseData)
        };      case 'PUT':
        console.log('✏️ Updating candidate...');
        if (!event.body) {
          throw new Error('Request body is required');
        }
        
        const updateData = JSON.parse(event.body);
        const { id } = updateData;
        
        console.log('📝 Updating candidate ID:', id);
        
        // Update candidate
        await client.query(`
          UPDATE candidates 
          SET name = $1, email = $2, phone = $3, position = $4, 
              experience = $5, skills = $6, status = $7, last_updated = CURRENT_TIMESTAMP
          WHERE candidate_id = $8
        `, [
          updateData.name,
          updateData.email,
          updateData.phone,
          updateData.position,
          updateData.experience,
          updateData.skills,
          updateData.status,
          id
        ]);
        
        console.log('✅ Candidate updated successfully');
        
        // Log to history
        await client.query(`
          INSERT INTO history (action, candidate, details)
          VALUES ($1, $2, $3)
        `, ['updated', updateData.name, `Updated candidate: ${updateData.name}`]);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };      case 'DELETE':
        console.log('🗑️ Deleting candidate...');
        const deleteId = event.queryStringParameters?.id;
        if (!deleteId) {
          throw new Error('Candidate ID is required');
        }
        
        console.log('🗑️ Deleting candidate ID:', deleteId);
        
        // Get candidate name before deleting
        const candidateResult = await client.query('SELECT name FROM candidates WHERE candidate_id = $1', [deleteId]);
        const candidateName = candidateResult.rows[0]?.name || 'Unknown';
        
        // Delete candidate
        await client.query('DELETE FROM candidates WHERE candidate_id = $1', [deleteId]);
        
        console.log('✅ Candidate deleted successfully');
        
        // Log to history
        await client.query(`
          INSERT INTO history (action, candidate, details)
          VALUES ($1, $2, $3)
        `, ['deleted', candidateName, `Deleted candidate: ${candidateName}`]);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };      case 'PATCH':
        // Clear all data if action=clear
        if (event.queryStringParameters?.action === 'clear') {
          console.log('🧹 Clearing all data...');
          await client.query('DELETE FROM candidates');
          await client.query('DELETE FROM history');
          
          console.log('✅ All data cleared successfully');
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'All data cleared' })
          };
        }
        
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    
    // More detailed error response
    const errorResponse = {
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
      // Add more context for PostgreSQL errors
    if (error.code === 'ECONNREFUSED') {
      errorResponse.details = 'Database connection refused';
    } else if (error.code === 'ENOTFOUND') {
      errorResponse.details = 'Database host not found';
    } else if (error.message.includes('DATABASE_URL')) {
      errorResponse.details = 'Database URL environment variable not configured';
    } else if (error.code) {
      errorResponse.details = `Database error: ${error.code}`;
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };  } finally {
    // Connection pooling handles cleanup automatically
  }
};
