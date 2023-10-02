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

// Helper function to return urls for logged on user
const urlsForUser = function(id, loggedInUserId) {
  let userUrls = {};
  for (let url in urlDatabase) {
    const urlInfo = urlDatabase[url];
    if (urlInfo.userID === id && loggedInUserId === id) {
      userUrls[url] = urlInfo;
    }
  }
  return userUrls;
};

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

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
  urlDatabase
};