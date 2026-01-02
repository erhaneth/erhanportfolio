import { Handler } from "@netlify/functions";
import { serverLogger } from "../../utils/logger";

// Use Firebase REST API instead of Admin SDK to avoid bundling issues
const FIREBASE_DB_URL = "https://portfolio-chat-aab82-default-rtdb.firebaseio.com";

export const handler: Handler = async (event) => {
  serverLogger.log("=== SLACK EVENTS FUNCTION CALLED ===");
  serverLogger.log("Method:", event.httpMethod);
  serverLogger.log("Body:", event.body);
  
  if (!event.body) {
    serverLogger.log("ERROR: No body received");
    return { statusCode: 400, body: "No body" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
    serverLogger.log("Parsed body type:", body.type);
    serverLogger.log("Event type:", body.event?.type);
  } catch (e) {
    serverLogger.log("ERROR: Failed to parse JSON", e);
    return { statusCode: 400, body: "Invalid JSON" };
  }
  
  // URL Verification challenge - respond immediately
  if (body.type === "url_verification") {
    serverLogger.log("Responding to Slack challenge");
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: body.challenge,
    };
  }

  try {
    serverLogger.log("Event details:", JSON.stringify(body.event, null, 2));
    serverLogger.log("Bot ID:", body.event?.bot_id);
    serverLogger.log("Subtype:", body.event?.subtype);
    
    // Handle message events from operator
    if (body.event?.type === "message") {
      serverLogger.log("Message event detected");
      
      if (body.event?.bot_id) {
        serverLogger.log("Ignoring bot message");
        return { statusCode: 200, body: "ok" };
      }
      
      if (body.event?.subtype) {
        serverLogger.log("Ignoring message with subtype:", body.event.subtype);
        return { statusCode: 200, body: "ok" };
      }
      
      const { text, user } = body.event;
      serverLogger.log("User:", user);
      serverLogger.log("Text:", text);
      
      // Extract session ID from message format: [SESSION_ID] message or [SESSION_ID]ai: message (invisible handoff)
      const sessionMatch = text?.match(/^\[([A-Z0-9-]+)\]\s*(ai:)?\s*(.*)/i);
      serverLogger.log("Session match result:", sessionMatch);
      
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        const isGhostMode = sessionMatch[2]?.toLowerCase() === "ai:";
        const message = sessionMatch[3].trim();
        serverLogger.log("Extracted session ID:", sessionId);
        serverLogger.log("Ghost mode (invisible handoff):", isGhostMode);
        serverLogger.log("Extracted message:", message);
        
        if (message) {
          serverLogger.log(`Storing to Firebase: messages/${sessionId}`);
          
          // Use Firebase REST API (no auth needed since rules allow public write)
          // If ghost mode (ai: prefix), prepend "ai:" to message for frontend to detect
          const firebasePayload = {
            sessionId,
            role: "operator",
            content: isGhostMode ? `ai:${message}` : message,
            timestamp: Date.now(),
          };
          serverLogger.log("Firebase payload:", JSON.stringify(firebasePayload));
          
          const response = await fetch(
            `${FIREBASE_DB_URL}/messages/${sessionId}.json`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(firebasePayload),
            }
          );
          
          const responseText = await response.text();
          serverLogger.log("Firebase response status:", response.status);
          serverLogger.log("Firebase response:", responseText);
          
          if (response.ok) {
            serverLogger.log("SUCCESS: Message stored in Firebase");
          } else {
            serverLogger.error("ERROR: Firebase rejected the request");
          }
        } else {
          serverLogger.log("No message content after session ID");
        }
      } else {
        serverLogger.log("Message does not match [SESSION_ID] format");
      }
    } else {
      serverLogger.log("Not a message event, type:", body.event?.type);
    }

    return { statusCode: 200, body: "ok" };
  } catch (error) {
    serverLogger.error("ERROR in handler:", error);
    return { statusCode: 200, body: "ok" };
  }
};
