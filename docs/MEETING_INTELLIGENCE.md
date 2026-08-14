# F.R.I.D.A.Y. Meeting Intelligence Engine Documentation

## Overview

The **Meeting Intelligence Engine** is F.R.I.D.A.Y.'s killer feature. It gives F.R.I.D.A.Y. the ability to join, record, transcribe, diarize speakers, summarize, and export structured meeting minutes for both **Online Meetings** (Google Meet, Zoom, Teams) and **Offline Ambient In-Person Meetings**.

---

## Key Capabilities

### 1. Online & Ambient Meeting Recording
- **Google Meet Auto-Join**: Detects Google Meet link from Phase 2 Calendar ("Your Google Meet starts in 2 minutes. Shall I join?"), opens Meet link, and starts audio capture.
- **Ambient Mic Recording**: Voice trigger ("Hey FRIDAY, start meeting minutes") activates ambient microphone capture for offline meetings.
- **Plugin Architecture**: Extensible plugin architecture (`meetingPlugins.js`) supporting Google Meet, Ambient Mic, Zoom, and Microsoft Teams.

### 2. Real-Time Transcription & Speaker Diarization
- **Whisper Integration**: Audio stream transcription with Silero VAD segmenter.
- **Speaker Diarization**: Identifies distinct speakers ("Speaker 1: Tony Stark", "Speaker 2: Pepper Potts", "Speaker 3: Rhodey").
- **Smart Voice Bookmarking**: Voice trigger ("FRIDAY, flag that" / "FRIDAY, bookmark timestamp") flags important timestamps for post-meeting review.

### 3. Intelligent Summarization (< 60s Execution)
Automated post-meeting report generated in under 60 seconds:
- **Executive Summary**: 3-5 high-level bullet points.
- **Key Decisions Made**: Explicitly highlighted decisions ("Move production rollout to Q2 end").
- **Action Items Table**: Formatted as `[Action] | [Owner] | [Deadline]`.

### 4. Automatic Google Tasks Conversion
- Extracted meeting action items are automatically converted into **Google Tasks** with 1-click or voice confirmation.

### 5. Document Exporter (PDF & Markdown)
- Generates formatted PDF meeting minutes documents and Markdown files stored in `docs/Meeting_Minutes_[ID].md`.

---

## Legal & Compliance Security
- **Visual Recording Indicator**: Pulsing crimson banner (`● RECORDING ACTIVE`) displayed during active recording.
- **Audio Announcement Option**: "This call is being recorded and transcribed by F.R.I.D.A.Y."
- **1-Tap Stop Recording**: Instant cancellation and privacy wiping via Privacy Dashboard.
