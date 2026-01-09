import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import games from "./routes/games.js";
import developers from "./routes/developers.js";
import Game from "./models/Game.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/games", games);
app.use("/api/developers", developers);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
});

const port = Number(process.env.PORT || 3000);

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        await Game.syncIndexes();
        app.listen(port, () => console.log(`API running on port ${port}`));
    })
    .catch((e) => {
        console.error("MongoDB connection failed:", e?.message || e);
        process.exit(1);
    });
