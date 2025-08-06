import mongoose from "mongoose";

const financialRecordSchema = new mongoose.Schema({
    date: { type: Date, required: true }, 
    userId: { type: String, required: true },
    description: { type: String, required: true },  
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true }
});


const FinancialRecordModel = mongoose.model('FinancialRecord', financialRecordSchema);

export default FinancialRecordModel;

