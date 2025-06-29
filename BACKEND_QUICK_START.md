# 🚀 RAG Backend Quick Start

## Prerequisites Checklist
- [ ] Node.js v16+ installed
- [ ] Redis installed and running
- [ ] OpenAI API key obtained
- [ ] Pinecone API key obtained
- [ ] Git installed

## 5-Minute Setup

```bash
# 1. Clone and navigate
git clone [repo-url]
cd ..
mkdir backend && cd backend

# 2. Copy backend files here (package.json, src/, test-rag.js)

# 3. Install dependencies
npm install

# 4. Create Pinecone index "second-degree" with 3072 dimensions

# 5. Create .env file
echo "PORT=3000
PINECONE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
REDIS_HOST=localhost
REDIS_PORT=6379" > .env

# 6. Start Redis (Mac)
brew services start redis

# 7. Start backend
npm run dev

# 8. Test it works
node test-rag.js
```

## Quick Checks
- Health: http://localhost:3000/health
- All tests pass: ✅
- See logs in terminal
- Check Pinecone dashboard for vectors

## Common Fixes
- Port in use? Change PORT in .env
- Redis not running? `redis-cli ping`
- Wrong API key? Check .env formatting

Full guide: See BACKEND_SETUP_FOR_GRADERS.md 