const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/auth');

// Create Supabase client using config values
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://guyjxicqanfahzfdsvsx.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const { data: user, error } = await supabaseAdmin
            .from('Users Table')
            .select('name, email, role, user_type')
            .eq('user_id', req.user.id)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
