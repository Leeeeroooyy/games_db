import mongoose from "mongoose";

const DeveloperSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        nameKey: { type: String, required: true, unique: true, index: true },
        country: { type: String, required: true, trim: true, default: "Unknown" }
    },
    { timestamps: true }
);

DeveloperSchema.pre("validate", function (next) {
    const n = String(this.name || "").trim();
    this.name = n;
    this.nameKey = n.toLowerCase();

    const c = String(this.country || "").trim();
    this.country = c ? c : "Unknown";

    next();
});

export default mongoose.model("Developer", DeveloperSchema);
