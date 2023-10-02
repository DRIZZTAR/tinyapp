const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { getUserByEmail, generateRandomString } = require("./helper");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

// In-memory database for users
const users = {};

// Function to filter URLs for a specific user
const urlsForUser = function(id) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

// Routes

// Root route - Redirects to login if not logged in, else redirects to /urls
app.get("/", (req, res) => {
  const userId = req.session.user_id;
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

// URL index route - If user is logged in, render urls_index page with URLs created by the user. Else, send error message.
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  // Check if the user is logged in
  if (user) {
    const userURLs = urlsForUser(userId);
    const templateVars = {
      urls: userURLs,
      user: user
    };
    res.render("urls_index", templateVars);
  } else {
    // Send an error message when a user attempts to access /urls without being logged in
    res.send("Error: You must be logged in to view this page.");
  }
});

// URL creation route - Generate short URL, save it to urlDatabase, and redirect to /urls/:shortURL
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (!user) {
    res.status(401).send("Error: You must be logged in to shorten URLs.");
  } else {
    const longURL = req.body.longURL;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: userId
    };
    console.log(`Long URL: ${longURL}, Short URL: ${shortURL}`);
    res.redirect(`/urls/${shortURL}`);
  }
});

// URL new route - If user is logged in, render urls_new page. Else, redirect to login.
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (user) {
    res.render("urls_new", { user });
  } else {
    res.redirect("/login"); // Redirect to the login page if not logged in
  }
});

// URL show route - Render urls_show page with short URL, corresponding long URL, and user data
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (!user) {
    res.send("Error: You must be logged in to view this page.");
    return;
  }
  const url = urlDatabase[req.params.id];
  if (url.userID !== userId) {
    res.send("Error: You do not own this URL.");
    return;
  }
  const templateVars = {
    id: req.params.id,
    longURL: url.longURL,
    user: user
  };
  res.render("urls_show", templateVars);
});

// URL update route - If user is logged in and owns the URL, update the URL and redirect to /urls. Else, send error message.
app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!user) {
    res.send("Error: You must be logged in to update URLs.");
  } else if (!url) {
    res.send("Error: The URL for the given ID does not exist.");
  } else if (url.userID !== userId) {
    res.send("Error: You do not own the URL with the given ID.");
  } else {
    url.longURL = req.body.newLongURL;
    res.redirect("/urls");
  }
});

// URL redirect route - If long URL exists, redirect to long URL. Else, send error message.
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (url) {
    res.redirect(url.longURL);
  } else {
    res.status(404).send('<html><body><h1>URL not found</h1></body></html>');
  }
});

// URL delete route - If user is logged in and owns the URL, delete the URL and redirect to /urls. Else, send error message.
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!user) {
    res.send("Error: You must be logged in to delete URLs.");
  } else if (!url) {
    res.send("Error: The URL for the given ID does not exist.");
  } else if (url.userID !== userId) {
    res.send("Error: You do not own the URL with the given ID.");
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// Registration route form - If user is logged in, redirect to /urls. Else, render registration page.
app.get("/registration", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("registration", { user });
  }
});

// Registration post - If email or password are empty or email already exists, send error message. Else, create new user, set cookie, and redirect to /urls.
app.post("/registration", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }

  if (getUserByEmail(email, users)) {
    res.status(400).send("Email is already registered.");
    return;
  }

  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password

  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword, // Save the hashed password
  };

  // Set the user_id session variable and then redirect to /urls
  req.session.user_id = userId;
  res.redirect("/urls");
});

// Login route - If user is logged in, redirect to /urls. Else, render login page.
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("login", { user });
  }
});

// Login post - If email or password are invalid, send error message. Else, set the session and redirect to /urls.
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Invalid email or password");
    return;
  }

  req.session.user_id = user.id; // Set the session variable
  res.redirect("/urls");
});

// Logout post - Clear the session cookie and redirect to login.
app.post("/logout", (req, res) => {
  req.session = null; // Clear the session data
  res.redirect("/login");
});

// Start the Express server on the specified port and log the listening status
app.listen(PORT, () => {
  console.log(`Express server is now listening on port ${PORT}`);
});

