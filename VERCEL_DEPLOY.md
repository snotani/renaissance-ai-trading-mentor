# Vercel Deployment Fix for 401 Error

## Problem
Getting 401 Unauthorized error when calling backend API on Vercel.

## Solution
I've created a proper Vercel serverless function structure.

## Steps to Fix:

### 1. Commit and Push Changes
```bash
cd trader-performance-agent
git add .
git commit -m "Fix: Add Vercel serverless function structure"
git push
```

### 2. Redeploy Backend on Vercel
- Go to your Vercel dashboard
- Find your backend project
- Click "Redeploy" or it will auto-deploy from the push

### 3. Verify Environment Variables
Make sure these are set in Vercel backend project:
```
GEMINI_API_KEY=your_key
QDRANT_URL=https://bed7a299-7865-45c0-9280-09fe6c88c63d.us-east-1-1.aws.cloud.qdrant.io
QDRANT_API_KEY=your_key
```

### 4. Test Backend
Visit: `https://renaissance-ai-trading-mentor-s6tt-rffxxp4wy.vercel.app/health`

Should return: `{"status":"ok"}`

### 5. Test API Endpoint
Visit: `https://renaissance-ai-trading-mentor-s6tt-rffxxp4wy.vercel.app/api/trades`

Should return JSON with trades array.

## What Changed:

1. **Created `backend/api/index.ts`** - Vercel serverless function entry point
2. **Updated `backend/vercel.json`** - Points to the new API structure
3. **Removed dotenv.config()** - Vercel handles env vars automatically

## Alternative: Use Railway Instead

If Vercel continues to have issues, I **strongly recommend Railway** for the backend:

### Why Railway is Better for This Backend:
- ✅ No serverless limitations (10s timeout)
- ✅ Persistent connections (better for Qdrant)
- ✅ Simpler deployment (no special structure needed)
- ✅ Better for long-running AI operations
- ✅ Free tier available

### Deploy to Railway:
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo
4. Set Root Directory: `backend`
5. Add environment variables
6. Deploy!

Railway will give you a URL like: `https://your-app.railway.app`

Then update your frontend's `VITE_API_URL` to the Railway URL.

## Troubleshooting

### Still Getting 401?
- Check Vercel function logs in dashboard
- Verify all environment variables are set
- Try Railway instead (recommended)

### CORS Errors?
- Backend already has `cors()` enabled for all origins
- Should not be an issue

### Timeout Errors?
- Vercel has 10s timeout for serverless functions
- AI operations might take longer
- **Use Railway instead** for no timeout limits
