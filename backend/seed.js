import mongoose from "mongoose";
import dotenv from "dotenv";
import Developer from "./src/models/Developer.js";
import Game from "./src/models/Game.js";

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    await Developer.deleteMany({});
    await Game.deleteMany({});

    const devs = await Developer.insertMany([
        { name: "Valve", country: "USA" },
        { name: "CD Projekt Red", country: "Poland" },
        { name: "Rockstar Games", country: "USA" },
        { name: "Nintendo", country: "Japan" },
        { name: "Bethesda", country: "USA" },
        { name: "Creative Assembly", country: "UK" }
    ]);

    await Game.insertMany([
        { title: "Half-Life 2", genre: "FPS", releaseYear: 2004, developerId: devs[0]._id, steamAppId: 220 },
        { title: "Portal 2", genre: "Puzzle", releaseYear: 2011, developerId: devs[0]._id, steamAppId: 620 },
        { title: "The Witcher 3", genre: "RPG", releaseYear: 2015, developerId: devs[1]._id, steamAppId: 292030 },
        { title: "GTA V", genre: "Action", releaseYear: 2013, developerId: devs[2]._id, steamAppId: 271590 },
        { title: "Skyrim Special Edition", genre: "RPG", releaseYear: 2016, developerId: devs[4]._id, steamAppId: 489830 },
        { title: "Total War: WARHAMMER III", genre: "Strategy", releaseYear: 2022, developerId: devs[5]._id, steamAppId: 1142710 }
    ]);

    await mongoose.disconnect();
    console.log("Seed completed.");
};

run().catch((e) => {
    console.error("Seed failed:", e?.message || e);
    process.exit(1);
});
