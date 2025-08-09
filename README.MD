# ‼️ ## Heads-up!

This project is a functional prototype built to showcase the core AI interview flow. While it works as intended, it has not yet been refactored for optimal architecture, performance, or a polished UX.

# 🤖 AI Video Interviewer

This is a full-stack project that implements an AI-powered video interviewer. The application allows companies to post job openings and enables talent to conduct an initial automated technical screening through an interactive video call.

---

## 📋 Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Installation & Setup](#installation--setup)
- [Getting Started & Usage Flow](#getting-started--usage-flow)

---

## ✨ Key Features

- **Two-Sided Platform:** Separate roles for companies (post jobs) and talent (perform interviews).
- **AI-Driven Interviews:** The AI generates dynamic questions based on the skills required for the job.
- **Real-Time Transcription:** Live transcription of the conversation during the video call, powered by Deepgram.
- **Integrated Video Calls:** Video room management through the Daily.co API.
- **"Kendyl Score" System:** The AI evaluates the candidate's answers and assigns a score from 0 to 100.
- **Secure Authentication:** Registration and login system with JWT (JSON Web Tokens).

---

## 🛠️ Tech Stack

- **Backend:** NestJS (Node.js, TypeScript)
- **Frontend:** Next.js (React, TypeScript)
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Artificial Intelligence:** OpenAI API
- **Video Calls:** Daily.co API
- **Transcription:** Deepgram API
- **Real-Time Communication:** WebSockets (Socket.IO)

---

## Prerequisites

Ensure you have the following software installed on your system:

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL
- Postman (or any API client for the initial setup)

---

## 🔧 Configuration

The project requires a `.env` file for environment variables in the backend.

1.  Navigate to the `backend` folder.
2.  Create a copy of the `.env.example` file or create a new file named `.env`.
3.  Fill the `.env` file with your own keys and credentials:

````env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_DATABASE=kendyl_db # Make sure to create this database in Postgres

# Secret for JSON Web Tokens
JWT_SECRET=THIS-IS-A-VERY-SECURE-SECRET-CHANGE-ME

# API Keys for External Services
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DAILY_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

## 🏁 Getting Started & Usage Flow

To use the application, you must perform an initial setup to create users and skills. Using **Postman** is recommended for these steps.

---

## 1. Register Users (Required Step)

Before you can log in through the UI, you must register at least one user of each type.

**Endpoint:** `POST http://localhost:3001/auth/register`

**Body to register a Talent:**
```json
{
  "email": "talent.test@example.com",
  "password": "password123",
  "role": "talent"
}

**Body to register a business:**
```json
{
  "email": "business.test@example.com",
  "password": "strongpassword456",
  "role": "business"
}

---

## **2.Create Skills (Required for Businesses)**

Before a business can create a job offer, skills must exist in the database.

**Endpoint:** `POST http://localhost:3001/jobs/skills`

**Body: **
```json

{
  "name": "PostgreSQL"
}

Repeat this step for all the skills you want (e.g., "React", "Node.js", "Java", etc.).

---

## **3. Using the Application**

Once the initial setup is complete:

If you log in as a business: You will see the jobs dashboard and a button to "+ Create New Offer". The form will allow you to select the skills you created in the previous step.

If you log in as a talent: You will see the list of published job offers with a button to "Start Interview" for each one. Click it to begin your interview with the AI!

---


````
