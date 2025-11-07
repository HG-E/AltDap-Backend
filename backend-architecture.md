# AltDap Backend Architecture & API Blueprint

This document describes the backend stack, service boundaries, API endpoints, and data schema required to power the AltDap application. It is intended as a hand-off spec for an AI agent or engineering team implementing the backend.

---

## 1. Technical Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Runtime | Node.js 20+, TypeScript | Strong type safety across services |
| Framework | NestJS (or Express + modular architecture) | Provides DI, decorators, structured modules |
| ORM | Prisma | PostgreSQL schema management and type-safe queries |
| Database | PostgreSQL (managed: RDS/Cloud SQL) | Primary persistence |
| Cache | Redis | Sessions, rate limits, challenge state |
| Queue / Workers | BullMQ (Redis) or Temporal | Notifications, streak jobs, moderation tasks |
| Storage | S3-compatible bucket | Avatars, media uploads |
| Observability | OpenTelemetry, Datadog/New Relic | Metrics, traces, logs |
| Auth | JWT access/refresh tokens + optional OAuth/SMS OTP | Guardian consent flows |
| Infrastructure | Dockerized services deployed to AWS/GCP/Azure | IaC via Terraform |

---

## 2. Architecture Overview

1. **API Gateway / HTTP Layer**
   - HTTPS termination, rate limiting per IP/user role.
   - Middleware for JWT verification, role scopes (teen/mentor/guardian/admin).
   - Feature flag integration (LaunchDarkly, ConfigCat).

2. **Service Modules**
   - **Auth Service**: registration, login, refresh, guardian consent.
   - **User Profile Service**: profiles, avatars, preferences.
   - **Assessment Service**: question banks, responses, recommendation generation.
   - **Learning Service**: courses, modules, progress, badges, streaks, daily challenges.
   - **Mentor & Organization Service**: mentor discovery, booking, organization resources.
   - **Community Service**: posts, comments, reactions, moderation, reports.
   - **Support Service**: emergency resources, ticketing, crisis integrations.
   - **Notification Service**: in-app notifications, push/email scheduling.

3. **Asynchronous Processing**
   - Job queue(s) for email/push delivery, streak protection, badge unlocks, moderation review, analytics rollups.

4. **Data Stores**
   - PostgreSQL schemas for transactional data.
   - Redis for transient/session data.
   - S3 for uploaded media.
   - Optional search index (OpenSearch) for full-text queries.

---

## 3. API Endpoints

### 3.1 Authentication & Authorization

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/signup` | Register teen/guardian/mentor accounts, returns tokens. |
| POST | `/auth/login` | Email/password login, returns JWT + refresh token. |
| POST | `/auth/refresh` | Rotate access token using refresh token. |
| POST | `/auth/logout` | Invalidate refresh token. |
| POST | `/auth/password-reset/request` | Send reset email/SMS. |
| POST | `/auth/password-reset/confirm` | Complete reset with token. |
| POST | `/auth/verify-email` | Verify email after signup. |
| POST | `/auth/guardian-consent` | Capture guardian approval for underage users. |

### 3.2 User & Profile

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/users/me` | Retrieve authenticated user profile + preferences. |
| PUT | `/users/me` | Update profile (name, pronouns, goals, etc.). |
| POST | `/users/me/avatar` | Upload avatar via presigned URL handshake. |
| GET | `/users/:id` | Public profile (limited fields). |
| GET | `/users/me/settings` | Notification, privacy, guardian links. |
| PUT | `/users/me/settings` | Update settings. |

### 3.3 Assessment & Personalization

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/assessments/questions` | Get latest assessment question set (versioned). |
| POST | `/assessments/responses` | Submit responses; triggers recommendation engine. |
| GET | `/assessments/responses/:id` | Fetch past assessment results. |
| GET | `/assessments/recommendations` | Personalized recommended courses/challenges. |

### 3.4 Learning (Courses, Modules, Progress)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/courses` | List/search courses (filters: category, difficulty). |
| POST | `/courses` *(admin)* | Create/update course metadata. |
| GET | `/courses/:courseId` | Course details with modules. |
| POST | `/courses/:courseId/modules/:moduleId/progress` | Update module state (started/completed). |
| POST | `/courses/:courseId/complete` | Mark full completion, award points. |
| GET | `/courses/:courseId/progress` | Fetch user’s progress breakdown. |
| GET | `/courses/recommended` | Recommended learning paths (based on assessment/behavior). |

### 3.5 Lessons, Challenges, Streaks, Badges

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/streaks` | Current streak, longest, shield status. |
| POST | `/streaks/protect` | Redeem shield to prevent streak loss. |
| GET | `/challenges/daily` | Fetch daily/weekly challenge list. |
| POST | `/challenges/:challengeId/complete` | Mark challenge complete, award points. |
| GET | `/badges` | List earned + locked badges. |
| POST | `/badges/:badgeId/unlock` *(internal)* | For awarding badges via job worker. |

### 3.6 Mentors, Bookings, Organizations

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/mentors` | Discover mentors (filters by specialty, availability). |
| POST | `/mentors` *(admin)* | Create mentor profiles. |
| GET | `/mentors/:mentorId` | Mentor profile detail. |
| GET | `/mentors/:mentorId/availability` | Free slots for booking. |
| POST | `/mentors/:mentorId/bookings` | Request a session (with optional guardian CC). |
| PATCH | `/bookings/:bookingId` | Accept/cancel/reschedule session. |
| GET | `/organizations` | Support orgs (rehab, hospitals, etc.). |
| GET | `/organizations/:orgId` | Detail including services and contact info. |

### 3.7 Community & Moderation

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/posts` | List community posts (support pagination, filters). |
| POST | `/posts` | Create post (text + media). |
| GET | `/posts/:postId` | Post detail. |
| DELETE | `/posts/:postId` | Soft delete by author/mod. |
| POST | `/posts/:postId/reactions` | React (like, support). |
| POST | `/posts/:postId/report` | Report for moderation. |
| GET | `/posts/:postId/comments` | List comments. |
| POST | `/posts/:postId/comments` | Add comment/reply. |
| POST | `/moderation/reviews` *(internal)* | Moderation decision ingestion. |

### 3.8 Support & Emergency

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/support/emergency-resources` | Crisis hotlines, regional resources. |
| POST | `/support/tickets` | Contact counselors/support; generates ticket. |
| GET | `/support/tickets/:ticketId` | View status/history. |
| POST | `/support/tickets/:ticketId/messages` | Two-way counselor messaging. |

### 3.9 Notifications

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/notifications` | Fetch notification center items. |
| POST | `/notifications/mark-read` | Mark specific notifications read. |
| POST | `/notifications/subscribe` | Register push token/device. |
| DELETE | `/notifications/subscribe/:deviceId` | Remove device token. |

### 3.10 Analytics & Reporting (Admin)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/analytics/engagement` | Aggregate metrics (DAU, streak stats). |
| GET | `/analytics/course-completions` | Completion rates per course. |
| GET | `/analytics/community-health` | Post volume, report counts. |
| GET | `/admin/users` | Admin search over users (with pagination). |
| PATCH | `/admin/users/:userId/status` | Suspend/reactivate accounts. |

---

## 4. Data Model (Key Tables)

### 4.1 Users & Auth

```sql
User(id, email, passwordHash, role, firstName, lastName, pronouns, avatarUrl,
     guardianId, guardianConsentStatus, createdAt, updatedAt)

GuardianConsent(id, userId, guardianName, guardianEmail, status, signedAt)

Session(id, userId, refreshTokenHash, userAgent, ipAddress, expiresAt)
```

### 4.2 Assessment

```sql
AssessmentVersion(id, version, questions JSONB, isActive)
AssessmentResponse(id, userId, versionId, answers JSONB, recommendations JSONB, createdAt)
```

### 4.3 Learning

```sql
Course(id, title, description, category, difficulty, points, heroImageUrl, tags TEXT[])
Module(id, courseId, title, type ENUM('video','reading','quiz','activity'), contentUrl, orderIndex, metadata JSONB)
CourseProgress(id, userId, courseId, moduleStatus JSONB, progressPercent, completedAt)
Badge(id, code, name, description, icon, criteria JSONB)
UserBadge(userId, badgeId, earnedAt)
Challenge(id, title, description, type, rewardPoints, expiresAt)
ChallengeCompletion(userId, challengeId, completedAt)
Streak(userId, currentValue, longestValue, lastActiveDate, shieldsRemaining)
```

### 4.4 Mentors & Bookings

```sql
Mentor(id, userId FK->User, bio, specialties TEXT[], rating, sessionsCompleted)
MentorAvailability(id, mentorId, startTime, endTime, isRecurring)
Booking(id, mentorId, userId, status ENUM('pending','confirmed','cancelled','completed'),
        scheduledStart, scheduledEnd, channel, guardianNotified BOOL)

Organization(id, name, type ENUM('Rehabilitation','Mental Health','Support Group','Hospital'),
             location, phone, email, services TEXT[], imageUrl)
```

### 4.5 Community

```sql
Post(id, authorId, content, mediaUrls TEXT[], visibility, moderationStatus, createdAt, updatedAt)
Reaction(id, postId, userId, type ENUM('like','support','celebrate'), createdAt)
Comment(id, postId, authorId, content, parentCommentId, createdAt)
Report(id, targetType ENUM('post','comment','user'), targetId, reporterId, reason, status, createdAt)
```

### 4.6 Support & Notifications

```sql
EmergencyResource(id, region, label, phone, sms, website, availableHours)
SupportTicket(id, userId, category, status, priority, assignedTo, createdAt, updatedAt)
SupportMessage(id, ticketId, senderId, message, attachments, createdAt)

Notification(id, userId, type, payload JSONB, readAt, createdAt)
PushSubscription(id, userId, deviceId, platform, token, createdAt)
```

---

## 5. Event & Job Flow (Examples)

1. **Course Completion**
   - `POST /courses/:courseId/complete` triggers event `course.completed`.
   - Worker listens, awards points, checks badge criteria, updates streak.
   - Notification service sends celebration push/in-app message.

2. **Daily Digest**
   - Nightly cron aggregates each user’s progress, upcoming mentor sessions, recommended challenges.
   - Generates notifications + email summary.

3. **Community Moderation**
   - `POST /posts/:id/report` enqueues moderation job.
   - Worker runs AI toxicity check, triages to human if needed, updates `moderationStatus`, sends resolution notification.

4. **Streak Protection**
   - Daily job finds users near streak break.
   - Sends reminder / allows shield redemption (`POST /streaks/protect`).

---

## 6. Security & Compliance Considerations

- Encrypt PII fields (guardian info, contact data) at rest via KMS.
- Enforce RBAC based on user role claims.
- Audit log table capturing critical events (login, profile change, mentor booking, community moderation).
- Rate limit sensitive endpoints (auth, posting) to prevent abuse.
- Support data export/delete for privacy requests (GDPR/CCPA).
- Zero-trust approach for admin APIs (service account tokens, IP allowlists).

---

## 7. Implementation Plan (High-Level)

1. **Bootstrap Repository**
   - NestJS project with modules scaffolded per domain.
   - Configure Prisma schema + migrations.
   - Set up ESLint, Prettier, unit/integration test harness (Jest).

2. **MVP Milestones**
   1. Auth + User profiles + Assessment submission.
   2. Course/catalog APIs with progress tracking.
   3. Community posting + moderation + notifications.
   4. Mentor booking + support resources.

3. **Deployment**
   - Dockerize app & worker.
   - Provision dev/staging/prod via Terraform.
   - CI/CD pipeline (GitHub Actions) running tests and deploying via blue/green.

4. **Integration with Front-End**
   - Publish OpenAPI spec.
   - Provide generated client SDK (e.g., OpenAPI generator) to the web app.
   - Implement feature flags to progressively switch from mock data to live API.

---

This blueprint captures the required backend services, endpoints, data structures, and operational considerations for AltDap. It can be handed directly to an AI agent or backend team to implement the API and supporting infrastructure. Ensure any custom business rules discovered later are appended to this document for continuity.
