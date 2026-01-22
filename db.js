const mongoose = require("mongoose");
require("dotenv").config();

const connect = async () => {
  try {
    const url = process.env.MONGO_URL;
    if (!url) {
      throw new Error("MONGO_URL is not defined");
    }

    await mongoose.connect(url);
    console.log("Database is connected");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { connect };
