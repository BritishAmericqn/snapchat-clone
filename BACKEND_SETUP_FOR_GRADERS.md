# RAG Backend Setup Guide for Graders

This guide will help you set up and run the RAG (Retrieval-Augmented Generation) backend for the Snapchat Clone project.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Redis** (v6 or higher)
   - **macOS**: `brew install redis`
   - **Ubuntu/Debian**: `sudo apt-get install redis-server`
   - **Windows**: Download from https://github.com/microsoftarchive/redis/releases
   - Verify: `redis-cli ping` (should return `PONG`)

3. **Git** (to clone the repository)
   - Verify: `git --version`

## 🔑 Required API Keys

You'll need to obtain the following API keys:

1. **OpenAI API Key**
   - Sign up at: https://platform.openai.com/
   - Create an API key in your account settings
   - Format: `sk-...` (starts with sk-)

2. **Pinecone API Key**
   - Sign up at: https://www.pinecone.io/
   - Create a new project and get your API key
   - Format: `pcsk-...` or similar

## 🚀 Quick Setup Steps

### 1. Clone the Repository

```bash
git clone [repository-url]
cd snapchat-clone
```

### 2. Set Up the Backend

The backend should be in a separate folder adjacent to the React Native app:

```bash
# Navigate to parent directory
cd ..

# Create backend folder if it doesn't exist
mkdir backend
cd backend
```

### 3. Copy Backend Files

If backend files are provided separately, copy them to the backend folder. The structure should be:

```
your-workspace/
├── snapchat-clone/      # React Native app
└── backend/             # Backend server (THIS FOLDER)
    ├── package.json
    ├── src/
    │   ├── server.js
    │   ├── routes/
    │   │   └── ragRoutes.js
    │   └── services/
    │       └── ragService.js
    └── test-rag.js
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Create Pinecone Index

1. Log into your Pinecone dashboard
2. Click "Create Index"
3. Use these EXACT settings:
   - **Index Name**: `second-degree`
   - **Dimensions**: `3072`
   - **Metric**: `cosine`
   - **Pod Type**: `p1.x1` or `s1.x1` (starter tier is fine)

### 6. Configure Environment Variables

Create a `.env` file in the backend folder:

```bash
touch .env
```

Add the following content (replace with your actual keys):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key_here

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS Configuration (for React Native)
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19000,http://localhost:19001
```

### 7. Start Redis

**macOS:**
```bash
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo service redis-server start
```

**Windows:**
```bash
# Run redis-server.exe from installation directory
```

### 8. Start the Backend Server

```bash
npm run dev
```

You should see:
```
🚀 RAG Backend Server Started!

📍 Local: http://localhost:3000
📊 Health: http://localhost:3000/health
🔌 RAG API: http://localhost:3000/api/rag/*

🟢 Ready to handle requests...
```

### 9. Verify Everything Works

In a new terminal:

```bash
cd backend
node test-rag.js
```

All 6 tests should pass:
- ✅ Health check
- ✅ Content storage
- ✅ Content search
- ✅ Batch processing
- ✅ App content indexing
- ✅ Index statistics

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "PINECONE_API_KEY not found"
- Make sure your `.env` file is in the backend root folder
- Check there are no spaces around the `=` sign
- Ensure the file is named exactly `.env` (not `.env.txt`)

#### 2. "Redis connection refused"
- Verify Redis is running: `redis-cli ping`
- Check Redis is on the default port (6379)
- On Mac, try: `brew services restart redis`

#### 3. "Port 3000 already in use"
- Change the PORT in `.env` to 3001 or another free port
- Or kill the process using port 3000:
  ```bash
  # Mac/Linux
  lsof -ti:3000 | xargs kill -9
  
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

#### 4. "Cannot find module" errors
- Ensure you ran `npm install` in the backend folder
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

#### 5. Pinecone errors
- Verify your index name is exactly `second-degree`
- Check dimensions are set to `3072`
- Ensure your API key has the correct permissions

## 📡 Testing with the React Native App

1. In the React Native app, ensure `config/rag.js` has:
   ```javascript
   export const BACKEND_CONFIG = {
     useBackend: true,
     backendUrl: 'http://localhost:3000'  // or your custom port
   };
   ```

2. Start the React Native app:
   ```bash
   cd ../snapchat-clone
   npx expo start --clear
   ```

3. Test AI features:
   - Smart caption generation
   - Text overlay suggestions
   - Story discovery
   - Filter recommendations

## 📊 Monitoring

### Check Backend Logs
The backend will log all API requests and RAG operations:
- `[API] Storing content request received` - Content being indexed
- `[RAG] Found X relevant results` - Vector search results
- `[RAG] Using cached embedding` - Cache hits (good for performance)

### Check Pinecone Dashboard
- Navigate to your Pinecone project
- You should see vectors being stored in the `second-degree` index
- Monitor usage and performance metrics

### Check Redis Cache
```bash
redis-cli
KEYS *        # List all cached keys
GET <key>     # View specific cached data
INFO stats    # View cache statistics
```

## 🎯 Success Indicators

You'll know everything is working when:
1. Backend health check returns `{"status":"healthy"}`
2. Test script shows all tests passing
3. React Native app AI features work without errors
4. Pinecone dashboard shows increasing vector count
5. Backend logs show successful API calls

## 📚 Additional Resources

- [Pinecone Documentation](https://docs.pinecone.io/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Redis Documentation](https://redis.io/documentation)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

## 💡 Tips for Graders

1. **API Keys**: The provided `.env.example` shows the format but you'll need your own keys
2. **Free Tiers**: Both Pinecone and OpenAI offer free tiers sufficient for testing
3. **Local Development**: Everything runs locally except API calls to OpenAI/Pinecone
4. **Performance**: First requests may be slower; subsequent ones use caching
5. **Debugging**: Check both React Native console and backend terminal for full picture

---

**Note**: This backend implements production-grade features including caching, deduplication, and error handling. It's designed to minimize API costs while maximizing performance. 