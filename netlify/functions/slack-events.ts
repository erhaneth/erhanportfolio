import { Handler } from "@netlify/functions";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// Lazy init Firebase
let database: ReturnType<typeof getDatabase> | null = null;

function getDb() {
  if (!database) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: "portfolio-chat-aab82",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        databaseURL: "https://portfolio-chat-aab82-default-rtdb.firebaseio.com",
      });
    }
    database = getDatabase();
  }
  return database;
}

export const handler: Handler = async (event) => {
  console.log("Slack events received:", event.body);
  
  if (!event.body) {
    return { statusCode: 400, body: "No body" };
  }

  try {
    const body = JSON.parse(event.body);
    
    // URL Verification challenge
    if (body.type === "url_verification") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: body.challenge,
      };
    }

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
    return { statusCode: 200, body: "ok" }; // Always return 200 to Slack
  }
};
