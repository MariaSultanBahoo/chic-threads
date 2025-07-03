// Initialize Isotope with error handling
var $grid;
try {
    $grid = $('.collection-list').isotope({
        itemSelector: '.col-md-6',
        layoutMode: 'fitRows',
        getSortData: {
            name: function(itemElem) {
                var $card = $(itemElem).find('.product-card');
                return ($card.data('name') || '').toLowerCase();
            },
            price: function(itemElem) {
                var $card = $(itemElem).find('.product-card');
                var price = parseFloat($card.data('discount-price')) || parseFloat($card.data('original-price')) || 0;
                return price;
            }
        }
    });
} catch (error) {
    console.error('Error initializing Isotope:', error);
}

// Filter toggle functionality
$('#filter-toggle').on('click', function() {
    $('#filter-options').toggleClass('d-none');
});

// --- Combined Isotope Filtering for Category, Price, and Search ---
var currentCategoryFilter = '*';
var currentMinPrice = 0;
var currentMaxPrice = Infinity;
var currentSearchQuery = '';

// Add a 'No products found' message container after the collection-list
if (!$('#no-products-message').length) {
    $('.collection-list').after('<div id="no-products-message" class="text-center text-muted my-4" style="display:none;">No products found.</div>');
}

function updateIsotopeFilter() {
    if (!$grid || !$grid.data('isotope')) {
        console.error('Isotope grid not initialized');
        return;
    }

    try {
        $grid.isotope({
            filter: function() {
                var $card = $(this).find('.product-card');
                if (!$card.length) return false;

                var matchesCategory = currentCategoryFilter === '*' || $(this).is(currentCategoryFilter);
                
                // Price filtering with error handling
                var price = 0;
                try {
                    price = parseFloat($card.data('discount-price')) || parseFloat($card.data('original-price')) || 0;
                } catch (e) {
                    console.warn('Error parsing price:', e);
                }
                var matchesPrice = price >= currentMinPrice && price <= currentMaxPrice;
                
                // Search filtering with error handling
                var name = '';
                var description = '';
                try {
                    name = ($card.data('name') || '').toLowerCase();
                    description = ($card.data('description') || '').toLowerCase();
                } catch (e) {
                    console.warn('Error getting product data:', e);
                }
                var searchQuery = (currentSearchQuery || '').toLowerCase();
                var matchesSearch = !searchQuery || 
                                  name.includes(searchQuery) || 
                                  description.includes(searchQuery);
                
                return matchesCategory && matchesPrice && matchesSearch;
            }
        });

        // Show/hide 'No products found' message with error handling
        setTimeout(function() {
            try {
                var visible = $grid.data('isotope').filteredItems.length;
                $('#no-products-message').toggle(visible === 0);
            } catch (e) {
                console.error('Error updating no products message:', e);
            }
        }, 100);
    } catch (error) {
        console.error('Error updating Isotope filter:', error);
    }
}

$('.filter-btn').on('click', function() {
    var filterValue = $(this).attr('data-filter') || '*';
    currentCategoryFilter = filterValue;
    updateIsotopeFilter();
    // Update active button states
    $('.filter-btn').removeClass('active-filter-btn btn-primary').addClass('btn-outline-primary');
    $(this).removeClass('btn-outline-primary btn-outline-danger').addClass('btn-primary');
    // Update URL hash for navigation
    if (typeof filterValue === 'string' && filterValue !== '*') {
        window.location.hash = filterValue.replace('.', '');
    } else {
        window.location.hash = '';
    }
});

$('#apply-price-filter').on('click', function() {
    currentMinPrice = parseFloat($('#min-price').val()) || 0;
    currentMaxPrice = parseFloat($('#max-price').val()) || Infinity;
    updateIsotopeFilter();
});
$('#clear-price-filter').on('click', function() {
    $('#min-price').val('');
    $('#max-price').val('');
    currentMinPrice = 0;
    currentMaxPrice = Infinity;
    updateIsotopeFilter();
});

// --- Fix aria-hidden/focus warning after modal close ---
$('.modal').on('hidden.bs.modal', function () {
    // Move focus to a visible element (e.g., filter-toggle button)
    $('#filter-toggle').focus();
});

// Sort functionality using Isotope
$('#sort-alpha').on('click', function() {
    $grid.isotope({ sortBy: 'name', sortAscending: true });
    $('.sort-btn').removeClass('btn-primary').addClass('btn-outline-primary');
    $(this).removeClass('btn-outline-primary').addClass('btn-primary');
});

$('#sort-price-low').on('click', function() {
    $grid.isotope({ sortBy: 'price', sortAscending: true });
    $('.sort-btn').removeClass('btn-primary').addClass('btn-outline-primary');
    $(this).removeClass('btn-outline-primary').addClass('btn-primary');
});

$('#sort-price-high').on('click', function() {
    $grid.isotope({ sortBy: 'price', sortAscending: false });
    $('.sort-btn').removeClass('btn-primary').addClass('btn-outline-primary');
    $(this).removeClass('btn-outline-primary').addClass('btn-primary');
});

// Add sorting data attributes
$('.product-card').each(function() {
    var $this = $(this);
    var name = $this.data('name');
    var price = parseFloat($this.data('original-price'));
    
    $this.attr('data-name', name);
    $this.attr('data-price', price);
});

// Product modal functionality
$('.product-image, .product-info').on('click', function(e) {
    var $card = $(this).closest('.product-card');
    var id = $card.data('id');
    var name = $card.data('name');
    var description = $card.data('description');
    var image = $card.data('image');
    var units = $card.data('units');
    var originalPrice = $card.data('original-price');
    var discountPrice = $card.data('discount-price');
    var discount = $card.data('discount');
    
    // Update modal content
    $('#productModal .modal-title').text(name);
    $('#productModal .product-description').text(description);
    $('#productModal .product-image').attr('src', image);
    $('#productModal .product-units').text(units + ' units left');
    
    // Update price display
    if (discount) {
        $('#productModal .original-price').text('$' + originalPrice).show();
        $('#productModal .discount-price').text('$' + discountPrice);
        $('#productModal .discount-badge').text(discount).show();
    } else {
        $('#productModal .original-price').hide();
        $('#productModal .discount-price').text('$' + originalPrice);
        $('#productModal .discount-badge').hide();
    }
    
    // Update quantity input
    $('#productModal .quantity-input').val(1);
    
    // Update add to cart button
    $('#productModal .add-to-cart-btn').data('id', id);
});

// Quantity controls
$('.quantity-btn').on('click', function() {
    var $input = $(this).siblings('.quantity-input');
    var currentVal = parseInt($input.val());
    
    if ($(this).hasClass('decrease')) {
        if (currentVal > 1) {
            $input.val(currentVal - 1);
        }
    } else {
        $input.val(currentVal + 1);
    }
});

// Wishlist functionality with tooltip update
$(document).on('click', '.wishlist-btn', function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    var $icon = $(this).find('.fa-heart');
    var $btn = $(this);
    var $card = $(this).closest('.product-card');
    var id = parseInt($card.data('id'));
    var name = $card.data('name');
    var price = parseFloat($card.data('discount-price') || $card.data('original-price'));
    var image = $card.data('image');
    
    // Store wishlist items in localStorage for non-logged in users
    let wishlistItems = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
    const exists = wishlistItems.some(item => item.id === id);

    if (!exists) {
        // Add to wishlist
        $icon.addClass('text-danger').removeClass('text-muted');
        $btn.attr('title', 'Remove from Wishlist').tooltip('dispose').tooltip();
        const wishlistItem = { id, name, price, image };
        wishlistItems.push(wishlistItem);
        localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
        // If user is logged in, also update server
        if (localStorage.getItem('user')) {
            $.ajax({
                url: 'http://localhost:3000/wishlist',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(wishlistItem),
                error: function(err) {
                    console.error('Error updating wishlist:', err);
                    $icon.removeClass('text-danger').addClass('text-muted');
                    $btn.attr('title', 'Add to Wishlist').tooltip('dispose').tooltip();
                    wishlistItems = wishlistItems.filter(item => item.id !== id);
                    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
                }
            });
        }
    } else {
        // Remove from wishlist
        $icon.removeClass('text-danger').addClass('text-muted');
        $btn.attr('title', 'Add to Wishlist').tooltip('dispose').tooltip();
        wishlistItems = wishlistItems.filter(item => item.id !== id);
        localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
        // If user is logged in, also update server
        if (localStorage.getItem('user')) {
            $.ajax({
                url: 'http://localhost:3000/wishlist',
                method: 'DELETE',
                contentType: 'application/json',
                data: JSON.stringify({ id: id }),
                error: function(err) {
                    console.error('Error updating wishlist:', err);
                    $icon.addClass('text-danger').removeClass('text-muted');
                    $btn.attr('title', 'Remove from Wishlist').tooltip('dispose').tooltip();
                    wishlistItems.push({ id, name, price, image });
                    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
                }
            });
        }
    }
});

// Add to cart functionality
$('.add-to-cart-btn').on('click', function() {
    var id = $(this).data('id');
    var quantity = $('#productModal .quantity-input').val();
    var $card = $(`.product-card[data-id="${id}"]`);
    var name = $card.data('name');
    var price = parseFloat($card.data('discount-price') || $card.data('original-price'));
    var image = $card.data('image');
    
    // Store cart items in localStorage for non-logged in users
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    // Check if item already exists in cart
    const existingItem = cartItems.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += parseInt(quantity);
    } else {
        cartItems.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: parseInt(quantity)
        });
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // If user is logged in, also update server
    if (localStorage.getItem('user')) {
        $.ajax({
            url: 'http://localhost:3000/cart',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                id: id,
                quantity: quantity
            }),
            error: function(err) {
                console.error('Error adding to cart:', err);
            }
        });
    }
    
    // Close modal
    $('#productModal').modal('hide');
});

// Checkout functionality
$('.checkout-btn').on('click', function(e) {
    e.preventDefault();
    
    if (!localStorage.getItem('user')) {
        // Show login required modal
        $('#loginRequiredModal').modal('show');
        return;
    }
    
    // Proceed with checkout
    window.location.href = 'checkout.html';
});

// Helper functions for showing messages
function showSuccessMessage(message) {
    $('#successModalLabel').text('Success');
    $('#success-message').text(message);
    $('#successModal').modal('show');
    setTimeout(() => {
        $('#successModal').modal('hide');
    }, 2000);
}

function showErrorMessage(message) {
    $('#successModalLabel').text('Error');
    $('#success-message').text(message);
    $('#successModal').modal('show');
}

// Initialize wishlist and cart from localStorage on page load
$(document).ready(function() {
    // Initialize wishlist icons
    const wishlistItems = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
    wishlistItems.forEach(item => {
        $(`.product-card[data-id="${item.id}"] .fa-heart`).addClass('text-danger').removeClass('text-muted');
    });
    
    // Initialize cart count
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    $('.cart-count').text(totalItems);
});

// Toast notification function
function showToast(title, message, type) {
    var $toast = $('#notification-toast');
    var $toastTitle = $toast.find('.toast-title');
    var $toastMessage = $toast.find('.toast-message');
    var $toastIcon = $toast.find('.toast-icon');
    
    // Update toast content
    $toastTitle.text(title);
    $toastMessage.text(message);
    
    // Update icon based on type
    switch(type) {
        case 'success':
            $toastIcon.html('<i class="fas fa-check-circle text-success"></i>');
            break;
        case 'error':
            $toastIcon.html('<i class="fas fa-exclamation-circle text-danger"></i>');
            break;
        case 'info':
            $toastIcon.html('<i class="fas fa-info-circle text-primary"></i>');
            break;
        case 'warning':
            $toastIcon.html('<i class="fas fa-exclamation-triangle text-warning"></i>');
            break;
    }
    
    // Show toast
    $toast.toast('show');
}

// Initialize tooltips (ensure this runs after DOM ready and after any dynamic updates)
$(function () {
    $('[data-bs-toggle="tooltip"]').tooltip();
});

// Initialize popovers
$('[data-bs-toggle="popover"]').popover();

// Back button functionality
function goBack() {
    window.history.back();
}

// Add back button to all pages
$(document).ready(function() {
    // Add back button to navbar
    $('.navbar-nav').prepend(`
        <li class="nav-item px-2 py-2">
            <button class="nav-link text-uppercase text-dark border-0 bg-transparent" onclick="goBack()">
                <i class="fas fa-arrow-left me-1"></i>Back
            </button>
        </li>
    `);
});

// Enhanced search functionality with error handling
$('#search-input').on('input', function() {
    try {
        currentSearchQuery = $(this).val().trim();
        updateIsotopeFilter();
    } catch (e) {
        console.error('Error in search input handler:', e);
    }
});

$('#search-btn').on('click', function() {
    try {
        currentSearchQuery = $('#search-input').val().trim();
        updateIsotopeFilter();
        $('#searchModal').modal('hide');
    } catch (e) {
        console.error('Error in search button handler:', e);
    }
});

$('#clear-search-btn').on('click', function() {
    try {
        $('#search-input').val('');
        currentSearchQuery = '';
        updateIsotopeFilter();
        $('#searchModal').modal('hide');
    } catch (e) {
        console.error('Error in clear search handler:', e);
    }
});

// Initialize search on page load with error handling
$(document).ready(function() {
    try {
        // Clear any existing search
        currentSearchQuery = '';
        $('#search-input').val('');
        
        // Initialize Isotope if not already initialized
        if ($grid && $grid.data('isotope')) {
            $grid.isotope('layout');
        }
        
        // Focus search input when modal opens
        $('#searchModal').on('shown.bs.modal', function () {
            $('#search-input').focus();
        });
        
        // Clear search when modal closes
        $('#searchModal').on('hidden.bs.modal', function () {
            $('#search-input').val('');
            currentSearchQuery = '';
            updateIsotopeFilter();
        });
    } catch (e) {
        console.error('Error in search initialization:', e);
    }
});