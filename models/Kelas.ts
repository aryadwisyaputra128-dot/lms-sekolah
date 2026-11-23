import mongoose, { Schema, Document } from "mongoose";

export interface IKelas extends Document {
    namaKelas: string;
    jurusan: string;
    mataPelajaran: string[];
}

const KelasSchema = new Schema<IKelas>(
    {
        namaKelas: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        jurusan: {
            type: String,
            trim: true,
            default: "",
        },

        mataPelajaran: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const Kelas = mongoose.models.Kelas || mongoose.model<IKelas>("Kelas", KelasSchema);

export default Kelas;