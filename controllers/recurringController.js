const RecurringExpense = require("../models/RecurringExpense");

exports.addRecurring = async (req, res) => {
    try {
        const { title, amount, category, frequency, type } = req.body;

        // Calculate next run date
        const nextRun = new Date(); // Runs immediately? Or next cycle? Let's say next cycle.
        // For simplicity, let's just save it. The cron job will determine when to run.

        const recurring = new RecurringExpense({
            userId: req.user.id,
            title,
            amount,
            category,
            type: type || "expense",
            frequency,
            nextRun: new Date() // Will be picked up by Cron immediately if date is passed
        });

        await recurring.save();
        res.json(recurring);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getRecurring = async (req, res) => {
    try {
        const recurring = await RecurringExpense.find({ userId: req.user.id });
        res.json(recurring);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteRecurring = async (req, res) => {
    try {
        await RecurringExpense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: "Recurring expense deleted" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
