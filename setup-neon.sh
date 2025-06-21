#!/bin/bash
# Neon DB Migration Setup Script

echo "🚀 Setting up Neon DB for your Candidate Management System..."
echo ""

echo "📋 Prerequisites:"
echo "1. Neon account (sign up at https://neon.tech)"
echo "2. Netlify account with your site deployed"
echo "3. Your Neon connection string"
echo ""

echo "🔧 Setup Steps:"
echo ""

echo "Step 1: Get your Neon connection string"
echo "- Go to https://neon.tech and sign in"
echo "- Create a new project or use existing one"
echo "- Go to 'Connection Details'"
echo "- Copy the connection string (starts with postgresql://...)"
echo ""

echo "Step 2: Configure Netlify environment variables"
echo "- Go to your Netlify dashboard"
echo "- Navigate to Site Settings > Environment Variables"
echo "- Add new variable:"
echo "  Key: DATABASE_URL"
echo "  Value: [Your Neon connection string]"
echo ""

echo "Step 3: Test the connection"
echo "- Visit: https://your-site.netlify.app/.netlify/functions/test"
echo "- You should see a success message"
echo ""

echo "✅ Migration Benefits:"
echo "- Serverless PostgreSQL with auto-scaling"
echo "- Cost-effective (scales to zero)"
echo "- Better performance and reliability"
echo "- Full PostgreSQL features"
echo "- Database branching for development"
echo ""

echo "📁 Files Updated:"
echo "- package.json (PostgreSQL dependencies only)"
echo "- api/candidates.js (migrated to PostgreSQL)"
echo "- api/history.js (migrated to PostgreSQL)"
echo "- api/test.js (Neon connection test)"
echo "- All MongoDB dependencies removed"
echo ""

echo "🎯 Next Steps:"
echo "1. Set up your Neon database"
echo "2. Add DATABASE_URL to Netlify"
echo "3. Deploy your updated code"
echo "4. Test the connection"
echo ""

echo "Need help? Check NEON_SETUP.md for detailed instructions!"
