const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(cookieParser()); // Use cookie-parser middleware

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));

const users = {};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // Get the longURL from the form data
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL; // Save the id-longURL pair to urlDatabase

  console.log(`Long URL: ${longURL}, Short URL: ${shortURL}`);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
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

// POST /login endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if the email exists in the users object
  const user = getUserByEmail(email, users);

  // If the user doesn't exist or the password is incorrect, return a 403 error
  if (!user || user.password !== password) {
    res.status(403).send("Invalid email or password");
    return;
  }

  // If the email and password are correct, set the user_id cookie and redirect to /urls
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// Display the login form
app.get("/login", (req, res) => {
  res.render("login");
});

// Logout endpoint
app.post("/logout", (req, res) => {
  const userId = req.cookies["user_id"]; // Clear the user_id cookie
  delete users[userId];
  res.clearCookie("user_id"); // Clear the user_id cookie
  res.redirect("/login");
});


// GET /register endpoint
app.get("/register", (req, res) => {
  res.render("registration");
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }

  // Use the helper function to check for an existing email
  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    res.status(400).send("Email is already registered.");
    return;
  }

  // Create a new user object and add it to the users object
  users[userId] = {
    id: userId,
    email: email,
    password: password,
  };

  // Set a user_id cookie containing the user's ID
  res.cookie("user_id", userId);

  // Redirect the user to the /urls page
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = function() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const getUserByEmail = function(email, users) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null; // Return null if the email is not found
};