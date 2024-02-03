// Import Mongoose library
const mongoose = require('mongoose');

// Define Mongoose schema for 'user' collection
const userSchema = new mongoose.Schema({
    // Username, required String
    username: { required: true, type: String },
    
    // Email, required String
    email: { type: String, required: true },

    // Password, required String
    password: { type: String, required: true },

    // One-time password (OTP), String
    otp: String,

    // OTP Expiration time, String
    expTime: String,

    

    // Verification status, Boolean
    verified: Boolean
});

// Create Mongoose model 'user' based on userSchema
const UserModel = new mongoose.model('user', userSchema);

// Export userModel for use in other files
module.exports = UserModel;
