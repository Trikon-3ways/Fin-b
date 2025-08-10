import express from 'express';
import mongoose from 'mongoose';
import FinancialRecordModel from "../schema/financial-records.js";

const router = express.Router();

// Force redeploy - mongoose import fix

// Test mongoose import
console.log('Mongoose imported successfully:', typeof mongoose);

// Helper function to ensure database connection
const ensureConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  
  try {
    console.log('Attempting to reconnect to MongoDB...');
    await mongoose.connect(process.env.MONGOURI || 'mongodb+srv://vermaroli89:fAIamwYiVIlKKJez@personalexpensetracker.kpm5gmx.mongodb.net/personalexpensetracker');
    console.log('Reconnected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('Failed to reconnect:', error.message);
    return false;
  }
};

router.get('', async (req, res) => {
  try {
    // Try to ensure connection
    const isConnected = await ensureConnection();
    if (!isConnected) {
      return res.status(503).json({ 
        message: 'Database connection failed, please try again',
        error: 'Connection failed'
      });
    }

    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    console.log('Fetching records for userId:', userId);
    const records = await FinancialRecordModel.find({ userId: userId });
    console.log('Found records:', records.length);
    res.status(200).json(records);
  } catch (error) {
    console.error('Error in GET /financial-records:', error);
    
    // Check if it's a connection error
    if (error.message && error.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        message: 'Database connection timeout, please try again',
        error: 'Connection timeout'
      });
    }
    
    res.status(500).json({ 
      message: 'Error fetching financial records', 
      error: error.message || 'Unknown error' 
    });
  }
});

router.post('', async (req, res) => {
    try {
        // Try to ensure connection
        const isConnected = await ensureConnection();
        if (!isConnected) {
            return res.status(503).json({ 
                message: 'Database connection failed, please try again',
                error: 'Connection failed'
            });
        }

        console.log('Creating new financial record');
        console.log('Received data:', req.body);
        
        const newRecord = new FinancialRecordModel(req.body);
        const savedRecord = await newRecord.save();
        
        console.log('Record saved successfully:', savedRecord);
        res.status(201).json(savedRecord);
    } catch (error) {
        console.error('Error creating financial record:', error);
        
        // Check if it's a connection error
        if (error.message && error.message.includes('buffering timed out')) {
            return res.status(503).json({ 
                message: 'Database connection timeout, please try again',
                error: 'Connection timeout'
            });
        }
        
        res.status(500).json({ message: 'Error creating financial record', error: error.message });
    }
});
router.put('/:id', async (req, res) => { 
    try {
        const id = req.params.id; 
        const updatedRecord = await FinancialRecordModel.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedRecord) {
            return res.status(404).json({ message: 'Financial record not found' });
        }
        res.status(200).json(updatedRecord);
    } catch (error) {
        console.error('Error in PUT /financial-records:', error);
        res.status(500).json({ 
            message: 'Error updating financial record', 
            error: error.message || 'Unknown error' 
        });
    }
}); 
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const deletedRecord = await FinancialRecordModel.findByIdAndDelete(id);
        if (!deletedRecord) {
            return res.status(404).json({ message: 'Financial record not found' });
        }
        res.status(200).json({ message: 'Financial record deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /financial-records:', error);
        res.status(500).json({ 
            message: 'Error deleting financial record', 
            error: error.message || 'Unknown error' 
        });
    }
});


export default router;