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
const MAX_RETRIES = 3;

// Connect to MongoDB function with retry logic
const connectDB = async () => {
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
    
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    connectionPromise = mongoose.connect(MONGOURI, {
      serverSelectionTimeoutMS: 3000, // Very aggressive
      socketTimeoutMS: 5000, // Very aggressive
      bufferCommands: false, // Changed back to false
      maxPoolSize: 1, // Minimal pool for serverless
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
      connectTimeoutMS: 5000, // Very aggressive
      heartbeatFrequencyMS: 5000,
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
    });
    
    await connectionPromise;
    isConnected = true;
    connectionPromise = null;
    retryCount = 0;
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error(`❌ MongoDB connection failed (attempt ${retryCount + 1}):`, error.message);
    isConnected = false;
    connectionPromise = null;
    
    // Retry logic
    if (retryCount < MAX_RETRIES - 1) {
      retryCount++;
      console.log(`🔄 Retrying connection in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
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