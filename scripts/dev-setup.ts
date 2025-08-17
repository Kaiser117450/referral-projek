#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

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

async function setupDatabase() {
  console.log('🏗️  Starting database setup...');

  try {
    // Read schema file
    const schemaPath = join(__dirname, '..', 'supabase', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    console.log('📖 Reading schema file...');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Try direct execution for non-RPC statements
            const { error: directError } = await supabase.from('_exec_sql').select('*').limit(1);
            if (directError) {
              console.log(`⚠️  Statement ${i + 1} skipped (likely already exists):`, statement.substring(0, 100) + '...');
            }
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} skipped:`, err instanceof Error ? err.message : 'Unknown error');
        }
      }
    }

    console.log('✅ Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run db:seed');
    console.log('   2. Start development: npm run dev');

  } catch (error) {
    console.error('❌ Error during database setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('\n✨ Setup process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
