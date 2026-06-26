# Detailed Breakdown: `src/pages/Meeting.tsx`

## 1. Overview & Importance
This page handles the Video Conferencing feature for the team workspace.

**What problem it solves:**
Instead of building a video streaming server from scratch using complex WebRTC logic, this page integrates the `@jitsi/react-sdk`. It uses our backend simply to *schedule* the meetings and store their names/IDs, but the actual heavy lifting of the video call happens on the frontend via Jitsi.

## 2. Line-by-Line Breakdown
- **JitsiMeeting Component**: This is a powerful iframe-wrapper provided by Jitsi. We pass it the `roomName` (fetched from our backend) and the user's `displayName` (from our Auth Context), and it instantly spawns a production-grade video call interface inside our app.
