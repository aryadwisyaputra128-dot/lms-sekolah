import mongoose, { Schema, Document } from "mongoose";

export interface ILoginLog extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: string;
    loginAt: Date;
}

const LoginLogSchema = new Schema<ILoginLog>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    loginAt: {
        type: Date,
        default: Date.now,
    },
});

const LoginLog =
    mongoose.models.LoginLog || mongoose.model<ILoginLog>("LoginLog", LoginLogSchema);

export default LoginLog;