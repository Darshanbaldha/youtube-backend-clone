import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // the one who is click on subscriber button
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, // the one who is click on subscriber button of the chennal.
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
