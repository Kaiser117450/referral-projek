#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { hashCode, generateSalt } from '../lib/utils';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create sample milestones
    console.log('📊 Creating milestones...');
    const { data: milestones, error: milestoneError } = await supabase
      .from('milestones')
      .insert([
        {
          name: 'First Referral',
          description: 'Complete your first successful referral',
          points_required: 100,
          reward_description: 'Welcome bonus points',
          is_active: true
        },
        {
          name: 'Referral Master',
          description: 'Reach 500 points from referrals',
          points_required: 500,
          reward_description: 'Premium status upgrade',
          is_active: true
        },
        {
          name: 'Referral Champion',
          description: 'Reach 1000 points from referrals',
          points_required: 1000,
          reward_description: 'Exclusive rewards access',
          is_active: true
        },
        {
          name: 'Referral Legend',
          description: 'Reach 2500 points from referrals',
          points_required: 2500,
          reward_description: 'VIP membership',
          is_active: true
        }
      ])
      .select();

    if (milestoneError) {
      console.error('Error creating milestones:', milestoneError);
      return;
    }

    console.log(`✅ Created ${milestones.length} milestones`);

    // 2. Create sample users (profiles)
    console.log('👥 Creating sample users...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          user_role: 'user',
          points: 0,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          email: 'jane.smith@example.com',
          full_name: 'Jane Smith',
          user_role: 'user',
          points: 0,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          email: 'cashier@example.com',
          full_name: 'Cashier User',
          user_role: 'cashier',
          points: 0,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          email: 'admin@example.com',
          full_name: 'Admin User',
          user_role: 'admin',
          points: 0,
          is_active: true
        }
      ])
      .select();

    if (userError) {
      console.error('Error creating users:', userError);
      return;
    }

    console.log(`✅ Created ${users.length} users`);

    // 3. Create sample invites
    console.log('📨 Creating sample invites...');
    const { data: invites, error: inviteError } = await supabase
      .from('invites')
      .insert([
        {
          user_id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Join our referral program!',
          description: 'Get started with earning points through referrals',
          slug: 'john-doe-welcome',
          max_uses: 10,
          is_active: true
        },
        {
          user_id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Special invitation for friends',
          description: 'Exclusive offer for new members',
          slug: 'jane-special',
          max_uses: 5,
          is_active: true
        }
      ])
      .select();

    if (inviteError) {
      console.error('Error creating invites:', inviteError);
      return;
    }

    console.log(`✅ Created ${invites.length} invites`);

    // 4. Create sample referrals
    console.log('🔗 Creating sample referrals...');
    const { data: referrals, error: referralError } = await supabase
      .from('referrals')
      .insert([
        {
          inviter_id: '550e8400-e29b-41d4-a716-446655440001',
          invitee_email: 'friend1@example.com',
          invite_id: invites[0].id,
          status: 'PENDING'
        },
        {
          inviter_id: '550e8400-e29b-41d4-a716-446655440001',
          invitee_email: 'friend2@example.com',
          invite_id: invites[0].id,
          status: 'PENDING'
        }
      ])
      .select();

    if (referralError) {
      console.error('Error creating referrals:', referralError);
      return;
    }

    console.log(`✅ Created ${referrals.length} referrals`);

    // 5. Create sample ephemeral codes
    console.log('🔐 Creating sample ephemeral codes...');
    const sampleCodes = [];
    
    for (let i = 0; i < 3; i++) {
      const code = nanoid(8);
      const salt = generateSalt();
      const codeHash = await hashCode(code, salt);
      
      sampleCodes.push({
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        code_hash: codeHash,
        salt: salt,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        status: 'ACTIVE',
        referral_id: referrals[0].id
      });
    }

    const { data: codes, error: codeError } = await supabase
      .from('ephemeral_codes')
      .insert(sampleCodes)
      .select();

    if (codeError) {
      console.error('Error creating codes:', codeError);
      return;
    }

    console.log(`✅ Created ${codes.length} ephemeral codes`);

    // 6. Create sample redemptions
    console.log('🎫 Creating sample redemptions...');
    const { data: redemptions, error: redemptionError } = await supabase
      .from('redemptions')
      .insert([
        {
          code_id: codes[0].id,
          cashier_id: '550e8400-e29b-41d4-a716-446655440003',
          points_awarded: 100,
          status: 'COMPLETED',
          receipt_url: 'https://example.com/receipts/sample1.json'
        }
      ])
      .select();

    if (redemptionError) {
      console.error('Error creating redemptions:', redemptionError);
      return;
    }

    console.log(`✅ Created ${redemptions.length} redemptions`);

    // 7. Update user points after redemption
    console.log('💰 Updating user points...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ points: 100 })
      .eq('id', '550e8400-e29b-41d4-a716-446655440001');

    if (updateError) {
      console.error('Error updating user points:', updateError);
      return;
    }

    console.log('✅ Updated user points');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample data created:');
    console.log(`   - ${milestones.length} milestones`);
    console.log(`   - ${users.length} users (including admin, cashier, and regular users)`);
    console.log(`   - ${invites.length} invites`);
    console.log(`   - ${referrals.length} referrals`);
    console.log(`   - ${codes.length} ephemeral codes`);
    console.log(`   - ${redemptions.length} redemptions`);
    
    console.log('\n🔑 Test credentials:');
    console.log('   - Regular User: john.doe@example.com (100 points)');
    console.log('   - Cashier: cashier@example.com');
    console.log('   - Admin: admin@example.com');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('\n✨ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
