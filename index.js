import express from "express";
import dbInit from "./database/dbInit.js";
import healthCheck from "./util/healthCheck.js";
import dotenv from "dotenv";
import {
  createUser,
  deleteUser,
  loginUser,
  updateUser,
  validateAccount,
} from "./controllers/userController.js";
import isAuth from "./util/isAuth.js";

const app = express();
//import links

dotenv.config();
const port = process.env.PORT;

//MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//INITIALIZE DATABASE
dbInit();

// Public Routes
app.get("/health", healthCheck);

// User Routes
app.post("/register", createUser);
app.post("/login", loginUser);
app.put("/user/updateUser", isAuth, updateUser);
app.delete("/user/deleteUser", isAuth, deleteUser);

// Validation Route
app.get("/validate/:validation_key", validateAccount);

//PORT
app.listen(port, () => {
  console.log("Server is running on port 8989");
});
