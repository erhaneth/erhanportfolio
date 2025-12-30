import { Handler } from "@netlify/functions";

// Simple handler - Firebase integration can be added later
export const handler: Handler = async (event) => {
  console.log("Slack events received:", event.body);
  
  if (!event.body) {
    return { statusCode: 400, body: "No body" };
  }

  try {
    const body = JSON.parse(event.body);
    
    // URL Verification challenge - Slack needs this to verify the endpoint
    if (body.type === "url_verification") {
      console.log("Responding to Slack challenge");
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: body.challenge,
      };
    }

    // Handle message events (for future: store in Firebase)
    if (body.event?.type === "message" && !body.event?.bot_id) {
      console.log("Message event:", body.event);
      // TODO: Add Firebase storage for operator replies
    }

    return { statusCode: 200, body: "ok" };
  } catch (error) {
    console.error("Error parsing Slack event:", error);
    return { statusCode: 500, body: "Parse error" };
  }
};
