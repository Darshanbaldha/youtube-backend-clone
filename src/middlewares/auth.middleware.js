import { User } from "../models/user.model";
import apiErrors from "../utils/apiErrors";
import { asyncHandler } from "../utils/asyncHandler";
import { jwt } from "jsonwebtoken";

// for logout functionality because we doesn't have user data in logout method.
export const verifyJWT = asyncHandler(
  async (requestAnimationFrame, res, next) => {
    try {
      // we place ? because if user doesn't have cookie then it is empty. It not have cookie because may be it comes from mobile the it is problematic.
      // if it is on mobile the it give you the custom header so we can take both senarios.
      // header("Authorization") is takes the header named Authorization and inside that header take the value now we don't want Bearer in token so we replace it with empty string.
      // Bearer is a syntax for place token inside header.
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        throw new apiErrors(401, "Unauthorized request");
      }

      // checking if token of cookie and server's cookie is same or note
      const decodedToken = await jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
      );
      // select all value except below value to logout. Using id.
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );

      if (!user) {
        throw new apiErrors(401, "Invalid access token");
      }

      // add a new object in request. we name it user(or whaterver).
      req.user = user;
      next();
    } catch (error) {
      throw new apiErrors(401, error.message || "Invalid access token");
    }
  }
);
