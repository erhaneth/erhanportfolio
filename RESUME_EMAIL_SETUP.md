# Resume Email Feature Setup

The AI can now automatically send your resume when recruiters ask for it!

## How It Works

1. **Recruiter asks**: "Can you send me your resume?" or "I'd like to see your CV"
2. **AI responds**: "I'd be happy to send you my resume. What's your email address?"
3. **Email modal opens**: Recruiter enters their email
4. **Resume sent**: Backend sends PDF via email service

## Setup Steps

### 1. Resume PDF ✅

Your resume is already in place:

```
public/resume/Gumus_Huseyin_22_12_Resume.docx.pdf
```

### 2. Choose Email Service

**Recommended: Resend** (easiest, free tier: 3,000 emails/month)

- Sign up: https://resend.com
- Get API key from dashboard

**Alternatives:**

- SendGrid (free tier: 100 emails/day)
- Nodemailer (works with Gmail, SMTP)

### 3. Backend API Endpoint ✅

**For Netlify (Current Setup):**

1. ✅ `netlify/functions/send-resume.ts` already exists
2. ✅ `netlify.toml` configured with redirects
3. Add `RESEND_API_KEY` to Netlify environment variables (see NETLIFY_DEPLOY.md)

**For Custom Backend:**

- Add Express route or similar
- Update `emailService.ts` fetch URL

### 4. Environment Variables

Add to `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 5. Email Service URL ✅

In `services/emailService.ts`, the fetch URL is already configured:

- ✅ Netlify: `/api/send-resume` (automatically redirects to `/.netlify/functions/send-resume` via `netlify.toml`)
- Custom backend: Update to `https://your-api.com/send-resume`

## Testing

1. Ask AI: "Can you send me your resume?"
2. AI should ask for email
3. Email modal should appear
4. Enter test email
5. Check email inbox

## Customization

- **Email content**: Edit the HTML in `netlify/functions/send-resume.ts`
- **Resume filename**: Change in attachment settings
- **From address**: Update in email service config

## Security Notes

- ✅ Email validation on frontend and backend
- ✅ Rate limiting recommended (add to backend)
- ✅ Spam protection (handled by email service)
- ⚠️ Consider adding CAPTCHA for production

## Troubleshooting

**Modal doesn't open:**

- Check browser console for errors
- Verify function tool is registered in `geminiService.ts`

**Email not sending:**

- Check API key is correct
- Verify backend endpoint is deployed
- Check email service logs

**CORS errors:**

- Ensure backend allows requests from your domain
- Check fetch URL in `emailService.ts`
