const mongoose = require("mongoose");

const recurringSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    type: { type: String, enum: ["expense", "income"], default: "expense" },
    frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"], required: true },
    nextRun: { type: Date, required: true }
});

module.exports = mongoose.model("RecurringExpense", recurringSchema);
