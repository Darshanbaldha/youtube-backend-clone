import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Give the connection with the mongodb database.
const connectDB = async () => {
  try {
    // try to connect the database
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log(`Mongodb Connected ${JSON.stringify(connectionInstance)}`);
    console.log(
      `Mongodb Connected !! on host ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("Mongodb Error", error);
    // throw error or we can use
    process.exit(1);
  }
};

export default connectDB;
