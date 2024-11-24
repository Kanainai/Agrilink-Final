const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/auth');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get unassigned orders
router.get('/unassigned-orders', authMiddleware, async (req, res) => {
    try {
        // Verify admin status
        const { data: user, error: userError } = await supabaseAdmin
            .from('Users Table')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (userError) throw userError;
        if (user.role !== 'EMPLOYEE' || user.user_type !== 'ADMIN') {
            throw new Error('Unauthorized access');
        }

        // Fetch unassigned orders with farmer details
        const { data: orders, error } = await supabaseAdmin
            .from('Orders Table')
            .select(`
                *,
                farmer:farmer_id (
                    name,
                    phone_number
                )
            `)
            .is('assigned_driver_id', null)
            .eq('status', 'PENDING')
            .order('order_date', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            orders: orders || []
        });

    } catch (error) {
        console.error('Error fetching unassigned orders:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get available drivers
router.get('/available-drivers', authMiddleware, async (req, res) => {
    try {
        // Verify admin status
        const { data: adminUser, error: adminError } = await supabaseAdmin
            .from('Users Table')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (adminError) throw adminError;
        if (adminUser.role !== 'EMPLOYEE' || adminUser.user_type !== 'ADMIN') {
            throw new Error('Unauthorized access');
        }

        // First get all active drivers from Users Table
        const { data: drivers, error: driversError } = await supabaseAdmin
            .from('Users Table')
            .select(`
                user_id,
                name,
                phone_number,
                email
            `)
            .eq('role', 'EMPLOYEE')
            .eq('user_type', 'DRIVER')
            .eq('status', 'ACTIVE');

        if (driversError) throw driversError;

        // Then get their profiles
        const driverIds = drivers.map(d => d.user_id);
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('Driver Profiles')
            .select('*')
            .in('driver_id', driverIds)
            .eq('status', 'ACTIVE');

        if (profilesError) throw profilesError;

        // Combine driver info with profiles
        const driversWithProfiles = drivers.map(driver => {
            const profile = profiles.find(p => p.driver_id === driver.user_id);
            return {
                ...driver,
                driver_profile: profile || null
            };
        });

        // Get order counts for each driver
        const driversWithCounts = await Promise.all(
            driversWithProfiles.map(async (driver) => {
                const { count, error: countError } = await supabaseAdmin
                    .from('Orders Table')
                    .select('*', { count: 'exact' })
                    .eq('assigned_driver_id', driver.user_id)
                    .in('status', ['ASSIGNED', 'IN_TRANSIT']);

                if (countError) throw countError;

                return {
                    ...driver,
                    current_orders: { count: count || 0 }
                };
            })
        );

        res.json({
            success: true,
            drivers: driversWithCounts
        });

    } catch (error) {
        console.error('Error fetching available drivers:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Assign driver to order
router.post('/assign-driver', authMiddleware, async (req, res) => {
    try {
        const { orderId, driverId } = req.body;

        // Verify admin status
        const { data: user, error: userError } = await supabaseAdmin
            .from('Users Table')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (userError) throw userError;
        if (user.role !== 'EMPLOYEE' || user.user_type !== 'ADMIN') {
            throw new Error('Unauthorized access');
        }

        // Update order with assigned driver
        const { error: updateError } = await supabaseAdmin
            .from('Orders Table')
            .update({
                assigned_driver_id: driverId,
                status: 'ASSIGNED'
            })
            .eq('order_id', orderId)
            .is('assigned_driver_id', null);

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: 'Driver assigned successfully'
        });

    } catch (error) {
        console.error('Error assigning driver:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 