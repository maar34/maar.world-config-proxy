// supabaseAdminClient.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY, 
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);

module.exports = supabaseAdmin;
