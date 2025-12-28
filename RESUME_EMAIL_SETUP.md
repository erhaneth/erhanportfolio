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

### 3. Create Backend API Endpoint

**For Vercel:**

1. Create `api/send-resume.ts`
2. Copy code from `api/send-resume.example.ts`
3. Uncomment Resend code
4. Add `RESEND_API_KEY` to Vercel environment variables

**For Netlify:**

1. Create `netlify/functions/send-resume.ts`
2. Similar setup, different import structure

**For Custom Backend:**

- Add Express route or similar
- Update `emailService.ts` fetch URL

### 4. Environment Variables

Add to `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 5. Update Email Service URL

In `services/emailService.ts`, update the fetch URL:

- Vercel: `/api/send-resume`
- Netlify: `/.netlify/functions/send-resume`
- Custom: `https://your-api.com/send-resume`

## Testing

1. Ask AI: "Can you send me your resume?"
2. AI should ask for email
3. Email modal should appear
4. Enter test email
5. Check email inbox

## Customization

- **Email content**: Edit the HTML in `api/send-resume.example.ts`
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
