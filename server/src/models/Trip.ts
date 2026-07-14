import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    startDate: { type: Date, required: true },
    startTime: { type: String, required: true },

    vehicle: { type: String },
    travelers: {
      type: Number,
      default: 1,
    },
    stops: [
      {
        location: {
          lat: Number,
          lng: Number,
        },
        name: String, // Added name for easier UI display if needed
        stopover: { type: Boolean, default: true },
      },
    ],
    duration: {
      type: String,
    },
    mode: {
      type: String,
      default: "4W",
    },
  },
  {
    timestamps: true,
  },
);

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;
