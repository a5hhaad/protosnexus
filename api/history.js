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
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('candidatedb');
    const collection = db.collection('history');

    switch (req.method) {
      case 'GET':
        console.log('📥 GET request - fetching history');
        const history = await collection.find({})
          .sort({ timestamp: -1 })
          .limit(1000)
          .toArray();
        console.log(`✅ Found ${history.length} history entries`);
        return res.status(200).json(history);

      case 'POST':
        console.log('📤 POST request - adding history entry');
        const historyEntry = req.body;
        
        if (!historyEntry || typeof historyEntry !== 'object') {
          console.error('❌ Invalid history entry format');
          return res.status(400).json({ error: 'Invalid history entry format' });
        }

        // Add timestamp if not present
        if (!historyEntry.timestamp) {
          historyEntry.timestamp = new Date().toISOString();
        }

        // Add unique ID
        historyEntry.id = Date.now();

        await collection.insertOne(historyEntry);
        console.log('✅ History entry added successfully');
        
        return res.status(200).json({ 
          success: true,
          message: 'History entry added successfully'
        });

      default:
        console.log(`❌ Method ${req.method} not allowed`);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

  } catch (error) {
    console.error('💥 API Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Database operation failed',
      details: error.message 
    });
  }
};
