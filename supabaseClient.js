// Import the Supabase JS library
const { createClient } = require('@supabase/supabase-js');

// Define the Supabase URL and anon public key (replace with your actual values)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export the initialized client to be used elsewhere in the project
module.exports = supabase;
