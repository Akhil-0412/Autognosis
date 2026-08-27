# Autognosis — Intelligent Vehicle Telemetry & Diagnostics Platform

Autognosis is an advanced automotive telemetry and AI diagnostics mission control system. Connect OBD2 diagnostics, monitor real-time vehicle fleet health scores, predict component wear, and execute interactive multi-turn diagnostic sessions with **Sparky AI**.

---

## 🏎️ Core Features

- **Mission Control Fleet Dashboard**: Real-time status monitoring, health score grading (Safe / Hazard / Critical), OBD2 fault code analysis, and live telemetry tracking for registered vehicles.
- **Sparky AI Diagnostic Engine**: Multi-turn vehicle-aware AI mechanic that analyzes symptoms, correlates service bulletins, estimates repair costs, and suggests targeted maintenance actions.
- **Floating HUD Navigation Dock**: Bottom-center floating glass navigation dock with liquid refraction, pointer-tracked specular sheen, and resting scale animation physics.
- **Enterprise Subscriptions & Billing**: Stripe payment integration with 1-click test portals, automated recurring subscriptions ($5, $10, $15 tiers), and real-time daily token quota tracking with automated 00:00 midnight resets.
- **Operator Authentication**: Integrated Clerk authentication for secure operator profiles, session management, and sandbox demo access.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: TanStack Start + React 19 (Server-Side Rendering with Nitro)
- **Routing & State**: TanStack Router + TanStack Query
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Icons & Visuals**: Lucide Icons & Custom Fluid SVG Refraction Shaders
- **Authentication**: Clerk React SDK

### Backend
- **Framework**: FastAPI + Python 3.12 (Uvicorn ASGI)
- **LLM Diagnostic Engine**: Groq LLaMA 3.3 70B Versatile
- **Payment Processing**: Stripe Python SDK

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v20+) & npm
- Python 3.11+ & `uv` package manager

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start Vite development server (port 8080)
npm run dev
```

### 3. Backend Setup
```bash
cd ai_backend

# Run FastAPI backend with hot-reload (port 8001)
uv run --with stripe python main.py
```

### 4. Build for Production
```bash
npm run build
```

---

## 📄 License
Private & Proprietary. All rights reserved.
