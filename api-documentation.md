# 📚 API Documentation - Aplikasi Referral Marketing

## 🔗 Base URL
```
Development: http://localhost:3001/api
Staging: https://staging-api.referralapp.com/api
Production: https://api.referralapp.com/api
```

## 🔐 Authentication

### Headers
Semua request yang memerlukan autentikasi harus menyertakan header:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Error Responses
```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required",
    "details": "JWT token is missing or invalid"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📱 Authentication Endpoints

### 1. WhatsApp Login
**POST** `/auth/whatsapp/login`

Memulai proses login dengan nomor WhatsApp.

#### Request Body
```json
{
  "phoneNumber": "+6281234567890",
  "countryCode": "ID"
}
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_123456789",
    "expiresAt": "2024-01-15T11:00:00Z",
    "message": "Verification code sent to WhatsApp"
  }
}
```

#### Response Error (400)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PHONE",
    "message": "Invalid phone number format"
  }
}
```

### 2. WhatsApp Verification
**POST** `/auth/whatsapp/verify`

Verifikasi kode OTP yang dikirim via WhatsApp.

#### Request Body
```json
{
  "sessionId": "sess_123456789",
  "verificationCode": "123456"
}
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "phoneNumber": "+6281234567890",
      "referralCode": "REF123456",
      "totalPoints": 150,
      "totalReferrals": 3
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

### 3. Refresh Token
**POST** `/auth/refresh`

Memperbarui access token menggunakan refresh token.

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Logout
**POST** `/auth/logout`

Logout user dan invalidate token.

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🔗 Referral Endpoints

### 1. Get My Referral Code
**GET** `/referral/my-code`

Mendapatkan kode referral user yang sedang login.

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "referralCode": "REF123456",
    "referralLink": "https://referralapp.com/ref/REF123456",
    "totalReferrals": 3,
    "totalPoints": 150,
    "nextMilestone": {
      "target": 10,
      "current": 3,
      "reward": "Bonus 500 poin",
      "progress": 30
    }
  }
}
```

### 2. Get My Referrals
**GET** `/referral/my-referrals`

Mendapatkan daftar referral yang dibuat user.

#### Query Parameters
```
?page=1&limit=10&status=pending
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "referrals": [
      {
        "id": "ref_123",
        "inviteePhone": "+6281234567890",
        "status": "CLAIMED",
        "createdAt": "2024-01-15T10:00:00Z",
        "claimedAt": "2024-01-15T10:30:00Z",
        "pointsEarned": 50
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 3. Get Referral Statistics
**GET** `/referral/stats`

Mendapatkan statistik lengkap referral user.

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "totalReferrals": 25,
    "successfulReferrals": 20,
    "pendingReferrals": 3,
    "expiredReferrals": 2,
    "totalPoints": 1000,
    "pointsThisMonth": 250,
    "milestones": [
      {
        "target": 10,
        "achieved": true,
        "reward": "Bonus 100 poin",
        "achievedAt": "2024-01-10T10:00:00Z"
      },
      {
        "target": 25,
        "achieved": false,
        "reward": "Bonus 500 poin",
        "progress": 80
      }
    ],
    "monthlyProgress": [
      {"month": "Jan", "referrals": 8, "points": 400},
      {"month": "Feb", "referrals": 12, "points": 600}
    ]
  }
}
```

### 4. Share Referral
**POST** `/referral/share`

Mencatat aktivitas berbagi referral.

#### Request Body
```json
{
  "inviteePhone": "+6281234567890",
  "platform": "whatsapp"
}
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "message": "Referral shared successfully",
    "inviteePhone": "+6281234567890"
  }
}
```

### 5. Referral Landing Page
**GET** `/referral/landing/{code}`

Halaman landing untuk invitee yang membuka link referral.

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "referralCode": "REF123456",
    "referrerName": "John Doe",
    "availableRewards": [
      {
        "id": "reward_1",
        "name": "Gratis Es Kopi",
        "description": "Nikmati es kopi gratis dari kami",
        "image": "https://cdn.referralapp.com/rewards/coffee.jpg"
      }
    ],
    "claimUrl": "/claim/reward_1"
  }
}
```

## 🎁 Reward & Claim Endpoints

### 1. Get Reward Catalog
**GET** `/rewards/catalog`

Mendapatkan katalog hadiah yang tersedia.

#### Query Parameters
```
?category=instant&minPoints=0&maxPoints=1000
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": "reward_1",
        "name": "Gratis Es Kopi",
        "description": "Nikmati es kopi gratis dari kami",
        "pointsRequired": 50,
        "category": "INSTANT",
        "image": "https://cdn.referralapp.com/rewards/coffee.jpg",
        "stockQuantity": 100,
        "isActive": true
      }
    ],
    "categories": [
      {"id": "instant", "name": "Hadiah Instan", "count": 15},
      {"id": "milestone", "name": "Hadiah Milestone", "count": 8},
      {"id": "seasonal", "name": "Hadiah Musiman", "count": 5}
    ]
  }
}
```

### 2. Claim Reward
**POST** `/rewards/claim`

Klaim hadiah menggunakan poin.

#### Request Body
```json
{
  "rewardId": "reward_1",
  "quantity": 1
}
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "claimId": "claim_123",
    "reward": {
      "id": "reward_1",
      "name": "Gratis Es Kopi"
    },
    "pointsSpent": 50,
    "remainingPoints": 950,
    "claimCode": "CLAIM123456",
    "expiresAt": "2024-01-16T10:00:00Z"
  }
}
```

### 3. Get My Rewards
**GET** `/rewards/my-rewards`

Mendapatkan daftar hadiah yang telah diklaim user.

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": "claim_123",
        "reward": {
          "id": "reward_1",
          "name": "Gratis Es Kopi",
          "image": "https://cdn.referralapp.com/rewards/coffee.jpg"
        },
        "claimedAt": "2024-01-15T10:00:00Z",
        "expiresAt": "2024-01-16T10:00:00Z",
        "status": "ACTIVE",
        "claimCode": "CLAIM123456"
      }
    ]
  }
}
```

## 💰 Points Endpoints

### 1. Get Points Balance
**GET** `/points/balance`

Mendapatkan saldo poin user.

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "currentBalance": 950,
    "totalEarned": 1500,
    "totalSpent": 550,
    "thisMonthEarned": 250,
    "nextMilestone": {
      "target": 1000,
      "current": 950,
      "reward": "Bonus 100 poin",
      "progress": 95
    }
  }
}
```

### 2. Get Points History
**GET** `/points/history`

Mendapatkan riwayat transaksi poin.

#### Query Parameters
```
?page=1&limit=20&type=earned&startDate=2024-01-01&endDate=2024-01-31
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "type": "EARNED",
        "points": 50,
        "description": "Referral berhasil - John Doe",
        "createdAt": "2024-01-15T10:30:00Z",
        "referral": {
          "id": "ref_123",
          "inviteePhone": "+6281234567890"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

## 🏪 Cashier Endpoints

### 1. Verify Reward Code
**GET** `/cashier/verify/{claimCode}`

Verifikasi kode hadiah untuk penukaran.

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "claimCode": "CLAIM123456",
    "reward": {
      "id": "reward_1",
      "name": "Gratis Es Kopi",
      "description": "Nikmati es kopi gratis dari kami",
      "image": "https://cdn.referralapp.com/rewards/coffee.jpg"
    },
    "claimer": {
      "phoneNumber": "+6281234567890",
      "referralCode": "REF123456"
    },
    "claimedAt": "2024-01-15T10:00:00Z",
    "expiresAt": "2024-01-16T10:00:00Z",
    "status": "ACTIVE",
    "verificationElements": {
      "dynamicColor": "#FF6B35",
      "animationPattern": "pulse",
      "securityCode": "SEC789"
    }
  }
}
```

### 2. Redeem Reward
**POST** `/cashier/redeem`

Menandai hadiah sebagai telah ditukar.

#### Request Body
```json
{
  "claimCode": "CLAIM123456",
  "cashierId": "cashier_123",
  "storeId": "store_456",
  "notes": "Diberikan kepada pelanggan"
}
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "message": "Reward redeemed successfully",
    "redemptionId": "redemption_123",
    "redeemedAt": "2024-01-15T11:00:00Z"
  }
}
```

### 3. Get Cashier Transactions
**GET** `/cashier/transactions`

Mendapatkan riwayat transaksi kasir.

#### Query Parameters
```
?page=1&limit=20&startDate=2024-01-01&endDate=2024-01-31&storeId=store_456
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "redemption_123",
        "claimCode": "CLAIM123456",
        "reward": {
          "name": "Gratis Es Kopi"
        },
        "claimerPhone": "+6281234567890",
        "redeemedAt": "2024-01-15T11:00:00Z",
        "cashier": "John Cashier",
        "store": "Coffee Shop Central"
      }
    ],
    "summary": {
      "totalRedeemed": 25,
      "totalToday": 5,
      "totalThisWeek": 18
    }
  }
}
```

### 4. Get Daily Report
**GET** `/cashier/daily-report`

Laporan harian transaksi kasir.

#### Query Parameters
```
?date=2024-01-15&storeId=store_456
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "store": "Coffee Shop Central",
    "summary": {
      "totalRedeemed": 5,
      "totalPoints": 250,
      "uniqueReferrers": 3
    },
    "rewards": [
      {
        "name": "Gratis Es Kopi",
        "quantity": 3,
        "points": 150
      },
      {
        "name": "Diskon 20%",
        "quantity": 2,
        "points": 100
      }
    ],
    "referrers": [
      {
        "referralCode": "REF123456",
        "referrals": 2,
        "points": 100
      }
    ]
  }
}
```

## 👤 User Profile Endpoints

### 1. Get User Profile
**GET** `/user/profile`

Mendapatkan profil user yang sedang login.

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "phoneNumber": "+6281234567890",
    "referralCode": "REF123456",
    "totalPoints": 950,
    "totalReferrals": 25,
    "memberSince": "2024-01-01T00:00:00Z",
    "status": "ACTIVE",
    "achievements": [
      {
        "id": "ach_1",
        "name": "First Referral",
        "description": "Berhasil mengundang teman pertama",
        "earnedAt": "2024-01-05T10:00:00Z",
        "icon": "🎯"
      }
    ],
    "preferences": {
      "notifications": true,
      "language": "id",
      "timezone": "Asia/Jakarta"
    }
  }
}
```

### 2. Update User Profile
**PUT** `/user/profile`

Update profil user.

#### Request Body
```json
{
  "preferences": {
    "notifications": false,
    "language": "en"
  }
}
```

## 📊 Analytics Endpoints

### 1. Get User Analytics
**GET** `/analytics/user`

Analytics untuk user yang sedang login.

#### Query Parameters
```
?period=30d&groupBy=day
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "referrals": {
      "total": 25,
      "successful": 20,
      "conversionRate": 80,
      "daily": [
        {"date": "2024-01-15", "count": 2, "successful": 2},
        {"date": "2024-01-14", "count": 1, "successful": 1}
      ]
    },
    "points": {
      "earned": 1000,
      "spent": 550,
      "balance": 450,
      "daily": [
        {"date": "2024-01-15", "earned": 100, "spent": 50},
        {"date": "2024-01-14", "earned": 50, "spent": 0}
      ]
    },
    "rewards": {
      "claimed": 8,
      "redeemed": 6,
      "favorite": "Gratis Es Kopi"
    }
  }
}
```

## 🚨 Error Codes

### Authentication Errors
- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `INVALID_PHONE` - Invalid phone number format
- `VERIFICATION_FAILED` - OTP verification failed
- `SESSION_EXPIRED` - Session expired

### Referral Errors
- `INVALID_REFERRAL_CODE` - Referral code not found
- `REFERRAL_EXPIRED` - Referral has expired
- `REFERRAL_ALREADY_USED` - Referral already claimed
- `SELF_REFERRAL` - Cannot refer yourself
- `DUPLICATE_REFERRAL` - Phone number already referred

### Reward Errors
- `INSUFFICIENT_POINTS` - Not enough points
- `REWARD_UNAVAILABLE` - Reward out of stock
- `REWARD_INACTIVE` - Reward is not active
- `CLAIM_EXPIRED` - Claim has expired
- `CLAIM_ALREADY_USED` - Claim already redeemed

### System Errors
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `VALIDATION_ERROR` - Invalid request data
- `INTERNAL_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## 📱 WhatsApp Webhook

### Webhook URL
```
POST /webhook/whatsapp
```

### Request Body (from WhatsApp)
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "1234567890",
              "phone_number_id": "987654321"
            },
            "contacts": [
              {
                "profile": {
                  "name": "John Doe"
                },
                "wa_id": "1234567890"
              }
            ],
            "messages": [
              {
                "from": "1234567890",
                "id": "wamid.123456789",
                "timestamp": "1234567890",
                "text": {
                  "body": "Hello"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## 🔄 Rate Limiting

### Limits
- **Authentication**: 5 requests per minute per IP
- **Referral Creation**: 10 requests per hour per user
- **Reward Claims**: 20 requests per hour per user
- **API Calls**: 1000 requests per hour per user

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642233600
```

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": "Additional error details",
    "field": "field_name" // for validation errors
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🧪 Testing

### Test Environment
```
Base URL: https://test-api.referralapp.com/api
Test Phone: +6281234567890
Test OTP: 123456
```

### Postman Collection
Download Postman collection: [Referral App API.postman_collection.json](https://api.referralapp.com/docs/postman-collection)

### Swagger Documentation
Interactive API docs: [https://api.referralapp.com/docs](https://api.referralapp.com/docs)

## 📞 Support

- **API Support**: api-support@referralapp.com
- **Documentation**: [https://docs.referralapp.com](https://docs.referralapp.com)
- **Status Page**: [https://status.referralapp.com](https://status.referralapp.com)
- **Developer Community**: [https://community.referralapp.com](https://community.referralapp.com)
