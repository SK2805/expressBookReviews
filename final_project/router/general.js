const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

/**
 * Internal endpoint used for async Axios fetches
 */
public_users.get('/books-data', (req, res) => {
  return res.json(books);
});

/**
 * Task 10: Get all books (async/await + Axios)
 */
public_users.get('/', async function (req, res) {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const response = await axios.get(`${baseUrl}/books-data`);
    return res.send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    console.error("Error fetching books:", error.message || error);
    return res.status(500).json({ message: "Unable to fetch books" });
  }
});

/**
 * Task 11: Get book details based on ISBN (async/await + Axios)
 */
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const isbn = req.params.isbn;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const response = await axios.get(`${baseUrl}/books-data`);
    const allBooks = response.data;

    const book = allBooks[isbn];
    if (!book) {
      return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }

    return res.send(JSON.stringify(book, null, 4));
  } catch (error) {
    console.error("Error fetching book by ISBN:", error.message || error);
    return res.status(500).json({ message: "Unable to fetch book details" });
  }
});

/**
 * Task 12: Get book details based on Author (async/await + Axios)
 */
public_users.get('/author/:author', async function (req, res) {
  try {
    const authorParam = req.params.author;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const response = await axios.get(`${baseUrl}/books-data`);
    const allBooks = Object.values(response.data);

    const matches = allBooks.filter(
      (book) => book.author && book.author.toLowerCase() === authorParam.toLowerCase()
    );

    if (!matches.length) {
      return res.status(404).json({ message: `No books found by author '${authorParam}'` });
    }

    return res.send(JSON.stringify(matches, null, 4));
  } catch (error) {
    console.error("Error fetching books by author:", error.message || error);
    return res.status(500).json({ message: "Unable to fetch books by author" });
  }
});

/**
 * ✅ Task 13: Get book details based on Title (async/await + Axios)
 */
public_users.get('/title/:title', async function (req, res) {
  try {
    const titleParam = req.params.title;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Fetch all books asynchronously
    const response = await axios.get(`${baseUrl}/books-data`);
    const allBooks = Object.values(response.data);

    // Filter by title (case-insensitive)
    const matches = allBooks.filter(
      (book) => book.title && book.title.toLowerCase() === titleParam.toLowerCase()
    );

    if (!matches.length) {
      return res.status(404).json({ message: `No books found with title '${titleParam}'` });
    }

    return res.send(JSON.stringify(matches, null, 4));
  } catch (error) {
    console.error("Error fetching books by title:", error.message || error);
    return res.status(500).json({ message: "Unable to fetch books by title" });
  }
});

/**
 * Register a new user (synchronous)
 */
public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (typeof isValid === "function") {
    if (!isValid(username)) {
      return res.status(409).json({ message: "User already exists" });
    }
  } else {
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ message: "User already exists" });
    }
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});

/**
 * Get book review (synchronous)
 */
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  return res.send(JSON.stringify(book.reviews || {}, null, 4));
});

module.exports.general = public_users;
