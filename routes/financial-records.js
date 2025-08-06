import express from 'express';
import FinancialRecordModel from "../schema/financial-records.js";

const router = express.Router();

router.get('', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const records = await FinancialRecordModel.find({ userId: userId });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching financial records', error });
  }
});

router.post('',  async (req, res) => {
    try {
        console.log('Received data:', req.body);
        const newRecord = new FinancialRecordModel(req.body);
        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (error) {
        console.error('Error creating financial record:', error);
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
        res.status(500).json({ message: 'Error updating financial record', error });
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
        res.status(500).json({ message: 'Error deleting financial record', error });
    }
});


export default router;