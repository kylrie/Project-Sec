# F.R.I.D.A.Y. Production API Specifications (Phases 1 - 5)

## Base URL
- **REST**: `http://localhost:3001`
- **WebSocket**: `ws://localhost:3001`

---

## REST Endpoints Summary

### System & Health
- `GET /api/health`: System health & uptime.
- `GET /api/privacy/stats`: Database stats & 7-day retention policy.
- `POST /api/privacy/purge`: Wipes all local database tables & tokens.

### Phase 5 Sync & Brain
- `POST /api/sync`: Triggers E2E Encrypted Cross-Device Sync.
- `GET /api/brain/briefing2`: Morning Briefing 2.0.
- `GET /api/brain/habits`: Learned habit insights.
- `GET /api/brain/prep`: Predictive pre-meeting prep pack.
- `GET /api/audit`: Daily security audit log.
- `POST /api/feedback`: Submit in-app 👍/👎 rating.

### Phase 4 Multi-Channel Communication
- `GET /api/comm/inbox`: Unified Inbox & Communication Digest.
- `POST /api/comm/send`: Send SMS, Viber, or Messenger message.
- `POST /api/comm/call`: Initiate call & log summary.
- `POST /api/comm/dnd`: Toggle Meeting DND mode.

### Phase 3 Meeting Intelligence
- `POST /api/meetings/start`: Start meeting recording & diarization.
- `POST /api/meetings/stop`: Stop meeting & generate summary report.
- `POST /api/meetings/flag`: Voice bookmark timestamp.
- `GET /api/meetings/:id/export`: Export PDF meeting minutes.

### Phase 2 Google Workspace Secretary
- `GET /api/auth/google`: Get Google OAuth URL.
- `GET /api/auth/status`: Check OAuth status.
- `GET /api/workspace/summary`: Fetch Workspace HUD overview.
- `POST /api/workspace/drafts/send`: Approve and send email draft.
