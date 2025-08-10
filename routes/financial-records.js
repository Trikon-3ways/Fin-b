import express from 'express';
import FinancialRecordModel from "../schema/financial-records.js";

const router = express.Router();

router.get('', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    // Check MongoDB connection status
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ MongoDB not ready, attempting to connect...');
      // This will trigger the connection middleware
      return res.status(503).json({ 
        message: 'Database connection not ready, please try again' 
      });
    }
    
    console.log('Fetching records for userId:', userId);
    const records = await FinancialRecordModel.find({ userId: userId }).maxTimeMS(5000);
    console.log('Found records:', records.length);
    res.status(200).json(records);
  } catch (error) {
    console.error('Error in GET /financial-records:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'MongoNetworkError' || error.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        message: 'Database connection issue, please try again',
        error: 'Connection timeout'
      });
    }
    
    res.status(500).json({ 
      message: 'Error fetching financial records', 
      error: error.message || 'Unknown error' 
    });
  }
});

router.post('',  async (req, res) => {
    try {
        // Check MongoDB connection status
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️ MongoDB not ready, attempting to connect...');
            return res.status(503).json({ 
                message: 'Database connection not ready, please try again' 
            });
        }
        
        console.log('Received data:', req.body);
        const newRecord = new FinancialRecordModel(req.body);
        console.log('Created model instance:', newRecord);
        const savedRecord = await newRecord.save().maxTimeMS(5000);
        console.log('Saved record:', savedRecord);
        res.status(201).json(savedRecord);
    } catch (error) {
        console.error('Error creating financial record:', error);
        
        // Handle specific MongoDB errors
        if (error.name === 'MongoNetworkError' || error.message.includes('buffering timed out')) {
            return res.status(503).json({ 
                message: 'Database connection issue, please try again',
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