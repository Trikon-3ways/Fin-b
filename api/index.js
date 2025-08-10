import express from 'express';
import mongoose from 'mongoose';
import financialRecordRouter from "../routes/financial-records.js";
import cors from 'cors';

const app = express();

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: true, // Allow all origins temporarily for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Personal Expense Tracker API is running!' });
});

app.use("/financial-records", financialRecordRouter);

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection string
const MONGOURI = process.env.MONGOURI || 'mongodb+srv://vermaroli89:fAIamwYiVIlKKJez@personalexpensetracker.kpm5gmx.mongodb.net/personalexpensetracker';

// MongoDB connection state
let isConnected = false;
let connectionPromise = null;
let retryCount = 0;
const MAX_RETRIES = 5;

// Connect to MongoDB function with ultra-aggressive timeouts
const connectDB = async () => {
  // Check if already connected and healthy
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    return;
  }
  
  // If connection is in progress, wait for it
  if (connectionPromise) {
    console.log('⏳ MongoDB connection in progress, waiting...');
    await connectionPromise;
    return;
  }
  
  try {
    console.log(`🚀 Connecting to MongoDB (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
    console.log('MongoDB URI:', MONGOURI.substring(0, 50) + '...');
    
    // Force disconnect any existing connection
    if (mongoose.connection.readyState !== 0) {
      console.log('🔄 Force disconnecting existing connection...');
      await mongoose.disconnect();
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for cleanup
    }
    
    connectionPromise = mongoose.connect(MONGOURI, {
      serverSelectionTimeoutMS: 1000, // Even more aggressive
      socketTimeoutMS: 2000, // Even more aggressive
      bufferCommands: false, // Critical for serverless
      maxPoolSize: 1, // Minimal pool
      minPoolSize: 1,
      maxIdleTimeMS: 3000, // Very short
      connectTimeoutMS: 1000, // Even more aggressive
      heartbeatFrequencyMS: 2000, // Very frequent
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
      // Additional serverless optimizations
      family: 4, // Force IPv4
      keepAlive: true,
      keepAliveInitialDelay: 500,
      // Force immediate connection
      directConnection: true,
      // Disable DNS caching
      dnsServer: '8.8.8.8',
    });
    
    await connectionPromise;
    isConnected = true;
    connectionPromise = null;
    retryCount = 0;
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error(`❌ MongoDB connection failed (attempt ${retryCount + 1}):`, error.message);
    console.error('Full error:', error);
    isConnected = false;
    connectionPromise = null;
    
    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRIES - 1) {
      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Exponential backoff, max 5s
      console.log(`🔄 Retrying connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(); // Recursive retry
    } else {
      retryCount = 0;
      throw error; // Max retries reached
    }
  }
};

// Connect on first request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Export for Vercel
export default app; 