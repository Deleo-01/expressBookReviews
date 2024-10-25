const express = require('express');
const axios = require('axios');
const bcrypt = require('bcrypt');
const { authenticateJWT } = require('./auth_users.js');  /* Import authenticateJWT */
let books = require('./booksdb.js');  /* Import books only once */
let isValid = require("./auth_users.js").isValid;  /* Import isValid function */
let users = require("./auth_users.js").users;  /* Import users array */
const public_users = express.Router();

/* Async callback function to get all books */
const getAllBooks = async (req, res) => {
    try {
        res.status(200).json(books); /* Send the books object as a response */
    } catch (error) {
        res.status(500).json({ message: "Error fetching books" });
    }
};

/* Route to fetch all books */
public_users.get('/books', getAllBooks);

/* Function to search by ISBN using Promises */
const searchByISBN = (req, res) => {
    const isbn = req.params.isbn;  /* Get ISBN from URL parameters */
    const book = books[isbn];      /* Find the book by ISBN */

    /* Return a promise */
    return new Promise((resolve, reject) => {
        if (book) {
            resolve(book);  /* Book found, resolve the promise */
        } else {
            reject('Book not found');  /* Book not found, reject the promise */
        }
    })
    .then((bookDetails) => {
        res.status(200).json(bookDetails);  /* Send book details as response */
    })
    .catch((error) => {
        res.status(404).json({ message: error });  /* Handle error case */
    });
};

/* Route to search for a book by ISBN */
public_users.get('/books/isbn/:isbn', searchByISBN);

module.exports.general = public_users;

/* Function to search by Author using Promises */
const searchByAuthor = (req, res) => {
    const author = req.params.author;  /* Get author name from URL parameters */

    /* Return a promise to search books by author */
    return new Promise((resolve, reject) => {
        const booksByAuthor = Object.values(books).filter(book => book.author === author); /* Filter books by author */
        
        if (booksByAuthor.length > 0) {
            resolve(booksByAuthor);  /* If books are found, resolve the promise */
        } else {
            reject('No books found by this author');  /* If no books, reject the promise */
        }
    })
    .then((books) => {
        res.status(200).json(books);  /* Send the filtered books as response */
    })
    .catch((error) => {
        res.status(404).json({ message: error });  /* Handle error if no books are found */
    });
};

/* Route to search for books by author */
public_users.get('/books/author/:author', searchByAuthor);

/* Function to search by Title using Promises */
const searchByTitle = (req, res) => {
    const title = req.params.title;  /* Get title from URL parameters */

    /* Return a promise to search books by title */
    return new Promise((resolve, reject) => {
        const booksByTitle = Object.values(books).filter(book => book.title === title);  /* Filter books by title */

        if (booksByTitle.length > 0) {
            resolve(booksByTitle);  /* If books are found, resolve the promise */
        } else {
            reject('No books found with this title');  /* If no books are found, reject the promise */
        }
    })
    .then((books) => {
        res.status(200).json(books);  /* Send the filtered books as response */
    })
    .catch((error) => {
        res.status(404).json({ message: error });  /* Handle error if no books are found */
    });
};

/* Route to search for books by title */
public_users.get('/books/title/:title', searchByTitle);

/* GET reviews of a book by ISBN */
public_users.get('/books/:isbn/reviews', (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (book && book.reviews) {
        res.status(200).json(book.reviews);  /* Send the reviews if they exist */
    } else {
        res.status(404).json({ message: "Reviews not found" });
    }
});

/* DELETE: Allow logged-in users to delete their own reviews */
public_users.delete("/books/:isbn/reviews/:username", authenticateJWT, (req, res) => {
    const isbn = req.params.isbn;
    const { username } = req.params;
    const book = books[isbn];

    if (book && book.reviews[username]) {
        delete book.reviews[username];  /* Remove the review from the book */
        res.status(200).json({ message: "Review deleted successfully" });
    } else {
        res.status(404).json({ message: "Review not found" });
    }
});

/* POST: Register a new user */
public_users.post("/users/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    if (isValid(username)) {
        return res.status(409).json({ message: "User already exists" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);  /* Hash the password */
        users.push({ username, password: hashedPassword });  /* Store user with hashed password */
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user" });
    }
});

module.exports.general = public_users; 
