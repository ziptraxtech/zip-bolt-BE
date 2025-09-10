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

// PUT /chargers/:id (Allocator, Admin, Superadmin)
router.put("/:id", (req, res, next) => {
  if (req.user.role === "allocator" || req.user.role === "admin" || req.user.role === "superadmin") {
    return next();
  }
  return res.status(403).json({error: "Access denied",message: "Only allocator, admin, or superadmin can update chargers",});
}, async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Charger.update(req.body, { where: { id } });

    if (updated) {
      const updatedCharger = await Charger.findByPk(id);
      return res.json({success: true,message: "Charger updated successfully",data: updatedCharger,});
    }
    return res.status(404).json({ error: "Charger not found" });
  } catch (error) {
    console.error("Update charger error:", error);
    res.status(500).json({error: "Failed to update charger",message: "Internal server error",});
  }
});

// DELETE /chargers/:id (Allocator, Admin, Superadmin)
router.delete("/:id", (req, res, next) => {
  if (["allocator", "admin", "superadmin"].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({error: "Access denied",message: "Only allocator, admin, or superadmin can delete chargers",});
}, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Charger.destroy({ where: { id } });

    if (deleted) {
      return res.json({ success: true, message: "Charger deleted successfully" });
    }
    return res.status(404).json({ error: "Charger not found" });
  } catch (error) {
    console.error("Delete charger error:", error);
    res.status(500).json({error: "Failed to delete charger",message: "Internal server error",});
  }
});

module.exports = router;
