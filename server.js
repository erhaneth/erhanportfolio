/**
 * Simple local dev server for testing the resume API
 * Run: node server.js
 * This will start a server on port 3001 that handles /api/send-resume
 */

import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Check if API key is loaded
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in environment variables!');
  console.error('   Make sure .env.local exists and contains RESEND_API_KEY');
} else {
  console.log('✅ RESEND_API_KEY loaded');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasApiKey: !!process.env.RESEND_API_KEY,
    resumePath: join(__dirname, 'public', 'resume', 'Gumus_Huseyin_22_12_Resume.docx.pdf')
  });
});

app.post('/api/send-resume', async (req, res) => {
  const { email, name } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Use provided name or default to "there"
  const recipientName = name?.trim() || 'there';

  try {
    // Read resume from public folder
    const resumePath = join(__dirname, 'public', 'resume', 'Gumus_Huseyin_22_12_Resume.docx.pdf');
    
    try {
      var resumeBuffer = readFileSync(resumePath);
    } catch (fileError) {
      console.error('Failed to read resume file:', fileError);
      return res.status(500).json({
        error: 'Resume file not found. Please check the file path.',
      });
    }

    // Send email with resume attachment
    const { data, error } = await resend.emails.send({
      from: 'Erhan Gumus <onboarding@resend.dev>',
      to: email,
      subject: 'Erhan Gumus - Resume',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00FF41;">Hello ${recipientName}!</h2>
          <p>Thank you for your interest in my work. Please find my resume attached.</p>
          <p>I'm excited about the opportunity to connect and discuss how I can contribute to your team.</p>
          <p>Best regards,<br><strong>Erhan Gumus</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            This email was sent automatically from my AI portfolio. 
            You can reach me directly through the portfolio chat or via LinkedIn.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'Erhan_Gumus_Resume.pdf',
          content: resumeBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error, null, 2));
      return res.status(500).json({
        error: error.message || 'Failed to send email. Please try again later.',
        details: error,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resume sent successfully!',
      emailId: data?.id,
    });
  } catch (error) {
    console.error('Error sending resume:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send resume. Please try again later.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📧 Resume API: http://localhost:${PORT}/api/send-resume`);
  console.log(`✅ Make sure Vite dev server is running on port 3000`);
});

