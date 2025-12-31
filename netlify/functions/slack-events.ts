import { Handler } from "@netlify/functions";

// Use Firebase REST API instead of Admin SDK to avoid bundling issues
const FIREBASE_DB_URL = "https://portfolio-chat-aab82-default-rtdb.firebaseio.com";

export const handler: Handler = async (event) => {
  console.log("Slack events received");
  
  if (!event.body) {
    return { statusCode: 400, body: "No body" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  
  // URL Verification challenge - respond immediately
  if (body.type === "url_verification") {
    console.log("Responding to challenge");
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: body.challenge,
    };
  }

  try {
    // Handle message events from operator
    if (body.event?.type === "message" && !body.event?.bot_id && !body.event?.subtype) {
      const { text } = body.event;
      console.log("Operator message:", text);
      
      // Extract session ID from message format: [SESSION_ID] message
      const sessionMatch = text?.match(/^\[([A-Z0-9-]+)\]\s*(.*)/);
      
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        const message = sessionMatch[2].trim();
        
        if (message) {
          console.log(`Storing message for session ${sessionId}: ${message}`);
          
          // Use Firebase REST API (no auth needed since rules allow public write)
          const response = await fetch(
            `${FIREBASE_DB_URL}/messages/${sessionId}.json`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                role: "operator",
                content: message,
                timestamp: Date.now(),
              }),
            }
          );
          
          if (response.ok) {
            console.log("Message stored successfully");
          } else {
            console.error("Firebase error:", await response.text());
          }
        }
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (error) {
    console.error("Error:", error);
    return { statusCode: 200, body: "ok" };
  }
};
