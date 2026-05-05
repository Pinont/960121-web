/**
 * REGISTRATION SERVICE
 * Business logic for user registration
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const AUTH_DATA_PATH = path.join(__dirname, '../data/auth_user.json');

// ============================================================================
// UTILITIES
// ============================================================================

function loadAuthData() {
  try {
    const rawData = fs.readFileSync(AUTH_DATA_PATH, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading auth data:', error);
    return { users: [] };
  }
}

function saveAuthData(data) {
  try {
    fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving auth data:', error);
    throw new Error('Failed to save user data');
  }
}

function findUserByEmail(email) {
  const authData = loadAuthData();
  return authData.users.find(user => user.username === email || user.email === email);
}

// ============================================================================
// REGISTRATION LOGIC
// ============================================================================

async function registerUser(name, email, password) {
  try {
    // Validate inputs
    if (!name || !email || !password) {
      return {
        success: false,
        message: 'Name, email, and password are required',
        code: 400,
      };
    }

    // Check if email already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return {
        success: false,
        message: 'Email already registered',
        code: 409,
      };
    }

    // Load current auth data
    const authData = loadAuthData();

    // Hash password with bcrypt (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user object
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      username: email.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Append to users array
    authData.users.push(newUser);

    // Write back to file
    saveAuthData(authData);

    return {
      success: true,
      message: 'Registration successful',
      code: 201,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.message || 'Registration failed',
      code: 500,
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

module.exports = {
  registerUser,
  findUserByEmail,
  loadAuthData,
};
