const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/auth');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create new order
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const {
            pickupAddress,
            deliveryAddress,
            cargoType,
            cargoWeight,
            vehicle,
            routeData,
            totalCost
        } = req.body;

        // Create order record
        const { data: order, error: orderError } = await supabaseAdmin
            .from('Orders Table')
            .insert({
                farmer_id: req.user.id,
                pickup_address: pickupAddress,
                delivery_address: deliveryAddress,
                goods_type: cargoType,
                status: 'PENDING',
                total_cost: totalCost,
                route_data: routeData,
                order_date: new Date().toISOString(),
                delivery_date: null,
                assigned_driver_id: null
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Create initial tracking record
        const { error: trackingError } = await supabaseAdmin
            .from('Tracking Table')
            .insert({
                order_id: order.order_id,
                status: 'PENDING',
                location: pickupAddress,
                timestamp: new Date().toISOString()
            });

        if (trackingError) throw trackingError;

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get farmer's orders (for dashboard)
router.get('/farmer-orders', authMiddleware, async (req, res) => {
    try {
        // First fetch orders
        const { data: orders, error } = await supabaseAdmin
            .from('Orders Table')
            .select('*')
            .eq('farmer_id', req.user.id)
            .order('order_date', { ascending: false });

        if (error) throw error;

        // Then fetch tracking data separately
        const { data: tracking, error: trackingError } = await supabaseAdmin
            .from('Tracking Table')
            .select('*')
            .in('order_id', orders.map(order => order.order_id));

        if (trackingError) throw trackingError;

        // Combine the data
        const ordersWithTracking = orders.map(order => ({
            ...order,
            tracking: tracking.filter(t => t.order_id === order.order_id)
        }));

        res.json({
            success: true,
            orders: ordersWithTracking
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Delete order endpoint
router.delete('/delete/:orderId', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // First check if order exists and belongs to user
        const { data: order, error: orderError } = await supabaseAdmin
            .from('Orders Table')
            .select('*')
            .eq('order_id', orderId)
            .eq('farmer_id', userId)
            .single();

        if (orderError) throw orderError;
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Check if order is in PENDING status
        if (order.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: 'Only pending orders can be deleted'
            });
        }

        // First delete tracking records
        const { error: trackingDeleteError } = await supabaseAdmin
            .from('Tracking Table')
            .delete()
            .eq('order_id', orderId);

        if (trackingDeleteError) throw trackingDeleteError;

        // Then delete the order
        const { error: deleteError } = await supabaseAdmin
            .from('Orders Table')
            .delete()
            .eq('order_id', orderId)
            .eq('farmer_id', userId);

        if (deleteError) throw deleteError;

        res.json({
            success: true,
            message: 'Order deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get order tracking details
router.get('/:orderId/tracking', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // First fetch the order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('Orders Table')
            .select('*')
            .eq('order_id', orderId)
            .eq('farmer_id', userId)
            .single();

        if (orderError) throw orderError;
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Then fetch tracking data separately
        const { data: tracking, error: trackingError } = await supabaseAdmin
            .from('Tracking Table')
            .select('*')
            .eq('order_id', orderId)
            .order('timestamp', { ascending: true });

        if (trackingError) throw trackingError;

        // Combine the data
        const orderWithTracking = {
            ...order,
            tracking: tracking || []
        };

        res.json({
            success: true,
            order: orderWithTracking
        });

    } catch (error) {
        console.error('Error fetching order tracking:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
