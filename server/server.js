const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = 3000;

// YOUR SERVICE ROLE KEY - Full Access
const supabase = createClient(
    'https://rqvijxpbdrholshzhusb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdmlqeHBiZHJob2xzaHpodXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU3NjE4NSwiZXhwIjoyMDk4MTUyMTg1fQ.Ypd8iKnvD3By_75yEE1VRSVnJw7SGK6_IqLugRu2nCA'
);

app.get('/', (req, res) => {
    res.json({ 
        message: '🇰🇪 G-KODE Server is running!',
        time: new Date().toISOString()
    });
});

app.get('/api/test-db', async (req, res) => {
    try {
        console.log('🔍 Testing Supabase connection...');
        
        const { data, error, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log('❌ Error:', error.message);
            return res.json({
                success: false,
                error: error.message,
                hint: 'Check if "users" table exists'
            });
        }

        console.log('✅ Connected! Users:', count || 0);
        res.json({
            success: true,
            message: '✅ Supabase connected!',
            userCount: count || 0
        });
    } catch (err) {
        console.log('❌ Catch Error:', err.message);
        res.json({
            success: false,
            error: err.message
        });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('phone, full_name, email')
            .limit(5);

        if (error) throw error;

        res.json({
            success: true,
            count: data?.length || 0,
            users: data || []
        });
    } catch (err) {
        res.json({
            success: false,
            error: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 G-KODE SERVER');
    console.log('========================================');
    console.log(`📍 http://localhost:${PORT}`);
    console.log('🔑 Using SERVICE ROLE KEY');
    console.log('========================================');
    console.log('');
    console.log('Test these URLs:');
    console.log(`  http://localhost:${PORT}/`);
    console.log(`  http://localhost:${PORT}/api/test-db`);
    console.log(`  http://localhost:${PORT}/api/users`);
    console.log('');
});