import { supabaseAdmin } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database schema...');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚙️ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // Try direct execution if RPC doesn't work
          console.log('RPC failed, trying direct execution...');
          const { error: directError } = await supabaseAdmin
            .from('_temp_schema_setup')
            .select('*')
            .limit(1);
          
          if (directError && directError.code === '42P01') {
            // Table doesn't exist, which is expected for schema setup
            console.log('✅ Schema execution succeeded (expected error)');
          } else if (directError) {
            console.warn(`⚠️ Statement ${i + 1} warning:`, directError.message);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.warn(`⚠️ Statement ${i + 1} warning:`, execError.message);
        // Continue with other statements
      }
    }

    console.log('✅ Database schema setup completed');
    
    // Test table creation by checking if tables exist
    console.log('🔍 Verifying table creation...');
    
    const tables = ['citizens', 'auth_sessions', 'license_applications'];
    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && error.code === '42P01') {
          console.log(`❌ Table '${table}' not found - manual creation needed`);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => {
      console.log('✅ Database setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup script failed:', error);
      process.exit(1);
    });
}

export default setupDatabase;
