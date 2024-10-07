import express from 'express';
import pg from "pg";
import bodyParser from "body-parser";
import env from "dotenv";
import session from "express-session";
import { body } from 'express-validator';
import passport from "passport";
import { Strategy } from "passport-local";
import bcrypt, { compare } from "bcrypt";
import GoogleStrategy from "passport-google-oauth20"
import FacebookStrategy from "passport-facebook"

import { getReviewIndex, getReviewEdit } from "./get-review.js"
import { getProfile, getProfileEdit, getProfileIndex } from "./profile.js";
import { postCreate, postDeleteReview, postEditReview, postReviewIndex } from "./post-review.js";
import { postProfileEdit } from "./post-profile.js";


const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 100 * 60 * 60 * 720
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
    res.locals.user = req.user;  // Make the user available in the templates
    next();
});

// DB Connection
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
  db.connect();




// Create Username
async function createUsername(name) {
    let newUserName = (name.replace(/\s/g, '')).toLowerCase() + 0;    
    const result = await db.query("SELECT username FROM users");
    const userNames = result.rows.map(row => row.username);    
    let addNumber = 1;
    let baseUsername = newUserName.slice(0, -1)

    while (userNames.includes(newUserName)) {
        newUserName = baseUsername + addNumber;
        addNumber += 1;
    }    
    return newUserName;       
};

let books = []
let bookReviews = []


// Home

app.get("/", async (req, res)=>{
    try{
        const result = await db.query("SELECT books.*, users.name, users.username FROM books JOIN users ON books.user_id = users.id");
        books = result.rows       
    
        res.render("index.ejs", {books});
    } catch(err){
        console.log(err);
    }
});

app.get("/about", (req, res)=>{    
    res.render("about.ejs");
});

// Get Review related

app.get("/review-create", async (req, res)=>{   
    if (req.isAuthenticated()) {      
        res.render("review-create.ejs");
    } else {
        res.redirect("/login")
    }
});

app.get("/review/:index", getReviewIndex);

app.get("/review-edit/:index", getReviewEdit);


// Get Login Related

app.get("/login", (req, res)=>{
    res.render("login.ejs");
});

app.get("/register", (req, res)=>{
    res.render("register.ejs");
});

app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

app.get("/auth/google", 
    passport.authenticate(
    "google", {
        scope: ["profile", "email"]
    })
);

app.get('/auth/facebook',
    passport.authenticate('facebook'      
    ));

app.get("/auth/google/profile", passport.authenticate("google", {
    successRedirect:"/",
    failureRedirect: "/login",
})
);

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
});

// Get Profile Related

app.get("/profile", getProfile);
app.get("/profile/:index", getProfileIndex);
app.get("/profile-edit", getProfileEdit);


// Search for a Book
app.post ("/search",[body("search").trim().escape()] ,async (req,res)=>{
    const searchInput = req.body.search;
    const searchInfo = searchInput.toLowerCase();
    console.log(searchInfo);

    try{
        const result = await db.query(
            "SELECT books.*, users.name FROM books JOIN users ON books.user_id = users.id WHERE LOWER (title) = $1",
             [searchInfo]);     
        if (result.rows.length > 0) {
        bookReviews = result.rows
        res.render("book-reviews.ejs", {bookReviews});
        } else {
            res.render("book-reviews.ejs");
        }

    }catch (err){
        console.log(err);
        res.redirect("/");
    }

   
});

// CREATE NEW REVIEW 
app.post("/submit", postCreate);

app.post("/review/:index", postReviewIndex);


// Profile Edit
app.post("/profile/edit", postProfileEdit);

// Review Delete/Edit

app.post("/delete", postDeleteReview);
app.post("/review-edit", postEditReview);



// Registration and Encryptation 
app.post("/sign-up",[body("name").trim().escape(), [body("registerPassword").trim().escape()]], async (req, res)=>{    
    const registerEmail = req.body.registerEmail;
    const registerName = req.body.name;
    const registerPassword = req.body.registerPassword;    
    
   try{
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [registerEmail]);
    if (checkResult.rows.length > 0){
        res.redirect("/login")
    } else{        
        let userName = await createUsername(registerName);                       
        bcrypt.hash(registerPassword, saltRounds, async (err, hash)=>{
          const result = await db.query("INSERT INTO users (name, password, email, username) VALUES ($1, $2, $3, $4) RETURNING *", [registerName, hash, registerEmail, userName]);
          const user = result.rows[0];
          req.login(user, (err)=>{
            console.log("success");
            res.redirect("/");
          })
        });
    }
   }catch (err){
    console.log(err);
   }
    
});

// Login

app.post(
    "/login", (req, res, next) =>{
        passport.authenticate("local", (err, user, info)=>{
            if(err){
                return next(err);
            }
            if (!user){                
                return res.render("login.ejs", {errorMessage: "Incorrect username or password"});
            }
            req.logIn(user, (err)=>{
                if (err){
                    return next(err);
                }
                return res.redirect("/");
            });
        })(req, res,  next);
    }
);


//Strategies
passport.use(
    "local", 
    new Strategy(async function verify(username, password, cb) {             
    try{
        const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);       
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedHashedPassword = user.password;
            bcrypt.compare(password, storedHashedPassword, (err, valid)=>{
                if (err) {
                    console.log("Error comparing password", err);
                    return cb(err);
                } else {
                    if (valid) {                        
                        return cb(null, user);
                    } else{                        
                        return cb(null, false, {message: "Incorrect password"});
                    }
                }
            });
        } else {
            return cb(null, false, {message: "User not found"});
        }
     }catch (err){
        console.log(err);
     }
}));

passport.use(
    "google", 
    new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/profile",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
}, async (accessToken, refreshToken, profile, cb) => {   

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.emails[0].value]);
        if (result.rows.length === 0) {
            let userName = await createUsername(profile.displayName);  
            const newUser = await db.query("INSERT INTO users (email, password, name, username) VALUES ($1, $2, $3, $4)", [profile.emails[0].value, "google", profile.displayName, userName]);
            cb(null, newUser.rows[0]);
        } else {
            cb(null, result.rows[0]);
        }

    } catch (err){
        cb (err);
    }

}
));

passport.use(
    "facebook", new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/callback",
        profileFields: ["displayName", "email"],
    }, async function(accessToken, refreshToken, profile, cb) {      
        
        try {
            const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.id]);
            if (result.rows.length === 0) {
                let userName = await createUsername(profile.displayName);  
                const newUser = await db.query("INSERT INTO users (email, password, name, username) VALUES ($1, $2, $3, $4)", [profile.id, "facebook", profile.displayName, userName]);
                cb(null, newUser.rows[0]);
            } else {
                cb(null, result.rows[0]);
            }
        } catch (err) {
            cb (err);
        }
    } 
));

passport.serializeUser((user, cb)=>{
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
  });

app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});