# Hybrid Authentication Setup Guide

This guide explains how to set up the hybrid authentication system that supports both Firebase Google authentication for regular users and username/password authentication for admins/cashiers.

## Overview

The system now supports two authentication methods:
- **Firebase Google Authentication**: For regular users (one-click Gmail login)
- **Username/Password Authentication**: For admins and cashiers

## Setup Steps

### 1. Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one

2. **Enable Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Google Sign-in provider
   - Configure OAuth consent screen if needed

3. **Get Configuration**:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click the web app icon (</>) to add a web app
   - Copy the configuration object

4. **Update Firebase Config**:
   - Copy `frontend/firebase-config-example.js` to `frontend/src/config/firebase.ts`
   - Replace the placeholder values with your actual Firebase config

### 2. Database Migration

The Prisma schema has been updated with new fields. You'll need to run a migration:

```bash
# Inside the backend container
docker exec referral_backend npx prisma migrate dev --name add_firebase_support
```

### 3. Environment Variables

Update your backend `.env` file to include Firebase configuration if needed:

```env
# Optional: Firebase Admin SDK (for server-side verification)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## How It Works

### Regular Users (Firebase)
1. Click "Continue with Google" button
2. Firebase handles OAuth flow
3. User is automatically created in your database
4. User gets a referral code and starts earning points

### Admins/Cashiers (Username/Password)
1. Click "Are you an admin or cashier? Click here"
2. Enter username and password
3. Authenticated against your backend database
4. Access admin/cashier features

## User Roles

- **USER**: Regular users with Firebase authentication
- **ADMIN**: System administrators with username/password
- **CASHIER**: Store staff with username/password

## Security Features

- Firebase handles OAuth security
- JWT tokens for admin authentication
- Role-based access control
- Secure password hashing for admin accounts

## Testing

1. **Test Firebase Login**:
   - Go to `/login`
   - Click "Continue with Google"
   - Should redirect to dashboard after successful authentication

2. **Test Admin Login**:
   - Go to `/login`
   - Click "Are you an admin or cashier? Click here"
   - Enter admin credentials
   - Should redirect to dashboard

## Troubleshooting

### Common Issues

1. **Firebase not working**:
   - Check Firebase configuration
   - Ensure Google Sign-in is enabled
   - Check browser console for errors

2. **Database errors**:
   - Run Prisma migration
   - Check database connection
   - Verify schema changes

3. **CORS issues**:
   - Ensure backend CORS is configured for frontend domain
   - Check Docker networking

## Next Steps

1. **Customize Firebase UI**: Modify the Google sign-in button styling
2. **Add More Providers**: Enable Facebook, Twitter, etc. in Firebase
3. **Role Management**: Create admin interface for managing user roles
4. **Audit Logging**: Track authentication events for security

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Docker container logs
3. Verify Firebase configuration
4. Ensure all dependencies are installed

