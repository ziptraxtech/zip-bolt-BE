const express = require("express");
const { Charger } = require("../models");
const { requireAdmin, requireAllocator, requireSuperadmin, requireRider } = require("../middleware/auth");

const router = express.Router();

// GET /chargers (only Rider)
router.get("/", requireRider, async (req, res) => {
  try {
    const chargers = await Charger.findAll();
    res.json({
      success: true,
      data: chargers,
    });
  } catch (error) {
    console.error("Get chargers error:", error);
    res.status(500).json({
      error: "Failed to get chargers",
      message: "Internal server error",
    });
  }
});

// POST /chargers (Allocator, Admin, Superadmin can access)
router.post("/", (req, res, next) => {
  if (req.user.role === "allocator" || req.user.role === "admin" || req.user.role === "superadmin") {
    return next();
  }
  return res.status(403).json({ error: "Access denied", message: "Only allocator, admin, or superadmin can create chargers" });
}, async (req, res) => {
  try {
    const charger = await Charger.create(req.body);
    res.status(201).json({ success: true, message: "Charger created successfully", data: charger });
  } catch (error) {
    console.error("Create charger error:", error);
    res.status(500).json({ error: "Failed to create charger", message: "Internal server error" });
  }
});

module.exports = router;
