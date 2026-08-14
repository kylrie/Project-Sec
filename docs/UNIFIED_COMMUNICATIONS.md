# F.R.I.D.A.Y. Multi-Channel Unified Communication Manager Documentation

## Overview

F.R.I.D.A.Y. serves as a multi-channel **Communication Manager** — reading, drafting, and dispatching messages across **SMS & Phone Calls**, **Viber**, **Facebook Messenger**, and **Gmail**.

---

## Key Capabilities

### 1. SMS & Phone Telephony
- **SMS Readout & Voice Reply**: Incoming SMS readout ("Message from Mom: 'Dinner at 7?'") with hands-free voice reply drafting.
- **Smart OTP Metadata Extraction**: Automatically detects OTP verification codes, addresses, and appointment times from SMS content ("Your Stark Bank verification code is 482910").
- **Phone Calls**: Voice call initiation ("Call John"), incoming caller announcement, and post-call summary logger.

### 2. Viber Integration
- **Viber Bot API**: Voice draft & send ("Tell John on Viber I'll be 10 minutes late").
- **Driving / Hands-Free Relay**: Incoming Viber message readout during voice mode.

### 3. Facebook Messenger Integration
- **Messenger Graph API**: Message fetch, draft creation, and voice dispatches.
- **Group Chat Summarizer**: Summarizes 24 hours of group chat activity ("What did the family group say?").

### 4. Unified Inbox HUD & Communication Digest
- Single HUD view aggregating unread messages across SMS, Viber, Messenger, and Gmail.
- Platform filter tabs (`All`, `SMS`, `Viber`, `Messenger`, `Gmail`).
- Communication Digest ("You have 12 unread messages across 4 platforms. 2 are urgent.").

### 5. Smart Reply Suggestions & DND Auto-Responder
- **Context-Aware Smart Replies**: Generates 3 quick reply options ("Yes, see you at 7!", "Can we push by 15 mins?", "I am running slightly late").
- **Meeting DND & Auto-Responder**: Filters non-emergency notifications during meetings while dispatching automated auto-responses ("F.R.I.D.A.Y. is managing Tony's messages. They will reply shortly."). Breaks through only for emergency keywords (`urgent`, `emergency`, `help`, `ASAP`).
