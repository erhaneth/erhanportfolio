import { Handler } from "@netlify/functions";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export const handler: Handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  if (!SLACK_WEBHOOK_URL) {
    return { statusCode: 500, body: "Slack webhook not configured" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { statusCode: 200, body: "ok" };
    } else {
      return { statusCode: response.status, body: "Slack error" };
    }
  } catch (error) {
    console.error("Slack webhook error:", error);
    return { statusCode: 500, body: "Internal error" };
  }
};
