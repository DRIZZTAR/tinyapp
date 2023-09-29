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
const generateRandomString = function() {
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
const getUserByEmail = function(email, users) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

// Routes

// Root route - Redirects to login if not logged in, else redirects to /urls
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

// JSON route - Returns JSON representation of urlDatabase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// URL index route - If user is logged in, render urls_index page. Else, send error message.
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

// URL creation route - Generate short URL, save it to urlDatabase, and redirect to /urls/:shortURL
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // Get the longURL from the form data
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL; // Save the id-longURL pair to urlDatabase

  console.log(`Long URL: ${longURL}, Short URL: ${shortURL}`);
  res.redirect(`/urls/${shortURL}`);
});

// URL new route - If user is logged in, render urls_new page. Else, redirect to login.
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (user) {
    res.render("urls_new", { user });
  } else {
    res.redirect("/login");
  }
});

// URL show route - Render urls_show page with short URL, corresponding long URL, and user data
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

// URL update route - If user is logged in and owns the URL, update the URL and redirect to /urls. Else, send error message.
app.post("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (!user) {
    res.send("Error: You must be logged in to update URLs.");
  } else if (!longURL) {
    res.send("Error: The URL for the given ID does not exist.");
  } else if (longURL.userId !== userId) {
    res.send("Error: You do not own the URL with the given ID.");
  } else {
    longURL.url = req.body.newLongURL; // Update the long URL
    res.redirect("/urls");
  }
});

// URL redirect route - If long URL exists, redirect to long URL. Else, send error message.
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

// URL delete route - If user is logged in and owns the URL, delete the URL and redirect to /urls. Else, send error message.
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (!user) {
    res.send("Error: You must be logged in to delete URLs.");
  } else if (!longURL) {
    res.send("Error: The URL for the given ID does not exist.");
  } else if (longURL.userId !== userId) {
    res.send("Error: You do not own the URL with the given ID.");
  } else {
    delete urlDatabase[shortURL]; // Delete the URL from urlDatabase
    res.redirect("/urls");
  }
});

// Registration route form - If user is logged in, redirect to /urls. Else, render registration page.
app.get("/registration", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("registration", { user });
  }
});

// Registration post - If email or password are empty or email already exists, send error message. Else, create new user, set cookie, and redirect to /urls.
app.post("/registration", (req, res) => {
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

// Login route - If user is logged in, redirect to /urls. Else, render login page.
app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("login", { user });
  }
});

// Login post - If email or password are invalid, send error message. Else, set cookie and redirect to /urls.
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

// Logout post - Clear cookie and redirect to login.
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});