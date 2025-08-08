

import express from 'express';
import mongoose from 'mongoose';
import financialRecordRouter from "./routes/financial-records.js";
import cors from 'cors';

const app = express();
app.use(cors());
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

// Connect to MongoDB immediately
console.log('Connecting to MongoDB...');
mongoose.connect(MONGOURI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 1,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:', error.message);
});

// Only start server for local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app;