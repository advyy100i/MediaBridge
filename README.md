Sure! Here’s a concise, clear, and still professional README for your project:

````markdown
# Media Platform Backend

![Architecture](https://github.com/user-attachments/assets/ba510096-e67a-4af8-b71a-4f861cd15e5f)

Node.js & Express backend with MongoDB for secure media management and streaming.  
Admins can upload media, authenticate with JWT, and generate 10-minute secure streaming links.

---

## Features

- Admin signup/login with JWT  
- Upload/manage video/audio media  
- Generate secure, expiring streaming URLs  
- Media view logging (IP & timestamp)  
- Supports HTTP range requests for smooth playback

---

## Setup

```bash
git clone https://github.com/advyy100i/media_platform_backend.git
cd media_platform_backend
npm install
````

Create `.env` with:

```
PORT=4000
MONGO_URI=mongodb://localhost/media-platform
JWT_SECRET=your_jwt_secret
STREAM_TOKEN_SECRET=your_stream_token_secret
STREAM_TOKEN_EXP_SECONDS=600
UPLOAD_DIR=uploads
```

Start server:

```bash
npm start
```

---

## API Endpoints

* `POST /auth/signup` — Register admin
* `POST /auth/login` — Login and get JWT
* `POST /media` — Upload media (auth required)
* `GET /media/:id/stream-url` — Get secure stream URL (auth required)
* `GET /media/:id/stream?token=...` — Stream media using token

Use the JWT token in `Authorization: Bearer <token>` header for protected routes.

---



https://github.com/user-attachments/assets/5cab0cc4-4367-4038-9f05-7ca46efad0ac


```


```
