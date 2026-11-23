import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "GURU" | "MURID" | "WAKAKURI" | "KEPSEK";
  status: "ACTIVE" | "OFFLINE" | "SUSPENDED";
  kelas?: string; // untuk MURID: kelas siswa, untuk GURU: kelas yang diampu (opsional)
  mapel?: string; // untuk GURU: mata pelajaran yang diajar
  jabatan?: string; // untuk WAKAKURI/KEPSEK: nama jabatan
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["ADMIN", "GURU", "MURID", "WAKAKURI", "KEPSEK"],
      default: "MURID",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "OFFLINE", "SUSPENDED"],
      default: "ACTIVE",
    },

    kelas: {
      type: String,
      trim: true,
    },

    mapel: {
      type: String,
      trim: true,
    },

    jabatan: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;