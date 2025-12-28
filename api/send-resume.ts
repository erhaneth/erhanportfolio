import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Use provided name or default to "there"
  const recipientName = name?.trim() || 'there';

  try {
    // Get resume from public folder
    // In production, use your actual domain
    const resumeUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/resume/Gumus_Huseyin_22_12_Resume.docx.pdf`
      : process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/resume/Gumus_Huseyin_22_12_Resume.docx.pdf`
      : 'http://localhost:3000/resume/Gumus_Huseyin_22_12_Resume.docx.pdf';

    const resumeResponse = await fetch(resumeUrl);
    if (!resumeResponse.ok) {
      throw new Error('Failed to fetch resume file');
    }
    const resumeBuffer = await resumeResponse.arrayBuffer();

    // Send email with resume attachment
    const { data, error } = await resend.emails.send({
      from: 'Erhan Gumus <onboarding@resend.dev>', // Change this to your verified domain email
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
          content: Buffer.from(resumeBuffer),
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({
        error: 'Failed to send email. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resume sent successfully!',
      emailId: data?.id,
    });
  } catch (error: any) {
    console.error('Error sending resume:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send resume. Please try again later.',
    });
  }
}

