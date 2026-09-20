import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  clerkId?: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, sparse: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: false },
    avatar: { type: String }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
