const { createClient } = require('@supabase/supabase-js');

// Supabase configuration 
const supabaseUrl = 'https://onqdnjzhuehbyvhzihkm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucWRuanpodWVoYnl2aHppaGttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg5Nzg3MCwiZXhwIjoyMDY1NDczODcwfQ.TibN99CXoCml1Su8Tz_pF61EXX7jCNnlFJZ7sJ4oiQc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabase() {
    console.log('🔧 Fixing database for mock user...');
    
    try {
        // 1. Disable RLS (using raw SQL)
        console.log('📝 Disabling RLS...');
        await supabase.rpc('exec_sql', { 
            sql: 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;' 
        });
        await supabase.rpc('exec_sql', { 
            sql: 'ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;' 
        });
        await supabase.rpc('exec_sql', { 
            sql: 'ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;' 
        });
        
        // 2. Create mock user
        console.log('👤 Creating mock user...');
        const { error: userError } = await supabase
            .from('users')
            .upsert({
                id: '00000000-0000-0000-0000-000000000001',
                email: 'chirag@narraite.xyz',
                full_name: 'Chirag',
                preferences: {}
            });
        
        if (userError) {
            console.warn('User creation warning:', userError.message);
        } else {
            console.log('✅ Mock user created/updated');
        }
        
        // 3. Create sample project
        console.log('📁 Creating sample project...');
        const { error: projectError } = await supabase
            .from('projects')
            .upsert({
                user_id: '00000000-0000-0000-0000-000000000001',
                repo_url: 'https://github.com/Schreezer/Codex-home',
                repo_name: 'Codex-home',
                repo_owner: 'Schreezer',
                name: 'Sample Project',
                description: 'A sample project for testing the async-code platform'
            });
        
        if (projectError) {
            console.warn('Project creation warning:', projectError.message);
        } else {
            console.log('✅ Sample project created');
        }
        
        // 4. Test data access
        console.log('🧪 Testing data access...');
        const { data: projects, error: fetchError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', '00000000-0000-0000-0000-000000000001');
            
        if (fetchError) {
            console.error('❌ Data access test failed:', fetchError);
        } else {
            console.log('✅ Data access test passed:', projects.length, 'projects found');
        }
        
        console.log('🎉 Database fix completed!');
        
    } catch (error) {
        console.error('❌ Database fix failed:', error);
    }
}

// Alternative approach without RPC
async function fixDatabaseSimple() {
    console.log('🔧 Fixing database (simple approach)...');
    
    try {
        // Create mock user
        console.log('👤 Creating mock user...');
        const { error: userError } = await supabase
            .from('users')
            .upsert({
                id: '00000000-0000-0000-0000-000000000001',
                email: 'chirag@narraite.xyz',
                full_name: 'Chirag',
                preferences: {}
            });
        
        if (userError) {
            console.log('User operation:', userError.message);
        } else {
            console.log('✅ Mock user handled');
        }
        
        // Create sample project
        console.log('📁 Creating sample project...');
        const { error: projectError } = await supabase
            .from('projects')
            .upsert({
                user_id: '00000000-0000-0000-0000-000000000001',
                repo_url: 'https://github.com/Schreezer/Codex-home',
                repo_name: 'Codex-home',
                repo_owner: 'Schreezer',
                name: 'Sample Project',
                description: 'A sample project for testing the async-code platform'
            });
        
        if (projectError) {
            console.log('Project operation:', projectError.message);
        } else {
            console.log('✅ Sample project handled');
        }
        
        // Test query
        console.log('🧪 Testing query...');
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', '00000000-0000-0000-0000-000000000001');
            
        console.log('Query result:', { data: data?.length || 0, error: error?.message });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the simple fix
fixDatabaseSimple();