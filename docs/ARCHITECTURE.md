# F.R.I.D.A.Y. Voice, Workspace, Meeting & Communication Architecture

## System Architecture Diagram

```mermaid
graph TD
    A[User Voice Input / Hotkey Ctrl+Shift+Space] --> B[Client App Shell - React / Electron / Mobile]
    B --> C[Wake Word Spotter - "Hey FRIDAY"]
    C --> D[Continuous Listening & VAD Engine]
    D -->|Speech Stream| E[Web Speech / Whisper STT Engine]
    E -->|Transcript Text| F[WebSocket Service]
    F -->|ws://localhost:3001| G[Backend Core & Intent Engine]
    
    G --> H[Google Workspace Subsystem]
    G --> M[Meeting Intelligence Subsystem]
    G --> C1[Multi-Channel Communication Subsystem]
    
    C1 --> C2[SMS & Phone Telephony - OTP Extractor & Call Summarizer]
    C1 --> C3[Viber API Service - Voice Dispatch & Relay]
    C1 --> C4[Facebook Messenger Graph API - Group Chat Summarizer]
    C1 --> C5[DND Auto-Responder & Smart Reply Generator]
    
    G --> J[(Local SQLite DB - friday.db)]
    J --> J1[unified_messages]
    J --> J2[call_logs]
    J --> J3[dnd_settings]
    J --> J4[meetings & transcripts]
    J --> J5[7-Day Rolling Context Engine]
    
    G --> K[TTS Engine & Voice Personalities]
    K -->|Audio / Text Payload| F
    F --> L[Unified Inbox HUD & Smart Reply Bar]
```

## Subsystem Breakdown

### 1. Multi-Channel Communication Subsystem
- **SMS & Calls**: Readout, hands-free reply, OTP/address extraction, call initiation, post-call summary log.
- **Viber & Messenger**: Multi-platform voice messaging, driving notification relay, 24-hour group chat summarizer.
- **Unified Inbox HUD**: Single unified view with AI priority badges (`URGENT`, `OTP`, `BOSS`).
- **DND Auto-Responder**: Emergency keyword filter & meeting auto-response dispatcher.
