-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'CLAIMED', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RewardCategory" AS ENUM ('INSTANT', 'MILESTONE', 'SEASONAL');

-- CreateEnum
CREATE TYPE "RewardCodeStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "inviteePhone" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardCode" TEXT,
    "claimedAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pointsRequired" INTEGER NOT NULL DEFAULT 0,
    "category" "RewardCategory" NOT NULL DEFAULT 'INSTANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stockQuantity" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "status" "RewardCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claimed_rewards" (
    "id" TEXT NOT NULL,
    "rewardCode" TEXT NOT NULL,
    "rewardName" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "cashierId" TEXT,
    "storeId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claimed_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referralCode_key" ON "referrals"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_rewardCode_key" ON "referrals"("rewardCode");

-- CreateIndex
CREATE UNIQUE INDEX "reward_codes_code_key" ON "reward_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "reward_codes_referralId_key" ON "reward_codes"("referralId");

-- CreateIndex
CREATE UNIQUE INDEX "claimed_rewards_rewardCode_key" ON "claimed_rewards"("rewardCode");

-- AddForeignKey
ALTER TABLE "reward_codes" ADD CONSTRAINT "reward_codes_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_codes" ADD CONSTRAINT "reward_codes_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
