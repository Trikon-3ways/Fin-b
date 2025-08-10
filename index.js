

import express from 'express';
import mongoose from 'mongoose';
import financialRecordRouter from "./routes/financial-records.js";
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

// Connect to MongoDB function with aggressive timeouts
const connectDB = async () => {
  if (isConnected) {
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
    console.log('🚀 Connecting to MongoDB...');
    connectionPromise = mongoose.connect(MONGOURI, {
      serverSelectionTimeoutMS: 5000, // Reduced from 30000
      socketTimeoutMS: 10000, // Reduced from 45000
      bufferCommands: true,
      maxPoolSize: 5, // Reduced for serverless
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    });
    
    await connectionPromise;
    isConnected = true;
    connectionPromise = null;
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isConnected = false;
    connectionPromise = null;
    throw error; // Re-throw to handle in route
  }
};

// Connect on first request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Only start server for local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app;
