import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// if anyone goes to /register then only post otherwise not use this code.
router.route("/register").post(
  // takes the files from upload(multer) and give the name field fromthe database in our case its avtar and coverImag and give this to registeruser.
  upload.fields([
    {
      name: "avtar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// before logout the user got to the middleware verifyJWT. And that's why we use nest() so router not confuse and only one method.
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
export default router;
