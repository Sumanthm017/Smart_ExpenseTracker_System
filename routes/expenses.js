const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const expenseController = require("../controllers/expenseController");

// Middleware to check JWT
function authMiddleware(req, res, next) {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
}

router.post("/", authMiddleware, expenseController.addExpense);
router.get("/", authMiddleware, expenseController.getAllExpenses);
router.put("/:id", authMiddleware, expenseController.updateExpense);
router.delete("/:id", authMiddleware, expenseController.deleteExpense);

module.exports = router;