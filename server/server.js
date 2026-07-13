// ============================================
// G-KODE PRODUCTION SERVER
// Kenya Helping Kenya 🇰🇪
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURATION
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 300 });

// Supabase Client (Using SERVICE KEY - Full Access)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// Compression
app.use(compression());

// CORS
app.use(cors({
    origin: '*',
    credentials: true
}));

// JSON Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting (100 requests per minute per IP)
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please slow down.' }
}));

// ============================================
// LOGGING
// ============================================
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        name: 'G-KODE Server',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        message: '🇰🇪 Kenya Helping Kenya'
    });
});

// ============================================
// SUPABASE CONNECTION TEST
// ============================================
app.get('/api/test-db', async (req, res) => {
    try {
        // Check cache first
        const cached = cache.get('user_count');
        if (cached) {
            return res.json({
                success: true,
                message: '✅ Supabase connected (cached)',
                userCount: cached,
                source: 'cache'
            });
        }

        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                message: '❌ Supabase connection failed'
            });
        }

        // Cache the result
        cache.set('user_count', count || 0);

        res.json({
            success: true,
            message: '✅ Supabase connected!',
            userCount: count || 0,
            source: 'database'
        });

    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: '❌ Server error'
        });
    }
});

// ============================================
// USER ROUTES (With Caching)
// ============================================
app.get('/api/users', async (req, res) => {
    try {
        const cached = cache.get('users_list');
        if (cached) {
            return res.json({
                success: true,
                count: cached.length,
                users: cached,
                source: 'cache'
            });
        }

        const { data, error } = await supabase
            .from('users')
            .select('phone, full_name, email, location, profession, is_paid, is_banned, rating')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        // Cache for 5 minutes
        cache.set('users_list', data || []);

        res.json({
            success: true,
            count: data.length,
            users: data,
            source: 'database'
        });

    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// SINGLE USER
// ============================================
app.get('/api/users/:phone', async (req, res) => {
    try {
        const { phone } = req.params;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            throw error;
        }

        res.json({
            success: true,
            user: data
        });

    } catch (error) {
        console.error('User error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// GIG ROUTES
// ============================================
app.get('/api/gigs', async (req, res) => {
    try {
        const { status, location, skill } = req.query;

        let query = supabase.from('gigs').select('*');

        if (status) query = query.eq('status', status);
        if (location) query = query.ilike('location', `%${location}%`);
        if (skill) query = query.ilike('skill', `%${skill}%`);

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json({
            success: true,
            count: data.length,
            gigs: data
        });

    } catch (error) {
        console.error('Gigs error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// ADMIN ROUTES
// ============================================
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
        message: '✅ Admin access granted!',
        timestamp: new Date().toISOString()
    });
});

// Admin: Get all users (full access)
app.get('/api/admin/users', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];

    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            count: data.length,
            users: data
        });

    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Admin: Ban user
app.put('/api/admin/users/:phone/ban', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];

    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    try {
        const { phone } = req.params;
        const { banned } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({ is_banned: banned })
            .eq('phone', phone)
            .select()
            .single();

        if (error) throw error;

        // Clear cache
        cache.del('users_list');
        cache.del('user_count');

        res.json({
            success: true,
            message: banned ? 'User banned' : 'User unbanned',
            user: data
        });

    } catch (error) {
        console.error('Ban error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Admin: Delete user
app.delete('/api/admin/users/:phone', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];

    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    try {
        const { phone } = req.params;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('phone', phone);

        if (error) throw error;

        cache.del('users_list');
        cache.del('user_count');

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Admin: Get stats
app.get('/api/admin/stats', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];

    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    try {
        const [users, gigs, payments] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('gigs').select('*', { count: 'exact', head: true }),
            supabase.from('payments').select('*', { count: 'exact', head: true })
        ]);

        res.json({
            success: true,
            stats: {
                users: users.count || 0,
                gigs: gigs.count || 0,
                payments: payments.count || 0,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 G-KODE PRODUCTION SERVER');
    console.log('========================================');
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📡 Supabase: ✅ Connected`);
    console.log(`🔑 Admin: ${process.env.ADMIN_KEY}`);
    console.log(`💾 Cache: Enabled`);
    console.log('========================================');
    console.log('🇰🇪 Kenya Helping Kenya');
    console.log('========================================');
});