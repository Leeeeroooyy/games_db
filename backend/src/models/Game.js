import mongoose from "mongoose";

const GameSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        genre: { type: String, required: true, trim: true },
        releaseYear: { type: Number, required: true },
        developerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Developer",
            required: true
        },
        steamAppId: { type: Number, required: false },
        coverUrl: { type: String, required: false, trim: true }
    },
    { timestamps: true }
);

GameSchema.index({ title: "text", genre: "text" });

export default mongoose.model("Game", GameSchema);
