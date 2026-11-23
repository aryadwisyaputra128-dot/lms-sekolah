import mongoose, { Schema, Document } from "mongoose";

export interface IJawaban {
    soalId: mongoose.Types.ObjectId;
    pilihanIndex?: number; // untuk pilihan ganda
    teksEssay?: string; // untuk essay
    benar?: boolean; // hasil auto-koreksi, hanya untuk pilihan ganda
}

export interface ISubmission extends Document {
    assessmentId: mongoose.Types.ObjectId;
    siswaId: mongoose.Types.ObjectId;
    namaSiswa: string;
    emailSiswa: string;
    judulTugas: string;
    jawaban: IJawaban[];
    submittedAt: Date;
    status: "PENDING" | "GRADED";
    nilai?: number;
    butuhNilaiManual: boolean; // true kalau ada soal essay, guru harus nilai manual
}

const JawabanSchema = new Schema<IJawaban>(
    {
        soalId: { type: Schema.Types.ObjectId, ref: "Soal", required: true },
        pilihanIndex: { type: Number },
        teksEssay: { type: String },
        benar: { type: Boolean },
    },
    { _id: false }
);

const SubmissionSchema = new Schema<ISubmission>(
    {
        assessmentId: { type: Schema.Types.ObjectId, ref: "Assessment", required: true },
        siswaId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        namaSiswa: { type: String, required: true },
        emailSiswa: { type: String, required: true },
        judulTugas: { type: String, required: true },
        jawaban: { type: [JawabanSchema], default: [] },
        submittedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["PENDING", "GRADED"], default: "PENDING" },
        nilai: { type: Number },
        butuhNilaiManual: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Submission =
    mongoose.models.Submission || mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;