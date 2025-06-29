# 🚨 IMPORTANT: Backend Setup Instructions

## What Just Happened

I created all your backend files in a folder called **`moveme`** inside your snapchat-clone project. 

**BUT THE BACKEND SHOULD NOT BE INSIDE YOUR SNAPCHAT-CLONE!**

## 📁 Current Structure (WRONG)
```
snapchat-clone/
├── moveme/         ← Backend files are here (WRONG LOCATION)
├── App.js
├── package.json
└── ... other app files
```

## ✅ Desired Structure (CORRECT)
```
Your-Projects/              ← Or wherever you keep your projects
├── snapchat-clone/         ← Your React Native app
│   ├── App.js
│   ├── package.json
│   └── ... app files
│
└── backend/                ← Backend should be HERE (next to, not inside)
    ├── package.json
    ├── src/
    └── ... backend files
```

## 🛠️ Step-by-Step Instructions

### Step 1: Open Finder (Mac) or File Explorer (Windows)

Navigate to your snapchat-clone folder and find the `moveme` folder inside it.

### Step 2: Move the Folder

1. **Cut** (Cmd+X on Mac, Ctrl+X on Windows) the entire `moveme` folder
2. Navigate up one level (to the parent folder of snapchat-clone)
3. **Paste** (Cmd+V on Mac, Ctrl+V on Windows) the folder
4. **Rename** `moveme` to `backend`

### Step 3: Create .env File

Inside the newly moved `backend` folder, create a new file called `.env` (no extension!) with:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Pinecone Configuration
PINECONE_API_KEY=YOUR_ACTUAL_PINECONE_API_KEY_HERE

# OpenAI Configuration  
OPENAI_API_KEY=YOUR_ACTUAL_OPENAI_API_KEY_HERE

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19000,http://localhost:19001
```

### Step 4: Install Redis

**On Mac:**
1. Open Terminal
2. Run: `brew install redis`
3. Run: `brew services start redis`

**Don't have Homebrew?** Visit https://brew.sh

### Step 5: Start the Backend

1. Open a **NEW** Terminal window
2. Navigate to the backend folder:
   ```bash
   cd ~/path/to/your/backend  # Update this path!
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
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

### Step 6: Test It Works

In another Terminal:
```bash
cd ~/path/to/your/backend
node test-rag.js
```

## ❓ Common Issues

**"Cannot find module" errors?**
- Make sure you ran `npm install` in the backend folder

**"Redis connection refused"?**
- Make sure Redis is running: `redis-cli ping` should return `PONG`

**"Port 3000 already in use"?**
- Change PORT in .env to 3001 or another free port

## 🎉 Success!

Once your backend is running, your React Native app can start using RAG features! 