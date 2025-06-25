import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDE_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// file upload
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    } else {
      const response = await cloudinary.uploader
        .upload(localFilePath, {
          resource_type: "auto",
        })
        .catch((error) => {
          console.log(`File not Uploded : ${error}`);
        });
      console.log(`File uploaded on Cloudinary:-`, response.url);
      fs.unlinkSync(localFilePath);
      return response;
    }
  } catch (error) {
    // remove local temporary file from multer when file operation got failed.
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export default uploadOnCloudinary;
