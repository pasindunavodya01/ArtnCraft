# React + Express Full-Stack Application

A full-stack web application with a React frontend and Express backend.

## Project Structure

```
APP/
├── client/          # React frontend (Vite)
│   ├── src/
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── vite.config.js
├── server/          # Express backend
│   ├── .env
│   ├── .gitignore
│   ├── index.js
│   └── package.json
└── .gitignore
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Install client dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```
   Server runs on `http://localhost:5000`

2. **In another terminal, start the client:**
   ```bash
   cd client
   npm run dev
   ```
   Client runs on `http://localhost:3000`

## Environment Variables

### Client (.env)
- `VITE_API_URL=http://localhost:5000` - API base URL

### Server (.env)
- `PORT=5000` - Server port
- `NODE_ENV=development` - Environment mode

## Available Scripts

### Server
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features

- CORS enabled for client-server communication
- Vite for fast client-side development
- Express with dotenv for environment management
- Modular folder structure for easy scaling

## Next Steps

- Add authentication (JWT, OAuth, etc.)
- Connect to a database (MongoDB, PostgreSQL, etc.)
- Add middleware for logging and error handling
- Implement API routes and business logic
- Add form validation and error handling
