# Deployment Guide

## Frontend Deployment (Vercel)

### Option 1: Deploy from Frontend Directory
1. Navigate to the `frontend` directory
2. Connect to Vercel: `vercel`
3. Follow the prompts
4. Set environment variable: `VITE_API_URL` to your backend URL

### Option 2: Deploy from Root
1. In Vercel dashboard, set:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
2. Add environment variable: `VITE_API_URL`

### Vercel Configuration
The `frontend/vercel.json` file is already configured with:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: `vite`

## Backend Deployment

### Option 1: Railway
1. Create new project on Railway
2. Connect your GitHub repository
3. Set root directory to `backend`
4. Add environment variables:
   - `GEMINI_API_KEY`
   - `QDRANT_URL`
   - `QDRANT_API_KEY`
   - `PORT` (Railway will set this automatically)

### Option 2: Render
1. Create new Web Service
2. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Add environment variables (same as above)

### Option 3: Vercel (Serverless)
1. Deploy backend separately or use the root `vercel.json`
2. Note: Serverless functions have cold starts and timeouts

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.com
```

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
PORT=3001
```

## Troubleshooting

### "vite: command not found"
- Ensure `vite` is in `dependencies` (not `devDependencies`)
- Run `npm install` locally to verify
- Check Vercel build logs for npm install errors

### CORS Issues
- Update backend CORS configuration to allow your frontend domain
- In `backend/src/index.ts`, update the CORS origin

### API Connection Failed
- Verify `VITE_API_URL` is set correctly in Vercel
- Check backend is running and accessible
- Verify backend CORS allows frontend domain
