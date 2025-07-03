const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Load users from users.json
let users = {};
try {
    const usersData = fs.readFileSync('users.json', 'utf8');
    users = JSON.parse(usersData);
} catch (error) {
    users = { 'admin': { password: 'admin123', role: 'admin', email: 'admin@attire.com' }, 'user1': { password: 'user123', role: 'user', email: 'user1@example.com' } };
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// Load cart from cart.json
let cart = [];
try {
    const cartData = fs.readFileSync('cart.json', 'utf8');
    cart = JSON.parse(cartData);
} catch (error) {
    cart = [];
    fs.writeFileSync('cart.json', JSON.stringify(cart, null, 2));
}

// Load wishlist from wishlist.json
let wishlist = [];
try {
    const wishlistData = fs.readFileSync('wishlist.json', 'utf8');
    wishlist = JSON.parse(wishlistData);
} catch (error) {
    wishlist = [];
    fs.writeFileSync('wishlist.json', JSON.stringify(wishlist, null, 2));
}

// In-memory session store
let sessions = {};

// Load checkouts from checkouts.json
let checkouts = [];
try {
    const checkoutsData = fs.readFileSync('checkouts.json', 'utf8');
    checkouts = JSON.parse(checkoutsData);
} catch (error) {
    checkouts = [];
    fs.writeFileSync('checkouts.json', JSON.stringify(checkouts, null, 2));
}

app.get('/cart', (req, res) => res.json(cart));
app.post('/cart', (req, res) => {
    const product = { ...req.body, price: parseFloat(req.body.price) };
    const existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity += product.quantity;
    } else {
        cart.push(product);
    }
    fs.writeFileSync('cart.json', JSON.stringify(cart, null, 2));
    res.status(201).json({ message: 'Item added to cart' });
});
// Contact form handler
app.post('/contact', (req, res) => {
    // You can access form data via req.body
    // For now, just log it and return a success response
    console.log('Contact form submission:', req.body);
    res.status(200).json({ message: 'Contact form received!' });
});
app.put('/cart/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    const item = cart.find(item => item.id === id);
    if (item && quantity > 0) {
        item.quantity = quantity;
        fs.writeFileSync('cart.json', JSON.stringify(cart, null, 2));
        res.json({ message: 'Quantity updated' });
    } else {
        res.status(404).json({ message: 'Item not found' });
    }
});
app.delete('/cart/:id', (req, res) => {
    const id = parseInt(req.params.id);
    cart = cart.filter(item => item.id !== id);
    fs.writeFileSync('cart.json', JSON.stringify(cart, null, 2));
    res.json({ message: 'Item removed' });
});

app.get('/wishlist', (req, res) => res.json(wishlist));
app.post('/wishlist', (req, res) => {
    const product = { ...req.body, price: parseFloat(req.body.price) };
    const existingProduct = wishlist.find(item => item.id === product.id);
    if (existingProduct) {
        res.status(409).json({ message: 'Item already in wishlist' });
    } else {
        wishlist.push(product);
        fs.writeFileSync('wishlist.json', JSON.stringify(wishlist, null, 2));
        res.status(201).json({ message: 'Item added to wishlist' });
    }
});
app.delete('/wishlist/:id', (req, res) => {
    const id = parseInt(req.params.id);
    wishlist = wishlist.filter(item => item.id !== id);
    fs.writeFileSync('wishlist.json', JSON.stringify(wishlist, null, 2));
    res.json({ message: 'Item removed from wishlist' });
});

app.post('/checkout', (req, res) => {
    const checkoutData = req.body;
    checkouts.push(checkoutData);
    fs.writeFileSync('checkouts.json', JSON.stringify(checkouts, null, 2));
    cart = []; // Clear cart after checkout
    fs.writeFileSync('cart.json', JSON.stringify(cart, null, 2));
    res.json({ message: 'Checkout successful' });
});

app.get('/checkouts', (req, res) => {
    res.json(checkouts);
});

app.put('/checkouts/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { status, deliveryStatus } = req.body;
    const checkout = checkouts[id];
    if (checkout) {
        if (status) checkout.status = status;
        if (deliveryStatus) checkout.deliveryStatus = deliveryStatus;
        fs.writeFileSync('checkouts.json', JSON.stringify(checkouts, null, 2));
        res.json({ message: 'Status updated' });
    } else {
        res.status(404).json({ message: 'Checkout not found' });
    }
});

app.post('/signup', (req, res) => {
    const { username, password, email } = req.body;
    if (users[username]) {
        res.status(400).json({ message: 'Username already exists' });
    } else {
        users[username] = { password, role: 'user', email };
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
        res.status(201).json({ message: 'Signup successful' });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username].password === password) {
        sessions[username] = { username, role: users[username].role, email: users[username].email };
        res.json({ username, role: users[username].role, email: users[username].email });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

app.post('/logout', (req, res) => {
    const user = Object.keys(sessions)[0];
    if (user) delete sessions[user];
    res.json({ message: 'Logged out' });
});

app.get('/session', (req, res) => {
    const user = Object.values(sessions)[0] || {};
    res.json(user);
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));