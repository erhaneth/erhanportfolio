import { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  console.log("slack-webhook called");
  
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  console.log("Webhook URL exists:", !!webhookUrl);
  
  if (!webhookUrl) {
    console.error("SLACK_WEBHOOK_URL not configured");
    return { statusCode: 500, body: "Slack webhook not configured" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    console.log("Sending to Slack...");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("Slack response status:", response.status);
    
    if (response.ok) {
      return { statusCode: 200, body: "ok" };
    } else {
      const errorText = await response.text();
      console.error("Slack error:", errorText);
      return { statusCode: response.status, body: "Slack error" };
    }
  } catch (error) {
    console.error("Slack webhook error:", error);
    return { statusCode: 500, body: "Internal error" };
  }
};
