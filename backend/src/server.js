require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Initialize Database Connection
connectDB().then(() => {
  // Start Listening
  app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` CivicFix API Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(` Listening on PORT: ${PORT}`);
    console.log(` API Endpoint: http://localhost:${PORT}`);
    console.log(`=============================================`);
  });
}).catch(err => {
  console.error('Failed to initialize MongoDB:', err.message);
  process.exit(1);
});
