const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect to database and seed superadmin
connectDB().then(async () => {
  const User = require('./models/User');
  const exists = await User.findOne({ username: 'superadmin' });
  if (!exists) {
    await User.create({ username: 'superadmin', password: 'Admin@123', name: 'Super Admin', role: 'superadmin' });
    console.log('[Auth] Superadmin created — username: superadmin | password: Admin@123');
  }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/student-inventory', require('./routes/studentInventoryRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/ledger', require('./routes/ledgerRoutes'));
app.use('/api/cashbook', require('./routes/cashbookRoutes'));
app.use('/api/daybook', require('./routes/daybookRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
