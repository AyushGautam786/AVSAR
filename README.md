# 🎯 AI Internship Recommender

> A smart, full-stack web application that uses AI to recommend relevant internship opportunities tailored to each user's profile, skills, and preferences.

---

## 📌 Project Overview

**AI Internship Recommender** is a Next.js 15 web application that helps students and fresh graduates discover internship opportunities matched to their background using AI-driven recommendations. Users create a profile, and the app intelligently surfaces relevant internships from a curated database — all behind a secure, modern UI.

This project showcases full-stack development skills including database design, authentication, AI integration, and production-ready UI/UX.

---

## 🖼️ Result Screenshots

> 📸 _Add your screenshots below (replace placeholder paths with actual images)_

| Dashboard | Recommendations |
|-----------|----------------|
| ![Dashboard](./public/screenshots/dashboard.png) | ![Recommendations](./public/screenshots/recommendations.png) |

| Profile Page | Sign In |
|--------------|---------|
| ![Profile](./public/screenshots/profile.png) | ![Sign In](./public/screenshots/signin.png) |

---

## ✨ Key Features

- 🤖 **AI-Powered Recommendations** — Personalized internship suggestions based on user profile and skills
- 🔐 **Authentication** — Secure sign-up/sign-in powered by Better Auth
- 📊 **Dashboard** — Visual overview of matched internships and activity
- 👤 **Profile Management** — Users can update skills, preferences, and background
- 🌐 **Modern UI** — Built with Shadcn/ui, Radix UI, Framer Motion, and Tailwind CSS v4
- 🗄️ **Turso Database** — Lightweight edge-ready SQLite via LibSQL/Turso
- 📱 **Fully Responsive** — Works seamlessly across all screen sizes

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4, Shadcn/ui, Radix UI |
| **Animations** | Framer Motion, Motion |
| **Database** | Turso (LibSQL) |
| **ORM** | Drizzle ORM |
| **Authentication** | Better Auth |
| **Forms & Validation** | React Hook Form + Zod |
| **Charts** | Recharts |
| **3D / Visual** | Three.js, React Three Fiber, TSParticles |
| **Deployment** | Vercel (recommended) |

---

## 🗂️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Protected dashboard page
│   ├── profile/            # User profile page
│   ├── recommendations/    # AI recommendations page
│   └── sign-in/            # Auth pages
├── components/             # Reusable UI components
│   └── ui/                 # Shadcn/ui base components
├── db/
│   └── schema.ts           # Drizzle ORM schema (user, session, account)
├── lib/
│   └── auth.ts             # Better Auth configuration
└── ...
drizzle/                    # DB migrations
public/                     # Static assets
middleware.ts               # Route protection
```

---

## 🗄️ Database Schema

The app uses **Drizzle ORM** with **Turso (LibSQL)** and includes the following core tables:

- **`user`** — Stores user identity (name, email, image)
- **`session`** — Manages active sessions with expiry
- **`account`** — OAuth provider accounts linked to users
- **`verification`** — Email/OTP verification tokens

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`
- A [Turso](https://turso.tech) account (free tier works)
- `bun` or `npm`/`yarn`/`pnpm`

### 1. Clone the Repository

```bash
git clone https://github.com/AyushGautam786/ai-internship-recommender-1.git
cd ai-internship-recommender-1
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Turso Database
TURSO_CONNECTION_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

# Better Auth
BETTER_AUTH_SECRET=your_secret_key_here
```

> 💡 Get your Turso credentials from [turso.tech](https://turso.tech) after creating a database.

### 4. Run Database Migrations

```bash
npx drizzle-kit push
```

### 5. Start the Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Protected Routes

The following routes require authentication (handled by `middleware.ts`):

| Route | Description |
|-------|-------------|
| `/dashboard` | Main user dashboard |
| `/profile` | User profile settings |
| `/recommendations` | AI-generated internship matches |

Unauthenticated users are automatically redirected to `/sign-in`.

---

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit push` | Push schema changes to database |
| `npx drizzle-kit studio` | Open Drizzle Studio (DB GUI) |

---

## 🌐 Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy!

---

## 👨‍💻 Author

**Ayush Gautam**
- GitHub: [@AyushGautam786](https://github.com/AyushGautam786)
- Email: gautamayush095@gmail.com

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

> ⭐ If you found this project useful, consider giving it a star on GitHub!
