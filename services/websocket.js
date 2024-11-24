const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const initializeRealtime = (server) => {
    // Subscribe to order updates
    const orderSubscription = supabase
        .channel('orders')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'Orders Table' },
            (payload) => {
                // Handle order updates
                console.log('Order update:', payload);
                // Emit to connected clients
            }
        )
        .subscribe();

    // Subscribe to tracking updates
    const trackingSubscription = supabase
        .channel('tracking')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'Tracking Table' },
            (payload) => {
                // Handle new tracking updates
                console.log('New tracking data:', payload);
            }
        )
        .subscribe();

    return {
        orderSubscription,
        trackingSubscription
    };
};

module.exports = { initializeRealtime };
