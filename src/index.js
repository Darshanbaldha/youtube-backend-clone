// require("dotenv") .config({path: "./env"});
import dotenv from "dotenv";
import connectDB from "./db/db.js";

dotenv.config({
  path: "./env",
});

// connectDB is write async(asyncronus) and by default it return promise so we can add then and catch.
connectDB()
  .then(() => {
    let port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running at port ${port}.`);
    });
  })
  .catch((error) => {
    console.error(`DB Connect Error: ${error}`);
  });
/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from "express";
const app = express();
// IIFE used for invoke function imidiate.
( async () => {
    try {
        // try to connect the database
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

        // after db connect check the express connection whether it gives error or not.
        app.on("error", (error) => {
            console.error("Express Error: ",error);
            throw error
        })

        // connect to the port or listning for connection
        app.listen(process.env.PORT, () => {
            console.log(`App is listning on port ${process.env.PORT}`);
        })
        
    } catch (error) {
        console.error("Mongo_db Error: ", error);
        throw error
        
    }
})()
*/
