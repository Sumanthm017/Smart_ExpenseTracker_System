const express = require("express");
const router = express.Router();
const recurringController = require("../controllers/recurringController");
const jwt = require("jsonwebtoken");

// Middleware
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

router.post("/", authMiddleware, recurringController.addRecurring);
router.get("/", authMiddleware, recurringController.getRecurring);
router.delete("/:id", authMiddleware, recurringController.deleteRecurring);

module.exports = router;
