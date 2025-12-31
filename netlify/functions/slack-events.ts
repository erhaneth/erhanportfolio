import { Handler } from "@netlify/functions";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// Lazy init Firebase
let database: ReturnType<typeof getDatabase> | null = null;

function getDb() {
  if (!database) {
    try {
      if (getApps().length === 0) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        // Handle different ways the key might be stored
        const formattedKey = privateKey?.includes("\\n") 
          ? privateKey.replace(/\\n/g, "\n")
          : privateKey;
          
        initializeApp({
          credential: cert({
            projectId: "portfolio-chat-aab82",
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedKey,
          }),
          databaseURL: "https://portfolio-chat-aab82-default-rtdb.firebaseio.com",
        });
      }
      database = getDatabase();
    } catch (error) {
      console.error("Firebase init error:", error);
      throw error;
    }
  }
  return database;
}

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
          console.log(`Storing message for session ${sessionId}`);
          const db = getDb();
          const messagesRef = db.ref(`messages/${sessionId}`);
          await messagesRef.push({
            sessionId,
            role: "operator",
            content: message,
            timestamp: Date.now(),
          });
          console.log(`Stored operator message for session ${sessionId}: ${message}`);
        }
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (error) {
    console.error("Error:", error);
    // Always return 200 to Slack to prevent retries
    return { statusCode: 200, body: "ok" };
  }
};
