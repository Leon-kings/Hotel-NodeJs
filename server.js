const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const messageRoutes = require('./routes/messageRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const bookRoutes = require('./routes/bookRoutes')
const userRoutes = require('./routes/userRoutes')
dotenv.config();
require('dotenv').config();
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

app.use('/63729/892308', messageRoutes);
// After other middleware
app.use('/83920/92303', subscriptionRoutes);
// 
app.use('/84383/92823', bookRoutes);
// Start the server
app.use('/37829/7892', userRoutes);
// 
app.listen(PORT, () => console.log(`App started on port ${PORT}`));

// Exporting the app for testing or other purposes
module.exports = app;
