import { Handler } from "@netlify/functions";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// Initialize Firebase Admin (server-side)
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

const database = getDatabase();

export const handler: Handler = async (event) => {
  // Slack sends a challenge for URL verification
  if (event.body) {
    const body = JSON.parse(event.body);
    
    // URL Verification challenge
    if (body.type === "url_verification") {
      return {
        statusCode: 200,
        body: body.challenge,
      };
    }

    // Handle message events
    if (body.event?.type === "message" && !body.event?.bot_id) {
      const { text, thread_ts, ts } = body.event;
      
      // We only care about threaded replies (your responses)
      if (thread_ts) {
        // Extract session ID from the thread (we'll include it in the original message)
        // For now, we need to find the session from the thread
        
        // Look for session ID pattern in the message or thread
        const sessionMatch = text?.match(/\[([A-Z0-9-]+)\]/);
        let sessionId = sessionMatch?.[1];
        
        // If no session ID in message, try to find it from the original thread message
        if (!sessionId && thread_ts) {
          // We'll store thread_ts -> sessionId mapping when creating threads
          const mappingRef = database.ref(`threadMappings/${thread_ts.replace(".", "_")}`);
          const snapshot = await mappingRef.get();
          sessionId = snapshot.val();
        }
        
        if (sessionId && text) {
          // Clean the message (remove session ID if present)
          const cleanMessage = text.replace(/\[[A-Z0-9-]+\]\s*/g, "").trim();
          
          if (cleanMessage) {
            // Store operator message in Firebase
            const messagesRef = database.ref(`messages/${sessionId}`);
            await messagesRef.push({
              sessionId,
              role: "operator",
              content: cleanMessage,
              timestamp: Date.now(),
            });
            
            console.log(`Operator message stored for session ${sessionId}`);
          }
        }
      }
    }
  }

  return { statusCode: 200, body: "ok" };
};
