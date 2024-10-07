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

export async function postProfileEdit(req, res) {
    if (req.isAuthenticated()){
        const newName = req.body.name;
        const newAbout = req.body.about;
        const userInfo = req.user;
        const newUserName = req.body.userName;            
        try{
            // Check if Username is in DB
            const result = await db.query("SELECT * FROM users WHERE username = $1", [newUserName]); 

            console.log(userInfo.username);
            console.log(newUserName);
            
            if (userInfo.username !== newUserName) {                
                if (result.rows.length === 0){
                    try {
                        await db.query("UPDATE users SET name = $1, about = $2, username = $3 WHERE id = $4", [newName, newAbout, newUserName, userInfo.id]);
                        // Update Session
                        req.user.name = newName;
                        req.user.about = newAbout;
                        req.user.username = newUserName;
                        res.redirect("/profile");
                    }catch (err){
                        console.log(err);
                    }
                    }else {
                        try {
                            const result = await db.query("SELECT books.*, users.name FROM books JOIN users ON books.user_id = users.id WHERE user_id = $1", [userInfo.id]);
                            const userBooks = result.rows;  
                            res.render("profile-edit.ejs", {
                            userInfo: userInfo,
                            userReviews: userBooks,
                            errorMessage:"Username is already taken",
                        });                     
                        } catch (err){
                            console.log(err);
                        }              
                }
            }else {
                try {
                    await db.query("UPDATE users SET name = $1, about = $2 WHERE id = $3", [newName, newAbout, userInfo.id]);
                    // Update Session
                    req.user.name = newName;
                    req.user.about = newAbout;                    
                    res.redirect("/profile");
                }catch (err){
                    console.log(err);
                }
            }
        }catch (err){
            console.log(err);
        }

    }else{
        res.redirect("/login");
    }
};
