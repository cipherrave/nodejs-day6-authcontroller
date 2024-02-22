import pool from "../database/connection.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Create a USER
export async function createUser(req, res) {
  try {
    // Generate unique user id and validation key using nanoid
    let generatedID = nanoid();
    const user_id = generatedID;

    let generatedValidationKey = nanoid();
    const validation_key = generatedValidationKey;

    // Establish what needs to be included in JSON for POST, and encrypt it
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json("Missing required fields");
    } else {
      // Establishing genSalt and encrypt password
      const salt = await bcrypt.genSalt(10);
      const encryptedPassword = await bcrypt.hash(password, salt);

      // Set validate value as false by default
      const validated = false;

      // Inserting new user details
      const newUser = await pool.query(
        "INSERT INTO users (user_id, username, email, password, validation_key, validated) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
        [user_id, username, email, encryptedPassword, validation_key, validated]
      );

      // Generate a response
      const apiResponse = {
        message: "User created successfully. Check email for validation link.",
      };
      res.status(200).json(newUser.rows[0]);
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
}

// Email validation - USER
export async function validateAccount(req, res) {
  try {
    // Check validation key from url given in email in address
    let { validation_key } = req.params;
    const isValidationKeyValid = await pool.query(
      "SELECT * FROM users WHERE validation_key = $1",
      [validation_key]
    );
    if (isValidationKeyValid.rowCount === 0) {
      return res
        .status(404)
        .json("Validation key invalid. Please make sure correct link is used");
    } else {
      const user_id = isValidationKeyValid.rows[0].user_id;
      const validValidationKey = await pool.query(
        "UPDATE users SET validated = true WHERE user_id = $1",
        [user_id]
      );

      const apiResponse = {
        message: "Validation successful",
        username: isValidationKeyValid.rows[0].email,
        email: isValidationKeyValid.rows[0].email,
      };

      res.status(200).json(apiResponse);
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
}

// Log into account - USER
export async function loginUser(req, res) {
  try {
    // Making sure user fill all fields
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json("Missing required fields");
    } else {
      // Check user email availability
      const checkEmail = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      if (checkEmail.rowCount === 0) {
        return res.status(404).json("Email not found");
      } else {
        // Compare using hashed password
        const isPasswordCorrect = await bcrypt.compare(
          password,
          checkEmail.rows[0].password
        );
        if (!isPasswordCorrect) {
          return res.status(401).json("Password incorrect");
        } else {
          // Check validation status
          const validated = true;
          const checkValidationStatus = await pool.query(
            "SELECT validated FROM users WHERE (email, validated) = ($1, $2)",
            [email, validated]
          );
          if (checkValidationStatus.rowCount === 0) {
            return res
              .status(404)
              .json(
                "Email has not been validated. Please check your email inbox for validation link. Might wanna check your spam folder too."
              );
          } else {
            // If password matches, create a token using jsonwebtoken
            // Generate JWT token using userData with SECRET from .env file
            const userData = {
              user_id: checkEmail.rows[0].user_id,
              username: checkEmail.rows[0].username,
              email: checkEmail.rows[0].email,
              validated: checkEmail.rows[0].validated,
            };
            const token = jwt.sign(userData, process.env.JWT_SECRET);

            // Generate response
            const apiResponse = {
              message: "Login successful",
              user: {
                user_id: checkEmail.rows[0].user_id,
                username: checkEmail.rows[0].username,
                email: checkEmail.rows[0].email,
                validated: checkEmail.rows[0].validated,
              },
              token: token,
            };

            res.status(200).json(apiResponse);
          }
        }
      }
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
}

// Update a user - USER
export async function updateUser(req, res) {
  try {
    // Read data from token
    const authData = req.user;
    const user_id = authData.user_id;

    // Check user id availability in token
    const checkUserId = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [user_id]
    );
    if (checkUserId.rowCount === 0) {
      return res.status(404).json("User id not found.");
    } else {
      const { username, email, password } = req.body;
      // Generate password hash
      const salt = await bcrypt.genSalt(10);
      const encryptedPassword = await bcrypt.hash(password, salt);

      // Update user with user_id specified in token
      const updateUser = await pool.query(
        "UPDATE users SET (username, email, password) = ($1, $2, $3) WHERE user_id= $4",
        [username, email, encryptedPassword, user_id]
      );

      // Read back new data from user_id
      const updateUserRead = await pool.query(
        "SELECT * FROM users WHERE user_id = $1",
        [user_id]
      );

      const newUserData = {
        message: "User data has been updated",
        user_id: updateUserRead.rows[0].user_id,
        username: updateUserRead.rows[0].username,
        email: updateUserRead.rows[0].email,
        password: password,
      };

      res.status(200).json(newUserData);
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
}

// Delete own account - USER
export async function deleteUser(req, res) {
  try {
    // Read user_id from token
    const authData = req.user;
    const user_id = authData.user_id;
    const checkUserID = await pool.query(
      "SELECT * FROM users WHERE user_id=$1",
      [user_id]
    );
    if (checkUserID.rowCount === 0) {
      return res.status(404).json("User id not found.");
    } else {
      const { password } = req.body;

      // Compare using hashed password for verification
      const isPasswordCorrect = await bcrypt.compare(
        password,
        checkUserID.rows[0].password
      );
      if (!isPasswordCorrect) {
        return res.status(401).json("Password incorrect");
      } else {
        // Delete user from user_id token
        const deleteUser = await pool.query(
          "DELETE FROM users WHERE user_id = $1",
          [user_id]
        );

        res.json("User has been deleted");
      }
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
}
