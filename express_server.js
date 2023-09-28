const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser"); // Require cookie-parser

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
    user: users[req.cookies["user_id"]] // Pass the user object
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // Get the longURL from the form data
  const shortURL = generateRandomString(); // Generate a random short URL

  // Save the id-longURL pair to urlDatabase
  urlDatabase[shortURL] = longURL;

  console.log(`Long URL: ${longURL}, Short URL: ${shortURL}`);

  // Respond with a redirect to the new short URL page
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]] // Pass the user object
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]] // Pass the user object
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

  // Use the delete operator to remove the URL from urlDatabase
  delete urlDatabase[shortURL];

  // Redirect the client back to the urls_index page ("/urls")
  res.redirect("/urls");
});

// Add a new route to handle URL updates
app.post("/urls/:id/update", (req, res) => {
  const shortURL = req.params.id; // Extract the shortURL from the request parameters
  const newLongURL = req.body.newLongURL; // Get the updated longURL from the form data

  // Update the long URL in the urlDatabase
  urlDatabase[shortURL] = newLongURL;

  // Redirect to the URL show page for the updated URL
  res.redirect(`/urls/${shortURL}`);
});

// Login
app.post("/login", (req, res) => {
  const username = req.body.username; // Get the username from the request body

  // Set a cookie named "user_id" with the value submitted in the request body
  const userId = generateRandomString();
  res.cookie("user_id", userId);

  // Add the user object to the users object
  users[userId] = {
    id: userId,
    email: username,
    password: "", // You can add password logic here
  };

  // Redirect the browser back to the /urls page
  res.redirect("/urls");
});

// Logout endpoint
app.post("/logout", (req, res) => {
  // Clear the user_id cookie
  const userId = req.cookies["user_id"];
  delete users[userId];
  res.clearCookie("user_id");

  // Redirect the user back to the /urls page (for now)
  res.redirect("/urls");
});

// GET /register endpoint
app.get("/register", (req, res) => {
  res.render("registration");
});

app.post("/register", (req, res) => {
  const userId = generateRandomString(); // Generate a random user ID
  const { email, password } = req.body; // Get user data from the form

  // Check if the email or password is empty
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }

  // Check if the email is already in use
  for (const existingUserId in users) {
    if (users[existingUserId].email === email) {
      res.status(400).send("Email is already registered.");
      return;
    }
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

function generateRandomString() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
