const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

/* returns true if username is available (not already present) */
const isValid = (username) => {
  if (!username) return false;
  return !users.some(u => u.username === username);
}

/* returns true if username/password match a registered user */
const authenticatedUser = (username, password) => {
  if (!username || !password) return false;
  return users.some(u => u.username === username && u.password === password);
}

//only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  // basic validation
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  // verify credentials
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // sign a JWT. In production, use process.env.JWT_SECRET instead of "access"
  const token = jwt.sign({ username }, "access", { expiresIn: "1h" });

  // save to session authorization (index.js must have session middleware mounted for /customer)
  if (req.session) {
    req.session.authorization = {
      accessToken: token,
      username: username
    };
  }

  return res.status(200).json({ message: "User successfully logged in", token });
});

// Add or update a book review (only for logged-in users)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  if (!isbn) {
    return res.status(400).json({ message: "ISBN parameter is required" });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  const review = req.query.review || (req.body && req.body.review);
  if (!review) {
    return res.status(400).json({ message: "Review text is required (send in body as { review: '...' } or as ?review=...)" });
  }

  const username = req.session && req.session.authorization && req.session.authorization.username;
  if (!username) {
    return res.status(401).json({ message: "User not logged in" });
  }

  if (!book.reviews) book.reviews = {};
  book.reviews[username] = review;

  return res.status(200).json({
    message: `Review added/updated for ISBN ${isbn}`,
    reviews: book.reviews
  });
});

// Delete a book review (only the logged-in user's review)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  if (!isbn) {
    return res.status(400).json({ message: "ISBN parameter is required" });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  // get username from session (must be logged in)
  const username = req.session && req.session.authorization && req.session.authorization.username;
  if (!username) {
    return res.status(401).json({ message: "User not logged in" });
  }

  // if there are no reviews, nothing to delete
  if (!book.reviews || Object.keys(book.reviews).length === 0) {
    return res.status(404).json({ message: `No reviews found for ISBN ${isbn}` });
  }

  // if this user has no review on this book, cannot delete someone else's review
  if (!Object.prototype.hasOwnProperty.call(book.reviews, username)) {
    return res.status(403).json({ message: "You do not have a review for this book to delete" });
  }

  // delete the user's review
  delete book.reviews[username];

  // If reviews object becomes empty, you may choose to set it to {} or delete it entirely.
  // Keep it as an empty object for simplicity:
  if (Object.keys(book.reviews).length === 0) {
    book.reviews = {};
  }

  return res.status(200).json({
    message: `Review deleted for ISBN ${isbn} by user ${username}`,
    reviews: book.reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
