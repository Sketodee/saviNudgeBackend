import { supabase } from "./supabase";

async function testSupabaseDbConn(): Promise<void> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables (SUPABASE_URL or SUPABASE_ANON_KEY)');
    }
    
    try {
        console.log('🔄 Testing Supabase connection...');
        // console.log(`📊 Supabase URL: ${supabaseUrl}`);

        // Simple health check using the REST endpoint
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'HEAD', // HEAD request is lighter than GET
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase connection failed with HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('✅ Successfully connected to Supabase!');
        // console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        // console.log('🎉 Supabase is ready to use!');
        
    } catch (error) {
        console.error('❌ Failed to connect to Supabase');
        
        if (error instanceof Error) {
            console.error('Error message:', error.message);
        } else {
            console.error('Error details:', JSON.stringify(error, null, 2));
        }
        
        throw error;
    }
}

export default testSupabaseDbConn;