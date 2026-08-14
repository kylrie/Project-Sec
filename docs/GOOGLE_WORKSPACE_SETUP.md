# Google Workspace Setup & Integration Guide

## Overview

F.R.I.D.A.Y. integrates with **Google Workspace** (Google Calendar, Gmail, and Google Tasks) to serve as your executive voice secretary.

It operates in two modes:
1. **Local Autonomous Mode (Default)**: Pre-configured with zero-setup offline simulation mode, storing all calendar events, unread email summaries, and tasks in local SQLite (`friday.db`).
2. **Production OAuth 2.0 Mode**: Connects directly to your Google Workspace account via Google Cloud OAuth 2.0 APIs.

---

## OAuth 2.0 Permission Scopes

F.R.I.D.A.Y. requests granular permissions:

| Service | Scope URI | Purpose |
|---------|-----------|---------|
| **Calendar Read** | `https://www.googleapis.com/auth/calendar.readonly` | Voice schedule summaries & daily briefings |
| **Calendar Write** | `https://www.googleapis.com/auth/calendar` | Creating meetings & conflict resolution |
| **Gmail Read** | `https://www.googleapis.com/auth/gmail.readonly` | Inbox summarization & urgent triage |
| **Gmail Send** | `https://www.googleapis.com/auth/gmail.send` | Dispatching emails after user voice approval |
| **Google Tasks** | `https://www.googleapis.com/auth/tasks` | Adding, listing, and completing tasks |

---

## Configuring Google Cloud OAuth Credentials (Production)

To connect your own Google Workspace account:

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **FRIDAY Assistant**.
3. Enable the following APIs:
   - **Google Calendar API**
   - **Gmail API**
   - **Google Tasks API**
4. Configure the **OAuth Consent Screen**:
   - User Type: Internal or External.
   - App Name: `F.R.I.D.A.Y. Assistant`.
5. Create **OAuth 2.0 Web Application Credentials**:
   - Authorized Redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Add environment variables to `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
   ```

---

## In-App Permission Management

Users can inspect active scopes, check connected account status, and click **"Revoke Permissions"** anytime in F.R.I.D.A.Y.'s Settings Modal or Privacy Dashboard.
