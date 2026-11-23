import mongoose, { Schema, Document } from "mongoose";

export interface ISchedule extends Document {
    guruId: mongoose.Types.ObjectId;
    judul: string; // cth: "Basis Data", "Office Hours", "Faculty Meeting"
    kelas?: string; // opsional, kosong kalau bukan jam mengajar kelas (misal Office Hours)
    hari: "SEN" | "SEL" | "RAB" | "KAM" | "JUM";
    jamMulai: string; // format "HH:mm", cth "09:00"
    jamSelesai: string; // format "HH:mm", cth "10:00"
}

const ScheduleSchema = new Schema<ISchedule>(
    {
        guruId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        judul: {
            type: String,
            required: true,
            trim: true,
        },
        kelas: {
            type: String,
            trim: true,
        },
        hari: {
            type: String,
            enum: ["SEN", "SEL", "RAB", "KAM", "JUM"],
            required: true,
        },
        jamMulai: {
            type: String,
            required: true,
        },
        jamSelesai: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Schedule =
    mongoose.models.Schedule || mongoose.model<ISchedule>("Schedule", ScheduleSchema);

export default Schedule;