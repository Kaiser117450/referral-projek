# Referral & Code Redemption System (Self-Hosted)

A modern, secure, and scalable referral system built with Next.js 14+, Turso DB, and Next-Auth. This system allows users to create referral links, generate ephemeral codes with 5-minute TTL, and redeem them through cashiers to earn points and unlock milestones.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend & Backend**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Turso DB (libSQL)
- **Authentication**: Next-Auth (Email OTP)
- **Deployment**: Docker on a single Linux VPS

### Core Features
- **User Management**: Role-based access control (user, cashier, admin)
- **Referral System**: Create unique referral links with tracking
- **Code Generation**: Single-use ephemeral codes with 5-minute TTL
- **Point System**: Earn points through successful referrals
- **Milestone Rewards**: Unlock achievements based on point thresholds
- **Cashier Interface**: Dedicated UI for code redemption
- **Admin Panel**: User management, analytics, and system oversight

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker and Docker Compose
- Turso DB account

### 1. Clone and Install
```bash
git clone <repository-url>
cd referral-projek
npm install
```

### 2. Environment Setup
Create a `.env` file in the root of the project and add the following environment variables:

```env
# Turso DB Configuration
TURSO_DATABASE_URL=your_turso_db_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Next-Auth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Email Configuration (for Next-Auth Email OTP)
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=noreply@example.com
```

### 3. Database Setup
Run the following command to create the necessary tables in your Turso DB:

```bash
npm run db:setup
```

### 4. Development
To run the application in development mode, use the following command:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

### 5. Production Deployment
To build and run the application in a Docker container for production, use the following command:

```bash
docker-compose up --build
```

The application will be available at [http://localhost:3000](http://localhost:3000).
