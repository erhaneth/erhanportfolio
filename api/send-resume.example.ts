/**
 * EXAMPLE BACKEND API ENDPOINT
 * 
 * This is an example of how to set up the backend endpoint for sending resumes.
 * 
 * Choose one of these deployment options:
 * 
 * OPTION 1: Vercel Serverless Function
 * - Create: api/send-resume.ts
 * - Deploy to Vercel
 * 
 * OPTION 2: Netlify Function
 * - Create: netlify/functions/send-resume.ts
 * - Deploy to Netlify
 * 
 * OPTION 3: Express/Node.js Backend
 * - Add route to your Express server
 * 
 * You'll need to:
 * 1. Install an email service (Resend, SendGrid, Nodemailer, etc.)
 * 2. Add your API keys to environment variables
 * 3. Place your resume PDF in the public folder or cloud storage
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Example using Resend (recommended - simple and modern)
// npm install resend
// Get API key from: https://resend.com/api-keys

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    // OPTION 1: Using Resend (recommended)
    // const { Resend } = require('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // 
    // // Get resume from public folder (adjust URL to your deployment)
    // const resumeUrl = process.env.VERCEL_URL 
    //   ? `https://${process.env.VERCEL_URL}/resume/Gumus_Huseyin_22_12_Resume.docx.pdf`
    //   : 'http://localhost:3000/resume/Gumus_Huseyin_22_12_Resume.docx.pdf';
    // 
    // const resumeBuffer = await fetch(resumeUrl).then(r => r.arrayBuffer());
    // 
    // const { data, error } = await resend.emails.send({
    //   from: 'Erhan Gumus <portfolio@yourdomain.com>',
    //   to: email,
    //   subject: 'Erhan Gumus - Resume',
    //   html: `
    //     <h2>Hello!</h2>
    //     <p>Thank you for your interest. Please find Erhan's resume attached.</p>
    //     <p>Best regards,<br>Erhan Gumus</p>
    //   `,
    //   attachments: [{
    //     filename: 'Erhan_Gumus_Resume.pdf',
    //     content: Buffer.from(resumeBuffer)
    //   }]
    // });
    // 
    // if (error) throw error;

    // OPTION 2: Using SendGrid
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // 
    // const resumeUrl = process.env.VERCEL_URL 
    //   ? `https://${process.env.VERCEL_URL}/resume/Gumus_Huseyin_22_12_Resume.docx.pdf`
    //   : 'http://localhost:3000/resume/Gumus_Huseyin_22_12_Resume.docx.pdf';
    // 
    // const resumeBuffer = await fetch(resumeUrl).then(r => r.arrayBuffer());
    // 
    // await sgMail.send({
    //   to: email,
    //   from: 'portfolio@yourdomain.com',
    //   subject: 'Erhan Gumus - Resume',
    //   html: '<p>Thank you for your interest. Please find Erhan\'s resume attached.</p>',
    //   attachments: [{
    //     content: Buffer.from(resumeBuffer).toString('base64'),
    //     filename: 'Erhan_Gumus_Resume.pdf',
    //     type: 'application/pdf',
    //     disposition: 'attachment'
    //   }]
    // });

    // OPTION 3: Using Nodemailer (Gmail, SMTP, etc.)
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASSWORD
    //   }
    // });
    // 
    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: 'Erhan Gumus - Resume',
    //   html: '<p>Thank you for your interest. Please find Erhan\'s resume attached.</p>',
    //   attachments: [{
    //     filename: 'Erhan_Gumus_Resume.pdf',
    //     path: './public/resume/Gumus_Huseyin_22_12_Resume.docx.pdf'
    //   }]
    // });

    // For now, return success (you'll implement actual email sending above)
    return res.status(200).json({
      success: true,
      message: 'Resume sent successfully!'
    });

  } catch (error: any) {
    console.error('Error sending resume:', error);
    return res.status(500).json({
      error: 'Failed to send resume. Please try again later.'
    });
  }
}

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Choose an email service (Resend is easiest - free tier: 3,000 emails/month)
 * 
 * 2. Install the package:
 *    npm install resend
 * 
 * 3. Get API key from Resend dashboard
 * 
 * 4. Add to .env.local:
 *    RESEND_API_KEY=re_xxxxxxxxxxxxx
 * 
 * 5. Your resume is already at: public/resume/Gumus_Huseyin_22_12_Resume.docx.pdf
 * 
 * 6. Uncomment the Resend code above and implement
 * 
 * 7. Update the emailService.ts fetch URL to match your deployment:
 *    - Vercel: '/api/send-resume'
 *    - Netlify: '/.netlify/functions/send-resume'
 *    - Custom: 'https://your-api.com/send-resume'
 */

