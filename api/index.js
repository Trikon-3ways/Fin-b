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

// MongoDB connection test endpoint
app.get('/test-db', async (req, res) => {
  try {
    console.log('🧪 Testing MongoDB connection...');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Is connected:', isConnected);
    
    await connectDB();
    
    console.log('✅ Connection test successful');
    res.json({ 
      message: 'MongoDB connection test successful',
      connectionState: mongoose.connection.readyState,
      isConnected: isConnected
    });
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    res.status(500).json({ 
      message: 'MongoDB connection test failed',
      error: error.message,
      connectionState: mongoose.connection.readyState,
      isConnected: isConnected
    });
  }
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
const MAX_RETRIES = 3; // Reduced retries

// Connect to MongoDB function with serverless-optimized approach
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
      await new Promise(resolve => setTimeout(resolve, 100)); // Faster cleanup
    }
    
    connectionPromise = mongoose.connect(MONGOURI, {
      // Ultra-fast timeouts for serverless
      serverSelectionTimeoutMS: 500, // Very aggressive
      socketTimeoutMS: 1000, // Very aggressive
      bufferCommands: false, // Critical for serverless
      maxPoolSize: 1, // Minimal pool
      minPoolSize: 1,
      maxIdleTimeMS: 1000, // Very short
      connectTimeoutMS: 500, // Very aggressive
      heartbeatFrequencyMS: 1000, // Very frequent
      retryWrites: false, // Disable retry writes for speed
      w: 1, // Simpler write concern
      readPreference: 'primaryPreferred', // Faster reads
      // Serverless optimizations
      family: 4, // Force IPv4
      keepAlive: false, // Disable keepAlive for serverless
      // Force immediate connection
      directConnection: true,
      // Disable DNS caching
      dnsServer: '8.8.8.8',
      // Disable SSL validation for speed (if needed)
      ssl: false,
      // Minimal connection options
      maxConnecting: 1,
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
    
    // Retry logic with minimal delay
    if (retryCount < MAX_RETRIES - 1) {
      retryCount++;
      const delay = 200; // Fixed short delay
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