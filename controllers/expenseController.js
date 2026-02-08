const Expense = require("../models/Expense");

exports.getAllExpenses = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let filter = { userId: req.user.id };

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const expenses = await Expense.find(filter).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addExpense = async (req, res) => {
    try {
        const { title, amount, category } = req.body;

        // Validation
        if (!title || !amount || !category) {
            return res.status(400).json({ error: "Please fill all fields" });
        }

        const expense = new Expense({
            title,
            amount,
            category,
            userId: req.user.id
        });
        await expense.save();
        res.json(expense);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const { title, amount, category } = req.body;
        const updatedExpense = await Expense.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id }, // Ensure user owns the expense
            { title, amount, category },
            { new: true }
        );

        if (!updatedExpense) {
            return res.status(404).json({ error: "Expense not found or unauthorized" });
        }

        res.json(updatedExpense);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const deletedExpense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

        if (!deletedExpense) {
            return res.status(404).json({ error: "Expense not found or unauthorized" });
        }

        res.json({ message: "Expense deleted" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
