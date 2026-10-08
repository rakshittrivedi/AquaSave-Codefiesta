import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: 'admin' | 'operator';
  createdAt: Date;
  comparePassword(plainText: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'operator'],
      default: 'admin',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

UserSchema.methods.comparePassword = async function (plainText: string): Promise<boolean> {
  return bcrypt.compare(plainText, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
