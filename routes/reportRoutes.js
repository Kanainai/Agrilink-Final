const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate revenue report
router.get('/revenue', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Get all payments within date range
        const { data: payments, error: paymentError } = await supabaseAdmin
            .from('Payments Table')
            .select('amount, payment_date')
            .gte('payment_date', startDate)
            .lte('payment_date', endDate);

        if (paymentError) throw paymentError;

        // Calculate total revenue
        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

        // Get expenses
        const { data: expenses, error: expenseError } = await supabaseAdmin
            .from('Expenses Table')
            .select('amount, expense_date')
            .gte('expense_date', startDate)
            .lte('expense_date', endDate);

        if (expenseError) throw expenseError;

        // Calculate total expenses
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Create report record
        const { data: report, error: reportError } = await supabaseAdmin
            .from('Reports Table')
            .insert({
                report_type: 'REVENUE',
                generated_date: new Date().toISOString(),
                data: {
                    startDate,
                    endDate,
                    totalRevenue,
                    totalExpenses,
                    netProfit: totalRevenue - totalExpenses,
                    paymentCount: payments.length
                },
                status: 'COMPLETED'
            })
            .select()
            .single();

        if (reportError) throw reportError;

        res.json({
            success: true,
            report
        });

    } catch (error) {
        console.error('Revenue report error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Generate driver performance report
router.get('/driver-performance', async (req, res) => {
    try {
        const { data: drivers, error: driverError } = await supabaseAdmin
            .from('Driver Profiles')
            .select(`
                *,
                Orders Table (
                    order_id,
                    status,
                    delivery_date
                )
            `);

        if (driverError) throw driverError;

        const performanceData = drivers.map(driver => {
            const completedOrders = driver['Orders Table'].filter(order => 
                order.status === 'COMPLETED'
            ).length;

            const totalOrders = driver['Orders Table'].length;

            return {
                driverId: driver.driver_id,
                completedOrders,
                totalOrders,
                completionRate: totalOrders ? (completedOrders / totalOrders) * 100 : 0
            };
        });

        // Store report
        const { data: report, error: reportError } = await supabaseAdmin
            .from('Reports Table')
            .insert({
                report_type: 'DRIVER_PERFORMANCE',
                generated_date: new Date().toISOString(),
                data: performanceData,
                status: 'COMPLETED'
            })
            .select()
            .single();

        if (reportError) throw reportError;

        res.json({
            success: true,
            report
        });

    } catch (error) {
        console.error('Driver performance report error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
