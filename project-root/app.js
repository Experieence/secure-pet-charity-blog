const express = require('express')
const app = express();
const port = 3000;

var bodyParser = require('body-parser');
const fs = require('fs');

const { Pool } = require("pg");
const dotenv = require("dotenv");
require('dotenv').config({ path: __dirname + '/.env' });
console.log("DB PASSWORD:", process.env.DB_PASSWORD);
console.log("DB NAME:", process.env.DB_NAME);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


app.use(express.static(__dirname + '/app/public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Landing page
app.get('/', (req, res) => {
    /// send the static file
    res.sendFile(__dirname + '/app/public/html/login.html', (err) => {
        if (err){
            console.log(err);
        }
    })
});

// Reset login_attempt.json when server restarts
let login_attempt = {"username" : "null", "password" : "null"};
let data = JSON.stringify(login_attempt);
fs.writeFileSync(__dirname + '/app/public/json/login_attempt.json', data);

// Store who is currently logged in
let currentUser = null;

// Login POST request
app.post('/', async function(req, res) {
  try {
      // 1. Get username from form
  var username = req.body.username_input;

  // 2. Get password from form  
  var password = req.body.password_input;

  console.log("Username:", username);
  console.log("Password:", password);
  // 3. Check database
  const result = await pool.query(
    'SELECT * FROM login_users WHERE username = $1 AND password = $2',
    [username, password]
  );

  // 4. If user found
  if(result.rows.length > 0) {
    currentUser = username; 
    let login_attempt = {"username": username, "password": password};
    fs.writeFileSync(__dirname + '/app/public/json/login_attempt.json', JSON.stringify(login_attempt));
    res.sendFile(__dirname + '/app/public/html/index.html');
  } else {
    // 5. Send back to login
    let login_attempt = {"username": username, "password": password};
    fs.writeFileSync(__dirname + '/app/public/json/login_attempt.json', JSON.stringify(login_attempt)) 
    res.sendFile(__dirname + '/app/public/html/login.html');
  }
  // your database query and if/else goes here
} catch(err) {
  console.log(err);
  res.sendFile(__dirname + '/app/public/html/login.html');
}
});

// Make a post POST request
app.post('/makepost', function(req, res) {

    // Read in current posts
    const json = fs.readFileSync(__dirname + '/app/public/json/posts.json');
    var posts = JSON.parse(json);

    // Get the current date
    let curDate = new Date();
    curDate = curDate.toLocaleString("en-GB");

    // Find post with the highest ID
    let maxId = 0;
    for (let i = 0; i < posts.length; i++) {
        if (posts[i].postId > maxId) {
            maxId = posts[i].postId;
        }
    }

    // Initialise ID for a new post
    let newId = 0;

    // If postId is empty, user is making a new post
    if(req.body.postId == "") {
        newId = maxId + 1;
    } else { // If postID != empty, user is editing a post
        newId = req.body.postId;

        // Find post with the matching ID, delete it from posts so user can submit their new version
        let index = posts.findIndex(item => item.postId == newId);
        posts.splice(index, 1);
    }

    // Add post to posts.json
    posts.push({"username": currentUser , "timestamp": curDate, "postId": newId, "title": req.body.title_field, "content": req.body.content_field});

    fs.writeFileSync(__dirname + '/app/public/json/posts.json', JSON.stringify(posts));

    // Redirect back to my_posts.html
    res.sendFile(__dirname + '/app/public/html/my_posts.html');
 });

 // Delete a post POST request
 app.post('/deletepost', (req, res) => {

    // Read in current posts
    const json = fs.readFileSync(__dirname + '/app/public/json/posts.json');
    var posts = JSON.parse(json);

    // Find post with matching ID and delete it
    let index = posts.findIndex(item => item.postId == req.body.postId);
    posts.splice(index, 1);

    // Update posts.json
    fs.writeFileSync(__dirname + '/app/public/json/posts.json', JSON.stringify(posts));

    res.sendFile(__dirname + '/app/public/html/my_posts.html');
 });

app.listen(port, () => {
    console.log(`My app listening on port ${port}!`)
});