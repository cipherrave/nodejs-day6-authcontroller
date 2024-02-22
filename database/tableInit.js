import pool from "./connection.js";

// create User table if not exist
export async function createUsersTable() {
  try {
    const createTableQuery = await pool.query(
      'CREATE TABLE IF NOT EXISTS "users" ( user_id VARCHAR(225) UNIQUE PRIMARY KEY, username VARCHAR(225) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(225) NOT NULL, validation_key VARCHAR(255) NOT NULL UNIQUE, validated BOOLEAN NOT NULL, creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP )'
    );
    console.log("users table created successfully");
  } catch (error) {
    console.log(error, "Error creating users table");
  }
}
