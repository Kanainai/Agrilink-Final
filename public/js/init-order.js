// Initialize Supabase client
const supabase = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_ANON_KEY
);

// Initialize Order System
document.addEventListener('DOMContentLoaded', () => {
    let isSubmitting = false;

    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loadingIndicator';
    loadingIndicator.className = 'loading-indicator d-none';
    loadingIndicator.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;
    document.body.appendChild(loadingIndicator);

    window.showLoading = () => {
        document.getElementById('loadingIndicator').classList.remove('d-none');
    };

    window.hideLoading = () => {
        document.getElementById('loadingIndicator').classList.add('d-none');
    };

    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (isSubmitting) return;
            
            try {
                isSubmitting = true;
                const submitButton = orderForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                }
                
                await OrderSystem.submitOrder();
                
            } catch (error) {
                console.error('Error submitting order:', error);
            } finally {
                isSubmitting = false;
                const submitButton = orderForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        });
    }
});
