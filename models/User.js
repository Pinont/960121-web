/**
 * User Model
 * Defines the User data schema
 */

class User {
  constructor(id, name, email, username, password, createdAt = null) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.username = username;
    this.password = password;
    this.createdAt = createdAt || new Date().toISOString();
  }

  /**
   * Validate user registration data
   * @returns {Object} { valid: boolean, errors: array }
   */
  static validateRegistration(data) {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Valid name is required');
    }

    if (!data.email || !emailRegex.test(data.email)) {
      errors.push('Valid email is required');
    }

    if (!data.password || data.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate login credentials
   * @returns {Object} { valid: boolean, errors: array }
   */
  static validateLogin(data) {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.email || !emailRegex.test(data.email)) {
      errors.push('Valid email is required');
    }

    if (!data.password) {
      errors.push('Password is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get public user data (without password)
   */
  toPublic() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
    };
  }
}

module.exports = User;
