# Autognosis 🚗⚡

**Your Personal Vehicle Intelligence Hub.**

[**View Live Demo**](https://smart-saas-frontend.vercel.app/)

---

## What is this?

Managing your vehicle's health shouldn't require a degree in mechanical engineering. **Autognosis** is a modern SaaS platform that bridges the gap between you and your car's data. 

Think of it as a "Command Center" for your garage. We combine standard fleet management (tracking mileage, service history, health scores) with **Sparky**, an AI-powered mechanic that you can actually talk to. Hear a weird noise? Dashboard light flashing? Just ask Sparky.

## Key Features

### 🤖 Meet Sparky: The AI Mechanic
Powered by a Python/FastAPI backend and advanced LLMs, Sparky isn't just a chatbot—it's a diagnostic engine.
- **Instant Diagnostics**: Describe symptoms ("clicking noise when turning") and get immediate potential causes and fixes.
- **Context Aware**: Sparky knows which car you're talking about, its year, make, model, and history.

### 🏎️ Digital Garage
- **Visual Health Tracking**: unique health scores and visual gauges for every vehicle in your fleet.
- **Detailed Logs**: Keep a digital paper trail of every repair, upgrade, and maintenance check.
- **Manage Anything**: From your daily commuter to your weekend project car.

### 💼 SaaS Architecture
- **Usage Limits**: Smart usage tracking offering a generous free tier (10 diagnostics/day).
- **Pro Upgrade**: Seamless Stripe integration for power users who need unlimited access.
- **Secure**: Enterprise-grade authentication via Clerk and robust role-based access control.

## Under the Hood 🛠️

We built Autognosis to practice what we preach—using the latest and greatest in modern web development.

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/).
- **UI/UX**: [Framer Motion](https://www.framer.com/motion/) for those buttery smooth animations and a custom "Glassmorphism" design system.
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via Neon) managed by [Prisma ORM](https://www.prisma.io/).
- **Backend (AI)**: Python & FastAPI for the heavy lifting and reasoning.
- **Payments**: [Stripe](https://stripe.com/) Checkout for subscription handling.

## Getting Started

Want to run this locally? Here's how to spin up your own instance.

1. **Clone the repo**
   ```bash
   git clone https://github.com/Akhil-0412/Smart_Saas_Dashboard.git
   cd Smart_Saas_Dashboard/saas_env
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Rename `.env.example` to `.env` and fill in your keys (Clerk, Database URL, Stripe, etc.).

4. **Ignition**
   ```bash
   npx prisma generate
   npm run dev
   ```
   Visit `http://localhost:3000` and start your engines.

## License

MIT © [Akhil](https://github.com/Akhil-0412)
