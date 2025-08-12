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
