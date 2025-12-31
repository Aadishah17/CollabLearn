

# CollabLearn

*A collaborative-learning platform connecting learners and instructors*

## 🚀 Overview

CollabLearn is a full-stack web application designed to facilitate skill-sharing, mentoring and peer-to-peer learning. Instructors can offer their expertise, learners can browse and book skill sessions, chat in real-time, post content, and build profiles.
The app uses a modern tech stack: a React (Vite) frontend, an Express backend with MongoDB, and Socket.IO for real-time chat.

## 🧩 Features

* User authentication (register/login) via JWT
* User profiles with avatars
* Create and browse posts: liking, commenting
* Skill listings: offer or seek a skill, recommendations
* Booking & session management (document uploads etc)
* Ratings & reviews for sessions/instructors
* Real-time chat between participants (via Socket.IO)
* Admin-moderation endpoints for managing the platform

## 🛠️ Tech Stack

* **Frontend**: React + Vite
* **Backend**: Node.js + Express
* **Realtime**: Socket.IO
* **Database**: MongoDB
* **Authentication**: JWT
* Environment variable support via `.env`

## 🎯 Quick Start

1. Copy or create `server/.env` and define at least:

   ```bash
   MONGODB_URI=your-mongodb-uri  
   JWT_SECRET=your-secret
   ```
2. Install dependencies and run both servers:

   ```bash
   # In the server folder  
   cd server  
   npm install  
   npm run dev  

   # In the client folder  
   cd ../client  
   npm install  
   npm run dev  
   ```
3. Default configurations:

   * If `MONGODB_URI` is not set, backend falls back to `mongodb://localhost:27017/collablearn`
   * Backend runs on port `5000`, Vite dev server on `5173`; CORS configured for `http://localhost:5173`

## 🗂️ API Endpoints (Quick Pointers)

* Auth: `/api/auth` — register, login, user info/profile
* Posts: `/api/posts` — create, read, like, comment
* Skills: `/api/skills` — offer/seek listings, recommendations
* Booking: `/api/booking` — manage booking, sessions
* Dashboard: `/api/dashboard` — user-specific dashboard data
* Admin: `/api/admin` — moderation and admin actions

## 👥 Contributor

* Aadi Shah

## 🔍 Future Enhancements (TODO)

* Expand user roles (e.g., guest, premium)
* Add payments integration for paid sessions
* Improve recommendation algorithm for skill matches
* UI/UX polish: dark mode, mobile responsiveness
* Add notifications (email/push) for bookings & messages
* Deploy to production (with CI/CD, scaling)



Thanks for checking out **CollabLearn** — happy collaborating and learning! 😊