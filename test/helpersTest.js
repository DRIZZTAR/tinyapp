const { assert } = require('chai');

const { getUserByEmail } = require('../helper.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    // Assert that the user object returned is not null and has the expected user ID
    assert.isNotNull(user, 'User should exist');
    assert.strictEqual(user.id, expectedUserID, 'User ID should match');
  });

  it('should return null for a non-existent email', function() {
    const user = getUserByEmail("nonexistent@example.com", testUsers);
    assert.isNull(user, 'User should be null');
  });

  it('should return a user object with the expected structure', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    assert.isNotNull(user, 'User should exist');
    assert.containsAllKeys(user, ['id', 'email', 'password'], 'User object should have the expected keys');
  });
});