// Import the Express.js framework
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to upload files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});

const upload = multer({ storage: storage });

// MySQL connection 
const connection = mysql.createConnection({
    // host: 'localhost',
    // user: 'root',
    // password: '',
    // database: 'products'

    host: 'sql.freedb.tech',
    user: 'freedb_23007696',
    password: 'HbY8g*59&%j$7zz',
    database: 'freedb_techxproject'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine 
app.set('view engine', 'ejs');
// Enable static files 
app.use(express.static('public'));
// Enable form processing
app.use(express.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    const queries = [
        'SELECT * FROM laptops',
        'SELECT * FROM phones',
        'SELECT * FROM accessories'
    ];

    let laptops = [], phones = [], accessories = [];

    connection.query(queries[0], (error, results) => {
        if (error) throw error;
        laptops = results;

        connection.query(queries[1], (error, results) => {
            if (error) throw error;
            phones = results;

            connection.query(queries[2], (error, results) => {
                if (error) throw error;
                accessories = results;

                res.render('index', { laptops, phones, accessories });
            });
        });
    });
});

// Route to display only laptops
app.get('/categories/laptops', function (req, res) {
    const sql = 'SELECT * FROM laptops';
    connection.query(sql, (error, results) => {
        if (error) throw error;
        res.render('laptops', { laptops: results });
    });
});

// Route to display only phones
app.get('/categories/phones', function (req, res) {
    const sql = 'SELECT * FROM phones';
    connection.query(sql, (error, results) => {
        if (error) throw error;
        res.render('phones', { phones: results });
    });
});

// Route to display only accessories
app.get('/categories/accessories', function (req, res) {
    const sql = 'SELECT * FROM accessories';
    connection.query(sql, (error, results) => {
        if (error) throw error;
        res.render('accessories', { accessories: results });
    });
});

// Route to get a specific product by ID and category
app.get('/products/:category/:id', function (req, res) {
    const category = req.params.category;
    const productId = parseInt(req.params.id);
    const sql = `SELECT * FROM ${category} WHERE id = ?`;

    connection.query(sql, [productId], (error, results) => {
        if (error) throw error;
        const product = results[0];
        if (product) {
            res.render('productInfo', { product, category });
        } else {
            res.status(404).send('Product not found');
        }
    });
});

// Add a new product form
app.get('/addProductForm', function (req, res) {
    res.render('addProduct');
});

// Add a new product
app.post('/products', upload.single('image'), (req, res) => {
    const { category, name, price, quantity } = req.body;
    const image = req.file ? req.file.filename : 'default-product.jpg'; // Use default if no image
    const sql = `INSERT INTO ${category} (name, price, quantity, image) VALUES (?, ?, ?, ?)`;

    connection.query(sql, [name, price, quantity, image], (error, results) => {
        if (error) return handleError(res, error);
        res.redirect('/');
    });
});

// Update a product by ID - First find the product
app.get('/products/:category/:id/update', function (req, res) {
    const category = req.params.category;
    const productId = parseInt(req.params.id);
    const sql = `SELECT * FROM ${category} WHERE id = ?`;

    connection.query(sql, [productId], (error, results) => {
        if (error) throw error;
        const product = results[0];
        res.render('updateProduct', { product, category });
    });
});

// Update a product by ID
app.post('/products/:category/:id/update', upload.single('image'), (req, res) => {
    const category = req.params.category;
    const id = parseInt(req.params.id);
    const { name, price, quantity } = req.body;
    const image = req.file ? req.file.filename : null;

    let sql = `UPDATE ${category} SET name = ?, price = ?, quantity = ?`;
    let params = [name, price, quantity];

    if (image) {
        sql += `, image = ?`;
        params.push(image);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    connection.query(sql, params, (error, results) => {
        if (error) return handleError(res, error);
        res.redirect('/');
    });
});

// Delete a product by ID
app.post('/products/:category/:id/delete', (req, res) => {
    const category = req.params.category;
    const productId = parseInt(req.params.id);
    const sql = `DELETE FROM ${category} WHERE id = ?`;

    connection.query(sql, [productId], (error, results) => {
        if (error) throw error;
        res.redirect('/');
    });
});

// Route to Shopping Cart
app.get('/cart', (req, res) => {
    const sql = 'SELECT * FROM cart';
    connection.query(sql, (error, results) => {
        if (error) throw error;
        res.render('cart', { cart: results });
    });
});

// Route to add a product to the cart
app.post('/cart/add', (req, res) => {
    const { userId, itemName, quantity, price, image } = req.body;
    const totalAmount = price * quantity;
    const sql = `INSERT INTO cart (userID, itemName, quantity, price, totalAmount, image) VALUES (?, ?, ?, ?, ?,?)`;

    connection.query(sql, [userId, itemName, quantity, price, totalAmount, image], (error, results) => {
        if (error) throw error;
        res.redirect('/cart');
    });
});

// Route to remove an item from the cart
app.post('/cart/:id/deleteItem', (req, res) => {
    const cartItemId = parseInt(req.params.id);
    const sql = 'DELETE FROM cart WHERE id = ?';

    connection.query(sql, [cartItemId], (error, results) => {
        if (error) throw error;
        res.redirect('/cart');
    });
});

// Route to handle checkout
app.post('/cart/checkout', (req, res) => {
    // Add your checkout logic here (e.g., process payment, clear the cart, etc.)
    const sql = 'DELETE FROM cart';
    connection.query(sql, (error, results) => {
        if (error) throw error;
        res.redirect('/cart');
    });
});

// Start the server and listen on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));
