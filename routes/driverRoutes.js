const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/auth');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get driver's assigned orders with tracking
router.get('/assigned-orders', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching orders for driver:', req.user.id);

        // First fetch the driver's orders
        const { data: orders, error } = await supabaseAdmin
            .from('Orders Table')
            .select(`
                *,
                farmer:farmer_id (
                    name,
                    phone_number
                )
            `)
            .eq('assigned_driver_id', req.user.id)
            .order('order_date', { ascending: false });

        if (error) throw error;

        console.log('Orders with route data:', orders);

        if (!orders || orders.length === 0) {
            return res.json({
                success: true,
                orders: [],
                message: 'No orders assigned yet',
                vehicle: null
            });
        }

        // Then fetch tracking data separately
        const { data: tracking, error: trackingError } = await supabaseAdmin
            .from('Tracking Table')
            .select('*')
            .in('order_id', orders.map(order => order.order_id));

        if (trackingError) throw trackingError;

        // Get driver's vehicle information
        const { data: vehicle, error: vehicleError } = await supabaseAdmin
            .from('Vehicles Table')
            .select('*')
            .eq('driver_id', req.user.id)
            .single();

        if (vehicleError && vehicleError.code !== 'PGRST116') {
            throw vehicleError;
        }

        // Combine orders with their tracking data
        const ordersWithTracking = orders.map(order => ({
            ...order,
            tracking: tracking?.filter(t => t.order_id === order.order_id) || []
        }));

        res.json({
            success: true,
            orders: ordersWithTracking,
            vehicle: vehicle || null
        });

    } catch (error) {
        console.error('Error fetching driver orders:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Update order status and tracking
router.post('/update-order/:orderId', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, location, latitude, longitude } = req.body;

        // Update order status
        const { error: orderError } = await supabaseAdmin
            .from('Orders Table')
            .update({ status })
            .eq('order_id', orderId)
            .eq('assigned_driver_id', req.user.id);

        if (orderError) throw orderError;

        // Add tracking entry
        const { error: trackingError } = await supabaseAdmin
            .from('Tracking Table')
            .insert({
                order_id: orderId,
                location,
                status,
                latitude,
                longitude,
                timestamp: new Date().toISOString()
            });

        if (trackingError) throw trackingError;

        res.json({
            success: true,
            message: 'Order updated successfully'
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get driver's active order
router.get('/active-order', authMiddleware, async (req, res) => {
    try {
        const { data: order, error } = await supabaseAdmin
            .from('Orders Table')
            .select('*')
            .eq('assigned_driver_id', req.user.id)
            .eq('status', 'IN_TRANSIT')
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            success: true,
            activeOrder: order || null
        });
    } catch (error) {
        console.error('Error fetching active order:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
