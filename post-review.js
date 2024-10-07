import pg from "pg";
import env from "dotenv";
import axios from "axios"; 


env.config();

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
  db.connect();

const coverAPI = "https://covers.openlibrary.org/b/id/"
const bookSearchAPI = "https://openlibrary.org/search.json?";

  // Seach for book ID and Author name USING API
async function searchBook(params) { 
      let bookID = ""
      let author_name = ""
      let bookTitle = ""
      
      try {
      const bookInfo = await axios.get(bookSearchAPI, {params: params});
      bookID = bookInfo.data.docs[0].cover_i;
      author_name = bookInfo.data.docs[0].author_name;
      bookTitle = bookInfo.data.docs[0].title;
      } catch (err) {       
       console.log (err);
      } 
      return [bookID, author_name[0], bookTitle];  
};

// Create a Review

export async function postCreate(req, res) {
    const bookTitleInput = req.body.bookTitle;    
    let bookRating = req.body.rating;
    const bookReview = req.body.bookText;  
    let bookInfo = ""
    let bookCoverURL = ""
    let userID = req.user.id    
  
    if (!bookRating){
        bookRating = 0
    };

    try{
        const paramsBookSearch = {q:bookTitleInput};
        bookInfo = await searchBook(paramsBookSearch); 
        console.log(bookInfo);
        bookCoverURL = coverAPI + bookInfo[0] + "-L.jpg";               
    }catch (err){
        console.log(err)
    }      
    
    if (bookInfo[2] === "") {     
        res.redirect("/review/0");
    } else {
        try {
            const result = await db.query("SELECT * FROM books WHERE books.TITLE = $1 AND books.user_id = $2", [bookInfo[2], userID]);
            if (result.rows.length === 0) {
                try{
                    const result = await db.query("INSERT INTO books (title, author, rate, review, cover_url, user_id ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [bookInfo[2], bookInfo[1], bookRating, bookReview, bookCoverURL, userID]);
                    res.redirect(`/review/${result.rows[0].id}`);
                }catch (err){
                    console.log(err);
                } 
            }else {
                res.redirect(`/review-edit/${result.rows[0].id}`)
            }
        }catch {
            console.log(err)
        }        
    }
};

// Create Comments/Replies
export async function postReviewIndex(req, res) {
    const bookID = req.params.index;
    const userComment = req.body.postComment;
    const commentId = req.body.replyComment;
    const userReply = req.body.replyForm;
    const replyID = req.body.deleteReply    
    console.log(commentId); 
    

    if (req.isAuthenticated()) {
        const userInfo = req.user

        if (userComment != null)
          try{
            const result = await db.query("INSERT INTO comments (user_comment, user_id, book_id) VALUES ($1, $2, $3)", [userComment, userInfo.id, bookID]);   
            res.redirect(`/review/${bookID}`)
          }catch (err){
            console.log(err);              
        } else if (userReply != null) {
            try {
                const result = await db.query("INSERT INTO replies (user_reply, user_id, comments_id) VALUES ($1, $2, $3)", [userReply, req.user.id, commentId]);
                res.redirect(`/review/${bookID}`)
            } catch(err){
                console.log(err);
            }
        } else if (replyID != null){
            try {
                const result = await db.query ("UPDATE replies SET user_reply = 'This reply has been deleted.' WHERE replies.id = $1", [replyID]);
                res.redirect(`/review/${bookID}`)
            }catch(err){
                console.log(err);
            }

        } else {
            try {
                const result = await db.query("UPDATE comments SET user_comment = 'This comment has been deleted.' WHERE comments.id = $1", [commentId]);
                res.redirect(`/review/${bookID}`)
            }catch(err){
                console.log(err);
            }
        }
    };    
}

// Delete a Review

export async function postDeleteReview(req, res) {
    let bookID = req.body.deleteButton;    
    0

    try {
        await db.query("DELETE FROM books WHERE id = $1", [bookID]);
        res.redirect("/profile"); 

    }catch (err){
        console.log(err);
    }
};

//Review Edit
export async function postEditReview(req, res) {
    const newReview = req.body.bookReview;
    const bookID = req.body.editButton;

    try{
        await db.query("UPDATE books SET review = $1 WHERE id = $2", [newReview, bookID]);
        res.redirect(`/review/${bookID}`);
    }catch (err){
        console.log(err);
    }
};