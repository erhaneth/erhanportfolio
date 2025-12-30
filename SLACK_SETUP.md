# Slack Operator Mode Setup

This enables visitors to request a "direct connection" to you. When they do, you get notified in Slack with their conversation history, and subsequent messages are forwarded to you in real-time.

## Setup Steps

### 1. Create a Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name it something like "Portfolio Operator"
4. Select your workspace

### 2. Enable Incoming Webhooks

1. In your app settings, go to **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to ON
3. Click **"Add New Webhook to Workspace"**
4. Select the channel where you want notifications (e.g., #portfolio-leads)
5. Copy the Webhook URL (looks like `https://hooks.slack.com/services/T.../B.../xxx`)

### 3. Add to Environment

Add this to your `.env` file:

```
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 4. Deploy

Make sure your deployment platform (Netlify/Vercel) also has this environment variable set.

---

## How It Works

1. **Visitor clicks "DIRECT_CHANNEL"** in the sidebar
2. **Slack receives notification** with:
   - Session ID
   - Last 5 messages of conversation
   - Any context they provided (job description, etc.)
3. **Chat continues normally** but each message is forwarded to Slack
4. **You see what they're saying** in real-time

### What You See in Slack

```
🚨 Operator Request - Portfolio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session ID: M1XKA-R2D3
Time: 12/30/2025, 3:45:00 PM

Context Provided:
Looking for a Senior React Developer...

Recent Conversation:
👤 Visitor: Tell me about your React experience
🤖 AI: I've been working with React for 3 years...
👤 Visitor: What about TypeScript?
```

Then ongoing messages:
```
👤 [M1XKA-R2D3] Do you have availability to start in January?
```

---

## Phase 2 (Future)

To enable **two-way** chat (you reply in Slack → appears in their browser):

1. Set up Firebase Realtime Database or Supabase
2. Store messages with session IDs
3. Frontend polls/subscribes for operator messages
4. Add Slack slash command to reply

This requires more infrastructure but is doable if you want true live chat.
