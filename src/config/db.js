const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI is not defined in environment variables. Please set it in your .env file.');
    process.exit(1);
}

// Additional check to prevent localhost MongoDB URI in production deployment
const isProduction = process.env.NODE_ENV === 'production';
const forbiddenHosts = ['localhost', '127.0.0.1', '::1'];
const uriLower = process.env.MONGO_URI ? process.env.MONGO_URI.toLowerCase() : '';

if (isProduction) {
    for (const host of forbiddenHosts) {
        if (uriLower.includes(host)) {
            console.error(`Error: MONGO_URI contains forbidden host "${host}" for production environment. Please use a remote MongoDB URI.`);
            process.exit(1);
        }
    }
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1); // Exit the process with failure
    }
}

module.exports = connectDB
