const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;  /* Import customer routes */
const genl_routes = require('./router/general.js').general;  /* Import general routes */

const app = express();

app.use(express.json());  /* Middleware to parse JSON bodies */

/* Configure session for the /customer route */
app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

/* JWT Authentication Middleware for customer/auth routes */
app.use("/customer/auth/*", function auth(req, res, next) {
    const token = req.headers.authorization;  /* Retrieve the token from the authorization header */
    if (!token) {
        return res.status(403).json({ message: "Token required" });  /* Return an error if no token is provided */
    }

    /* Verify the JWT token */
    jwt.verify(token.split(' ')[1], "your_jwt_secret_key", (err, user) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized" });  /* If token is invalid, return unauthorized */
        }
        req.user = user;  /* Attach the verified user to the request */
        next();  /* Proceed to the next middleware or route */
    });
});

const PORT = 5000;  /* Define the port on which the server will listen */

/* Importing general routes from general.js */
const general_routes = require('./router/general.js').general;

app.use('/customer', general_routes);  /* Use the customer routes */
app.use("/", genl_routes);  /* Use the general routes for all other paths */

/* Start the server and listen on the specified port */
app.listen(PORT, () => console.log("Server is running on http://localhost:" + PORT));  
