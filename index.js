

import express from 'express';
import mongoose from 'mongoose';
import financialRecordRouter from "./routes/financial-records.js";
import cors from 'cors';

const app = express();
app.use(cors());
const port = process.env.PORT || 3001;

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

const MONGOURI = process.env.MONGOURI || 'mongodb://localhost:27017/personal-expense-tracker';

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    await mongoose.connect(MONGOURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit the process in serverless environment
  }
};

// Connect to database
connectDB();

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;