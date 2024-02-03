// Import the Mongoose library
const mongoose = require('mongoose');

// Define an asynchronous function named Connect to establish a connection to the database
const Connect = async () => {
    try {
        // Log a message indicating the start of the connection process
        console.log("Connecting to DataBase...");

        // Get the database URL from the environment variables
        const DB_url = `${process.env.DATABASE_URL}`;

        // Use Mongoose to connect to the database with specified options
        await mongoose.connect(DB_url);

        // Log a success message if the connection is established
        console.log("Successfully Connected to DataBase ✅");
    }
    catch (error) {
        // Log an error message if there's an issue with the database connection
        console.error(`❌Connection Error: ${error}`);
    }
}

// Export the Connect function to make it accessible in other files
module.exports = Connect;
