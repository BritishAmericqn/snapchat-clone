# 🧠 RAG Environment Variables Setup

## 📋 **Required Environment Variables**

Add these environment variables to your `.env` file:

```env
# RAG Integration - OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here

# RAG Integration - Pinecone Configuration  
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_HOST=https://second-degree-53vsbwo.svc.aped-4627-b74a.pinecone.io

# RAG Feature Flags (for gradual rollout)
RAG_CAPTION_GENERATION_ENABLED=true
RAG_SIMILARITY_SEARCH_ENABLED=true
RAG_ANALYTICS_ENABLED=true

# RAG Rate Limiting (optional overrides)
RAG_MAX_REQUESTS_PER_MINUTE=10
RAG_MAX_REQUESTS_PER_HOUR=100

# Development Settings
NODE_ENV=development
DEBUG_RAG=true
```

## 🔑 **How to Get API Keys**

### **OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy the key (starts with `sk-`)
4. Add to your `.env` file

### **Pinecone API Key:**
1. Go to https://app.pinecone.io/
2. Navigate to "API Keys" in your project
3. Copy your existing API key
4. Add to your `.env` file

### **Pinecone Host:**
Your Pinecone host is already configured as:
`https://second-degree-53vsbwo.svc.aped-4627-b74a.pinecone.io`

## 🔄 **After Adding Environment Variables**

1. Restart your Expo development server
2. The RAG features will automatically detect and use your API keys
3. If keys are missing, the system will use mock implementations for development

## 🛡️ **Security Notes**

- **Never commit** your `.env` file to version control
- **Never share** your API keys publicly
- **Regenerate keys** if they're accidentally exposed
- **Use separate keys** for development and production

## 🧪 **Testing Setup**

After adding the environment variables, you can test the setup by running:

```bash
# This will be created in the next step
node test-rag-infrastructure.js
```

## 📊 **Cost Monitoring**

Monitor your API usage:
- **OpenAI**: https://platform.openai.com/usage
- **Pinecone**: https://app.pinecone.io/organizations/billing

## 🚀 **Next Steps**

Once environment variables are set up:
1. Restart your Expo development server
2. The RAG features will be ready for testing
3. Smart caption generation will be available in MediaPreviewScreen

---

*Note: This file is temporary and will be removed after setup is complete.* 