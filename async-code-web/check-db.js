const { createClient } = require('@supabase/supabase-js');

// Supabase configuration 
const supabaseUrl = 'https://onqdnjzhuehbyvhzihkm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucWRuanpodWVoYnl2aHppaGttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg5Nzg3MCwiZXhwIjoyMDY1NDczODcwfQ.TibN99CXoCml1Su8Tz_pF61EXX7jCNnlFJZ7sJ4oiQc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
    console.log('🔍 Checking database state...');
    
    try {
        // Check what tables exist
        const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
        console.log('Tables query result:', { tables, error: tablesError?.message });
        
        // Try to list tables using information_schema
        const { data: schema, error: schemaError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
            
        console.log('Schema query result:', { schema, error: schemaError?.message });
        
        // Try a simple auth check
        const { data: auth, error: authError } = await supabase.auth.getSession();
        console.log('Auth check:', { auth: !!auth, error: authError?.message });
        
        // Try direct table access
        console.log('Testing table access...');
        
        const tests = [
            { name: 'users', table: 'users' },
            { name: 'projects', table: 'projects' },  
            { name: 'tasks', table: 'tasks' }
        ];
        
        for (const test of tests) {
            const { data, error } = await supabase
                .from(test.table)
                .select('*')
                .limit(1);
                
            console.log(`${test.name}:`, { 
                exists: !error, 
                error: error?.message?.substring(0, 100),
                count: data?.length || 0 
            });
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    }
}

checkDatabase();