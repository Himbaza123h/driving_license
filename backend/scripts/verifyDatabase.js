import { supabaseAdmin } from '../config/database.js';

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database setup...');

    // Test citizens table
    console.log('\n👤 Testing citizens table...');
    const { data: citizens, error: citizensError } = await supabaseAdmin
      .from('citizens')
      .select('*')
      .limit(5);

    if (citizensError) {
      console.log('❌ Citizens table error:', citizensError.message);
      return false;
    } else {
      console.log(`✅ Citizens table: ${citizens.length} records found`);
      if (citizens.length > 0) {
        console.log('   Sample citizen:', citizens[0].full_name, '-', citizens[0].national_id);
      }
    }

    // Test auth_sessions table
    console.log('\n🔐 Testing auth_sessions table...');
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('auth_sessions')
      .select('*')
      .limit(1);

    if (sessionsError) {
      console.log('❌ Auth sessions table error:', sessionsError.message);
      return false;
    } else {
      console.log(`✅ Auth sessions table: accessible (${sessions.length} records)`);
    }

    // Test license_applications table
    console.log('\n📄 Testing license_applications table...');
    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from('license_applications')
      .select('*')
      .limit(1);

    if (applicationsError) {
      console.log('❌ License applications table error:', applicationsError.message);
      return false;
    } else {
      console.log(`✅ License applications table: accessible (${applications.length} records)`);
    }

    console.log('\n🎉 Database verification completed successfully!');
    console.log('\n💡 Available test accounts:');
    citizens.forEach((citizen, index) => {
      console.log(`${index + 1}. National ID: ${citizen.national_id}`);
      console.log(`   Name: ${citizen.full_name}`);
      console.log(`   Phone: ${citizen.phone_number}`);
      console.log(`   Demo OTP: 123456\n`);
    });

    return true;

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    return false;
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDatabase()
    .then((success) => {
      if (success) {
        console.log('✅ Database is ready for use!');
        process.exit(0);
      } else {
        console.log('❌ Database setup incomplete. Please run the setup.sql file in Supabase dashboard.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Verification script failed:', error);
      process.exit(1);
    });
}

export default verifyDatabase;
