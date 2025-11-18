# Deployment Guide

## Important: Deploy Backend and Frontend Separately

The backend and frontend must be deployed as **separate projects** because:
- Backend is a Node.js API server (Express)
- Frontend is a static React app (Vite)

## Backend Deployment (Deploy First!)

### Recommended: Railway (Easiest for Node.js)
1. Go to [Railway.app](https://railway.app)
2. Create new project → Deploy from GitHub repo
3. Select your repository
4. Configure:
   - **Root Directory**: `backend`
   - Railway auto-detects Node.js
5. Add environment variables:
   ```
   GEMINI_API_KEY=your_key_here
   QDRANT_URL=your_qdrant_url
   QDRANT_API_KEY=your_qdrant_key
   ```
6. Deploy! Railway will give you a URL like: `https://your-app.railway.app`
7. **Save this URL** - you'll need it for the frontend

### Alternative: Render
1. Go to [Render.com](https://render.com)
2. New → Web Service
3. Connect your GitHub repository
4. Configure:
   - **Name**: `trader-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Deploy and save the URL

### Alternative: Vercel (Serverless Functions)
1. Create a **separate** Vercel project for backend
2. In Vercel dashboard:
   - **Root Directory**: `backend`
   - Framework Preset: Other
3. Add environment variables
4. Note: May have cold starts and 10s timeout limit

## Frontend Deployment (Deploy Second!)

### Recommended: Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url-from-step-1
   ```
   (Use the Railway/Render URL from backend deployment)
5. Deploy!

### Alternative: Netlify
1. Similar to Vercel
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL`

## Quick Deployment Checklist

- [ ] 1. Deploy backend to Railway/Render
- [ ] 2. Get backend URL (e.g., `https://your-app.railway.app`)
- [ ] 3. Deploy frontend to Vercel
- [ ] 4. Set `VITE_API_URL` in frontend to backend URL
- [ ] 5. Update backend CORS to allow frontend domain
- [ ] 6. Test the application!

## Environment Variables Reference

### Backend Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your_qdrant_api_key
PORT=3001  # Railway/Render set this automatically
```

### Frontend Environment Variables
```bash
VITE_API_URL=https://your-backend-url.railway.app
```

## Troubleshooting

### Backend Issues

**"No Output Directory named 'public' found"**
- This means you're trying to deploy backend as a static site
- Backend should be deployed to Railway/Render, NOT as a static site on Vercel
- If using Vercel for backend, it should detect it as a Node.js project

**CORS Errors**
- Update `backend/src/index.ts`:
```typescript
app.use(cors({
  origin: ['https://your-frontend-domain.vercel.app', 'http://localhost:5173']
}));
```

### Frontend Issues

**"vite: command not found"**
- Already fixed in package.json (vite is in dependencies)
- Clear cache and redeploy

**"Failed to fetch" or API errors**
- Check `VITE_API_URL` is set correctly
- Verify backend is running (visit backend URL in browser)
- Check browser console for CORS errors

**Build fails with TypeScript errors**
- Run `npm run build` locally first
- Fix any TypeScript errors before deploying

## Testing Your Deployment

1. **Test Backend**: Visit `https://your-backend-url/health`
   - Should return: `{"status":"ok"}`

2. **Test Frontend**: Visit your Vercel URL
   - Dashboard should load
   - Click "Get Coaching" button
   - Check browser console for errors

3. **Test Integration**:
   - Trades should load automatically
   - "Get Coaching" should work without CORS errors
