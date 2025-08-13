# Referral Marketing Application

A modern, WhatsApp-inspired referral marketing platform built with React, Node.js, and PostgreSQL. Users can invite friends, earn points, and redeem rewards through a gamified system.

## 🚀 Features

### Core Functionality
- **User Authentication**: Username/password-based login system
- **Referral Management**: Create and track referrals with unique codes
- **Point System**: Earn points for successful referrals
- **Reward Catalog**: Browse and redeem rewards with earned points
- **Cashier Verification**: Quick visual verification system for rewards
- **Gamification**: Milestones and progress tracking

### Technical Features
- **Modern UI/UX**: Clean design with Red-Orange-Yellow gradient accents
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live referral tracking and statistics
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **API-First Architecture**: RESTful API with comprehensive endpoints
- **Database Optimization**: Prisma ORM with PostgreSQL
- **Caching**: Redis for performance optimization

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router DOM** for routing
- **Axios** for API communication
- **Zustand** for state management

#### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** for database operations
- **PostgreSQL** as primary database
- **Redis** for caching and sessions
- **JWT** for authentication
- **Zod** for validation
- **Sentry** for error tracking

#### Infrastructure
- **Docker** for containerization
- **Docker Compose** for development environment
- **AWS S3** for file storage
- **Rate limiting** and security middleware

## 📁 Project Structure

```
referral-project/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── index.ts        # Server entry point
│   ├── prisma/             # Database schema and migrations
│   ├── package.json        # Backend dependencies
│   └── Dockerfile.dev      # Development Dockerfile
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── App.tsx         # Main app component
│   ├── package.json        # Frontend dependencies
│   └── Dockerfile.dev      # Development Dockerfile
├── docker-compose.yml      # Development environment
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd referral-project
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   # Edit backend/.env with your actual values
   
   # Frontend
   cp frontend/env.example frontend/.env
   # Edit frontend/.env with your actual values
   ```

3. **Start the development environment**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

### Local Development

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Set up database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

3. **Start services**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/referral_marketing"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_S3_BUCKET="your-s3-bucket-name"
AWS_REGION="ap-southeast-2"

# Third Party Services
SENTRY_DSN="your-sentry-dsn-here"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGIN="http://localhost:3000"
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_URL="http://localhost:3001/api"

# Sentry Configuration
VITE_SENTRY_DSN="your-sentry-dsn-here"

# App Configuration
VITE_APP_NAME="Referral Marketing App"
VITE_APP_VERSION="1.0.0"

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=false
```

## 📊 Database Schema

The application uses PostgreSQL with the following main models:

- **Users**: Authentication and profile information
- **Referrals**: Referral relationships and tracking
- **Rewards**: Available rewards and their costs
- **PointTransactions**: Point earning and spending history
- **Milestones**: User achievement tracking
- **CashierSessions**: Reward verification sessions

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Referrals
- `POST /api/referral/create` - Create new referral
- `GET /api/referral/stats` - Get referral statistics
- `GET /api/referral/my-code` - Get user's referral code
- `GET /api/referral/history` - Get referral history

### Rewards
- `GET /api/reward/catalog` - Get reward catalog
- `POST /api/reward/redeem` - Redeem reward
- `GET /api/reward/my-rewards` - Get user's rewards

### Cashier
- `POST /api/cashier/verify` - Verify referral reward
- `GET /api/cashier/referral/:rewardCode` - Get referral by code

## 🎨 Design System

### Color Palette
- **Base**: White (#FFFFFF) and Black (#000000)
- **Primary Gradient**: Red (#EF4444) → Orange (#F97316) → Yellow (#EAB308)
- **Accents**: Various shades of gray for text and borders

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)

### Components
- **Buttons**: Multiple variants (primary, secondary, outline, ghost)
- **Cards**: Consistent shadow and border styling
- **Forms**: Clean input styling with focus states
- **Animations**: Smooth transitions and micro-interactions

## 🧪 Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Code Quality
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** for code formatting
- **Husky** for git hooks (if configured)

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve dist/ folder with your preferred web server
```

### Docker Production
```bash
# Build production images
docker build -f backend/Dockerfile.prod -t referral-backend .
docker build -f frontend/Dockerfile.prod -t referral-frontend .

# Run with production environment variables
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation

## 🔮 Roadmap

### Phase 2 Features
- [ ] WhatsApp integration for notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced gamification features
- [ ] Social media integration

### Phase 3 Features
- [ ] AI-powered referral suggestions
- [ ] Advanced reward algorithms
- [ ] Enterprise features
- [ ] White-label solutions
- [ ] Advanced reporting and analytics

---

**Built with ❤️ using modern web technologies**
