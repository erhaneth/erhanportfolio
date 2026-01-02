/**
 * Netlify Serverless Function for sending resume
 * This will be available at: /.netlify/functions/send-resume
 */
import { serverLogger } from "../../utils/logger";

import type { Handler } from "@netlify/functions";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { email, name } = JSON.parse(event.body || "{}");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid email address" }),
      };
    }

    // Use provided name or default to "there"
    const recipientName = name?.trim() || "there";

    // Get resume from public folder
    // In production, use your actual domain
    const resumeUrl = process.env.URL
      ? `${process.env.URL}/resume/Gumus_Huseyin_22_12_Resume.docx.pdf`
      : process.env.DEPLOY_PRIME_URL
      ? `${process.env.DEPLOY_PRIME_URL}/resume/Gumus_Huseyin_22_12_Resume.docx.pdf`
      : "http://localhost:8888/resume/Gumus_Huseyin_22_12_Resume.docx.pdf";

    const resumeResponse = await fetch(resumeUrl);
    if (!resumeResponse.ok) {
      throw new Error("Failed to fetch resume file");
    }
    const resumeBuffer = await resumeResponse.arrayBuffer();

    // Send email with resume attachment
    const { data, error } = await resend.emails.send({
      from: "Erhan Gumus <onboarding@resend.dev>", // Change this to your verified domain email
      to: email,
      subject: "Erhan Gumus - Resume",
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
          filename: "Erhan_Gumus_Resume.pdf",
          content: Buffer.from(resumeBuffer),
        },
      ],
    });

    if (error) {
      serverLogger.error("Resend error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to send email. Please try again later.",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Resume sent successfully!",
        emailId: data?.id,
      }),
    };
  } catch (error: any) {
    console.error("Error sending resume:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          error.message || "Failed to send resume. Please try again later.",
      }),
    };
  }
};
