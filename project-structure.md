# 🏗️ Struktur Proyek Aplikasi Referral Marketing

## 📁 Struktur Folder

```
referral-project/
├── 📁 frontend/                 # React Frontend Application
│   ├── 📁 public/
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable UI Components
│   │   ├── 📁 pages/           # Page Components
│   │   ├── 📁 hooks/           # Custom React Hooks
│   │   ├── 📁 services/        # API Services
│   │   ├── 📁 store/           # State Management
│   │   ├── 📁 types/           # TypeScript Types
│   │   ├── 📁 utils/           # Utility Functions
│   │   └── 📁 styles/          # CSS & Styling
│   ├── package.json
│   └── README.md
│
├── 📁 backend/                  # Node.js Backend Application
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # Route Controllers
│   │   ├── 📁 middleware/      # Express Middleware
│   │   ├── 📁 models/          # Database Models
│   │   ├── 📁 routes/          # API Routes
│   │   ├── 📁 services/        # Business Logic
│   │   ├── 📁 utils/           # Utility Functions
│   │   └── 📁 types/           # TypeScript Types
│   ├── 📁 prisma/              # Database Schema & Migrations
│   ├── package.json
│   └── README.md
│
├── 📁 shared/                   # Shared Types & Utilities
│   ├── 📁 types/
│   └── 📁 constants/
│
├── 📁 docs/                     # Documentation
│   ├── 📁 api/
│   ├── 📁 database/
│   └── 📁 deployment/
│
├── 📁 scripts/                  # Build & Deployment Scripts
├── 📁 tests/                    # Test Files
├── docker-compose.yml           # Docker Configuration
├── package.json                 # Root Package.json
└── README.md                    # Project Overview
```

## 🎯 Komponen Utama

### Frontend Components

#### 1. Authentication Components
- `LoginForm.tsx` - Form login WhatsApp
- `PhoneVerification.tsx` - Verifikasi nomor telepon
- `AuthGuard.tsx` - Route protection

#### 2. Referral Components
- `ReferralDashboard.tsx` - Dashboard utama referrer
- `ReferralCode.tsx` - Tampilan kode referral
- `ReferralStats.tsx` - Statistik referral
- `ShareButton.tsx` - Tombol berbagi referral

#### 3. Reward Components
- `RewardCatalog.tsx` - Katalog hadiah
- `PointBalance.tsx` - Saldo poin
- `MilestoneProgress.tsx` - Progress milestone
- `RewardHistory.tsx` - Riwayat hadiah

#### 4. Claim Components
- `ClaimLanding.tsx` - Halaman landing referral
- `RewardCode.tsx` - Tampilan kode hadiah dengan timer
- `ClaimSuccess.tsx` - Konfirmasi klaim berhasil

#### 5. Cashier Components
- `CashierDashboard.tsx` - Dashboard kasir
- `CodeVerification.tsx` - Verifikasi kode hadiah
- `TransactionHistory.tsx` - Riwayat transaksi

### Backend Services

#### 1. Authentication Service
- WhatsApp login & verification
- JWT token management
- Session handling

#### 2. Referral Service
- Generate referral codes
- Track referral status
- Calculate points

#### 3. Reward Service
- Manage reward catalog
- Process point redemption
- Handle seasonal bonuses

#### 4. Notification Service
- WhatsApp message sending
- Email notifications
- Push notifications

#### 5. Analytics Service
- User behavior tracking
- Conversion metrics
- Fraud detection

## 🔧 Konfigurasi Teknis

### Environment Variables

#### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WHATSAPP_API_KEY=your_key
REACT_APP_ANALYTICS_ID=your_id
```

#### Backend (.env)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# JWT
JWT_SECRET="d0e3354659430e38cfa1dea9a35699f287f317b350ae1eafe61d9beae2ca25da"
JWT_EXPIRES_IN="7d"


# AWS
AWS_ACCESS_KEY_ID="your_aws_access_key_id_here"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key_here"
AWS_S3_BUCKET="your_s3_bucket_name_here"
AWS_REGION="your_aws_region_here"


# Third Party Services
SENTRY_DSN="https://679e1d03f311d7e35f924b5c149553fb@o4509826295005184.ingest.de.sentry.io/4509826307981392"
```

### Database Schema

#### Prisma Schema (prisma/schema.prisma)
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

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
}

enum ReferralStatus {
  PENDING
  CLAIMED
  REDEEMED
  EXPIRED
}

enum RewardCategory {
  INSTANT
  MILESTONE
  SEASONAL
}

enum RewardCodeStatus {
  ACTIVE
  USED
  EXPIRED
}

enum TransactionType {
  EARNED
  SPENT
  BONUS
}
```

## 🚀 Deployment Strategy

### Development Environment
- Local development dengan hot reload
- Database lokal dengan Docker
- Mock WhatsApp API untuk testing

### Staging Environment
- Vercel preview deployments
- Railway staging database
- WhatsApp sandbox environment

### Production Environment
- Vercel production deployment
- Supabase production database
- WhatsApp Business API production
- CDN untuk static assets
- Load balancer untuk backend

## 📱 Mobile Responsiveness

### Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

### Progressive Web App (PWA)
- Service worker untuk offline functionality
- App manifest untuk install
- Push notifications
- Background sync

## 🔒 Security Measures

### API Security
- Rate limiting
- CORS configuration
- Input validation dengan Zod
- SQL injection prevention
- XSS protection

### Authentication Security
- JWT token rotation
- Refresh token mechanism
- Session timeout
- Multi-factor authentication (future)

### Data Security
- Data encryption at rest
- HTTPS enforcement
- Secure headers
- Content Security Policy

## 📊 Performance Optimization

### Frontend
- Code splitting dengan React.lazy
- Image optimization
- Bundle size optimization
- Caching strategies

### Backend
- Database query optimization
- Redis caching
- Connection pooling
- Load balancing

### Monitoring
- Performance metrics tracking
- Error tracking dengan Sentry
- User experience monitoring
- Real-time analytics

## 🧪 Testing Strategy

### Frontend Testing
- Unit tests dengan Jest
- Component testing dengan React Testing Library
- E2E testing dengan Playwright
- Visual regression testing

### Backend Testing
- Unit tests dengan Jest
- Integration tests
- API testing dengan Supertest
- Database testing

### Test Coverage
- Target: 80%+ coverage
- Critical path testing
- Edge case scenarios
- Performance testing

## 📈 Analytics & Tracking

### User Behavior
- Page views & navigation
- Feature usage
- Conversion funnels
- User retention

### Business Metrics
- Referral conversion rate
- Point earning/spending
- Reward popularity
- User engagement score

### Technical Metrics
- API response times
- Error rates
- Database performance
- System uptime

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
1. **Code Quality Check**
   - Linting (ESLint, Prettier)
   - Type checking
   - Security scanning

2. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

3. **Build & Deploy**
   - Frontend build & deploy ke Vercel
   - Backend build & deploy ke Railway
   - Database migrations

4. **Post-deployment**
   - Health checks
   - Performance monitoring
   - Error tracking setup

## 📚 Documentation

### API Documentation
- OpenAPI/Swagger specification
- Postman collection
- Example requests/responses
- Error code reference

### User Documentation
- User guides
- FAQ
- Video tutorials
- Troubleshooting guide

### Developer Documentation
- Setup guide
- Architecture overview
- Contributing guidelines
- Deployment guide

## 🌟 Future Enhancements

### Phase 2 Features
- Multi-language support
- Advanced analytics dashboard
- A/B testing framework
- Machine learning recommendations

### Phase 3 Features
- Mobile app (React Native)
- Social media integration
- Advanced gamification
- AI-powered fraud detection

### Scalability Improvements
- Microservices architecture
- Event-driven architecture
- Real-time notifications
- Global CDN deployment
