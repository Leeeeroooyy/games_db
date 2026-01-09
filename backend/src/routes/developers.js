import express from "express";
import Developer from "../models/Developer.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const devs = await Developer.find().sort({ name: 1 });
    return res.json(devs);
});

router.get("/:id", async (req, res) => {
    try {
        const dev = await Developer.findById(req.params.id);
        if (!dev) return res.status(404).json({ message: "Developer not found." });
        return res.json(dev);
    } catch {
        return res.status(400).json({ message: "Invalid developer id." });
    }
});

export default router;
