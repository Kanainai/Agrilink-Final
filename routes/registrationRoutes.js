const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Create two Supabase clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Service role client for bypassing RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Group Farmer Registration
router.post('/register/group-farmer', async (req, res) => {
    try {
        const {
            email,
            password,
            groupName,
            representativeName,
            phone,
            address,
            city,
            region,
            memberCount,
            farmSize,
            cropTypes,
            captchaToken
        } = req.body;

        console.log('Starting group farmer registration for:', email);

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                captchaToken,
                data: {
                    role: 'FARMER',
                    user_type: 'GROUP'
                }
            }
        });

        if (authError) {
            console.error('Auth error:', authError);
            throw authError;
        }

        // 2. Create user record
        const { data: userData, error: userError } = await supabaseAdmin
            .from('Users Table')
            .insert({
                user_id: authData.user.id,
                name: groupName,
                email: email,
                phone_number: phone,
                address: address,
                role: 'FARMER',
                user_type: 'GROUP',
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (userError) {
            console.error('User creation error:', userError);
            throw userError;
        }

        // 3. Create farmer profile
        const { error: profileError } = await supabaseAdmin
            .from('Farmer Profiles')
            .insert({
                farmer_id: authData.user.id,
                city: city,
                region: region,
                farm_size: farmSize,
                crop_types: cropTypes,
                member_count: memberCount,
                representative_name: representativeName,
                farmer_type: 'GROUP',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            throw profileError;
        }

        res.json({
            status: 'success',
            message: 'Registration successful'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

// Driver Registration
router.post('/register/driver', async (req, res) => {
    try {
        const {
            email,
            password,
            fullName,
            phone,
            address,
            city,
            region,
            licenseNumber,
            licenseExpiry,
            licenseType,
            plateNumber,
            vehicleType,
            vehicleCapacity,
            captchaToken
        } = req.body;

        console.log('Starting driver registration for:', email);

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                captchaToken,
                data: {
                    role: 'EMPLOYEE',
                    user_type: 'DRIVER'
                }
            }
        });

        if (authError) {
            console.error('Auth error:', authError);
            throw authError;
        }

        // 2. Create user record
        const { data: userData, error: userError } = await supabaseAdmin
            .from('Users Table')
            .insert({
                user_id: authData.user.id,
                name: fullName,
                email: email,
                phone_number: phone,
                address: address,
                role: 'EMPLOYEE',
                user_type: 'DRIVER',
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (userError) {
            console.error('User creation error:', userError);
            throw userError;
        }

        // 3. Create employee record
        const { error: employeeError } = await supabaseAdmin
            .from('Employee Table')
            .insert({
                user_id: authData.user.id,
                role: 'DRIVER',
                status: 'ACTIVE',
                hire_date: new Date().toISOString(),
                performance_rating: 0.0, // Default rating
                salary: 0.0 // Default salary, can be updated later
            });

        if (employeeError) {
            console.error('Employee creation error:', employeeError);
            throw employeeError;
        }

        // 4. Create driver profile
        const { error: profileError } = await supabaseAdmin
            .from('Driver Profiles')
            .insert({
                driver_id: authData.user.id,
                city: city,
                region: region,
                license_number: licenseNumber,
                license_expiry: licenseExpiry,
                license_type: licenseType,
                plate_number: plateNumber,
                vehicle_type: vehicleType,
                vehicle_capacity: vehicleCapacity,
                status: 'PENDING',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            throw profileError;
        }

        // 5. Create vehicle record
        const { error: vehicleError } = await supabaseAdmin
            .from('Vehicles Table')
            .insert({
                driver_id: authData.user.id,
                vehicle_type: vehicleType,
                vehicle_capacity: vehicleCapacity,
                vehicle_registration_number: plateNumber,
                status: 'ACTIVE'
            });

        if (vehicleError) {
            console.error('Vehicle creation error:', vehicleError);
            throw vehicleError;
        }

        res.json({
            status: 'success',
            message: 'Registration successful'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

// Admin Registration
router.post('/register/admin', async (req, res) => {
    try {
        const {
            email,
            password,
            fullName,
            phone,
            address,
            captchaToken
        } = req.body;

        console.log('Starting admin registration for:', email);

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                captchaToken,
                data: {
                    role: 'EMPLOYEE',
                    user_type: 'ADMIN'
                }
            }
        });

        if (authError) {
            console.error('Auth error:', authError);
            throw authError;
        }

        // 2. Create user record
        const { data: userData, error: userError } = await supabaseAdmin
            .from('Users Table')
            .insert({
                user_id: authData.user.id,
                name: fullName,
                email: email,
                phone_number: phone,
                address: address,
                role: 'EMPLOYEE',
                user_type: 'ADMIN',
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (userError) {
            console.error('User creation error:', userError);
            throw userError;
        }

        // 3. Create employee record
        const { error: employeeError } = await supabaseAdmin
            .from('Employee Table')
            .insert({
                user_id: authData.user.id,
                role: 'ADMIN',
                status: 'ACTIVE',
                hire_date: new Date().toISOString(),
                performance_rating: 0.0, // Default rating
                salary: 0.0 // Default salary, can be updated later
            });

        if (employeeError) {
            console.error('Employee creation error:', employeeError);
            throw employeeError;
        }

        res.json({
            status: 'success',
            message: 'Registration successful'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

// Individual Farmer Registration
router.post('/register/individual-farmer', async (req, res) => {
    console.log('Received registration request:', req.body);
    try {
        const {
            email,
            password,
            fullName,
            phone,
            address,
            city,
            region,
            farmSize,
            cropTypes,
            captchaToken
        } = req.body;

        console.log('Starting individual farmer registration for:', email);

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                captchaToken,
                data: {
                    role: 'FARMER',
                    user_type: 'INDIVIDUAL'
                }
            }
        });

        if (authError) {
            console.error('Auth error:', authError);
            throw authError;
        }

        // 2. Create user record
        const { data: userData, error: userError } = await supabaseAdmin
            .from('Users Table')
            .insert({
                user_id: authData.user.id,
                name: fullName,
                email: email,
                phone_number: phone,
                address: address,
                role: 'FARMER',
                user_type: 'INDIVIDUAL',
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (userError) {
            console.error('User creation error:', userError);
            throw userError;
        }

        // 3. Create farmer profile
        const { error: profileError } = await supabaseAdmin
            .from('Farmer Profiles')
            .insert({
                farmer_id: authData.user.id,
                city: city,
                region: region,
                farm_size: farmSize,
                crop_types: cropTypes,
                farmer_type: 'INDIVIDUAL',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            throw profileError;
        }

        res.json({
            status: 'success',
            message: 'Registration successful'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
