import mongoose, { Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IVehicle {
    id?: string;
    regNumber: string;
}

export interface IUser {
    name: string;
    phone: string;
    password: string;
    twoWheelers: IVehicle[];
    fourWheelers: IVehicle[];
}

export interface UserMethods {
    matchPassword(entered: string): Promise<boolean>;
}

const vehicleSchema = new mongoose.Schema<IVehicle>({
    id: String,
    regNumber: { type: String, required: true, trim: true },
});

const userSchema = new mongoose.Schema<IUser, Model<IUser, {}, UserMethods>, UserMethods>(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        twoWheelers: [vehicleSchema],
        fourWheelers: [vehicleSchema],
    },
    { timestamps: true },
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (entered: string) {
    return bcrypt.compare(entered, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
