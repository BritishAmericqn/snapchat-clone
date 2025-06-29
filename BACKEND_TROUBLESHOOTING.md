# Backend Troubleshooting Guide

## 🔴 Common Issues & Solutions

### 1. Environment Variables Not Loading

**Symptom**: `PINECONE_API_KEY not found` error

**Solutions**:
```bash
# Check .env file exists in backend root
ls -la | grep .env

# Verify no hidden extensions
file .env  # Should show "ASCII text" not ".env.txt"

# Check file contents
cat .env | head -n 3

# Fix common issues
# Remove any spaces around = sign
# Ensure no quotes unless value has spaces
# Make sure file is in backend root, not src/
```

### 2. Redis Connection Issues

**Symptom**: `Redis connection refused` or `ECONNREFUSED`

**Solutions**:
```bash
# Check if Redis is running
redis-cli ping  # Should return PONG

# Start Redis
# macOS
brew services start redis

# Ubuntu
sudo service redis-server start

# Check Redis is on correct port
redis-cli -p 6379 ping

# If still failing, check firewall
sudo lsof -i :6379
```

### 3. Pinecone Index Errors

**Symptom**: `Index 'second-degree' not found` or dimension mismatch

**Solutions**:
1. Log into Pinecone dashboard
2. Verify index exists with exact name: `second-degree`
3. Check dimensions are exactly `3072`
4. Verify API key has access to the index
5. Check you're in the correct Pinecone project/environment

### 4. OpenAI API Errors

**Symptom**: 401 Unauthorized or rate limit errors

**Solutions**:
```bash
# Test API key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"

# Common fixes:
# - Ensure API key starts with 'sk-'
# - Check billing/credits on OpenAI dashboard
# - Verify API key permissions
```

### 5. Port Already in Use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in .env
PORT=3001
```

### 6. Module Import Errors

**Symptom**: `Cannot find module` or `ERR_MODULE_NOT_FOUND`

**Solutions**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Verify package.json has "type": "module"
cat package.json | grep type

# Check all imports use .js extension
# ✅ import ragService from './services/ragService.js'
# ❌ import ragService from './services/ragService'
```

### 7. CORS Errors from React Native

**Symptom**: `CORS policy` errors in React Native app

**Solutions**:
1. Add your dev server URL to ALLOWED_ORIGINS in .env
2. For physical devices, add your computer's IP:
   ```
   ALLOWED_ORIGINS=http://localhost:8081,http://192.168.1.100:8081
   ```
3. Restart backend after changing .env

### 8. Slow Performance

**Symptom**: API calls taking too long

**Solutions**:
```bash
# Check Redis is caching
redis-cli
KEYS *  # Should show cached embeddings

# Monitor backend logs for:
# "[RAG] Using cached embedding" = Good
# "[RAG] Generating new embedding" = Slower

# Optimize by:
# - Ensuring Redis is running
# - Checking network latency to Pinecone
# - Using batch operations when possible
```

## 🔍 Debugging Commands

```bash
# Check all services
curl http://localhost:3000/health  # Backend health
redis-cli ping                      # Redis status
node -v                            # Node version (should be 16+)

# Test individual components
cd backend
node -e "require('dotenv').config(); console.log(process.env.PINECONE_API_KEY ? '✓ API Key loaded' : '✗ No API key')"

# View backend logs with filtering
npm run dev 2>&1 | grep -E "(RAG|API|Error)"

# Test Pinecone connection
node -e "
const { Pinecone } = require('@pinecone-database/pinecone');
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
pc.listIndexes().then(console.log).catch(console.error);
"
```

## 📞 Getting Help

If issues persist:

1. Check error logs in both terminals (React Native + Backend)
2. Verify all prerequisites are installed correctly
3. Ensure API keys are valid and have proper permissions
4. Try the test script: `node test-rag.js` for detailed diagnostics

## 💡 Pro Tips

- Always run `npm run dev` from the backend root directory
- Keep both backend and React Native terminals open for debugging
- First request after startup may be slow (embedding generation)
- Subsequent requests should be fast (cache hits)
- Monitor Pinecone dashboard for usage and errors 