# Neon DB Setup Guide

## What is Neon DB?

Neon is a serverless PostgreSQL platform that provides:
- **Serverless PostgreSQL**: Fully managed with automatic scaling
- **Database Branching**: Create branches like Git for development
- **Autoscaling**: Scales to zero when not in use
- **Fast Cold Starts**: Quick connection establishment
- **Cost Effective**: Pay only for what you use

## Setup Instructions

### 1. Create a Neon Account
1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

### 2. Get Your Database URL
1. In your Neon dashboard, go to your project
2. Navigate to "Connection Details"
3. Copy the **Connection String** (it looks like):
   ```
   postgresql://username:password@hostname/database?sslmode=require
   ```

### 3. Configure Netlify Environment Variables
1. Go to your Netlify dashboard
2. Navigate to your site settings
3. Go to "Environment variables"
4. Add a new variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string

### 4. Test Your Connection
- Visit: `https://your-site.netlify.app/.netlify/functions/test-neon`
- You should see a success message if the connection works

## Migration from MongoDB Complete

### Files Updated:
1. **`package.json`**: Updated to use `pg` (PostgreSQL client)
2. **`api/candidates.js`**: Migrated to PostgreSQL 
3. **`api/history.js`**: Migrated to PostgreSQL
4. **`api/test.js`**: Connection test for Neon DB

### Old MongoDB Files Removed:
- All MongoDB dependencies and references have been completely removed
- Clean PostgreSQL-only implementation

### Database Schema:
The PostgreSQL version automatically creates these tables:

#### Candidates Table:
```sql
CREATE TABLE candidates (
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
);
```

#### History Table:
```sql
CREATE TABLE history (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  action VARCHAR(100) NOT NULL,
  candidate VARCHAR(255),
  details TEXT,
  user_name VARCHAR(255) DEFAULT 'System'
);
```

## Benefits of Migration:

### 1. **Better Performance**
- PostgreSQL is known for excellent performance
- Neon provides connection pooling automatically

### 2. **Cost Efficiency**
- Neon scales to zero when not in use
- Pay only for actual usage

### 3. **Developer Experience**
- SQL is more familiar to many developers
- Better tooling and admin interfaces

### 4. **Reliability**
- PostgreSQL is battle-tested
- ACID compliance and strong consistency

### 5. **Advanced Features**
- Full-text search capabilities
- JSON support (best of both worlds)
- Advanced indexing options

## Next Steps:

1. Set up your Neon database and get the connection string
2. Add the `DATABASE_URL` to your Netlify environment variables
3. Test the connection using the test endpoint
4. Replace your existing API files with the Neon versions
5. Deploy and test your application

## API Endpoints:

- **Test Connection**: `/.netlify/functions/test-neon`
- **Candidates API**: `/.netlify/functions/candidates-neon`
- **History API**: `/.netlify/functions/history-neon`

Once you're ready to fully migrate, simply rename the files:
- `candidates-neon.js` → `candidates.js`
- `history-neon.js` → `history.js`
- `test-neon.js` → `test.js`
