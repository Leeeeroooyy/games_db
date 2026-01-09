import express from "express";
import mongoose from "mongoose";
import Game from "../models/Game.js";
import Developer from "../models/Developer.js";

const router = express.Router();

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

const normalizeCountry = (v) => {
    const s = String(v || "").trim();
    return s ? s : "Unknown";
};

const ensureDeveloperId = async ({ developerId, developerName, developerCountry }) => {
    const name = String(developerName || "").trim();

    if (name) {
        const key = name.toLowerCase();
        const country = normalizeCountry(developerCountry);

        let dev = await Developer.findOne({ nameKey: key });
        if (!dev) {
            dev = await Developer.create({ name, country });
        } else if ((dev.country === "Unknown" || !dev.country) && country !== "Unknown") {
            dev.country = country;
            await dev.save();
        }

        return dev._id;
    }

    const id = String(developerId || "").trim();
    if (!id) return null;
    if (!isValidObjectId(id)) throw new Error("Invalid developerId.");
    return id;
};

const normalizeSteamAppId = (v) => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    if (!s) return undefined;
    const n = Number.parseInt(s, 10);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return n;
};

const normalizeCoverUrl = (v) => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    if (!s) return undefined;
    return s;
};

router.get("/", async (req, res) => {
    const developerId = String(req.query.developerId || "").trim();
    const filter = {};

    if (developerId) {
        if (!isValidObjectId(developerId)) return res.status(400).json({ message: "Invalid developerId." });
        filter.developerId = developerId;
    }

    const games = await Game.find(filter).sort({ createdAt: -1 });
    return res.json(games);
});

router.get("/search", async (req, res) => {
    const q = String(req.query.q || "").trim();
    const developerId = String(req.query.developerId || "").trim();

    if (!q) return res.json([]);

    const filter = { $text: { $search: q } };

    if (developerId) {
        if (!isValidObjectId(developerId)) return res.status(400).json({ message: "Invalid developerId." });
        filter.developerId = developerId;
    }

    const results = await Game.find(filter).sort({ createdAt: -1 });
    return res.json(results);
});

router.get("/:id", async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ message: "Game not found." });
        return res.json(game);
    } catch {
        return res.status(400).json({ message: "Invalid game id." });
    }
});

router.post("/", async (req, res) => {
    try {
        const body = req.body || {};
        const title = String(body.title || "").trim();
        const genre = String(body.genre || "").trim();
        const releaseYear = Number(body.releaseYear);

        if (!title || !genre || !Number.isFinite(releaseYear)) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const devId = await ensureDeveloperId({
            developerId: body.developerId,
            developerName: body.developerName,
            developerCountry: body.developerCountry
        });

        if (!devId) return res.status(400).json({ message: "Missing developerId or developerName." });

        const created = await Game.create({
            title,
            genre,
            releaseYear,
            developerId: devId,
            steamAppId: normalizeSteamAppId(body.steamAppId),
            coverUrl: normalizeCoverUrl(body.coverUrl)
        });

        return res.status(201).json(created);
    } catch (e) {
        const msg = String(e?.message || e);
        if (msg === "Invalid developerId.") return res.status(400).json({ message: "Invalid developerId." });
        return res.status(400).json({ message: "Failed to create game.", error: msg });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const body = req.body || {};
        const set = {};
        const unset = {};

        if (body.title !== undefined) set.title = String(body.title || "").trim();
        if (body.genre !== undefined) set.genre = String(body.genre || "").trim();
        if (body.releaseYear !== undefined) set.releaseYear = Number(body.releaseYear);

        if (body.developerId !== undefined || body.developerName !== undefined) {
            const devId = await ensureDeveloperId({
                developerId: body.developerId,
                developerName: body.developerName,
                developerCountry: body.developerCountry
            });
            if (!devId) return res.status(400).json({ message: "Missing developerId or developerName." });
            set.developerId = devId;
        }

        if (body.steamAppId !== undefined) {
            const v = normalizeSteamAppId(body.steamAppId);
            if (v === undefined) unset.steamAppId = 1;
            else set.steamAppId = v;
        }

        if (body.coverUrl !== undefined) {
            const v = normalizeCoverUrl(body.coverUrl);
            if (v === undefined) unset.coverUrl = 1;
            else set.coverUrl = v;
        }

        const update = {};
        if (Object.keys(set).length) update.$set = set;
        if (Object.keys(unset).length) update.$unset = unset;

        const updated = await Game.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true
        });

        if (!updated) return res.status(404).json({ message: "Game not found." });
        return res.json(updated);
    } catch (e) {
        const msg = String(e?.message || e);
        if (msg === "Invalid developerId.") return res.status(400).json({ message: "Invalid developerId." });
        return res.status(400).json({ message: "Failed to update game.", error: msg });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Game.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Game not found." });
        return res.json({ message: "Deleted." });
    } catch {
        return res.status(400).json({ message: "Invalid game id." });
    }
});

export default router;
