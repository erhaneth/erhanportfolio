# 🚀 Netlify Deployment Guide

## Prerequisites

1. **GitHub Account** (your code is already pushed)
2. **Netlify Account** (free at [netlify.com](https://netlify.com))
3. **Resend API Key** (for sending resumes)

## Step-by-Step Deployment

### 1. Connect Your Repository

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize Netlify
4. Select your repository: `erhaneth/erhanportfolio`
5. Netlify will auto-detect your settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - ✅ These are already configured in `netlify.toml`

### 2. Set Environment Variables ⚠️ CRITICAL

**You MUST set these BEFORE deploying, or trigger a redeploy after setting them!**

1. In your site settings, go to **"Environment variables"**
2. Click **"Add variable"** and add:

   ```
   GEMINI_API_KEY = your_gemini_api_key_here
   RESEND_API_KEY = your_resend_api_key_here
   ```

   ⚠️ **Important**:

   - Get your `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey)
   - **After adding env vars, you MUST redeploy** (go to Deploys → Trigger deploy → Deploy site)
   - Environment variables are injected at BUILD TIME, so existing deploys won't have them

### 3. Deploy!

1. Click **"Deploy site"**
2. Wait for the build to complete (~2-3 minutes)
3. Your site will be live at: `https://random-name-123.netlify.app`

### 4. Custom Domain (Optional)

1. Go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `erhangumus.dev`)
4. Follow DNS setup instructions

## ✅ Verify Everything Works

After deployment, test:

1. ✅ **Homepage loads** - Matrix rain animation works
2. ✅ **Voice chat** - Click "SPEAK" button, test microphone
3. ✅ **Text chat** - Send a message, get AI response
4. ✅ **Resume feature** - Ask AI: "Can you send me your resume?"
   - Enter email in modal
   - Check your email inbox

## 🔧 Troubleshooting

### Build Fails

**Error**: `Module not found` or `Cannot find module`

- **Fix**: Make sure `package.json` has all dependencies
- Run `npm install` locally to verify

**Error**: `Environment variable not found` or `[INTERNAL_ERROR_0x99]: System instability. Connection lost.`

- **Fix**:
  1. Check that `GEMINI_API_KEY` is set in Netlify environment variables
  2. **CRITICAL**: After adding env vars, you MUST trigger a new deploy
  3. Go to **Deploys** → **Trigger deploy** → **Deploy site**
  4. Wait for the new build to complete
  5. The error happens because the API key wasn't available during the build

### Resume Email Not Sending

**Error**: `Failed to send email`

- **Fix**:
  1. Verify `RESEND_API_KEY` is correct in Netlify
  2. Check Resend dashboard for errors
  3. Make sure your Resend account is verified

### Function Not Found (404)

**Error**: `/api/send-resume` returns 404

- **Fix**:
  1. Check `netlify.toml` has the redirect rule
  2. Verify `netlify/functions/send-resume.ts` exists
  3. Redeploy after making changes

## 📁 Project Structure for Netlify

```
erhan-ai-portfolio/
├── netlify.toml              # Netlify config ✅
├── netlify/
│   └── functions/
│       └── send-resume.ts    # Serverless function ✅
├── public/
│   └── resume/
│       └── Gumus_Huseyin_22_12_Resume.docx.pdf
└── dist/                     # Build output (auto-generated)
```

## 🎯 Quick Deploy Commands

If you prefer CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

## 📝 Notes

- **Free tier**: 100GB bandwidth/month (plenty for a portfolio)
- **Functions**: 125K requests/month (more than enough)
- **Builds**: 300 minutes/month (unlimited for personal projects)
- **SSL**: Automatic HTTPS (free)

## 🆘 Need Help?

- Netlify Docs: [docs.netlify.com](https://docs.netlify.com)
- Netlify Community: [community.netlify.com](https://community.netlify.com)

---

**You're all set!** 🎉 Your portfolio is ready to go live.
