# Referral Project - Project Structure

## Overview
This document outlines the complete structure and architecture of the referral system project, including both frontend and backend components, database schema, and deployment infrastructure.

## Project Architecture

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT + Hybrid (Phone + WhatsApp)
- **File Storage**: AWS S3
- **Caching**: Redis
- **Deployment**: Docker + Docker Compose

### Directory Structure
```
referral-projek/
├── frontend/                 # React frontend application
├── backend/                  # Node.js backend API
├── shared/                   # Shared types and constants
├── docker-compose.yml        # Development environment setup
├── README.md                 # Project documentation
└── deployment-infrastructure.md
```

## Frontend Structure

### Core Components
- **App.tsx**: Main application component with routing
- **Pages**: 
  - ReferralLandingPage: Public landing page for referrals
  - ReferrerDashboard: Dashboard for users who refer others
  - ClaimPage: Page for claiming referral rewards
  - CashierDashboard: Admin dashboard for managing rewards

### State Management
- **Zustand Store**: `referral.store.ts` for global state management
- **API Service**: `api.service.ts` for backend communication

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Custom CSS**: `index.css` for global styles

## Backend Structure

### API Endpoints
- **Referral Routes**: `/api/referrals/*`
- **Cashier Routes**: `/api/cashier/*`

### Services
- **Referral Service**: Core business logic for referrals
- **Redis Service**: Caching and session management

### Database Models
- **User**: User accounts and referral codes
- **Referral**: Referral relationships and status
- **Reward**: Available rewards and categories
- **RewardCode**: Individual reward codes for redemption
- **PointTransaction**: Point earning/spending history

### Authentication
- **JWT**: Token-based authentication
- **Phone Verification**: SMS-based verification
- **WhatsApp Integration**: Alternative authentication method

## Database Schema

### Prisma Schema (prisma/schema.prisma)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(uuid())
  phoneNumber    String   @unique
  whatsappId     String?
  referralCode   String   @unique
  totalPoints    Int      @default(0)
  totalReferrals Int      @default(0)
  status         UserStatus @default(ACTIVE)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  referrals         Referral[]
  pointTransactions PointTransaction[]

  @@map("users")
}

model Referral {
  id            String   @id @default(uuid())
  referrerId    String
  inviteePhone  String
  status        ReferralStatus @default(PENDING)
  rewardCode    String?  @unique
  claimedAt     DateTime?
  redeemedAt    DateTime?
  createdAt     DateTime @default(now())

  referrer      User     @relation(fields: [referrerId], references: [id])
  rewardCodeRef RewardCode?
  pointTransactions PointTransaction[]

  @@map("referrals")
}

model Reward {
  id              String   @id @default(uuid())
  name            String
  description     String
  pointsRequired  Int
  category        RewardCategory
  isActive        Boolean  @default(true)
  stockQuantity   Int      @default(0)
  createdAt       DateTime @default(now())

  rewardCodes     RewardCode[]

  @@map("rewards")
}

model RewardCode {
  id         String   @id @default(uuid())
  code       String   @unique
  rewardId   String
  referralId String   @unique
  status     RewardCodeStatus @default(ACTIVE)
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime @default(now())

  reward     Reward   @relation(fields: [rewardId], references: [id])
  referral   Referral @relation(fields: [referralId], references: [id])

  @@map("reward_codes")
}

model PointTransaction {
  id          String   @id @default(uuid())
  userId      String
  referralId  String?
  points      Int
  type        TransactionType
  description String
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  referral    Referral? @relation(fields: [referralId], references: [id])

  @@map("point_transactions")
}
```

### Enums
```prisma
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum ReferralStatus {
  PENDING
  COMPLETED
  EXPIRED
  CANCELLED
}

enum RewardCategory {
  FOOD
  BEVERAGE
  DISCOUNT
  FREE_ITEM
  OTHER
}

enum RewardCodeStatus {
  ACTIVE
  USED
  EXPIRED
  CANCELLED
}

enum TransactionType {
  EARNED
  SPENT
  BONUS
  PENALTY
}
```

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/referral_db"

# JWT
JWT_SECRET="your_jwt_secret_here"
JWT_EXPIRES_IN="7d"

# AWS
AWS_ACCESS_KEY_ID="your_aws_access_key_id_here"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key_here"
AWS_S3_BUCKET="your_s3_bucket_name_here"
AWS_REGION="your_aws_region_here"

# Third Party Services
SENTRY_DSN="your_sentry_dsn_here"
```

## API Endpoints

### Referral Endpoints
- `POST /api/referrals/create` - Create new referral
- `GET /api/referrals/user/:userId` - Get user's referrals
- `PUT /api/referrals/:id/status` - Update referral status
- `GET /api/referrals/:id` - Get referral details

### Cashier Endpoints
- `POST /api/cashier/redeem` - Redeem reward code
- `GET /api/cashier/rewards` - Get available rewards
- `PUT /api/cashier/rewards/:id` - Update reward status

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose

### Local Development
1. Clone the repository
2. Copy `.env.example` to `.env` and configure variables
3. Run `docker-compose up -d` for database and Redis
4. Install dependencies: `npm install` in both frontend and backend
5. Run migrations: `npx prisma migrate dev`
6. Start development servers

### Database Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Deployment

### Docker Configuration
- **Frontend**: Multi-stage build with Nginx
- **Backend**: Node.js runtime with PM2
- **Database**: PostgreSQL with persistent volumes
- **Redis**: In-memory caching layer

### Production Considerations
- Environment-specific configurations
- SSL/TLS certificates
- Load balancing
- Database connection pooling
- Redis clustering
- Monitoring and logging

## Security Features

### Authentication & Authorization
- JWT token validation
- Role-based access control
- Rate limiting
- Input validation and sanitization

### Data Protection
- Encrypted database connections
- Secure file uploads
- API key management
- Audit logging

## Testing Strategy

### Frontend Testing
- Unit tests with Jest
- Component testing with React Testing Library
- E2E testing with Playwright

### Backend Testing
- Unit tests for services
- Integration tests for API endpoints
- Database testing with test containers

## Monitoring & Logging

### Application Monitoring
- Error tracking with Sentry
- Performance monitoring
- Health check endpoints

### Logging
- Structured logging with Winston
- Request/response logging
- Error logging and alerting

## Future Enhancements

### Planned Features
- Real-time notifications
- Advanced analytics dashboard
- Multi-language support
- Mobile app development
- Social media integration

### Scalability Improvements
- Microservices architecture
- Event-driven communication
- Horizontal scaling
- CDN integration
- Database sharding

## Contributing

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Write comprehensive tests
- Update documentation

### Code Review Process
- Pull request reviews required
- Automated testing on CI/CD
- Security scanning
- Performance benchmarking
