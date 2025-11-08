const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

// session for /customer routes
app.use("/customer", session({
  secret: "fingerprint_customer",
  resave: true,
  saveUninitialized: true
}));

// Authentication middleware for all /customer/auth/* routes
app.use("/customer/auth", function auth(req, res, next) {
  try {
    // Expecting session to have an authorization object like:
    // req.session.authorization = { accessToken: "<JWT token>", username: "..." }
    const sessionAuth = req.session && req.session.authorization;
    if (!sessionAuth || !sessionAuth.accessToken) {
      return res.status(401).json({ message: "Unauthorized: no access token in session." });
    }

    const token = sessionAuth.accessToken;

    // Verify the JWT. Replace "access" with your actual secret if different.
    jwt.verify(token, "access", (err, decoded) => {
      if (err) {
        // token invalid or expired
        return res.status(401).json({ message: "Unauthorized: invalid or expired token." });
      }

      // attach decoded info to request for downstream handlers (optional)
      req.user = decoded;
      // or: req.user = { username: decoded.username } if you only want username

      next();
    });

  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Authentication error." });
  }
});

const PORT = 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));
