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


  

export async function getReviewIndex (req, res) {
    const bookID = req.params.index;
    try{

        const [bookInfo, commentInfo] = await Promise.all([
            db.query("SELECT books.*, users.name, users.username FROM books JOIN users ON books.user_id = users.id WHERE books.id = $1;", [bookID]), 
            db.query("SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE book_id = $1 ORDER BY comments.id ASC", [bookID])
        ]); 
        
        let repliesList = [];
        const commentsList = commentInfo.rows;          
        console.log("-----------------------------------------------")
        
        try {
            await Promise.all(commentsList.map(async comment => {                             
                const result = await db.query("SELECT replies.*, users.username FROM replies JOIN users ON replies.user_id = users.id WHERE comments_id = $1 ORDER BY replies.id ASC", [comment.id]); 
                if (result.rows.length > 0) {
                    repliesList.push(result.rows);                              
                }     
                })
            );
            res.render("review.ejs", {book:bookInfo.rows[0], comments: commentInfo.rows, replies: repliesList});
        } catch (err){
            console.log(err);
        }
        
    }catch (err){
        console.log(err);              
    }

};


export async function getReviewEdit(req, res) {
    if (req.isAuthenticated()) {
        let bookID = req.params.index;

        try{
            const result = await db.query("SELECT * FROM books WHERE id = $1", [bookID]);
            const bookInfo = result.rows[0];             
            res.render("review-edit.ejs", {book: bookInfo});           

        }catch (err){
            console.log(err);
        }        
    } else {
        res.redirect("/login")
    }
};
