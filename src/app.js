import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
const app = express();

// .use is used for middleware or configuration like cors,etc.
// app.use(cors());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// limit the data when data comes in json formate.
app.use(express.json({ limit: "16kb" }));

// when data comes from url then urlencode is used to encode it.
// darshan baldha send via url: in some browser it is darsha+baldha or in some browser it is darshan%20baldha.
// to solve this we use urlencode.
// extended is used for give object inside object or nested object. In most cases it is no writen or not in use.
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// static store img, pdf etc to given folder name.
app.use(express.static("public"));

// cookie-parser is used to access the cookie of the browser by the server. Server can perform CRUD operation on browser's cookie by the usong of cookie-parser.
app.use(cookieParser());

// routes
app.use("/api/v1/users", userRouter);
// http://localhost:8000/api/v1/users/register

app.use("/api/v1/healthcheck");
app.use("/api/v1/tweets", userRouter);
app.use("/api/v1/subscriptions", userRouter);
app.use("/api/v1/video", userRouter);
app.use("/api/v1/comments", userRouter);
app.use("/api/v1/likes", userRouter);

export { app };
