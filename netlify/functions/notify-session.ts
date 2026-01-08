/**
 * Netlify Serverless Function for sending session notification emails
 * This will be available at: /.netlify/functions/notify-session
 */

import type { Handler } from "@netlify/functions";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email recipients for session notifications
// Note: Resend free tier only allows sending to verified account email
const NOTIFICATION_EMAILS = ["gumusucb21@gmail.com"];

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { sessionId, intentSummary, signals, conversationHistory } =
      JSON.parse(event.body || "{}");

    if (!sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Session ID is required" }),
      };
    }

    // Format conversation history for email
    const conversationHtml = conversationHistory
      ?.slice(-5)
      .map(
        (msg: { role: string; content: string }) =>
          `<p style="margin: 8px 0; padding: 8px; background: ${
            msg.role === "user" ? "#e3f2fd" : "#f5f5f5"
          }; border-radius: 4px;">
            <strong>${msg.role === "user" ? "Visitor" : "AI"}:</strong>
            ${msg.content.substring(0, 200)}${msg.content.length > 200 ? "..." : ""}
          </p>`
      )
      .join("") || "<p>No conversation yet</p>";

    // Format signals
    const signalsHtml = signals?.length
      ? signals.slice(0, 3).map((s: string) => `<li>${s}</li>`).join("")
      : "<li>New visitor</li>";

    // Send notification email
    const { data, error } = await resend.emails.send({
      from: "Portfolio Notifications <onboarding@resend.dev>",
      to: NOTIFICATION_EMAILS,
      subject: `New Session on Portfolio - ${sessionId.substring(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #00FF41; margin: 0; font-size: 24px;">New Portfolio Session</h1>
          </div>

          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Session Details</h3>
            <p style="margin: 5px 0;"><strong>Session ID:</strong> <code style="background: #eee; padding: 2px 6px; border-radius: 3px;">${sessionId}</code></p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Intent:</strong> ${intentSummary || "Browsing portfolio"}</p>
          </div>

          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Signals</h3>
            <ul style="margin: 0; padding-left: 20px;">${signalsHtml}</ul>
          </div>

          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Recent Conversation</h3>
            ${conversationHtml}
          </div>

          <div style="text-align: center; padding: 20px;">
            <a href="${process.env.URL || "https://erhangumus.com"}/admin"
               style="display: inline-block; background: #00FF41; color: #0a0e27; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Open Admin Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This notification was sent automatically from your AI portfolio.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to send notification email",
        }),
      };
    }

    console.log("Session notification email sent:", data?.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Notification sent successfully",
        emailId: data?.id,
      }),
    };
  } catch (error: any) {
    console.error("Error sending session notification:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to send notification",
      }),
    };
  }
};
