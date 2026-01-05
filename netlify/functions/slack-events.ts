import { Handler } from "@netlify/functions";

// Use Firebase REST API instead of Admin SDK to avoid bundling issues
const FIREBASE_DB_URL =
  "https://portfolio-chat-aab82-default-rtdb.firebaseio.com";

// Helper to set session as live
const setSessionLive = async (sessionId: string, isLive: boolean) => {
  const liveData = {
    isLive,
    operatorJoinedAt: isLive ? Date.now() : null,
    updatedAt: Date.now(),
  };

  const response = await fetch(
    `${FIREBASE_DB_URL}/sessions/${sessionId}/live.json`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(liveData),
    }
  );

  return response.ok;
};

export const handler: Handler = async (event) => {
  console.log("=== SLACK EVENTS FUNCTION CALLED ===");
  console.log("Method:", event.httpMethod);
  console.log("Body:", event.body);

  if (!event.body) {
    console.log("ERROR: No body received");
    return { statusCode: 400, body: "No body" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
    console.log("Parsed body type:", body.type);
    console.log("Event type:", body.event?.type);
  } catch (e) {
    console.log("ERROR: Failed to parse JSON", e);
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // URL Verification challenge - respond immediately
  if (body.type === "url_verification") {
    console.log("Responding to Slack challenge");
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: body.challenge,
    };
  }

  try {
    console.log("Event details:", JSON.stringify(body.event, null, 2));
    console.log("Bot ID:", body.event?.bot_id);
    console.log("Subtype:", body.event?.subtype);

    // Handle message events from operator
    if (body.event?.type === "message") {
      console.log("Message event detected");

      if (body.event?.bot_id) {
        console.log("Ignoring bot message");
        return { statusCode: 200, body: "ok" };
      }

      if (body.event?.subtype) {
        console.log("Ignoring message with subtype:", body.event.subtype);
        return { statusCode: 200, body: "ok" };
      }

      const { text, user } = body.event;
      console.log("User:", user);
      console.log("Text:", text);

      // Check for /join command: /join SESSION_ID
      const joinMatch = text?.match(/^\/join\s+([A-Z0-9-]+)/i);
      if (joinMatch) {
        const sessionId = joinMatch[1].toUpperCase();
        console.log(`JOIN COMMAND: Setting session ${sessionId} to live mode`);

        const success = await setSessionLive(sessionId, true);
        if (success) {
          console.log("SUCCESS: Session set to live mode");

          // Also send a system message to the chat
          await fetch(`${FIREBASE_DB_URL}/messages/${sessionId}.json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              role: "operator",
              content:
                "Hey! I saw you were interested in chatting. I'm Erhan - how can I help?",
              timestamp: Date.now(),
            }),
          });
        } else {
          console.error("ERROR: Failed to set session to live mode");
        }
        return { statusCode: 200, body: "ok" };
      }

      // Check for /leave command: /leave SESSION_ID
      const leaveMatch = text?.match(/^\/leave\s+([A-Z0-9-]+)/i);
      if (leaveMatch) {
        const sessionId = leaveMatch[1].toUpperCase();
        console.log(`LEAVE COMMAND: Setting session ${sessionId} to AI mode`);

        const success = await setSessionLive(sessionId, false);
        if (success) {
          console.log("SUCCESS: Session returned to AI mode");
        }
        return { statusCode: 200, body: "ok" };
      }

      // Extract session ID from message format: [SESSION_ID] message
      const sessionMatch = text?.match(/^\[([A-Z0-9-]+)\]\s*(.*)/);
      console.log("Session match result:", sessionMatch);

      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        const message = sessionMatch[2].trim();
        console.log("Extracted session ID:", sessionId);
        console.log("Extracted message:", message);

        if (message) {
          console.log(`Storing to Firebase: messages/${sessionId}`);

          // First, ensure the session is in live mode (auto-join when sending message)
          await setSessionLive(sessionId, true);
          console.log("Session set to live mode");

          // Use Firebase REST API (no auth needed since rules allow public write)
          const firebasePayload = {
            sessionId,
            role: "operator",
            content: message,
            timestamp: Date.now(),
          };
          console.log("Firebase payload:", JSON.stringify(firebasePayload));

          const response = await fetch(
            `${FIREBASE_DB_URL}/messages/${sessionId}.json`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(firebasePayload),
            }
          );

          const responseText = await response.text();
          console.log("Firebase response status:", response.status);
          console.log("Firebase response:", responseText);

          if (response.ok) {
            console.log("SUCCESS: Message stored in Firebase");
          } else {
            console.error("ERROR: Firebase rejected the request");
          }
        } else {
          console.log("No message content after session ID");
        }
      } else {
        console.log("Message does not match [SESSION_ID] format");
      }
    } else {
      console.log("Not a message event, type:", body.event?.type);
    }

    return { statusCode: 200, body: "ok" };
  } catch (error) {
    console.error("ERROR in handler:", error);
    return { statusCode: 200, body: "ok" };
  }
};
