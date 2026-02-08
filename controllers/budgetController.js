const Budget = require("../models/Budget");
const Expense = require("../models/Expense");

exports.setBudget = async (req, res) => {
    try {
        const { category, amount, month } = req.body;

        if (!category || !amount || !month) {
            return res.status(400).json({ error: "All fields required" });
        }

        const budget = await Budget.findOneAndUpdate(
            { userId: req.user.id, category, month },
            { amount },
            { new: true, upsert: true } // Create if not exists
        );

        res.json(budget);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getBudgets = async (req, res) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ error: "Month required" });

        const budgets = await Budget.find({ userId: req.user.id, month });

        // Aggregation to find actual spending per category
        const startOfMonth = new Date(`${month}-01`);
        const endOfMonth = new Date(new Date(startOfMonth).setMonth(startOfMonth.getMonth() + 1));

        const expenses = await Expense.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user.id),
                    date: { $gte: startOfMonth, $lt: endOfMonth },
                    type: "expense"
                }
            },
            {
                $group: {
                    _id: "$category",
                    totalSpent: { $sum: "$amount" }
                }
            }
        ]);

        // Merge budgets with spent amount
        const budgetStatus = budgets.map(b => {
            const expense = expenses.find(e => e._id === b.category);
            return {
                ...b.toObject(),
                spent: expense ? expense.totalSpent : 0
            };
        });

        res.json(budgetStatus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
