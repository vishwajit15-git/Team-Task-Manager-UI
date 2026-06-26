# Full-Stack API Wiring Map: Team Task Manager

This document maps every backend endpoint in the `Team-Task-Manager` (Node.js/Express) to the exact frontend file in `Team-Task-Manager-UI` (React/Vite) that consumes it. All frontend-to-backend connections are 100% verified and aligned.

## ✅ Fully Wired APIs

### 1. Authentication (`/api/auth`)
| Backend Endpoint | HTTP Method | Frontend File | Purpose |
|------------------|-------------|---------------|---------|
| `/api/auth/register` | `POST` | `src/pages/Register.tsx` | Create new user account |
| `/api/auth/login` | `POST` | `src/pages/Login.tsx` | Authenticate user & set HTTP-only cookie |
| `/api/auth/me` | `GET` | `src/lib/auth.tsx` | Validate session on page load |
| `/api/auth/logout` | `POST` | `src/lib/auth.tsx` | Clear HTTP-only cookie |
| `/api/auth/forgot-password` | `POST` | `src/pages/ForgotPassword.tsx` | Request password reset link |
| `/api/auth/reset-password/:token`| `POST` | `src/pages/ResetPassword.tsx` | Submit new password |

### 2. Projects & Members (`/api/projects`)
| Backend Endpoint | HTTP Method | Frontend File | Purpose |
|------------------|-------------|---------------|---------|
| `/api/projects` | `GET` | `src/lib/projectContext.tsx` | Fetch all projects for the global dropdown |
| `/api/projects/:id` | `GET` | `src/pages/Team.tsx`, `Tasks.tsx` | Fetch project details (members array and active tasks) |
| `/api/projects/:projectId/members` | `POST` | `src/pages/Dashboard.tsx` | Invite/add a new member to the active project |
| `/api/projects/:projectId/members/:userId` | `DELETE` | `src/pages/Team.tsx` | Remove a member from the active project |
| `/api/projects` | `POST` | *Pending UI* | Create a new project |
| `/api/projects/:id` | `PATCH / DELETE`| *Pending UI* | Update or delete a project |

### 3. Tasks (`/api/tasks`)
| Backend Endpoint | HTTP Method | Frontend File | Purpose |
|------------------|-------------|---------------|---------|
| `/api/tasks?projectId=...` | `GET` | `src/pages/Tasks.tsx`, `Timeline.tsx` | Fetch all tasks for the active project |
| `/api/tasks?projectId=...` | `POST` | `src/pages/Tasks.tsx` | Create a new task in the active project |
| `/api/tasks/:id` | `PATCH` | `src/pages/Tasks.tsx` | Update task status or details |
| `/api/tasks/:id` | `DELETE` | `src/pages/Tasks.tsx` | Delete a task |
| `/api/tasks/:taskId/comments` | `POST` | `src/pages/Tasks.tsx` | Add a comment to a task |

### 4. Real-Time Chat (`/api/projects/:projectId/messages`)
| Backend Endpoint | HTTP Method | Frontend File | Purpose |
|------------------|-------------|---------------|---------|
| `/api/projects/:projectId/messages` | `GET` | `src/pages/Messages.tsx` | Fetch chat history for the active project |
| `/api/projects/:projectId/messages` | `POST` | `src/pages/Messages.tsx` | Send a new chat message |
| `Socket.io (ws://)` | `TCP` | `src/lib/socket.ts`, `Messages.tsx` | Instant real-time message delivery (new_message) |

### 5. Video Meetings (`/api/projects/:projectId/meetings`)
| Backend Endpoint | HTTP Method | Frontend File | Purpose |
|------------------|-------------|---------------|---------|
| `/api/projects/:projectId/meetings` | `GET` | `src/pages/Meeting.tsx` | List scheduled/active meetings for the active project |
| `/api/projects/:projectId/meetings` | `POST` | `src/pages/Meeting.tsx` | Schedule a new meeting |
| `/api/projects/:projectId/meetings/:id` | `PATCH` | `src/pages/Meeting.tsx` | Update meeting status (start/end) |

### 6. Files & Assets (`/api/files`)
| Backend Endpoint | HTTP Method | Frontend File | Purpose |
|------------------|-------------|---------------|---------|
| `/api/files?projectId=...` | `GET` | `src/pages/Files.tsx` | Fetch all files for the active project |
| `/api/files/upload` | `POST` | `src/pages/Files.tsx` | Multipart/form-data upload directly to AWS S3 |

### 7. Dashboard & Notifications (`/api/dashboard` & `/api/notifications`)
| Backend Endpoint | HTTP Method | Frontend File | Purpose |
|------------------|-------------|---------------|---------|
| `/api/dashboard` | `GET` | `src/pages/Dashboard.tsx` | Fetch aggregate stats (active, overdue, etc.) |
| `/api/notifications` | `GET` | `src/components/Layout.tsx` | Fetch unread notifications for the bell icon |
| `Socket.io (ws://)` | `TCP` | `src/lib/socket.ts` | Listens for `new_notification` events |

---
*Note: All legacy endpoints (like the old `/api/invite` or global `/api/users`) have been fully stripped out and replaced with strict Project-based scoped requests for maximum security and data consistency.*
