import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "User name is required."],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      index: true,
    },
    avtar: {
      type: String, // cloudinary url
      required: [true, "Image is required."],
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      require: [true, "Password is required."],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// pre object is used to do work just before the data store in db.
userSchema.pre("save", async function (next) {
  // checking if password is modofied or not.
  if (this.isModified("password")) {
    // encryptthe password.
    // next() is a callback function that pass control to the next middleware funcion.
    // middleware function has access of req and res object lifecycle.
    // it does's not end req-res cycle.
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } else {
    // we return next() because here nothing to return other data.
    // In below function we does't pass next() because we already return the function or data.
    return next();
  }
});

// for check if the encrypted password and normal password is match or not.
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// create a token using jwt
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// create a refresh token using jwt
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
