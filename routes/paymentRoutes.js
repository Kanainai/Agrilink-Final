const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Process payment for an order
router.post('/process', async (req, res) => {
    try {
        const { orderId, amount, paymentMethod } = req.body;

        // Verify order exists and belongs to user
        const { data: order, error: orderError } = await supabaseAdmin
            .from('Orders Table')
            .select('*')
            .eq('order_id', orderId)
            .eq('farmer_id', req.user.id)
            .single();

        if (orderError) throw orderError;
        if (!order) throw new Error('Order not found');

        // Create payment record
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('Payments Table')
            .insert({
                order_id: orderId,
                payment_date: new Date().toISOString(),
                payment_method: paymentMethod,
                amount: amount,
                status: 'PROCESSING',
                transaction_id: `TXN-${Date.now()}`
            })
            .select()
            .single();

        if (paymentError) throw paymentError;

        // Calculate and record tax
        const taxRate = 0.16; // 16% VAT
        const { error: taxError } = await supabaseAdmin
            .from('Tax Table')
            .insert({
                description: `VAT for payment ${payment.payment_id}`,
                rate: taxRate,
                applicable_date: new Date().toISOString(),
                transaction_id: payment.payment_id,
                tax_amount: amount * taxRate
            });

        if (taxError) throw taxError;

        // Update invoice status
        const { error: invoiceError } = await supabaseAdmin
            .from('Invoices Table')
            .update({
                paid_amount: amount,
                status: amount >= order.total_cost ? 'PAID' : 'PARTIALLY_PAID'
            })
            .eq('order_id', orderId);

        if (invoiceError) throw invoiceError;

        res.json({
            success: true,
            payment,
            message: 'Payment processed successfully'
        });

    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get payment history for a user
router.get('/history', async (req, res) => {
    try {
        const { data: payments, error } = await supabaseAdmin
            .from('Payments Table')
            .select(`
                *,
                Orders Table (
                    order_id,
                    pickup_address,
                    delivery_address,
                    total_cost
                )
            `)
            .order('payment_date', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            payments
        });

    } catch (error) {
        console.error('Payment history error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
