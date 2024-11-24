require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test function to verify connection
async function testConnection() {
    const { data, error } = await supabase
        .from('Users Table')  // Replace with your actual table name
        .select('count')
        .limit(1);
    
    if (error) {
        console.error('Supabase connection error:', error);
        return false;
    }
    console.log('Supabase connection successful');
    return true;
}

module.exports = { supabase, testConnection };