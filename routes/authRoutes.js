const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password, userType, captchaToken } = req.body;

        // Proceed with Supabase authentication
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
                captchaToken
            }
        });

        if (authError) {
            console.error('Auth error:', authError);
            throw authError;
        }

        // Get user data
        const { data: userData, error: userError } = await supabase
            .from('Users Table')
            .select('*')
            .eq('email', email)
            .single();

        if (userError || !userData) {
            throw new Error('User not found');
        }

        // Log the values for debugging
        console.log('Requested user type:', userType);
        console.log('Stored user type:', userData.user_type);

        // Check if user type matches (case-insensitive)
        if (userData.user_type.toLowerCase() !== userType.toLowerCase()) {
            throw new Error(`Invalid user type. Expected ${userData.user_type}, got ${userType}`);
        }

        res.json({
            status: 'success',
            data: {
                user: userData,
                session: authData.session
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
