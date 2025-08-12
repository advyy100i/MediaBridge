
# Media Access & Analytics Platform Backend

A secure media management backend with user auth, media metadata management, streaming URLs, view logging, analytics with caching, and rate limiting.
##
* Users can upload media and generate secure streaming links.
* Tracks who is watching your media, when, and from where. 
* Adds performance, security, and production-readiness features.
 
---

## Key Features

* **User Authentication** (Signup/Login with JWT)
* **Media Management** (Add media metadata, stream URLs)
* **View Logging** (IP + timestamp)
* **Analytics** with Redis caching
* **Rate Limiting** on view logging endpoint
* **Automated Tests** (Jest/PyTest/JUnit)
* **Dockerized** for easy deployment
* **Config via `.env`**

---

## Database Schemas

* **MediaAsset**: `id`, `title`, `type` (video/audio), `file_url`, `created_at`
* **AdminUser**: `id`, `email`, `hashed_password`, `created_at`
* **MediaViewLog**: `media_id`, `viewed_by_ip`, `timestamp`

---

## APIs

* `POST /auth/signup`
* `POST /auth/login` → returns JWT token
* `POST /media` (auth) → add media metadata
* `GET /media/:id/stream-url` → returns secure 10-minute expiring URL
* `POST /media/:id/view` → log a view (with IP & timestamp), rate limited
* `GET /media/:id/analytics` → return view stats, cached with Redis

---

## Setup & Usage

* Clone repo
* Copy `.env.example` to `.env` and configure
* Build and run with Docker:

  ```bash
  docker compose up --build
  ```
* Run tests:

  ```bash
  # Example for Node.js (adjust for your stack)
  npm test
  ```

---

## Notes

* Streaming URLs are signed and expire after 10 minutes for security.
* Redis caches analytics responses to improve performance.
* Rate limiting protects view logging endpoint from abuse.
* Tests cover auth, media, logging, analytics, and middleware.

---
## Results:


https://github.com/user-attachments/assets/87a9d3c6-ad81-4dbd-bdac-a803b4902c55

<img width="388" height="112" alt="Screenshot 2025-08-12 163924" src="https://github.com/user-attachments/assets/d172e2f2-17be-4c76-9033-94c2664fc645" />
<img width="784" height="406" alt="Screenshot 2025-08-13 005810" src="https://github.com/user-attachments/assets/f6898779-e1ca-41eb-a061-929a785b6f22" />


