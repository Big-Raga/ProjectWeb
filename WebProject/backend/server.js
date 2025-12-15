require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet'); // Security headers
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const documentRoutes = require('./routes/documents');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet()); // Adds secure HTTP headers

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/academicbot')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);

// SSL/HTTPS Configuration Note:
// In production, use Nginx/Apache for SSL termination.
// For Node.js direct HTTPS, use 'https' module with fs.readFileSync for key/cert.

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
