const { MongoClient } = require('mongodb');

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    cachedClient = client;
    console.log('✅ Connected to MongoDB Atlas');
    return client;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Netlify function handler
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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
    const client = await connectToDatabase();
    const db = client.db('candidateDB');
    const collection = db.collection('candidates');
    
    const method = event.httpMethod;
    let result;

    switch (method) {
      case 'GET':
        result = await collection.find({}).toArray();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
        };

      case 'POST':
        const newCandidate = JSON.parse(event.body);
        newCandidate.id = Date.now().toString();
        newCandidate.dateAdded = new Date().toISOString();
        newCandidate.lastUpdated = new Date().toISOString();
        
        result = await collection.insertOne(newCandidate);
        
        // Log to history
        await db.collection('history').insertOne({
          timestamp: new Date().toISOString(),
          action: 'created',
          candidate: newCandidate.name,
          details: `Created new candidate: ${newCandidate.name}`,
          user: 'System'
        });
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newCandidate)
        };      case 'PUT':
        const updateData = JSON.parse(event.body);
        const { id } = updateData;
        updateData.lastUpdated = new Date().toISOString();
        
        result = await collection.updateOne(
          { id: id },
          { $set: updateData }
        );
        
        // Log to history
        await db.collection('history').insertOne({
          timestamp: new Date().toISOString(),
          action: 'updated',
          candidate: updateData.name,
          details: `Updated candidate: ${updateData.name}`,
          user: 'System'
        });
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };

      case 'DELETE':
        const deleteId = event.queryStringParameters?.id;
        const candidateToDelete = await collection.findOne({ id: deleteId });
        
        result = await collection.deleteOne({ id: deleteId });
        
        // Log to history
        if (candidateToDelete) {
          await db.collection('history').insertOne({
            timestamp: new Date().toISOString(),
            action: 'deleted',
            candidate: candidateToDelete.name,
            details: `Deleted candidate: ${candidateToDelete.name}`,
            user: 'System'
          });
        }
          return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };

      case 'PATCH':
        // Clear all data if action=clear
        if (event.queryStringParameters?.action === 'clear') {
          await collection.deleteMany({});
          await db.collection('history').deleteMany({});
          
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
