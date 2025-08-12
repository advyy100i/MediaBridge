Here’s a clean, professional README.md for your media platform backend project:

````markdown
# Media Platform Backend

A secure backend API built with Node.js, Express, and MongoDB for managing media assets.  
Allows admin users to upload video and audio files, authenticate with JWT, and generate time-limited secure streaming links.

---

## Features

- Admin user signup and login with hashed passwords and JWT authentication  
- Upload and manage media metadata (title, type, file)  
- Protected routes accessible only to authenticated admins  
- Generate secure 10-minute streaming URLs with token validation  
- Media view logging (viewer IP and timestamp)  
- Supports video/audio streaming with HTTP range requests

---

## Tech Stack

- Node.js  
- Express  
- MongoDB & Mongoose  
- JSON Web Tokens (JWT)  
- Multer (for file uploads)

---

## Setup & Run

1. Clone the repo  
   ```bash
   git clone https://github.com/advyy100i/media_platform_backend.git
   cd media_platform_backend
````

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` file in the root with the following variables:

   ```env
   PORT=4000
   MONGO_URI=mongodb://localhost/media-platform
   JWT_SECRET=your_jwt_secret
   STREAM_TOKEN_SECRET=your_stream_token_secret
   STREAM_TOKEN_EXP_SECONDS=600
   UPLOAD_DIR=uploads
   ```

4. Start the server

   ```bash
   npm start
   ```

---

## API Endpoints

* `POST /auth/signup`
  Register a new admin user.

* `POST /auth/login`
  Login admin user and get JWT token.

* `POST /media` (protected)
  Upload media metadata and file.

* `GET /media/:id/stream-url` (protected)
  Get a secure streaming URL valid for 10 minutes.

* `GET /media/:id/stream?token=...`
  Stream media using the secure token.

---

## Usage

Use the JWT token received from login to authorize requests to protected endpoints by setting the header:

```
Authorization: Bearer <your_token_here>
```

---

## Result media:

https://github.com/user-attachments/assets/ba510096-e67a-4af8-b71a-4f861cd15e5f



