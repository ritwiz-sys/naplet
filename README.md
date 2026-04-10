# 🚀 NAPLET

> Your AI-powered personal productivity dashboard — habits, moods, journal, todos, weather, and an AI life coach, all in one dark space-themed app.

**Live Demo:** https://melodic-elf-70fb44.netlify.app/

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Assistant | Ask your personal AI coach anything about your day, habits, or goals |
| ✅ Habit Tracker | Track daily habits with streak calculation and completion history |
| 📓 Journal | Auto-saving journal with mood integration |
| ☑️ Todo List | Full CRUD task management |
| 😊 Mood Tracker | Log your daily mood with emoji selection |
| 🌤️ Weather Card | Real-time weather based on your location |
| 📅 Calendar | View and manage custom events |
| 🌌 Space Theme | Beautiful dark UI with animated orbs and glowing accents |

---

## 🛠️ Tech Stack

**Frontend**
- React 18
- Tailwind CSS
- Clerk (Authentication)
- Firebase Firestore (Database)

**Backend**
- Node.js + Express
- Groq API (LLaMA 3.3 70B)
- OpenWeatherMap API

**Deployment**
- Frontend → Netlify
- Backend → Render

---

## 📁 Project Structure

```
naplet/
├── public/
│   └── _redirects          # Netlify routing fix
├── src/
│   ├── components/
│   │   └── Sidebar.jsx
│   ├── features/
│   │   ├── AIWelcomecard.jsx
│   │   ├── habits/
│   │   │   └── habit-tracker.jsx
│   │   ├── moods/
│   │   │   └── moodtracker.jsx
│   │   ├── notes/
│   │   │   └── notes-widget.jsx
│   │   ├── todos/
│   │   │   └── todolist.jsx
│   │   ├── weather/
│   │   │   └── weather.jsx
│   │   └── calendar/
│   │       └── calendar.jsx
│   ├── firebase/
│   │   └── firebase.js
│   ├── pages/
│   │   └── Dashboard.jsx
│   └── App.js
└── server/
    ├── index.js             # Express server
    └── .env                 # Server environment variables
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- Firebase project
- Clerk account
- Groq API key
- OpenWeatherMap API key

### 1. Clone the repo
```bash
git clone https://github.com/ritwiz-sys/naplet.git
cd naplet
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd server
npm install
```

### 4. Set up environment variables

Create `.env` in the root folder:
```env
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_key
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

Create `server/.env`:
```env
GROQ_API_KEY=your_groq_key
WEATHER_API_KEY=your_openweathermap_key
```

### 5. Run the app

Start the Express server:
```bash
cd server
node index.js
```

Start the React app:
```bash
npm start
```

---

## 🗄️ Firestore Data Structure

```
users/{userId}/
├── habits/{habitId}
│   ├── text: string
│   ├── createdAt: timestamp
│   └── completedDates: { "2026-04-01": true }
│
├── journal/{entryId}
│   ├── title: string
│   ├── content: string
│   ├── todayMood: string
│   └── createdAt: timestamp
│
└── events/{eventId}
    ├── title: string
    ├── date: string
    └── createdAt: timestamp

moods/{moodId}                 ← top-level collection
├── mood: string
├── emoji: string
├── userId: string
└── timestamp: timestamp
```

---

## 🚀 Deployment

### Backend → Render
1. Create a new Web Service on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set Root Directory to `server`
4. Add environment variables: `GROQ_API_KEY`, `WEATHER_API_KEY`
5. Deploy!

### Frontend → Netlify
1. Import your GitHub repo on [netlify.com](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `build`
4. Add all `REACT_APP_` environment variables
5. Deploy!

---

## 🔑 Key Design Decisions

- **Subcollections** for user data (habits, journal, events) — scoped to user, no `where` queries needed
- **`completedDates` object** instead of boolean for habits — enables streak calculation and history
- **Streak calculated client-side** from `completedDates` — single source of truth, never stale
- **Debounced autosave** in journal — prevents excessive Firestore writes
- **Express as API proxy** — keeps API keys server-side, never exposed to browser

---

## 👨‍💻 Built By

**Ritwiz** — Built from scratch with React, Firebase, and a lot of debugging 🚀

---

## 📄 License

MIT License — feel free to use and modify!
