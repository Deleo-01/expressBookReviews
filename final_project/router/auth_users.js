const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); /* For password hashing */
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = []; /* This will store registered users */

/* Middleware to authenticate JWT token */
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(403).json({ message: "Authorization header required" });
    }

    /* Check if the token is in the correct format: "Bearer <token>" */
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: "Invalid token format" });
    }

    const token = tokenParts[1]; /* The actual token is the second part */

    jwt.verify(token, "your_jwt_secret_key", (err, user) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized, invalid token" });
        }

        req.user = user; /* Attach the user to the request object */
        next(); /* Proceed to the next middleware or route handler */
    });
};

/* Check if the username exists in the system */
const isValid = (username) => {
    return users.some(user => user.username === username);
};

/* Check if username and password match the records */
const authenticatedUser = (username, password) => {
    const user = users.find(user => user.username === username);
    if (!user) return false;
    return bcrypt.compareSync(password, user.password); /* Securely compare password */
};

/* Only registered users can login */
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    if (!authenticatedUser(username, password)) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    /* Generate a JWT token */
    const token = jwt.sign({ username }, "your_jwt_secret_key", { expiresIn: '1h' });
    
    return res.status(200).json({ message: "Login successful", token });
});

/* Register a new user */
regd_users.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    if (isValid(username)) {
        return res.status(409).json({ message: "User already exists" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); /* Hash the password */
        users.push({ username, password: hashedPassword }); /* Store user with hashed password */
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user" });
    }
});

/* Add or modify reviews for a book (JWT-protected) */
regd_users.post("/books/:isbn/reviews", authenticateJWT, (req, res) => {
    const isbn = req.params.isbn;
    const { review } = req.body;
    const book = books[isbn];

    if (book) {
        /* Save the review with the username from the JWT token */
        book.reviews[req.user.username] = review;
        return res.status(200).json({ message: "Review added/updated successfully" });
    } else {
        return res.status(404).json({ message: "Book not found" });
    }
});

/* DELETE: Allow logged-in users to delete their own reviews */
regd_users.delete("/books/:isbn/reviews/:username", authenticateJWT, (req, res) => {
    const isbn = req.params.isbn;
    const { username } = req.params;
    const book = books[isbn];

    if (book && book.reviews[username]) {
        delete book.reviews[username]; /* Remove the review from the book */
        return res.status(200).json({ message: "Review deleted successfully" });
    } else {
        return res.status(404).json({ message: "Review not found" });
    }
});

/* Export the router and necessary functions/variables */
module.exports = {
    authenticateJWT,
    authenticated: regd_users,
    isValid,
    users
};
