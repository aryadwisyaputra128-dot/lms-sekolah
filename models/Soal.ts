import mongoose, { Schema, Document } from "mongoose";

export interface IPilihan {
    teks: string;
    benar: boolean;
}

export interface ISoal extends Document {
    assessmentId: mongoose.Types.ObjectId;
    mapel: string;
    tipeSoal: "PILIHAN_GANDA" | "ESSAY";
    pertanyaan: string;
    pilihan: IPilihan[]; // kosong kalau tipeSoal ESSAY
}

const PilihanSchema = new Schema<IPilihan>(
    {
        teks: { type: String, required: true },
        benar: { type: Boolean, default: false },
    },
    { _id: false }
);

const SoalSchema = new Schema<ISoal>(
    {
        assessmentId: {
            type: Schema.Types.ObjectId,
            ref: "Assessment",
            required: true,
        },
        mapel: {
            type: String,
            required: true,
            trim: true,
        },
        tipeSoal: {
            type: String,
            enum: ["PILIHAN_GANDA", "ESSAY"],
            default: "PILIHAN_GANDA",
        },
        pertanyaan: {
            type: String,
            required: true,
        },
        pilihan: {
            type: [PilihanSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const Soal = mongoose.models.Soal || mongoose.model<ISoal>("Soal", SoalSchema);

export default Soal;