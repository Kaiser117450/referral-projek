import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo rewards
  const coffeeReward = await prisma.reward.upsert({
    where: { id: 'demo-reward-1' },
    update: {},
    create: {
      id: 'demo-reward-1',
      name: 'Gratis Es Kopi',
      description: 'Nikmati es kopi gratis dari kami dengan rasa yang menyegarkan',
      pointsRequired: 0,
      category: 'INSTANT',
      isActive: true,
      stockQuantity: 100
    }
  });

  const discountReward = await prisma.reward.upsert({
    where: { id: 'demo-reward-2' },
    update: {},
    create: {
      id: 'demo-reward-2',
      name: 'Diskon 20%',
      description: 'Dapatkan diskon 20% untuk pembelian apapun',
      pointsRequired: 0,
      category: 'INSTANT',
      isActive: true,
      stockQuantity: 50
    }
  });

  const snackReward = await prisma.reward.upsert({
    where: { id: 'demo-reward-3' },
    update: {},
    create: {
      id: 'demo-reward-3',
      name: 'Snack Gratis',
      description: 'Pilih snack favorit Anda secara gratis',
      pointsRequired: 0,
      category: 'INSTANT',
      isActive: true,
      stockQuantity: 75
    }
  });

  console.log('✅ Demo rewards created:', {
    coffee: coffeeReward.name,
    discount: discountReward.name,
    snack: snackReward.name
  });

  // Create demo referral (for Initial Build)
  const demoReferral = await prisma.referral.upsert({
    where: { referralCode: 'DEMO123' },
    update: {},
    create: {
      referralCode: 'DEMO123',
      status: 'PENDING'
    }
  });

  console.log('✅ Demo referral created:', demoReferral.referralCode);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



