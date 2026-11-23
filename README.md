# Blogify

A full-stack MERN blogging platform built with React (Vite), Tailwind CSS, Node.js, Express, MongoDB (Mongoose), JWT authentication, and Cloudinary image uploads.

---

## Architecture & Tech Stack

- **Frontend (`client/`)**: React.js, Vite, React Router DOM, Axios, Tailwind CSS, Lucide icons.
- **Backend (`server/`)**: Node.js (ES Modules), Express.js, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, Multer (`memoryStorage`), Cloudinary (`v2`).
- **Database**: MongoDB Atlas (three indexed models: `User`, `Blog`, `Comment`).
- **Media Storage**: Cloudinary (`blogify/covers`), streamed directly from memory without local disk writes.

---

## Free Prerequisites

1. **MongoDB Atlas (Free M0 Cluster)**
   - Sign in at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free shared M0 cluster.
   - Create a database user with read/write access and allow network access (`0.0.0.0/0` for Render deployment).
   - Copy your connection string (`MONGO_URI`).

2. **Cloudinary (Free Tier)**
   - Create an account at [cloudinary.com](https://cloudinary.com).
   - From the Dashboard, note your `Cloud Name`, `API Key`, and `API Secret`.

3. **Generate a JWT Secret**
   Run the following command to generate a cryptographically strong secret:
   ```bash
   openssl rand -hex 32
   ```

---

## Environment Setup

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env` and fill in your credentials:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/blogify?retryWrites=true&w=majority
JWT_SECRET=<your_generated_hex_secret>
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Local Development

Install dependencies and start both servers in separate terminals:

```bash
# Terminal 1: Backend
cd server
npm install
npm run dev

# Terminal 2: Frontend
cd client
npm install
npm run dev
```

- Frontend runs at `http://localhost:5173`
- Backend runs at `http://localhost:5000`
- Health check endpoint: `GET http://localhost:5000/api/health`

---

## REST API Overview

Base prefix: `/api`

- `GET /api/health` — Server health check
- `POST /api/auth/signup` — Register a new user
- `POST /api/auth/login` — Authenticate user and issue JWT
- `GET /api/auth/me` — Get current authenticated user (Protected)
- `GET /api/blogs` — List all blogs (newest first)
- `GET /api/blogs/my` — List logged-in user's blogs (Protected)
- `GET /api/blogs/:id` — Get single blog and its comments
- `POST /api/blogs` — Create blog with `multipart/form-data` cover image (Protected)
- `PUT /api/blogs/:id` — Update blog and optionally replace cover image (Owner only)
- `DELETE /api/blogs/:id` — Delete blog, Cloudinary cover, and comments (Owner only)
- `POST /api/blogs/:blogId/comments` — Add comment to a blog (Protected)
- `DELETE /api/comments/:commentId` — Delete a comment (Owner only)

---

## Free-Tier Deployment Guide

### 1. Deploy Backend on Render
1. Push this repository to GitHub.
2. In Render, create a new **Web Service** connected to your repository.
3. Configure service settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Add environment variables in Render:
   - `NODE_ENV=production`
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLIENT_URL` (temporarily `http://localhost:5173`, update after Cloudflare Pages deploy)
5. Deploy and copy your Render URL (e.g., `https://blogify-api.onrender.com`).

### 2. Deploy Frontend on Cloudflare Pages
1. In Cloudflare Dashboard, open **Workers & Pages** and create a new **Pages** project connected to your repository.
2. Configure build settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
3. Add the build environment variable:
   - `VITE_API_URL=https://<your-render-app>.onrender.com/api`
4. Deploy. `client/public/_redirects` handles SPA client-side routing automatically.

### 3. Enable Production CORS
In your Render Web Service environment variables, update `CLIENT_URL` to your Cloudflare Pages URL:
```env
CLIENT_URL=https://<your-project>.pages.dev
```
(Multiple origins can be comma-separated if needed, e.g., `https://<your-project>.pages.dev,http://localhost:5173`.)
