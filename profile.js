import pg from "pg";
import env from "dotenv";


env.config();

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
  db.connect();


export async function getProfile(req, res) {
    if (req.isAuthenticated()) {
        const userInfo = req.user; 
        console.log(userInfo)            
        try {
            const [responseUsers, responseBooks] = await Promise.all([
                db.query("SELECT * FROM users WHERE users.id = $1", [userInfo.id]), 
                db.query("SELECT * FROM books WHERE books.user_id = $1", [userInfo.id])]);            
            res.render("profile.ejs", {
            userLoginInfo: userInfo,
            userQueryInfo: responseUsers.rows[0],
            userReviews: responseBooks.rows,
            });                      
                                
        } catch (err){
            console.log(err);
        } 
       
    } else {
        res.redirect("/login")
    }
    
};

export async function getProfileIndex(req, res) {
    let userName =  req.params.index;
    let userInfo = null
    console.log(userName);
    if (req.isAuthenticated()) {
        const userInfo = req.user; 
        console.log(userInfo)}

    try { 
        const responseUsers = await db.query("SELECT * FROM users WHERE users.username = $1", [userName]);
        const responseBooks = await db.query("SELECT * FROM books WHERE books.user_id = $1", [responseUsers.rows[0].id]);        
        res.render("profile.ejs", {
            userQueryInfo: responseUsers.rows[0],
            userReviews: responseBooks.rows,
            userLoginInfo: userInfo,
        })
    } catch (err) {
        console.log(err)
    }
};

export async function getProfileEdit(req,res) {
    if (req.isAuthenticated()) {
        const userInfo = req.user;         
        try {
            const result = await db.query("SELECT books.*, users.name FROM books JOIN users ON books.user_id = users.id WHERE user_id = $1", [userInfo.id]);
            const userBooks = result.rows;  
            res.render("profile-edit.ejs", {
            userInfo: userInfo,
            userReviews: userBooks,
        });                     
        } catch (err){
            console.log(err);
        } 
       
    } else {
        res.redirect("/login")
    }
};

