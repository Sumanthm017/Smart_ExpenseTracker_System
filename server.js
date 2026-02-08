const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve frontend files

// ✅ Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlas connected"))
    .catch(err => console.error("❌ Connection error:", err));

const cron = require("node-cron");
const RecurringExpense = require("./models/RecurringExpense");
const Expense = require("./models/Expense");

// Check Recurring Expenses (Run Daily at Midnight)
cron.schedule("0 0 * * *", async () => {
    console.log("⏳ Running Recurring Expense Job...");
    try {
        const today = new Date();
        const recurs = await RecurringExpense.find({ nextRun: { $lte: today } });

        for (const rec of recurs) {
            // Create the expense
            const newExpense = new Expense({
                userId: rec.userId,
                title: rec.title,
                amount: rec.amount,
                category: rec.category,
                type: rec.type,
                date: new Date()
            });
            await newExpense.save();

            // Update nextRun
            const nextDate = new Date(rec.nextRun);
            if (rec.frequency === "daily") nextDate.setDate(nextDate.getDate() + 1);
            if (rec.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
            if (rec.frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
            if (rec.frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);

            rec.nextRun = nextDate;
            await rec.save();
        }
        console.log(`✅ Processed ${recurs.length} recurring expenses.`);
    } catch (err) {
        console.error("❌ Error in Cron Job:", err);
    }
});

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const expenseRoutes = require("./routes/expenses");
app.use("/expenses", expenseRoutes);

const budgetRoutes = require("./routes/budgets");
app.use("/budgets", budgetRoutes);

const recurringRoutes = require("./routes/recurring");
app.use("/recurring", recurringRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));