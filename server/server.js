// ============================================
// G-KODE SERVER v1.0
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Use ANON KEY for now (it works with RLS policies)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

console.log('========================================');
console.log('🚀 G-KODE SERVER');
console.log('========================================');
console.log('📡 Supabase URL:', process.env.SUPABASE_URL);
console.log('🔑 Using ANON KEY (first 10 chars):', process.env.SUPABASE_ANON_KEY.substring(0, 10) + '...');
console.log('========================================');

app.use(cors());
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: '🇰🇪 G-KODE Server is working!',
        timestamp: new Date().toISOString()
    });
});

// Test Supabase Connection
app.get('/api/test-db', async (req, res) => {
    try {
        console.log('Testing Supabase connection...');
        
        const { data, error, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                message: '❌ Supabase connection failed.'
            });
        }

        console.log('✅ Supabase connected! User count:', count);
        res.json({
            success: true,
            message: '✅ Supabase connection successful!',
            userCount: count || 0
        });
    } catch (error) {
        console.error('Test DB error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: '❌ Supabase connection failed.'
        });
    }
});

// Get users
app.get('/api/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('phone, full_name, email, location, profession')
            .limit(10);

        if (error) throw error;

        res.json({
            success: true,
            count: data.length,
            users: data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin test
app.get('/api/admin/test', (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    res.json({
        success: true,
        message: '✅ Admin access granted!'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('========================================');
    console.log(`📍 Running on http://localhost:${PORT}`);
    console.log(`🔑 Admin Key: ${process.env.ADMIN_KEY || 'MAYA'}`);
    console.log('========================================');
    console.log('\n📋 Test these URLs:');
    console.log(`  GET  http://localhost:${PORT}/`);
    console.log(`  GET  http://localhost:${PORT}/api/test-db`);
    console.log(`  GET  http://localhost:${PORT}/api/users`);
    console.log(`  GET  http://localhost:${PORT}/api/admin/test (with header)`);
    console.log('========================================');
});