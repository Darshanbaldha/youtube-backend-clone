import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";

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

export default router;
