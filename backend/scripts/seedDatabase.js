import { supabaseAdmin } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // First, let's test the connection and check if tables exist
    console.log('🔍 Checking database connection and tables...');
    
    try {
      // Test citizens table
      const { error: citizenError } = await supabaseAdmin
        .from('citizens')
        .select('count')
        .limit(1);
      
      if (citizenError && citizenError.code === '42P01') {
        console.log('❌ Citizens table does not exist');
        console.log('📋 Please create the tables in Supabase dashboard first:');
        console.log('   1. Go to https://jfaqmpfvbeovprtcbztn.supabase.co');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Run the schema from backend/database/schema.sql');
        console.log('   4. Then run this seeding script again');
        return;
      } else if (citizenError) {
        console.warn('⚠️ Citizens table check warning:', citizenError.message);
      } else {
        console.log('✅ Citizens table exists');
      }
    } catch (tableError) {
      console.error('❌ Database connection failed:', tableError);
      console.log('🔧 Falling back to dummy data mode for local development');
      return;
    }

    // Load dummy citizens data
    const dummyDataPath = path.join(__dirname, '../data/dummy-citizens-12digit.json');
    const dummyData = JSON.parse(fs.readFileSync(dummyDataPath, 'utf8'));

    console.log(`📊 Found ${dummyData.length} dummy citizens to insert`);

    // Clear existing data (be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Clearing existing data (development only)...');
      
      try {
        // Delete in order due to foreign key constraints
        await supabaseAdmin.from('license_applications').delete().neq('id', 'dummy');
        await supabaseAdmin.from('auth_sessions').delete().neq('id', 'dummy');
        await supabaseAdmin.from('citizens').delete().neq('id', 'dummy');
        
        console.log('✅ Existing data cleared');
      } catch (clearError) {
        console.warn('⚠️ Warning clearing data:', clearError.message);
      }
    }

    // Insert citizens
    console.log('👤 Inserting citizens...');
    
    const citizensData = dummyData.map(citizen => ({
      national_id: citizen.nationalId,
      full_name: citizen.fullName,
      date_of_birth: citizen.dateOfBirth,
      address: citizen.address,
      phone_number: citizen.phoneNumber,
      email: citizen.email || null,
      photo_url: citizen.photoUrl || null,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data: insertedCitizens, error: citizenError } = await supabaseAdmin
      .from('citizens')
      .insert(citizensData)
      .select();

    if (citizenError) {
      console.error('❌ Error inserting citizens:', citizenError);
      throw citizenError;
    }

    console.log(`✅ Inserted ${insertedCitizens.length} citizens`);

    // Create some sample license applications
    console.log('📄 Creating sample license applications...');
    
    const sampleApplications = [
      {
        citizen_id: insertedCitizens[0].id,
        license_type: 'STANDARD',
        status: 'APPROVED',
        personal_info: {
          fullName: insertedCitizens[0].full_name,
          dateOfBirth: insertedCitizens[0].date_of_birth,
          address: insertedCitizens[0].address,
          phoneNumber: insertedCitizens[0].phone_number,
          email: insertedCitizens[0].email
        },
        documents: {
          nationalIdPhoto: 'https://example.com/dummy-id-photo.jpg',
          medicalCertificate: 'https://example.com/dummy-medical.jpg',
          applicationPhoto: 'https://example.com/dummy-app-photo.jpg'
        },
        emergency_contact: {
          name: 'Jean Mukamana',
          phone: '+257 79 123 456',
          relationship: 'Spouse'
        },
        submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        approved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        citizen_id: insertedCitizens[1].id,
        license_type: 'STANDARD',
        status: 'PENDING',
        personal_info: {
          fullName: insertedCitizens[1].full_name,
          dateOfBirth: insertedCitizens[1].date_of_birth,
          address: insertedCitizens[1].address,
          phoneNumber: insertedCitizens[1].phone_number,
          email: insertedCitizens[1].email
        },
        documents: {
          nationalIdPhoto: 'https://example.com/dummy-id-photo2.jpg',
          medicalCertificate: 'https://example.com/dummy-medical2.jpg',
          applicationPhoto: 'https://example.com/dummy-app-photo2.jpg'
        },
        emergency_contact: {
          name: 'Pierre Nkurunziza',
          phone: '+257 78 987 654',
          relationship: 'Brother'
        },
        submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: insertedApps, error: appError } = await supabaseAdmin
      .from('license_applications')
      .insert(sampleApplications)
      .select();

    if (appError) {
      console.error('❌ Error inserting applications:', appError);
      throw appError;
    }

    console.log(`✅ Inserted ${insertedApps.length} sample applications`);

    // Summary
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('=====================================');
    console.log(`👤 Citizens: ${insertedCitizens.length}`);
    console.log(`📄 Applications: ${insertedApps.length}`);
    console.log('=====================================');
    console.log('\n💡 Demo Login Information:');
    dummyData.slice(0, 3).forEach((citizen, index) => {
      console.log(`${index + 1}. National ID: ${citizen.nationalId}`);
      console.log(`   Name: ${citizen.fullName}`);
      console.log(`   Phone: ${citizen.phoneNumber}`);
      console.log(`   OTP: 123456 (demo)\n`);
    });

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;
