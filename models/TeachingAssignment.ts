import mongoose, { Schema, Document } from "mongoose";

export interface ITeachingAssignment extends Document {
    guruId: mongoose.Types.ObjectId;
    namaMapel: string; // cth: "Basis Data", "Unity Developer"
    kelas: string; // namaKelas terkait, cth: "12 PPLG 1"
    warna?: string; // untuk aksen warna card di UI (opsional)
    zoomLink?: string; // link kelas virtual, akan tersampaikan ke siswa
}

const TeachingAssignmentSchema = new Schema<ITeachingAssignment>(
    {
        guruId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        namaMapel: {
            type: String,
            required: true,
            trim: true,
        },
        kelas: {
            type: String,
            required: true,
            trim: true,
        },
        warna: {
            type: String,
            default: "indigo",
        },
        zoomLink: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const TeachingAssignment =
    mongoose.models.TeachingAssignment ||
    mongoose.model<ITeachingAssignment>("TeachingAssignment", TeachingAssignmentSchema);

export default TeachingAssignment;