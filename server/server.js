// ============================================
// G-KODE SERVER v1.0
// Kenya Helping Kenya 🇰🇪
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// TEST ROUTES
// ============================================

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: '🇰🇪 G-KODE Server is working!',
        timestamp: new Date().toISOString()
    });
});

// Test Supabase connection
app.get('/api/test-db', async (req, res) => {
    try {
        const { data, error, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        res.json({
            success: true,
            message: '✅ Supabase connection successful!',
            userCount: count || 0
        });
    } catch (error) {
        console.error('DB test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: '❌ Supabase connection failed. Check your credentials.'
        });
    }
});

// Get users from Supabase
app.get('/api/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, phone, full_name, email, location, profession, is_paid, is_banned')
            .limit(10);

        if (error) throw error;

        res.json({
            success: true,
            count: data.length,
            users: data
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Admin test
app.get('/api/admin/test', (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - Invalid admin key'
        });
    }

    res.json({
        success: true,
        message: '✅ Admin access granted!',
        adminKey: adminKey
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 G-KODE SERVER');
    console.log('========================================');
    console.log(`📍 Running on http://localhost:${PORT}`);
    console.log(`📡 Supabase: ${process.env.SUPABASE_URL ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`🔑 Admin Key: ${process.env.ADMIN_KEY || 'MAYA'}`);
    console.log('========================================');
    console.log('\n📋 Test these URLs:');
    console.log(`  GET  http://localhost:${PORT}/`);
    console.log(`  GET  http://localhost:${PORT}/api/test-db`);
    console.log(`  GET  http://localhost:${PORT}/api/users`);
    console.log(`  GET  http://localhost:${PORT}/api/admin/test (with header)`);
    console.log('========================================');
});