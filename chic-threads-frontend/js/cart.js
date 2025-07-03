$(document).ready(function() {
    let cart = [];
    let wishlist = [];
    let currentProduct = {};
    let currentUser = null;

    // Initialize toast
    const toastEl = document.getElementById('notification-toast');
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });

    // Load cart and wishlist from backend on page load
    $.ajax({
        url: 'http://localhost:3000/cart',
        method: 'GET',
        success: function(data) {
            cart = data.map(item => ({
                ...item,
                price: parseFloat(item.price)
            }));
            updateCartUI();
        },
        error: function(err) {
            console.error('Error loading cart:', err);
            showToast('Failed to load cart. Please refresh the page.', 'Error', 'error');
        }
    });

    $.ajax({
        url: 'http://localhost:3000/wishlist',
        method: 'GET',
        success: function(data) {
            wishlist = data.map(item => ({
                ...item,
                price: parseFloat(item.price),
                id: parseInt(item.id)
            }));
            updateWishlistUI();
            initializeHeartIcons();
        },
        error: function(err) {
            console.error('Error loading wishlist:', err);
            showToast('Failed to load wishlist. Please refresh the page.', 'Error', 'error');
        }
    });

    // Check user session
    $.ajax({
        url: 'http://localhost:3000/session',
        method: 'GET',
        success: function(data) {
            currentUser = data.username ? data : null;
            if (currentUser) {
                $('#user-name').text(currentUser.username);
                $('#login-btn').hide();
                $('#logout-btn').show();
                if (currentUser.role === 'admin') $('#admin-view').show();
            }
        }
    });

    // Function to show toast notification
    function showToast(message, title = "Notification", type = "info") {
        $('#toast-title').text(title);
        $('#toast-message').text(message);
        
        // Update toast styling based on type
        const $toast = $('#notification-toast');
        $toast.removeClass('bg-success bg-danger bg-info text-white');
        
        // Add appropriate icon based on type
        let icon = 'fa-info-circle';
        if (type === "success") {
            $toast.addClass('bg-success text-white');
            icon = 'fa-check-circle';
        } else if (type === "error") {
            $toast.addClass('bg-danger text-white');
            icon = 'fa-exclamation-circle';
        } else if (type === "info") {
            $toast.addClass('bg-info text-white');
            icon = 'fa-info-circle';
        }
        
        // Update icon
        $toast.find('.toast-header i').removeClass().addClass(`fas ${icon} me-2`);
        
        // Show toast with animation
        toast.show();
    }

    // Initialize heart icons based on wishlist state
    function initializeHeartIcons() {
        $('.product-card').each(function() {
            const $this = $(this);
            const productId = parseInt($this.data('id'));
            if (isNaN(productId)) {
                console.warn('Invalid product ID:', $this.data('id'));
                return;
            }
            const isInWishlist = wishlist.some(item => item.id === productId);
            $this.find('.fa-heart').toggleClass('text-danger', isInWishlist).toggleClass('text-muted', !isInWishlist);
        });
    }

    // Show product modal
    $('.product-card').click(function(e) {
        // Prevent triggering modal when clicking the heart icon
        if ($(e.target).hasClass('fa-heart')) return;
        
        const $this = $(this);
        currentProduct = {
            id: parseInt($this.data('id')),
            name: $this.data('name'),
            description: $this.data('description'),
            image: $this.data('image'),
            units: $this.data('units'),
            originalPrice: parseFloat($this.data('original-price')),
            discountPrice: parseFloat($this.data('discount-price')),
            discount: $this.data('discount'),
            quantity: 1
        };
        if (isNaN(currentProduct.id)) {
            console.warn('Invalid product ID in modal:', currentProduct.id);
            showToast('Invalid product data.', 'Error', 'error');
            return;
        }
        $('#product-image').attr('src', currentProduct.image);
        $('#product-name').text(currentProduct.name);
        $('#product-description').text(currentProduct.description);
        $('#product-units').text(currentProduct.units);
        $('#product-original-price').text(`$${currentProduct.originalPrice.toFixed(2)}`);
        $('#product-discount-price').text(`$${currentProduct.discountPrice.toFixed(2)}`);
        $('#product-discount').text(currentProduct.discount);
        $('#product-quantity').text(currentProduct.quantity);
    });

    // Quantity controls
    $('#decrease-quantity').click(function() {
        if (currentProduct.quantity > 1) {
            currentProduct.quantity--;
            $('#product-quantity').text(currentProduct.quantity);
            showToast(`Quantity decreased to ${currentProduct.quantity}`, 'Info', 'info');
        } else {
            showToast('Minimum quantity is 1', 'Warning', 'info');
        }
    });

    $('#increase-quantity').click(function() {
        currentProduct.quantity++;
        $('#product-quantity').text(currentProduct.quantity);
        showToast(`Quantity increased to ${currentProduct.quantity}`, 'Info', 'info');
    });

    // Add to cart from modal
    $('#add-to-cart-modal').click(function() {
        if (!currentUser) {
            showToast('Please log in to add items to cart.', 'Login Required', 'info');
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            return;
        }
        const product = {
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.discountPrice,
            quantity: currentProduct.quantity,
            image: currentProduct.image
        };
        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct) {
            existingProduct.quantity += product.quantity;
        } else {
            cart.push(product);
        }
        $.ajax({
            url: 'http://localhost:3000/cart',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(product),
            success: function() {
                updateCartUI();
                $('#productModal').modal('hide');
                showToast(`${product.name} (x${product.quantity}) added to cart!`, 'Success', 'success');
            },
            error: function(err) {
                console.error('Error adding to cart:', err);
                showToast('Failed to add item to cart. Please try again.', 'Error', 'error');
            }
        });
    });

    // Unified payment processing for both Buy Now and Cart Checkout
    function handlePaymentSuccess() {
        // Show thank you message
        if (!$('#successModal').length) {
            $('body').append(`
                <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="successModalLabel">Thank You!</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="text-center">
                                    <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
                                    <h5>Thank you for shopping with us!</h5>
                                    <p class="mb-3">Your order has been successfully placed.</p>
                                    <p class="text-muted">Order details have been sent to your email.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        } else {
            $('#successModalLabel').text('Thank You!');
            $('#success-message').html(`
                <div class="text-center">
                    <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
                    <h5>Thank you for shopping with us!</h5>
                    <p class="mb-3">Your order has been successfully placed.</p>
                    <p class="text-muted">Order details have been sent to your email.</p>
                </div>
            `);
        }
        $('#successModal').modal('show');
        // Clear cart and redirect to home after 3 seconds
        setTimeout(() => {
            cart = [];
            updateCartUI();
            $('#successModal').modal('hide');
            window.location.href = 'index.html';
        }, 3000);
    }

    // Always use this handler for Pay Now
    $('#pay-now').off('click').on('click', function() {
        const cardNumber = $('#checkout-form input[placeholder="1234 5678 9012 3456"]').val();
        const expiryDate = $('#checkout-form input[placeholder="MM/YY"]').val();
        const cvv = $('#checkout-form input[placeholder="123"]').val();

        if (!cardNumber || !expiryDate || !cvv) {
            showToast('Please fill in all payment details', 'Error', 'error');
            return;
        }

        showToast('Processing your payment...', 'Info', 'info');

        // Simulate payment processing
        setTimeout(() => {
            $('#checkoutModal').modal('hide');
            handlePaymentSuccess();
        }, 1500);
    });

    // Buy Now functionality
    $('#buy-now').click(function() {
        if (!currentUser) {
            $('#loginRequiredModal').modal('show');
            return;
        }

        const product = {
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.discountPrice,
            quantity: currentProduct.quantity
        };

        // Show payment modal directly
        $('#productModal').modal('hide');
        $('#checkoutModal').modal('show');
    });

    // Add to wishlist from product card
    $(document).on('click', '.product-card .fa-heart', function(e) {
        e.stopPropagation();
        if (!currentUser) {
            showToast('Please log in to add items to wishlist.', 'Login Required', 'info');
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            return;
        }
        const $productCard = $(this).closest('.product-card');
        const productId = parseInt($productCard.data('id'));
        if (isNaN(productId)) {
            console.warn('Invalid product ID for wishlist:', productId);
            showToast('Invalid product data.', 'Error', 'error');
            return;
        }
        const product = {
            id: productId,
            name: $productCard.data('name'),
            price: parseFloat($productCard.data('discount-price')),
            image: $productCard.data('image')
        };
        console.log('Adding to wishlist:', product);

        $.ajax({
            url: 'http://localhost:3000/wishlist',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(product),
            success: function(response) {
                wishlist.push(product);
                $productCard.find('.fa-heart').removeClass('text-muted').addClass('text-danger');
                updateWishlistUI();
                updateWishlistModal();
                showToast(`${product.name} added to wishlist!`, 'Success', 'success');
            },
            error: function(err) {
                if (err.status === 409) {
                    showToast('This item is already in your wishlist.', 'Info', 'info');
                } else {
                    console.error('Error adding to wishlist:', err);
                    showToast('Failed to add item to wishlist. Please try again.', 'Error', 'error');
                }
            }
        });
    });

    // Add to cart from wishlist with server update
    $(document).on('click', '.add-to-cart-wishlist', function() {
        const id = parseInt($(this).data('id'));
        const wishlistItem = wishlist.find(item => item.id === id);
        
        if (wishlistItem) {
            const product = {
                id: wishlistItem.id,
                name: wishlistItem.name,
                price: wishlistItem.price,
                quantity: 1
            };
            
            // Add to cart
            cart.push(product);
            updateCartUI();

            // Remove from wishlist
            wishlist = wishlist.filter(item => item.id !== id);
            updateWishlistUI();
            updateWishlistModal();
            initializeHeartIcons();

            // Update server
            if (currentUser) {
                // Remove from wishlist on server
                $.ajax({
                    url: `http://localhost:3000/wishlist/${id}`,
                    method: 'DELETE',
                    success: function() {
                        showToast(`${product.name} added to cart!`, 'Success', 'success');
                    },
                    error: function(err) {
                        console.error('Error updating wishlist:', err);
                        showToast('Failed to update wishlist. Please try again.', 'Error', 'error');
                    }
                });

                // Add to cart on server
                $.ajax({
                    url: 'http://localhost:3000/cart',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(product),
                    error: function(err) {
                        console.error('Error adding to cart:', err);
                        showToast('Failed to add item to cart. Please try again.', 'Error', 'error');
                    }
                });
            } else {
                // Update localStorage for non-logged in users
                localStorage.setItem('cartItems', JSON.stringify(cart));
                localStorage.setItem('wishlistItems', JSON.stringify(wishlist));
                showToast(`${product.name} added to cart!`, 'Success', 'success');
            }
        }
    });

    // Remove from cart with server update
    $(document).on('click', '.remove-item', function() {
        const id = parseInt($(this).data('id'));
        if (isNaN(id)) {
            console.warn('Invalid cart item ID:', id);
            showToast('Invalid cart item data.', 'Error', 'error');
            return;
        }

        // Remove from local cart
        cart = cart.filter(item => item.id !== id);
        updateCartUI();

        // Update server if logged in
        if (currentUser) {
            $.ajax({
                url: `http://localhost:3000/cart/${id}`,
                method: 'DELETE',
                success: function() {
                    showToast('Item removed from cart.', 'Success', 'success');
                },
                error: function(err) {
                    console.error('Error removing from cart:', err);
                    showToast('Failed to remove item from cart.', 'Error', 'error');
                }
            });
        } else {
            // Update localStorage for non-logged in users
            localStorage.setItem('cartItems', JSON.stringify(cart));
            showToast('Item removed from cart.', 'Success', 'success');
        }
    });

    // Update quantity in cart
    $(document).on('change', '.item-quantity', function() {
        const id = parseInt($(this).data('id'));
        const quantity = parseInt($(this).val());
        if (isNaN(id) || isNaN(quantity)) {
            console.warn('Invalid cart quantity data:', { id, quantity });
            showToast('Invalid quantity. Please enter a valid number.', 'Error', 'error');
            return;
        }
        if (quantity <= 0) {
            showToast('Quantity must be greater than 0', 'Warning', 'info');
            $(this).val(1);
            return;
        }
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity = quantity;
            $.ajax({
                url: `http://localhost:3000/cart/${id}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ quantity }),
                success: function() {
                    updateCartUI();
                    showToast(`Quantity updated to ${quantity}`, 'Success', 'success');
                },
                error: function(err) {
                    console.error('Error updating quantity:', err);
                    showToast('Failed to update quantity. Please try again.', 'Error', 'error');
                }
            });
        }
    });

    // Checkout functionality
    $('#checkout-btn').click(function() {
        if (cart.length === 0) {
            showToast('Your cart is empty!', 'Cart Empty', 'info');
            return;
        }
        if (!currentUser) {
            $('#loginRequiredModal').modal('show');
            return;
        }
        $('#cartModal').modal('hide');
        $('#checkoutModal').modal('show');
    });

    // Login redirect
    $('#login-btn').click(function() {
        showToast('Redirecting to login page...', 'Info', 'info');
        window.location.href = 'login.html';
    });

    // Logout functionality
    function handleLogout() {
        showToast('Logging out...', 'Info', 'info');
        $.ajax({
            url: 'http://localhost:3000/logout',
            method: 'POST',
            success: function() {
                currentUser = null;
                $('#user-name').text('Guest');
                $('#login-btn').show();
                $('#logout-btn').hide();
                $('#admin-view').hide();
                $('#profileModal').modal('hide');
                showToast('Successfully logged out!', 'Success', 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 1000);
            },
            error: function(err) {
                console.error('Error during logout:', err);
                showToast('Failed to logout. Please try again.', 'Error', 'error');
            }
        });
    }

    // Add logout event listener
    $(document).on('click', '#logout-btn', function(e) {
        e.preventDefault();
        handleLogout();
    });

    // Update cart UI
    function updateCartUI() {
        const $cartItems = $('#cart-items');
        const $cartTotal = $('#cart-total');
        const $cartCount = $('.cart-count');

        $cartItems.empty();
        let total = 0;
        let itemCount = 0;

        cart.forEach(item => {
            const itemPrice = parseFloat(item.price);
            const itemTotal = itemPrice * item.quantity;
            total += itemTotal;
            itemCount += item.quantity;

            $cartItems.append(`
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.name}" 
                                class="img-thumbnail me-3" 
                                style="width: 80px; height: 80px; object-fit: cover;">
                            <div>
                                <h6 class="mb-1">${item.name}</h6>
                                <small class="text-muted">Product ID: ${item.id}</small>
                            </div>
                        </div>
                    </td>
                    <td class="align-middle">$${itemPrice.toFixed(2)}</td>
                    <td class="align-middle">
                        <input type="number" class="item-quantity" data-id="${item.id}" value="${item.quantity}" min="1">
                    </td>
                    <td class="align-middle">$${itemTotal.toFixed(2)}</td>
                    <td class="align-middle">
                        <button class="btn btn-danger btn-sm remove-item" data-id="${item.id}">Remove</button>
                    </td>
                </tr>
            `);
        });

        $cartTotal.text(total.toFixed(2));
        $cartCount.text(itemCount);
    }

    // Update wishlist UI (count in navbar)
    function updateWishlistUI() {
        const $wishlistCount = $('.wishlist-count');
        $wishlistCount.text(wishlist.length);
        console.log('Wishlist count updated:', wishlist.length);
    }

    // Update wishlist modal content
    function updateWishlistModal() {
        const $wishlistItems = $('#wishlist-items');
        const $wishlistEmpty = $('#wishlist-empty');
        const $wishlistContainer = $('#wishlist-items-container');
        
        $wishlistItems.empty();

        if (wishlist.length === 0) {
            $wishlistEmpty.removeClass('d-none');
            $wishlistContainer.addClass('d-none');
        } else {
            $wishlistEmpty.addClass('d-none');
            $wishlistContainer.removeClass('d-none');
            
            wishlist.forEach(item => {
                const imageUrl = item.image || 'images/placeholder.jpg';
                $wishlistItems.append(`
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="${imageUrl}" alt="${item.name}" 
                                    class="img-thumbnail me-3" 
                                    style="width: 80px; height: 80px; object-fit: cover;">
                                <div>
                                    <h6 class="mb-1">${item.name}</h6>
                                    <small class="text-muted">Product ID: ${item.id}</small>
                                </div>
                            </div>
                        </td>
                        <td class="align-middle">$${item.price.toFixed(2)}</td>
                        <td class="align-middle">
                            <div class="btn-group">
                                <button class="btn btn-sm btn-primary add-to-cart-wishlist me-2" data-id="${item.id}">
                                    <i class="fas fa-shopping-cart"></i> Add to Cart
                                </button>
                                <button class="btn btn-sm btn-danger remove-wishlist-item" data-id="${item.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }
    }

    // Show wishlist modal and update its content
    $('#wishlistModal').on('show.bs.modal', function() {
        updateWishlistModal();
    });

    // Remove item from wishlist via modal
    $(document).on('click', '.remove-wishlist-item', function() {
        const id = parseInt($(this).data('id'));
        if (isNaN(id)) {
            console.warn('Invalid wishlist item ID:', id);
            showToast('Invalid wishlist item data.', 'Error', 'error');
            return;
        }
        
        $.ajax({
            url: `http://localhost:3000/wishlist/${id}`,
            method: 'DELETE',
            success: function() {
                const removedItem = wishlist.find(item => item.id === id);
                wishlist = wishlist.filter(item => item.id !== id);
                updateWishlistUI();
                updateWishlistModal();
                initializeHeartIcons();
                showToast(`${removedItem.name} removed from wishlist.`, 'Success', 'success');
            },
            error: function(err) {
                console.error('Error removing from wishlist:', err);
                showToast('Failed to remove item from wishlist. Please try again.', 'Error', 'error');
            }
        });
    });

    // Add success modal to HTML if not present
    if (!$('#successModal').length) {
        $('body').append(`
            <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="successModalLabel">Success</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p id="success-message" class="text-center"></p>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
});