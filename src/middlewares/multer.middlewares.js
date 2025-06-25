import multer from "multer";

// takes files from browser and temporary store on local server and give it to cloudinary.
// diskstorage store data on the local server. There is many option to store data like cloude , etc.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb means callback
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // cb(null, file.fieldname + '-' + uniqueSuffix)
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage: storage });
// export const upload = multer({ storage }); // also write like this.
