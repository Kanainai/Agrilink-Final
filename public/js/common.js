// Utility functions
const showAlert = (message, type = 'info') => {
    alert(message); // You can replace this with a better UI notification system
};

// API endpoints handler
const api = {
    async createOrder(formData) {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        return await response.json();
    },

    async processPayment(formData) {
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        return await response.json();
    },

    async getOrder(orderId) {
        const response = await fetch(`/api/orders/${orderId}`);
        return await response.json();
    },

    async updateOrder(orderId, formData) {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        return await response.json();
    }
};

// Form Handlers
const createOrderForm = document.getElementById("createOrderForm");
if (createOrderForm) {
    createOrderForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        if (!createOrderForm.checkValidity()) {
            event.stopPropagation();
            createOrderForm.classList.add('was-validated');
            return;
        }

        const formData = {
            goodsType: document.getElementById("goodsType").value,
            pickupAddress: document.getElementById("pickupAddress").value,
            deliveryAddress: document.getElementById("deliveryAddress").value,
            cost: document.getElementById("cost").value,
            vehicleType: document.getElementById("vehicleType").value,
            status: 'PENDING'
        };

        try {
            const result = await api.createOrder(formData);
            if (result.order) {
                showAlert("Order created successfully!");
                createOrderForm.reset();
                document.getElementById("orderId").value = result.order.id;
            } else {
                showAlert("Error: " + result.error);
            }
        } catch (error) {
            showAlert("Error creating order: " + error.message);
        }
    });
}

const paymentForm = document.getElementById("paymentForm");
if (paymentForm) {
    paymentForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        if (!paymentForm.checkValidity()) {
            event.stopPropagation();
            paymentForm.classList.add('was-validated');
            return;
        }

        const formData = {
            orderId: document.getElementById("orderId").value,
            amount: document.getElementById("amount").value,
            paymentMethod: document.getElementById("paymentMethod").value
        };

        try {
            const result = await api.processPayment(formData);
            if (result.payment) {
                showAlert("Payment processed successfully!");
                paymentForm.reset();
            } else {
                showAlert("Error: " + result.error);
            }
        } catch (error) {
            showAlert("Error processing payment: " + error.message);
        }
    });
}

const trackingForm = document.getElementById("trackingForm");
if (trackingForm) {
    trackingForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const orderId = document.getElementById("orderId").value;

        try {
            const result = await api.getOrder(orderId);
            if (result.order) {
                const trackingInfo = document.querySelector('.tracking-info');
                trackingInfo.innerHTML = `
                    <h3>Order Details</h3>
                    <p>Goods Type: ${result.order.goods_type}</p>
                    <p>Pickup: ${result.order.pickup_address}</p>
                    <p>Delivery: ${result.order.delivery_address}</p>
                    <p>Cost: $${result.order.cost}</p>
                    <p>Vehicle: ${result.order.vehicle_type}</p>
                    <p>Status: ${result.order.status}</p>
                `;
            } else {
                showAlert("Error: " + result.error);
            }
        } catch (error) {
            showAlert("Error tracking order: " + error.message);
        }
    });
}

const updateOrderForm = document.getElementById("updateOrderForm");
if (updateOrderForm) {
    updateOrderForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        if (!updateOrderForm.checkValidity()) {
            event.stopPropagation();
            updateOrderForm.classList.add('was-validated');
            return;
        }

        const orderId = document.getElementById("orderId").value;
        const formData = {
            goodsType: document.getElementById("goodsType").value,
            pickupAddress: document.getElementById("pickupAddress").value,
            deliveryAddress: document.getElementById("deliveryAddress").value,
            cost: document.getElementById("cost").value,
            vehicleType: document.getElementById("vehicleType").value,
            status: document.getElementById("status").value
        };

        try {
            const result = await api.updateOrder(orderId, formData);
            if (result.order) {
                showAlert("Order updated successfully!");
                window.location.reload();
            } else {
                showAlert("Error: " + result.error);
            }
        } catch (error) {
            showAlert("Error updating order: " + error.message);
        }
    });
}

async function populateUpdateForm(orderId) {
    try {
        const result = await api.getOrder(orderId);
        if (result.order) {
            document.getElementById("orderId").value = orderId;
            document.getElementById("goodsType").value = result.order.goods_type;
            document.getElementById("pickupAddress").value = result.order.pickup_address;
            document.getElementById("deliveryAddress").value = result.order.delivery_address;
            document.getElementById("cost").value = result.order.cost;
            document.getElementById("vehicleType").value = result.order.vehicle_type;
            document.getElementById("status").value = result.order.status;
            
            const updateModal = new bootstrap.Modal(document.getElementById('editOrderModal'));
            updateModal.show();
        } else {
            showAlert("Error: " + result.error);
        }
    } catch (error) {
        showAlert("Error fetching order details: " + error.message);
    }
}

function editOrder(orderId) {
    populateUpdateForm(orderId);
}

// Form validation initialization
(function () {
    'use strict'
    const forms = document.querySelectorAll('.needs-validation')
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }
            form.classList.add('was-validated')
        }, false)
    })
})()