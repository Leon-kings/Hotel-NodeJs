const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const messageRoutes = require('./routes/messageRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(cors());

// Database connection
mongoose
  .connect(process.env.DB)
  .then(() => console.log('Database connected'))
  .catch((err) => console.log(err));

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Welcome to my API' });
});

app.use('/api/messages', messageRoutes);
// After other middleware
app.use('/api/subscriptions', subscriptionRoutes);

// Start the server
app.listen(PORT, () => console.log(`App started on port ${PORT}`));

// Exporting the app for testing or other purposes
module.exports = app;
