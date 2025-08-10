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
    
    await connectDB();
    
    console.log('✅ Connection test successful');
    res.json({ 
      message: 'MongoDB connection test successful',
      connectionState: mongoose.connection.readyState
    });
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    res.status(500).json({ 
      message: 'MongoDB connection test failed',
      error: error.message,
      connectionState: mongoose.connection.readyState
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

// MongoDB connection function with better error handling
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }
    
    console.log('🚀 Connecting to MongoDB...');
    console.log('Connection state before connect:', mongoose.connection.readyState);
    
    await mongoose.connect(MONGOURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('Connection state after connect:', mongoose.connection.readyState);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Connect to MongoDB on startup and retry if needed
const initializeDB = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect on startup, will retry on first request');
  }
};

initializeDB();

// Export for Vercel
export default app; 