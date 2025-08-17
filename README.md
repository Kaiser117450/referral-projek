# Referral & Code Redemption System

A modern, secure, and scalable referral system built with Next.js 14+, Supabase, and TypeScript. This system allows users to create referral links, generate ephemeral codes with 5-minute TTL, and redeem them through cashiers to earn points and unlock milestones.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend & Backend**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom red theme
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth (Email OTP + OAuth)
- **Storage**: Supabase Storage for JSON receipts
- **Deployment**: Vercel (app) + Supabase (database/auth/storage)

### Core Features
- **User Management**: Role-based access control (user, cashier, admin)
- **Referral System**: Create unique referral links with tracking
- **Code Generation**: Single-use ephemeral codes with 5-minute TTL
- **Point System**: Earn points through successful referrals
- **Milestone Rewards**: Unlock achievements based on point thresholds
- **Cashier Interface**: Dedicated UI for code redemption
- **Admin Panel**: User management, analytics, and system oversight

### Security Features
- **Row Level Security (RLS)**: Database-level access control
- **Input Validation**: Zod schemas for all API endpoints
- **Rate Limiting**: Configurable request throttling
- **Audit Logging**: Comprehensive activity tracking
- **Code Hashing**: Secure storage of ephemeral codes
- **CSRF/XSS Protection**: Security headers and input sanitization

## 📁 Directory Structure

```
referral-projek/
├── app/                          # Next.js App Router
│   ├── (marketing)/             # Public landing pages
│   ├── api/                     # API routes
│   │   ├── admin/               # Admin endpoints
│   │   ├── code/                # Code generation/validation
│   │   ├── points/              # Points and milestones
│   │   ├── redeem/              # Code redemption
│   │   └── referral/            # Referral management
│   ├── cashier/                 # Cashier interface
│   ├── dashboard/                # User dashboard
│   └── layout.tsx               # Root layout
├── components/                   # Reusable UI components
│   └── ui/                      # Base UI components
├── lib/                         # Utility libraries
│   ├── supabase/                # Supabase client/server
│   ├── validation.ts            # Zod schemas
│   ├── utils.ts                 # Helper functions
│   └── rate-limit.ts            # Rate limiting utilities
├── public/                      # Static assets
├── scripts/                     # Database scripts
├── supabase/                    # Database schema and policies
├── .env.example                 # Environment variables template
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── tailwind.config.js           # Tailwind CSS configuration
└── README.md                    # This file
```

## 🗄️ Database Schema

### Core Tables

#### `profiles`
- Extends Supabase auth.users
- Stores user information, roles, and points
- RLS policies ensure users can only access their own data

#### `invites`
- Referral invitation configurations
- Unique slugs for public sharing
- Configurable usage limits and expiration

#### `referrals`
- Tracks individual referral attempts
- Links inviters to invitees
- Status tracking (PENDING, COMPLETED, FAILED)

#### `ephemeral_codes`
- Single-use codes with 5-minute TTL
- Hashed storage for security
- Unique constraints prevent duplicate active codes

#### `redemptions`
- Records successful code redemptions
- Links to Supabase Storage receipts
- Audit trail for all transactions

#### `milestones`
- Configurable achievement levels
- Point thresholds and rewards
- Active/inactive status management

#### `milestone_awards`
- Tracks user milestone progress
- Unlock timestamps and status
- Links users to specific milestones

### Security & Performance
- **Indexes**: Optimized queries with partial indexes
- **Triggers**: Automated timestamp updates and audit logging
- **Functions**: Atomic operations for point awarding and milestone checks
- **Cron Jobs**: Automated cleanup and maintenance tasks

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### 1. Clone and Install
```bash
git clone <repository-url>
cd referral-projek
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Code Generation
CODE_LENGTH=8
CODE_EXPIRY_MINUTES=5
```

### 3. Database Setup
```bash
# Run database schema
npm run db:setup

# Seed with sample data
npm run db:seed
```

### 4. Development
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## 🔧 API Endpoints

### Authentication Required Endpoints

#### Points & Milestones
- `GET /api/points/me` - Get user's points and history
- `GET /api/milestones/me` - Get milestone progress

#### Referral Management
- `POST /api/referral` - Create new referral invite
- `GET /api/referral` - Get user's invites
- `PUT /api/referral` - Update invite
- `DELETE /api/referral` - Delete invite

#### Code Generation
- `POST /api/code` - Generate ephemeral code
- `GET /api/code` - Get user's codes or validate code

### Cashier Endpoints
- `POST /api/redeem` - Redeem referral code
- `GET /api/redeem/history` - Get redemption history

### Admin Endpoints
- `GET /api/admin/users` - List and manage users
- `PUT /api/admin/users` - Update user roles
- `DELETE /api/admin/users` - Ban users
- `GET /api/admin/codes` - View and manage codes
- `DELETE /api/admin/codes` - Revoke codes
- `POST /api/admin/codes` - Get analytics

## 🎨 UI Components

### Core Components
- **Button**: Multiple variants (primary, secondary, outline, danger)
- **Card**: Flexible content containers with headers, content, and footers
- **Badge**: Status indicators with color variants
- **CountdownTimer**: Real-time countdown for ephemeral codes

### Pages
- **Landing Page**: Marketing site with feature overview
- **Dashboard**: User overview with tabs for points, milestones, and referrals
- **Cashier Interface**: Streamlined code redemption workflow
- **Admin Panel**: User and system management

## 🔐 Security Features

### Database Security
- **Row Level Security (RLS)**: Granular access control
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **Audit Logging**: Complete activity tracking

### Application Security
- **Rate Limiting**: Configurable request throttling
- **Authentication**: Supabase Auth with role-based access
- **CSRF Protection**: Security headers and token validation
- **XSS Prevention**: Input sanitization and output encoding

### Code Security
- **Ephemeral Codes**: 5-minute TTL with automatic expiration
- **Code Hashing**: bcryptjs with unique salts
- **Single-Use**: Atomic transactions prevent double-spending
- **Receipt Storage**: JSON artifacts in Supabase Storage

## 📊 Performance & Optimization

### Database Optimization
- **Indexes**: Strategic indexing for common queries
- **Partial Indexes**: Unique constraints on active codes
- **Cron Jobs**: Automated cleanup and maintenance
- **Connection Pooling**: Efficient database connections

### Frontend Optimization
- **Code Splitting**: Dynamic imports for better performance
- **Image Optimization**: Next.js built-in image optimization
- **Caching**: Strategic caching strategies
- **Bundle Analysis**: Webpack optimizations

### Edge Functions
- **API Routes**: Serverless API endpoints
- **Middleware**: Rate limiting and authentication
- **Global Distribution**: Vercel Edge Network

## 🧪 Testing & Quality Assurance

### Testing Strategy
- **Unit Tests**: Jest for utility functions and components
- **Integration Tests**: API endpoint testing with mocked Supabase
- **E2E Tests**: Playwright for full user journey testing
- **Type Safety**: TypeScript for compile-time error prevention

### Code Quality
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting consistency
- **Type Checking**: Strict TypeScript configuration
- **Git Hooks**: Pre-commit quality checks

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Supabase Setup
1. Create new Supabase project
2. Run database migrations
3. Configure authentication providers
4. Set up storage buckets

### Environment Variables
Ensure all required environment variables are set in your deployment platform:
- Supabase credentials
- Security keys
- Rate limiting configuration
- Storage configuration

## 📈 Monitoring & Analytics

### Built-in Monitoring
- **Audit Logs**: Complete user activity tracking
- **Rate Limiting**: Request pattern analysis
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time monitoring

### External Monitoring
- **Uptime Monitoring**: Uptime Robot integration
- **Error Tracking**: Sentry integration (optional)
- **Logging**: Structured logging for production

## 🔄 Maintenance & Updates

### Regular Tasks
- **Database Cleanup**: Automated via cron jobs
- **Security Updates**: Regular dependency updates
- **Performance Monitoring**: Ongoing optimization
- **Backup Management**: Automated database backups

### Update Process
1. Test changes in development
2. Deploy to staging environment
3. Run full test suite
4. Deploy to production
5. Monitor for issues

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and merge

### Code Standards
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow commit message conventions

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Community
- [Next.js Discord](https://discord.gg/nextjs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/your-repo/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase team for the excellent backend platform
- Tailwind CSS team for the utility-first CSS framework
- Open source community for various dependencies

---

**Built with ❤️ using modern web technologies**
