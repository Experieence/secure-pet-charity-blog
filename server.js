// setting up required packages 
const express = require("express"); 
const {Pool} = require("pg");
const dotenv = require("dotenv");
const cors = require("cors"); 

// Starts Express and tells it to accept JSON data (what are those?)
dotenv.config(); 
const app = express(); 
app.use(cors());
app.use(express.json()); 

// this is for access to the database 
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
}); 

// create a route and will print out all the values in the users data 
app.get("/api/users", async(req, res) =>{
    try{
        const result = await pool.query("SELECT * FROM users"); 
        res.json(result.rows);
    } catch (err){
        res.status(500).json({error: err.message})
    }
})

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000")
}); 