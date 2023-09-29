const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

// Middleware
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// In-memory database for URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// In-memory database for users
const users = {};

// Helper function to generate random strings
const generateRandomString = function () {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// Helper function to find a user by email
const getUserByEmail = function (email, users) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

// Routes

// Root route
app.get("/", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = getUserByEmail(userId, users);
  // Check if the user is logged in
  if (user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// JSON route
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// URL index route
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  // Check if the user is logged in
  if (user) {
    const templateVars = {
      urls: urlDatabase,
      user: user
    };
    res.render("urls_index", templateVars);
  } else {
    // If the user is not logged in, send an error message
    res.send("Error: You must be logged in to view this page.");
  }
});

// URL creation route
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // Get the longURL from the form data
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL; // Save the id-longURL pair to urlDatabase

  console.log(`Long URL: ${longURL}, Short URL: ${shortURL}`);
  res.redirect(`/urls/${shortURL}`);
});

// URL new route
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = getUserByEmail(userId, users);
  if (user) {
    res.render("urls_new", { user });
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id; // Extract the shortURL from the request parameters
  const longURL = urlDatabase[shortURL]; // Look up the longURL in the urlDatabase

  // Check if the longURL exists in the database
  if (longURL) {
    res.redirect(longURL); // Redirect to the longURL
  } else {
    res.status(404).send("URL not found"); // Handle the case where the shortURL doesn't exist
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id; // Extract the shortURL from the request parameters
  delete urlDatabase[shortURL]; // Use the delete operator to remove the URL from urlDatabase
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.newLongURL;
  urlDatabase[shortURL] = newLongURL; // Update the long URL in the urlDatabase
  res.redirect(`/urls/${shortURL}`); // Redirect to the URL show page for the updated URL
});



// Registration form
app.get("/register", (req, res) => {
  res.render("registration");
});

// Handle registration form submission
app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }

  if (getUserByEmail(email, users)) {
    res.status(400).send("Email is already registered.");
    return;
  }

  users[userId] = {
    id: userId,
    email: email,
    password: password,
  };

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

// Login form
app.get("/login", (req, res) => {
  res.render("login");
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user || user.password !== password) {
    res.status(403).send("Invalid email or password");
    return;
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
