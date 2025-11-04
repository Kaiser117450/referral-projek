# F&B Referral & Code Redemption System

A modern, self-hosted referral system built with Next.js 14, Turso DB, and NextAuth.js. Perfect for F&B businesses looking to implement a customer referral program with ephemeral codes and milestone rewards.

## 🚀 Features

### Core Functionality
- **Ephemeral 5-minute codes** - Secure, time-limited redemption codes
- **Role-based access control** - User, Cashier, and Admin roles
- **Real-time points tracking** - Instant point updates and milestone progress
- **Milestone rewards system** - Configurable achievement levels
- **Modern cashier interface** - Streamlined code redemption for F&B staff
- **QR code support** - Easy mobile scanning for customers
- **Receipt storage** - Local file-based receipt management

### Technical Features
- **Self-hosted architecture** - Deploy on your own VPS
- **Turso DB (libSQL)** - Fast, distributed SQLite database
- **NextAuth.js authentication** - Secure email-based authentication
- **TypeScript throughout** - Type-safe development
- **Responsive F&B design** - Restaurant-themed UI with Tailwind CSS
- **Docker deployment** - Containerized for easy deployment
- **Health monitoring** - Built-in health checks and monitoring

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: Turso DB (libSQL/SQLite)
- **Authentication**: NextAuth.js (Email Magic Links)
- **Storage**: Local file system (receipts)
- **Deployment**: Docker + Docker Compose
- **Styling**: Tailwind CSS, Lucide React icons
- **UI Components**: Custom F&B-themed components

## 📋 Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- Turso account and database
- SMTP server for email authentication
- VPS or server for deployment

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd referral-projek
npm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp env.example .env.local
```

Configure your `.env.local`:

```env
# Turso DB Configuration (REQUIRED)
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here

# NextAuth.js Configuration (REQUIRED)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here_generate_with_openssl_rand_base64_32

# Email Configuration for NextAuth.js (REQUIRED)
EMAIL_SERVER=smtp://username:password@smtp.gmail.com:587
EMAIL_FROM=noreply@yourdomain.com

# App Configuration (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security (REQUIRED)
ENCRYPTION_KEY=79BAeW+ilVHGlRumUpYtLgKS7s33bTRB6SsJWyTkQ8Y=

# F&B Specific Configuration (OPTIONAL)
RESTAURANT_NAME="Your Restaurant Name"
RESTAURANT_LOGO_URL="/logo.png"
POINTS_PER_REFERRAL=1
MAX_CODES_PER_USER_PER_DAY=5
```

### 3. Database Setup

Set up your Turso database:

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login and create database
turso auth login
turso db create your-database-name

# Get connection details
turso db show your-database-name
turso db tokens create your-database-name

# Run database schema
turso db shell your-database-name < scripts/setup-turso-schema.sql
```

### 4. Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 📊 Database Schema

### NextAuth.js Tables
- `users` - User accounts and basic information
- `accounts` - OAuth account linking
- `sessions` - User session management
- `verificationTokens` - Email verification tokens

### F&B Application Tables

#### `profiles`
Extended user profile information
- `id` (TEXT, Primary Key)
- `user_id` (TEXT, Foreign Key → users.id)
- `full_name` (TEXT)
- `role` (TEXT: user, cashier, admin)
- `points` (INTEGER, Default: 0)
- `created_at` (DATETIME)

#### `invites`
Referral link management
- `id` (TEXT, Primary Key)
- `inviter_id` (TEXT, Foreign Key → profiles.id)
- `slug` (TEXT, Unique)
- `title` (TEXT)
- `is_active` (BOOLEAN, Default: 1)
- `created_at` (DATETIME)

#### `ephemeral_codes`
Time-limited redemption codes
- `id` (TEXT, Primary Key)
- `invite_id` (TEXT, Foreign Key → invites.id)
- `code_hash` (TEXT, Unique)
- `referred_user_id` (TEXT, Foreign Key → profiles.id)
- `expires_at` (DATETIME)
- `is_used` (BOOLEAN, Default: 0)
- `created_at` (DATETIME)

#### `redemptions`
Completed code redemptions
- `id` (TEXT, Primary Key)
- `code_id` (TEXT, Foreign Key → ephemeral_codes.id)
- `redeemed_by` (TEXT, Foreign Key → profiles.id)
- `points_awarded` (INTEGER)
- `receipt` (TEXT) - Filename of stored receipt
- `redeemed_at` (DATETIME)

#### `milestones`
Achievement system configuration
- `id` (INTEGER, Primary Key)
- `name` (TEXT)
- `points_required` (INTEGER)
- `reward_type` (TEXT)
- `reward_value` (TEXT) - JSON string
- `is_active` (BOOLEAN, Default: 1)

## 🎯 User Flows

### Customer Journey
1. **Receive referral link** from existing customer
2. **Sign in with email** (magic link authentication)
3. **Generate ephemeral code** (5-minute expiry)
4. **Show code to cashier** at restaurant
5. **Earn points** for the referrer upon redemption

### Cashier Workflow
1. **Sign in to cashier terminal** with email authentication
2. **Scan QR code** or manually enter customer code
3. **Validate and redeem** code in real-time
4. **View transaction details** and customer information
5. **Track daily statistics** and session metrics

### User Dashboard
1. **View points balance** and referral statistics
2. **Generate and share** referral links
3. **Track milestone progress** and achievements
4. **View redemption history** and receipts

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signin` - Email magic link sign-in
- `GET /api/auth/callback` - Authentication callback
- `POST /api/auth/signout` - Sign out

### Public Endpoints
- `GET /api/invite/[slug]` - Get referral link details
- `POST /api/code` - Generate ephemeral code (authenticated)
- `POST /api/redeem` - Redeem code (cashier/admin only)

### Protected Endpoints
- `GET /api/points/me` - Get user points and history
- `GET /api/referral/me` - Get user's referral links
- `POST /api/referral/generate` - Create new referral link
- `GET /api/milestones/me` - Get milestone progress

### System Endpoints
- `GET /api/health` - Health check for monitoring

## 🎨 Enhanced UI Components

### F&B-Themed Design
- **Restaurant branding** - Orange/red gradient theme
- **Modern cashier interface** - Professional POS-style design
- **Customer dashboard** - Engaging points and rewards display
- **Mobile-first responsive** - Optimized for all devices

### Key Components
- **Enhanced Button** - Loading states and variants
- **Modern Cards** - Gradient headers and shadows
- **Progress Indicators** - Milestone tracking
- **Statistics Cards** - Real-time metrics display
- **QR Code Scanner** - Integrated camera scanning

## 🚀 Deployment

### Docker Deployment (Recommended)

1. **Configure environment variables**:
```bash
cp env.example .env
# Edit .env with your production values
```

2. **Deploy with Docker Compose**:
```bash
docker-compose up -d
```

3. **Check health**:
```bash
curl http://localhost:3000/api/health
```

### Manual VPS Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:
- VPS setup and configuration
- SSL certificate installation
- Nginx reverse proxy setup
- Monitoring and maintenance

## 🔒 Security Features

### Authentication & Authorization
- **NextAuth.js integration** - Secure email-based authentication
- **Role-based access control** - User, Cashier, Admin roles
- **Session management** - Secure JWT tokens
- **Email verification** - Magic link authentication

### Data Protection
- **Local file storage** - Receipts stored securely on server
- **Encrypted sensitive data** - Application-level encryption
- **Input validation** - Comprehensive request validation
- **Rate limiting** - API abuse prevention

### Code Security
- **Ephemeral codes** - 5-minute expiry window
- **Cryptographic hashing** - Secure code storage
- **One-time use** - Prevents code reuse
- **Secure generation** - Cryptographically secure random codes

## 📈 Performance Features

### Frontend Optimization
- **Next.js App Router** - Optimal loading and routing
- **Component optimization** - Lazy loading and code splitting
- **Tailwind CSS** - Minimal CSS bundle
- **Image optimization** - Next.js Image component

### Backend Optimization
- **Turso DB** - Fast, distributed SQLite
- **Connection pooling** - Efficient database connections
- **Health monitoring** - Built-in health checks
- **Docker optimization** - Multi-stage builds

## 🧪 Testing & Monitoring

### Health Monitoring
```bash
# Check application health
curl http://localhost:3000/api/health

# Monitor Docker logs
docker-compose logs -f

# Check resource usage
docker stats
```

### Storage Management
- **Receipt storage** - Local file system with organized structure
- **Backup utilities** - Built-in backup and export functions
- **Storage statistics** - Monitor disk usage and file counts

## 📝 Configuration

### F&B Customization
- **Restaurant branding** - Name, logo, colors
- **Points system** - Configurable point values
- **Code settings** - Expiry time, length, daily limits
- **Milestone rewards** - Custom achievement levels

### Email Templates
- **Branded emails** - Restaurant-themed email templates
- **Custom subjects** - Personalized email subjects
- **Multi-language** - Support for different languages

## 🗺 Migration from Supabase

This system has been completely migrated from Supabase to a self-hosted stack:

### What Changed
- ✅ **Database**: Supabase PostgreSQL → Turso DB (libSQL)
- ✅ **Authentication**: Supabase Auth → NextAuth.js
- ✅ **Storage**: Supabase Storage → Local file system
- ✅ **Deployment**: Vercel → Docker on VPS
- ✅ **UI/UX**: Enhanced for F&B environment

### Migration Benefits
- **Cost control** - No usage-based pricing
- **Data ownership** - Complete control over your data
- **Customization** - Full control over features and design
- **Performance** - Optimized for F&B workflows

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support and questions:
- Check the [DEPLOYMENT.md](DEPLOYMENT.md) guide
- Review the health endpoint: `/api/health`
- Create an issue in the GitHub repository

## 🗺 Roadmap

### Upcoming Features
- [ ] Advanced analytics dashboard
- [ ] Multi-restaurant support
- [ ] Mobile app integration
- [ ] Advanced reporting features
- [ ] Integration with POS systems
- [ ] Customer notification system

### Performance Improvements
- [ ] Redis caching layer
- [ ] CDN integration for static assets
- [ ] Advanced monitoring and alerting
- [ ] Automated backup system

---

Built with ❤️ for the F&B industry - Self-hosted, secure, and scalable.