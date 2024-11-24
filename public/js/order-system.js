// Order System Module
const OrderSystem = {
    // Kenya Map Bounds
    KENYA_BOUNDS: {
        north: 4.62,
        south: -4.67,
        west: 33.91,
        east: 41.91
    },

    // Mapbox Token
    mapboxToken: 'pk.eyJ1Ijoicm9zZWthbmluaSIsImEiOiJjbTNxYm5oemMwbjg0MmtzYTNmemlkNXMyIn0.GzozxUJVvYpNb33cxrCuog',

    // Vehicle types with their specifications
    VEHICLE_TYPES: {
        pickup: {
            name: 'Pickup Truck',
            capacity: 1, // 1 ton
            baseRate: 200  // Rate per km
        },
        van: {
            name: 'Delivery Van',
            capacity: 2, // 2 tons
            baseRate: 300  // Rate per km
        },
        light: {
            name: 'Light Truck',
            capacity: 5, // 5 tons
            baseRate: 350  // Rate per km
        },
        heavy: {
            name: 'Heavy Truck',
            capacity: 10, // 10 tons
            baseRate: 500  // Rate per km
        }
    },

    // Current form state
    currentStep: 1,
    totalSteps: 5,
    formData: {
        pickup: null,
        delivery: null,
        pickupAddress: null,
        deliveryAddress: null,
        cargoType: null,
        cargoWeight: null,
        specialInstructions: null,
        vehicle: null,
        price: 0,
        paymentMethod: null,
        paymentDetails: null
    },

    // Initialize the order system
    init() {
        try {
            // Set total steps
            this.totalSteps = 5;
            this.currentStep = 1;
            
            // Set Mapbox access token
            mapboxgl.accessToken = this.mapboxToken;
            
            // Initialize maps and components
            this.initMaps();
            this.initGeocoder();
            this.setupEventListeners();
            
            // Initialize form data
            this.formData = {
                pickup: null,
                delivery: null,
                cargoType: null,
                cargoWeight: null,
                vehicle: null,
                paymentMethod: null,
                paymentDetails: null
            };
            
            this.showStep(1); // Start at step 1
            
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing order system:', error);
            // Show error message to user
            const container = document.querySelector('.container');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">Error Loading Maps</h4>
                        <p>We encountered an error while loading the mapping system. Please try refreshing the page or contact support if the issue persists.</p>
                    </div>
                `;
            }
        }
    },

    // Initialize Mapbox with Kenya bounds
    initMaps() {
        try {
            // Initialize pickup map
            this.pickupMap = new mapboxgl.Map({
                container: 'pickupMap',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [37.9062, 0.0236], // Kenya center
                zoom: 5.5,
                maxBounds: [
                    [this.KENYA_BOUNDS.west, this.KENYA_BOUNDS.south],
                    [this.KENYA_BOUNDS.east, this.KENYA_BOUNDS.north]
                ]
            });

            // Initialize delivery map
            this.deliveryMap = new mapboxgl.Map({
                container: 'deliveryMap',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [37.9062, 0.0236], // Kenya center
                zoom: 5.5,
                maxBounds: [
                    [this.KENYA_BOUNDS.west, this.KENYA_BOUNDS.south],
                    [this.KENYA_BOUNDS.east, this.KENYA_BOUNDS.north]
                ]
            });

            // Initialize markers
            this.pickupMarker = new mapboxgl.Marker({ color: '#3887be' });
            this.deliveryMarker = new mapboxgl.Marker({ color: '#f30' });

            // Wait for maps to load before adding layers
            this.pickupMap.on('load', () => {
                this.pickupMap.addSource('pickup-route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: []
                        }
                    }
                });

                this.pickupMap.addLayer({
                    id: 'pickup-route',
                    type: 'line',
                    source: 'pickup-route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#3887be',
                        'line-width': 5,
                        'line-opacity': 0.75
                    }
                });
            });

            this.deliveryMap.on('load', () => {
                this.deliveryMap.addSource('delivery-route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: []
                        }
                    }
                });

                this.deliveryMap.addLayer({
                    id: 'delivery-route',
                    type: 'line',
                    source: 'delivery-route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#3887be',
                        'line-width': 5,
                        'line-opacity': 0.75
                    }
                });
            });

        } catch (error) {
            console.error('Error initializing maps:', error);
            throw error;
        }
    },

    // Initialize Mapbox Geocoder
    initGeocoder() {
        try {
            // Create geocoder instances
            const pickupGeocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl: mapboxgl,
                countries: 'ke',
                bbox: [
                    this.KENYA_BOUNDS.west,
                    this.KENYA_BOUNDS.south,
                    this.KENYA_BOUNDS.east,
                    this.KENYA_BOUNDS.north
                ],
                placeholder: 'Search for pickup location',
                marker: false
            });

            const deliveryGeocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl: mapboxgl,
                countries: 'ke',
                bbox: [
                    this.KENYA_BOUNDS.west,
                    this.KENYA_BOUNDS.south,
                    this.KENYA_BOUNDS.east,
                    this.KENYA_BOUNDS.north
                ],
                placeholder: 'Search for delivery location',
                marker: false
            });

            // Add geocoder to pickup location div
            const pickupGeocoderContainer = document.getElementById('pickupGeocoder');
            if (pickupGeocoderContainer) {
                pickupGeocoderContainer.innerHTML = ''; // Clear any existing content
                pickupGeocoderContainer.appendChild(pickupGeocoder.onAdd(this.pickupMap));
            } else {
                throw new Error('Pickup geocoder container not found');
            }

            // Add geocoder to delivery location div
            const deliveryGeocoderContainer = document.getElementById('deliveryGeocoder');
            if (deliveryGeocoderContainer) {
                deliveryGeocoderContainer.innerHTML = ''; // Clear any existing content
                deliveryGeocoderContainer.appendChild(deliveryGeocoder.onAdd(this.deliveryMap));
            } else {
                throw new Error('Delivery geocoder container not found');
            }

            // Add event listener for pickup location selection
            pickupGeocoder.on('result', (e) => {
                const lngLat = e.result.center;
                this.setPickupLocation({
                    lng: lngLat[0],
                    lat: lngLat[1]
                });
                
                // Update pickup info
                const pickupInfo = document.getElementById('pickupInfo');
                if (pickupInfo) {
                    pickupInfo.classList.remove('d-none');
                    pickupInfo.querySelector('.card-body').innerHTML = `
                        <h6>Pickup Address</h6>
                        <p class="mb-0">${e.result.place_name}</p>
                    `;
                }
            });

            // Add event listener for delivery location selection
            deliveryGeocoder.on('result', (e) => {
                const lngLat = e.result.center;
                this.setDeliveryLocation({
                    lng: lngLat[0],
                    lat: lngLat[1]
                });
                
                // Update delivery info
                const deliveryInfo = document.getElementById('deliveryInfo');
                if (deliveryInfo) {
                    deliveryInfo.classList.remove('d-none');
                    deliveryInfo.querySelector('.card-body').innerHTML = `
                        <h6>Delivery Address</h6>
                        <p class="mb-0">${e.result.place_name}</p>
                    `;
                }
            });

            // Add error handling for geocoder
            pickupGeocoder.on('error', (e) => {
                console.error('Pickup geocoder error:', e);
                alert('Error searching for pickup location. Please try again.');
            });

            deliveryGeocoder.on('error', (e) => {
                console.error('Delivery geocoder error:', e);
                alert('Error searching for delivery location. Please try again.');
            });

        } catch (error) {
            console.error('Error initializing geocoder:', error);
            throw error;
        }
    },

    // Show specific step
    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.step, .order-step').forEach(el => {
            el.style.display = 'none';
        });

        // Show current step
        let currentStep = document.querySelector(`.step-${step}`);
        if (!currentStep) {
            currentStep = document.querySelector(`#step${step}`);
        }
        
        if (currentStep) {
            currentStep.style.display = 'block';
            this.currentStep = step;
            this.updateProgressBar();

            // Resize maps if they exist
            if (step === 1 && this.pickupMap) {
                this.pickupMap.resize();
            } else if (step === 2 && this.deliveryMap) {
                this.deliveryMap.resize();
            }
        }
    },

    // Update progress bar and step indicators
    updateProgressBar() {
        // Update progress bar
        const progress = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            indicator.classList.remove('active', 'completed');
            if (index + 1 < this.currentStep) {
                indicator.classList.add('completed');
            } else if (index + 1 === this.currentStep) {
                indicator.classList.add('active');
            }
        });
    },

    // Initialize event listeners
    setupEventListeners() {
        // Back buttons
        document.querySelectorAll('.btn-prev').forEach(button => {
            button.addEventListener('click', () => {
                if (this.currentStep > 1) {
                    this.showStep(this.currentStep - 1);
                }
            });
        });

        // Next buttons
        document.querySelectorAll('.btn-next').forEach(button => {
            button.addEventListener('click', () => {
                if (this.validateCurrentStep()) {
                    if (this.currentStep < this.totalSteps) {
                        this.showStep(this.currentStep + 1);
                    }
                }
            });
        });

        // Cargo weight input
        const cargoWeightInput = document.getElementById('cargoWeight');
        if (cargoWeightInput) {
            cargoWeightInput.addEventListener('input', (e) => {
                const weight = parseFloat(e.target.value);
                if (!isNaN(weight) && weight > 0) {
                    this.formData.cargoWeight = weight;
                    this.suggestVehicle(weight);
                }
            });
        }

        // Vehicle selection
        document.querySelectorAll('.vehicle-option').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.getAttribute('data-vehicle');
                if (type) {
                    // Remove selected class from all options
                    document.querySelectorAll('.vehicle-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked option
                    option.classList.add('selected');
                    this.selectVehicle(type);
                }
            });
        });

        // Cargo type selection
        document.querySelectorAll('input[name="cargoType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.formData.cargoType = radio.value;
            });
        });

        // Payment method selection
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', () => {
                const type = method.getAttribute('data-method');
                this.selectPaymentMethod(type);
            });
        });
    },

    // Form navigation
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.formData.pickup !== null;
            case 2:
                return this.formData.delivery !== null;
            case 3:
                const cargoType = document.querySelector('input[name="cargoType"]:checked');
                const cargoWeight = document.getElementById('cargoWeight');
                if (!cargoType || !cargoWeight || !cargoWeight.value) {
                    alert('Please fill in all cargo details');
                    return false;
                }
                this.formData.cargoType = cargoType.value;
                this.formData.cargoWeight = parseFloat(cargoWeight.value);
                return true;
            case 4:
                // Validate that we have all necessary data before proceeding to payment
                if (!this.formData.pickup || !this.formData.delivery || !this.formData.cargoType || 
                    !this.formData.cargoWeight || !this.formData.vehicle) {
                    alert('Please ensure all order details are complete');
                    return false;
                }
                return true;
            case 5:
                return this.formData.paymentMethod !== null;
            default:
                return true;
        }
    },

    // Navigation methods
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.showStep(this.currentStep + 1);
            }
        }
    },

    prevStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    },

    // Location handling
    setPickupLocation(lngLat) {
        this.formData.pickup = lngLat;
        this.pickupMarker.setLngLat(lngLat).addTo(this.pickupMap);
        
        // Get and save the address
        this.reverseGeocode(lngLat).then(address => {
            this.formData.pickupAddress = address;
            document.getElementById('pickupInfo').innerHTML = `
                <h6>Pickup Address</h6>
                <p class="mb-0">${address}</p>
            `;
        });
    },

    setDeliveryLocation(lngLat) {
        this.formData.delivery = lngLat;
        this.deliveryMarker.setLngLat(lngLat).addTo(this.deliveryMap);
        
        // Get and save the address
        this.reverseGeocode(lngLat).then(address => {
            this.formData.deliveryAddress = address;
            document.getElementById('deliveryInfo').innerHTML = `
                <h6>Delivery Address</h6>
                <p class="mb-0">${address}</p>
            `;
        });
        
        // Calculate route if pickup location exists
        if (this.formData.pickup) {
            this.calculateRoute();
        }
    },

    // Geocoding
    async reverseGeocode(lngLat) {
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${this.mapboxToken}`
            );
            const data = await response.json();
            return data.features[0].place_name;
        } catch (error) {
            console.error('Geocoding error:', error);
            return 'Location selected';
        }
    },

    // Calculate route between pickup and delivery points
    calculateRoute() {
        if (!this.formData.pickup || !this.formData.delivery) return;
    
        const directionsRequest = `https://api.mapbox.com/directions/v5/mapbox/driving/${this.formData.pickup.lng},${this.formData.pickup.lat};${this.formData.delivery.lng},${this.formData.delivery.lat}?geometries=geojson&access_token=${this.mapboxToken}`;
    
        fetch(directionsRequest)
            .then(response => response.json())
            .then(data => {
                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    this.formData.route = {
                        geometry: route.geometry,
                        distance: route.distance,
                        duration: route.duration
                    };
                    
                    // Add routeData for database storage
                    this.formData.routeData = {
                        type: 'Feature',
                        properties: {
                            distance: route.distance,
                            duration: route.duration
                        },
                        geometry: route.geometry
                    };
                    
                    this.updateRouteDisplay();
                    this.calculatePrice(); // Update price based on distance
                }
            })
            .catch(error => {
                console.error('Error calculating route:', error);
            });
    },

    // Update route display
    updateRouteDisplay() {
        if (!this.formData.route) return;

        // Format duration string
        let durationStr = '';
        if (this.formData.route.duration > 3600) {
            durationStr += `${Math.floor(this.formData.route.duration / 3600)} hour${Math.floor(this.formData.route.duration / 3600) > 1 ? 's' : ''}`;
        }
        if (this.formData.route.duration % 3600 > 60) {
            if (durationStr) durationStr += ' and ';
            durationStr += `${Math.floor((this.formData.route.duration % 3600) / 60)} minute${Math.floor((this.formData.route.duration % 3600) / 60) > 1 ? 's' : ''}`;
        }

        // Update route info HTML
        const routeInfoHTML = `
            <div class="card-body">
                <h6 class="card-title">Route Information</h6>
                <p class="mb-1">Distance: ${(this.formData.route.distance / 1000).toFixed(2)} km</p>
                <p class="mb-0">Estimated Time: ${durationStr}</p>
                <small class="text-muted">(Based on 80 km/h speed limit)</small>
            </div>
        `;

        // Update both route info cards
        ['routeInfo', 'routeInfo2'].forEach(id => {
            const routeInfo = document.getElementById(id);
            if (routeInfo) {
                routeInfo.classList.remove('d-none');
                routeInfo.innerHTML = routeInfoHTML;
            }
        });

        // Function to update route on a map
        const updateMapRoute = (map, sourceId) => {
            if (!map) return;
            
            // Wait for the map to be loaded
            if (!map.loaded()) {
                map.once('load', () => updateMapRoute(map, sourceId));
                return;
            }

            const source = map.getSource(sourceId);
            if (source) {
                source.setData({
                    type: 'Feature',
                    properties: {},
                    geometry: this.formData.route.geometry
                });

                // Fit map to show entire route with padding
                const coordinates = this.formData.route.geometry.coordinates;
                const bounds = coordinates.reduce((bounds, coord) => {
                    return bounds.extend(coord);
                }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

                map.fitBounds(bounds, {
                    padding: 50
                });
            }
        };

        // Update route on both maps
        updateMapRoute(this.pickupMap, 'pickup-route');
        updateMapRoute(this.deliveryMap, 'delivery-route');
    },

    // Suggest appropriate vehicle based on cargo weight
    suggestVehicle(weight) {
        const vehicleSuggestion = document.getElementById('vehicleSuggestion');
        const suggestionText = vehicleSuggestion.querySelector('.suggestion-text');

        // Find the smallest vehicle that can handle the weight
        for (const [type, specs] of Object.entries(this.VEHICLE_TYPES)) {
            if (specs.capacity >= weight) { // Weight is already in tons
                // Remove selected class from all options
                document.querySelectorAll('.vehicle-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selected class to suggested option
                const option = document.querySelector(`[data-vehicle="${type}"]`);
                if (option) {
                    option.classList.add('selected');
                    vehicleSuggestion.classList.remove('d-none');
                    suggestionText.textContent = `Based on your cargo weight of ${weight} tons, we recommend using a ${specs.name} (${specs.capacity} tons capacity).`;
                }
                
                this.selectVehicle(type);
                return type;
            }
        }
        // If no vehicle can handle the weight
        const heavySpecs = this.VEHICLE_TYPES.heavy;
        vehicleSuggestion.classList.remove('d-none');
        suggestionText.textContent = `Warning: Your cargo weight of ${weight} tons exceeds our largest vehicle capacity (${heavySpecs.capacity} tons). Please consider splitting your cargo into multiple shipments.`;
        
        const option = document.querySelector('[data-vehicle="heavy"]');
        if (option) {
            option.classList.add('selected');
        }
        this.selectVehicle('heavy');
        return 'heavy';
    },

    // Select vehicle type
    selectVehicle(type) {
        if (this.VEHICLE_TYPES[type]) {
            this.formData.vehicle = type;
            
            // Update vehicle display
            document.querySelectorAll('.vehicle-option').forEach(opt => {
                if (opt.getAttribute('data-vehicle') === type) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
            
            // Hide suggestion if user manually selects a vehicle
            const vehicleSuggestion = document.getElementById('vehicleSuggestion');
            if (vehicleSuggestion) {
                vehicleSuggestion.classList.add('d-none');
            }
            
            this.calculatePrice();
            this.updateSummary();
        }
    },

    // Update summary page
    updateSummary() {
        // Update locations
        const summaryPickup = document.getElementById('summaryPickup');
        const summaryDelivery = document.getElementById('summaryDelivery');
        const summaryDistance = document.getElementById('summaryDistance');
        const summaryCargoType = document.getElementById('summaryCargoType');
        const summaryCargoWeight = document.getElementById('summaryCargoWeight');
        const summaryVehicle = document.getElementById('summaryVehicle');
        const summaryRate = document.getElementById('summaryRate');
        const summaryTotal = document.getElementById('summaryTotal');
        const summaryInstructions = document.getElementById('summaryInstructions');

        // Update locations
        if (summaryPickup) summaryPickup.textContent = this.formData.pickupAddress || 'Selected Location';
        if (summaryDelivery) summaryDelivery.textContent = this.formData.deliveryAddress || 'Selected Location';

        // Update distance with proper conversion and formatting
        if (summaryDistance && this.formData.route) {
            const distanceInKm = (this.formData.route.distance / 1000).toFixed(2);
            summaryDistance.textContent = `${distanceInKm} km`;
        } else if (summaryDistance) {
            summaryDistance.textContent = '-';
        }

        // Update cargo details
        if (summaryCargoType) summaryCargoType.textContent = this.formData.cargoType || '-';
        if (summaryCargoWeight && this.formData.cargoWeight) {
            summaryCargoWeight.textContent = `${this.formData.cargoWeight} tons`;
        } else if (summaryCargoWeight) {
            summaryCargoWeight.textContent = '-';
        }
        if (summaryInstructions) summaryInstructions.textContent = this.formData.specialInstructions || 'None';

        // Update vehicle details and rate
        if (this.formData.vehicle && this.VEHICLE_TYPES[this.formData.vehicle]) {
            const vehicle = this.VEHICLE_TYPES[this.formData.vehicle];
            if (summaryVehicle) {
                summaryVehicle.textContent = vehicle.name;
            }
            if (summaryRate) {
                summaryRate.textContent = `KES ${vehicle.baseRate.toLocaleString()} per km + cargo weight charge`;
            }
        } else {
            if (summaryVehicle) summaryVehicle.textContent = '-';
            if (summaryRate) summaryRate.textContent = '-';
        }

        // Calculate and update total price
        const total = this.calculatePrice();
        if (summaryTotal) {
            summaryTotal.textContent = `KES ${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }

        // Update payment amount for the payment step
        this.updatePaymentAmount();
    },

    // Calculate price based on distance and vehicle type
    calculatePrice() {
        if (!this.formData.route || !this.formData.vehicle) {
            return 0;
        }

        const vehicle = this.VEHICLE_TYPES[this.formData.vehicle];
        const distanceInKm = this.formData.route.distance / 1000; // Convert meters to kilometers
        const baseRate = vehicle.baseRate;
        const weightInTons = this.formData.cargoWeight; // Convert kg to tons

        // Price formula: (base * distance) + (base rate * weight in tons)
        const distanceCharge = baseRate * distanceInKm;
        const weightCharge = baseRate * weightInTons;
        const totalPrice = distanceCharge + weightCharge;

        this.formData.price = totalPrice;
        return totalPrice;
    },

    // Submit order
    async submitOrder() {
        try {
            window.showLoading();
            
            const token = await this.getAuthToken();
            if (!token) {
                throw new Error('Authentication required');
            }
            
            const orderData = {
                pickupAddress: this.formData.pickupAddress,
                deliveryAddress: this.formData.deliveryAddress,
                cargoType: this.formData.cargoType,
                cargoWeight: this.formData.cargoWeight,
                vehicle: this.formData.vehicle,
                routeData: this.formData.route,
                totalCost: this.formData.price
            };
    
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Order submission failed');
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error);
            }

            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'alert alert-success mt-4';
            successMessage.innerHTML = `
                <h5><i class='bx bx-check-circle'></i> Order Created Successfully!</h5>
                <p>Order ID: ${result.order.order_id}</p>
            `;
            document.querySelector('#step5').appendChild(successMessage);

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
                window.location.href = '/auth/new-farmer-dashboard.html';
            }, 3000);

        } catch (error) {
            console.error('Order submission error:', error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger mt-4';
            errorMessage.innerHTML = `
                <h5><i class='bx bx-error'></i> Error Creating Order</h5>
                <p>${error.message}</p>
            `;
            document.querySelector('#step5').appendChild(errorMessage);
        } finally {
            window.hideLoading();
        }
    },

    // Reset form
    resetForm() {
        this.formData = {
            pickup: null,
            delivery: null,
            pickupAddress: null,
            deliveryAddress: null,
            cargoType: null,
            cargoWeight: null,
            vehicle: null,
            route: null,
            price: 0,
            paymentMethod: null,
            paymentDetails: null
        };
        this.currentStep = 1;
        this.showStep(1);
        
        // Reset maps
        if (this.pickupMarker) this.pickupMarker.remove();
        if (this.deliveryMarker) this.deliveryMarker.remove();
        if (this.pickupMap.getSource('route')) {
            this.pickupMap.removeLayer('route');
            this.pickupMap.removeSource('route');
        }
        
        // Reset form inputs
        document.querySelectorAll('input[type="radio"]').forEach(input => input.checked = false);
        document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
        document.querySelectorAll('textarea').forEach(textarea => textarea.value = '');
        document.querySelectorAll('.vehicle-option').forEach(option => option.classList.remove('selected'));
        
        // Reset info displays
        const pickupInfo = document.getElementById('pickupInfo');
        if (pickupInfo) {
            pickupInfo.innerHTML = '';
            pickupInfo.classList.add('d-none');
        }
        
        const deliveryInfo = document.getElementById('deliveryInfo');
        if (deliveryInfo) {
            deliveryInfo.innerHTML = '';
            deliveryInfo.classList.add('d-none');
        }
        
        const routeInfo = document.getElementById('routeInfo');
        if (routeInfo) {
            routeInfo.classList.add('d-none');
        }
        
        const vehicleSuggestion = document.getElementById('vehicleSuggestion');
        if (vehicleSuggestion) {
            vehicleSuggestion.classList.add('d-none');
        }

        // Reinitialize geocoders
        this.initGeocoder();
    },

    // Select payment method
    selectPaymentMethod(method) {
        // Reset all payment methods and forms
        document.querySelectorAll('.payment-method').forEach(el => {
            el.classList.remove('selected');
        });
        document.querySelectorAll('.payment-form').forEach(el => {
            el.style.display = 'none';
        });

        // Show selected method
        const selectedMethod = document.querySelector(`[data-method="${method}"]`);
        const selectedForm = document.querySelector(`.${method}-form`);
        
        if (selectedMethod && selectedForm) {
            selectedMethod.classList.add('selected');
            selectedForm.style.display = 'block';
        }

        this.formData.paymentMethod = method;
    },

    // Process payment (dummy implementation)
    async processPayment() {
        const loadingBtn = document.getElementById('processPayment');
        loadingBtn.disabled = true;
        loadingBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

        try {
            // Validate payment details
            if (!this.validatePaymentDetails()) {
                throw new Error('Please fill in all payment details');
            }

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simulate successful payment
            await this.submitOrder();

            // Show success message
            alert('Payment successful! Your order has been placed.');
            
            // Reset form
            this.resetForm();
            
        } catch (error) {
            alert(error.message || 'Payment failed. Please try again.');
        } finally {
            loadingBtn.disabled = false;
            loadingBtn.innerHTML = 'Process Payment';
        }
    },

    // Validate payment details
    validatePaymentDetails() {
        const { paymentMethod } = this.formData;
        
        if (!paymentMethod) {
            return false;
        }

        if (paymentMethod === 'mpesa') {
            const phone = document.getElementById('mpesaPhone').value;
            return phone && phone.length >= 10;
        }

        if (paymentMethod === 'card') {
            const cardNumber = document.getElementById('cardNumber').value;
            const expiry = document.getElementById('cardExpiry').value;
            const cvv = document.getElementById('cardCvv').value;
            return cardNumber && expiry && cvv;
        }

        return false;
    },

    // Update payment amount
    updatePaymentAmount() {
        const amountElement = document.getElementById('paymentAmount');
        if (amountElement) {
            amountElement.textContent = `KES ${this.formData.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
    },

    // Show M-Pesa payment modal
    showMpesaPayment() {
        const mpesaModal = new bootstrap.Modal(document.getElementById('mpesaModal'));
        const mpesaForm = document.getElementById('mpesaForm');
        
        // Update amount display
        document.getElementById('mpesaAmount').textContent = `KES ${this.formData.price.toFixed(2)}`;
        
        // Handle form submission
        mpesaForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission
            const phoneInput = mpesaForm.querySelector('input[type="tel"]');
            if (phoneInput.checkValidity()) {
                this.completePayment('mpesa');
            }
        });
        
        mpesaModal.show();
    },

    // Show card payment modal
    showCardPayment() {
        const cardModal = new bootstrap.Modal(document.getElementById('cardModal'));
        const cardForm = document.getElementById('cardForm');
        
        // Update amount display
        document.getElementById('cardAmount').textContent = `KES ${this.formData.price.toFixed(2)}`;
        
        // Handle form submission
        cardForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission
            if (cardForm.checkValidity()) {
                this.completePayment('card');
            }
        });
        
        cardModal.show();
    },

    // Complete payment and proceed
    async completePayment(method) {
        try {
            // Check session before proceeding
            const token = await this.getAuthToken();
            if (!token) {
                throw new Error('Authentication required');
            }
    
            this.formData.paymentMethod = method;
            this.formData.paymentStatus = 'completed';
            
            // Close modals
            const mpesaModal = bootstrap.Modal.getInstance(document.getElementById('mpesaModal'));
            const cardModal = bootstrap.Modal.getInstance(document.getElementById('cardModal'));
            if (mpesaModal) mpesaModal.hide();
            if (cardModal) cardModal.hide();
            
            // Submit the order
            await this.submitOrder();
        } catch (error) {
            console.error('Payment error:', error);
            // Show error to user
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger mt-4';
            errorMessage.innerHTML = `
                <h5><i class='bx bx-error'></i> Payment Error</h5>
                <p>${error.message}</p>
            `;
            document.querySelector('#step5').appendChild(errorMessage);
        }
    },
    async getAuthToken() {
        const sessionStr = localStorage.getItem('userSession');
        if (!sessionStr) {
            window.location.href = '/auth/login.html';
            throw new Error('No active session');
        }
        try {
            const session = JSON.parse(sessionStr);
            return session.access_token || session; // Fallback to full session if no access_token
        } catch (error) {
            console.error('Error parsing session:', error);
            return sessionStr; // Fallback to raw token if parsing fails
        }
    }
};

// Initialize the system
document.addEventListener('DOMContentLoaded', () => {
    // Make orderSystem globally available
    window.orderSystem = OrderSystem;
    
    // Initialize the first step
    OrderSystem.init();
})
