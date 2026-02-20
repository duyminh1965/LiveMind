# Neon PostgreSQL Setup Guide

Complete guide for deploying Agent Wallet Dashboard with Neon serverless PostgreSQL.

## 🌟 What is Neon?

Neon is a serverless PostgreSQL platform with:
- ⚡ **Instant provisioning** - Database ready in seconds
- 🔄 **Auto-scaling** - Scales to zero when not in use
- 💰 **Cost-effective** - Pay only for what you use
- 🚀 **Branching** - Git-like database branches
- 🔒 **Secure** - Built-in SSL/TLS
- 📊 **PostgreSQL 16** - Latest features

## 🚀 Quick Start

### Step 1: Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub, Google, or email
3. Verify your email

### Step 2: Create Project

1. Click **"New Project"**
2. Configure:
   - **Name**: `agent-wallet-db`
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 16 (latest)
   - **Compute Size**: Start with 0.25 vCPU (Free tier)

3. Click **Create Project**

### Step 3: Get Connection String

Neon provides connection strings in multiple formats:

**Connection String** (for Node.js):
```
postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Connection Pooling** (recommended for serverless):
```
postgresql://username:password@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## 📝 Configuration

### Update Backend .env

```bash
# Neon PostgreSQL Connection
DATABASE_URL=postgresql://username:password@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Or use individual components
DB_HOST=ep-cool-name-123456-pooler.us-east-2.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=username
DB_PASSWORD=password
DB_SSL=true

# Server Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

### Update database.js for Neon

Create `backend/config/database-neon.js`: 

```javascript
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

// Neon-optimized configuration
const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon
  },
  max: 10, // Lower for Neon's connection limits
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Longer for cold starts
  allowExitOnIdle: true // Important for serverless
};

const pool = new Pool(config);

// Handle errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection with retry
export async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ Neon database connected successfully');
      const result = await client.query('SELECT NOW(), version()');
      console.log('📅 Database time:', result.rows[0].now);
      console.log('🗄️  PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
      client.release();
      return true;
    } catch (error) {
      console.warn(`Connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('❌ Failed to connect to Neon database');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Query with retry logic
export async function query(text, params, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Query executed', { duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error(`Query attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Transaction helper
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
  console.log('Neon database pool closed');
}

export default pool;
```

## 🔧 Database Setup on Neon

### Method 1: Using Neon SQL Editor

1. Go to your Neon project dashboard
2. Click **"SQL Editor"** tab
3. Copy entire contents of `database/schema.sql`
4. Paste into SQL Editor
5. Click **Run** ▶️

### Method 2: Using psql

```bash
# Install psql if needed
brew install postgresql  # macOS
sudo apt-get install postgresql-client  # Ubuntu

# Connect to Neon
psql "postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Run schema
\i database/schema.sql

# Or pipe file
psql "your-connection-string" < database/schema.sql
```

### Method 3: Using Node.js Script

Create `backend/scripts/setup-neon.js`:

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupNeon() {
  console.log('🌟 Setting up Neon PostgreSQL database...\n');
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to Neon\n');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by statement (simple approach)
    const statements = schema
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i]);
        process.stdout.write(`\r✅ Progress: ${i + 1}/${statements.length}`);
      } catch (error) {
        // Skip comments and empty statements
        if (!error.message.includes('syntax error')) {
          console.error(`\n❌ Error in statement ${i + 1}:`, error.message);
        }
      }
    }
    
    console.log('\n\n✅ Schema created successfully!\n');
    
    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    console.log('\n✨ Neon database setup complete!\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupNeon();
```

Run it:
```bash
cd backend
node scripts/setup-neon.js
```

## 🌱 Seeding Neon Database

Update `backend/scripts/seed-neon.js`:

```javascript
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function seedNeon() {
  console.log('🌱 Seeding Neon database...\n');
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to Neon\n');
    
    await client.query('BEGIN');
    
    // Insert sample agents
    console.log('👤 Creating agents...');
    const agentResult = await client.query(`
      INSERT INTO agents (
        address, name, balance, max_per_call, max_per_hour, max_per_day,
        auto_refill_threshold, auto_refill_amount, tags, favorite_apis, status
      ) VALUES 
        ('0x742d35Cc6634C0532925a3b844Bc9e7595f0A3f9', 'Weather Agent', 45.23, 1.0, 10.0, 50.0, 10.0, 50.0, 
         ARRAY['production', 'weather'], ARRAY['weather_api', 'geocoding_api'], 'active'),
        ('0x8f3c2a1b9e4d7c5f6b8a2e3d9c7f5b4a8e6d3c1b', 'ML Inference Agent', 89.50, 2.0, 20.0, 100.0, 20.0, 100.0,
         ARRAY['production', 'ml'], ARRAY['gpt_inference', 'translation_api'], 'active'),
        ('0x9c4e7d8a3b2f6e5c9d8a7b6e5c4d3a2b1c9e8d7a', 'Data Scraper', 5.20, 1.5, 15.0, 75.0, 10.0, 50.0,
         ARRAY['development', 'data'], ARRAY['data_fetch_api'], 'warning')
      RETURNING id
    `);
    console.log(`✅ Created ${agentResult.rowCount} agents\n`);
    
    // Insert API providers
    console.log('🔌 Creating providers...');
    const providerResult = await client.query(`
      INSERT INTO api_providers (address, name, avg_cost, uptime_percentage, is_approved, is_active) VALUES
        ('0x1234567890123456789012345678901234567890', 'Weather API Pro', 0.01, 99.9, true, true),
        ('0x2345678901234567890123456789012345678901', 'ML Inference Hub', 0.05, 99.5, true, true),
        ('0x3456789012345678901234567890123456789012', 'Data Services Inc', 0.02, 98.7, true, true)
      RETURNING id
    `);
    console.log(`✅ Created ${providerResult.rowCount} providers\n`);
    
    // Generate sample payments
    console.log('💸 Creating payment history...');
    const agentIds = agentResult.rows.map(r => r.id);
    const providerIds = providerResult.rows.map(r => r.id);
    
    let paymentCount = 0;
    for (let i = 0; i < 50; i++) {
      const agentId = agentIds[Math.floor(Math.random() * agentIds.length)];
      const providerId = providerIds[Math.floor(Math.random() * providerIds.length)];
      
      await client.query(`
        INSERT INTO payment_history (
          agent_id, provider_id, amount, api_endpoint, tx_hash, 
          block_number, gas_used, status, response_time, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'success', $8,
          NOW() - INTERVAL '${Math.floor(Math.random() * 168)} hours'
        )
      `, [
        agentId,
        providerId,
        (Math.random() * 0.1).toFixed(4),
        ['weather_api', 'gpt_inference', 'data_fetch_api'][Math.floor(Math.random() * 3)],
        '0x' + Math.random().toString(36).substring(2, 15),
        18000000 + Math.floor(Math.random() * 100000),
        Math.floor(Math.random() * 50000) + 50000,
        Math.floor(Math.random() * 1000) + 100
      ]);
      paymentCount++;
    }
    console.log(`✅ Created ${paymentCount} payments\n`);
    
    await client.query('COMMIT');
    
    console.log('✨ Neon database seeded successfully!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedNeon();
```

Run it:
```bash
node scripts/seed-neon.js
```

## 📦 Updated package.json Scripts

Add to `backend/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "db:setup": "node scripts/setup-neon.js",
    "db:seed": "node scripts/seed-neon.js",
    "db:reset": "node scripts/reset-neon.js"
  }
}
```

## 🔍 Neon-Specific Features

### Database Branching

Create branches for development:

```bash
# Via Neon Console
1. Go to "Branches" tab
2. Click "Create Branch"
3. Name: "development"
4. Source: main

# Get branch connection string
postgresql://...@ep-branch-name-pooler...
```

Use in development:
```bash
# .env.development
DATABASE_URL=postgresql://...@ep-dev-branch...
```

### Connection Pooling

Neon provides built-in pooling:

```javascript
// Use pooler endpoint (recommended)
const poolerUrl = process.env.DATABASE_URL.replace(
  '.neon.tech',
  '-pooler.neon.tech'
);
```

### Auto-Suspend

Neon automatically suspends inactive databases:
- **Suspend after**: 5 minutes of inactivity (configurable)
- **Wake up**: Automatic on first query (~1-2 seconds)

Handle cold starts:
```javascript
// Add retry logic for cold starts
async function queryWithRetry(text, params) {
  let attempts = 0;
  while (attempts < 3) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      attempts++;
      if (attempts === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

## 📊 Monitoring with Neon

### Neon Dashboard

Monitor from Neon console:
- **Metrics**: CPU, memory, storage
- **Connections**: Active connections
- **Queries**: Query performance
- **Logs**: System logs

### Query Statistics

Enable in Neon console:
1. Go to Settings
2. Enable "Query statistics"
3. View in "Monitoring" tab

### Alerts

Set up alerts:
1. Go to "Settings" → "Alerts"
2. Configure:
   - High CPU usage
   - Connection limits
   - Storage limits

## 💰 Cost Optimization

### Free Tier Limits

Neon Free tier includes:
- **Compute**: 0.25 vCPU
- **Storage**: 3 GB
- **Branches**: 10
- **Suspend**: After 5 minutes

### Optimize Costs

1. **Use Connection Pooling**:
```javascript
max: 10  // Lower connection limit
```

2. **Enable Auto-Suspend**:
   - Configure in Neon console
   - Suspends when inactive

3. **Monitor Storage**:
```sql
SELECT pg_size_pretty(pg_database_size('neondb'));
```

4. **Delete Old Data**:
```sql
-- Archive old payments
DELETE FROM payment_history 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## 🚀 Deployment

### Environment Variables

Set in your deployment platform:

```bash
# Vercel, Netlify, Railway, etc.
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
NODE_ENV=production
CORS_ORIGIN=https://your-app.com
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd backend
vercel --prod

# Set environment variable
vercel env add DATABASE_URL
```

### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Add Neon connection
railway variables set DATABASE_URL="postgresql://..."

# Deploy
railway up
```

## 🔧 Troubleshooting

### Connection Timeout

```javascript
// Increase timeout for cold starts
connectionTimeoutMillis: 10000  // 10 seconds
```

### SSL Certificate Error

```javascript
ssl: {
  rejectUnauthorized: false
}
```

### Too Many Connections

```javascript
// Reduce pool size
max: 5
```

Or use connection pooler endpoint

### Slow Cold Starts

- Use connection pooler
- Implement connection warming
- Consider upgrading compute

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Neon GitHub](https://github.com/neondatabase)
- [Neon Discord](https://discord.gg/neon)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Complete Neon PostgreSQL setup for Agent Wallet Dashboard** 🌟