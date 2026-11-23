import mongoose, { Schema, Document } from "mongoose";

export interface IAssessment extends Document {
    namaUjian: string;
    tipe: "EXAM" | "QUIZ";
    kelas: string;
    mapel?: string;
    status: "LIVE" | "SCHEDULED" | "ARCHIVED";
    guruId?: mongoose.Types.ObjectId;
    tenggat?: Date; // deadline pengerjaan, opsional
}

const AssessmentSchema = new Schema<IAssessment>(
    {
        namaUjian: { type: String, required: true, trim: true },
        tipe: { type: String, enum: ["EXAM", "QUIZ"], default: "EXAM" },
        kelas: { type: String, required: true, trim: true },
        mapel: { type: String, trim: true },
        status: {
            type: String,
            enum: ["LIVE", "SCHEDULED", "ARCHIVED"],
            default: "SCHEDULED",
        },
        guruId: { type: Schema.Types.ObjectId, ref: "User" },
        tenggat: { type: Date },
    },
    { timestamps: true }
);

const Assessment =
    mongoose.models.Assessment ||
    mongoose.model<IAssessment>("Assessment", AssessmentSchema);

export default Assessment;