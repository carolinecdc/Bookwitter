# Web Application Description: Book Review

## Overview
The application is a book review that allows users to create, edit, and delete reviews of books they have read. Users can sign up, log in using email or social media accounts (Google and Facebook), and interact with reviews and profiles of other users. The platform aims to facilitate community discussions around books through reviews and comments.

![image](https://github.com/user-attachments/assets/7ddc836b-12c3-4d6f-bf1f-b9d08652699e)


## Technologies Used
- **Backend Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: Passport.js (with local, Google, and Facebook strategies)
- **Password Security**: bcrypt for hashing passwords
- **Environment Configuration**: dotenv for managing environment variables
- **Data Validation**: express-validator
- **Frontend Templating**: EJS (Embedded JavaScript templates)
- **API Integration**: Axios for fetching book data from external APIs (Open Library)

## Key Features
### User Authentication
- Users can register with their email, and a username is automatically generated to ensure uniqueness.
- Login functionality supports both traditional email/password authentication and OAuth via Google and Facebook.

![image](https://github.com/user-attachments/assets/2933b459-773f-4fda-a8eb-99bedbc5f093)


### Book Reviews
- Users can create reviews for books, which includes inputting the book title, rating, and written review.
- Reviews are stored in the PostgreSQL database and displayed to other users.

  ![image](https://github.com/user-attachments/assets/c8b096c3-b6c2-4cb3-a84f-0cbf1680884c)


### Comments and Replies
- Each review can have multiple comments. Users can reply to comments, creating a threaded discussion format.

  ![image](https://github.com/user-attachments/assets/ba1ef26f-a446-42f1-b0d4-8bfe91062883)


### Profile Management
- Users can view their profile, edit their details (like name, about section, and username), and see the reviews they have created.
- Users can search for other profiles by their username.

  ![image](https://github.com/user-attachments/assets/f54adab1-024f-4dda-9e1f-3270a61551f6)


### Book Search
- Users can search for books using a title. The application fetches book data (cover images, authors, etc.) from the Open Library API.

  ![image](https://github.com/user-attachments/assets/f5056b58-89c7-4b67-a09c-2240a3cb2737)


### Session Management
- User sessions are managed using express-session, allowing users to stay logged in across multiple visits.

## Application Structure
### Routing
The application uses routes to handle various functionalities:
- `/:` Home page displaying a list of books and their reviews.
- `/review-create`: Form to create a new book review (requires authentication).
- `/review/:index`: Displays an individual book review along with its comments.
- `/profile`: Shows the user’s profile and their reviews.
- `/login`, `/register`: Pages for user authentication.

### Database Schema
- **Users table** for storing user information (name, email, password, username).
- **Books table** for storing book details (title, author, review, rating, user_id).
- **Comments table** for user comments on reviews.
- **Replies table** for user replies to comments.

## User Experience
### Frontend
- The frontend is styled using Bootstrap for a responsive design.
- The application uses EJS templates to dynamically render content based on user interactions and database queries.
- Error handling is implemented for user authentication and form submissions.

## Security Considerations
- User passwords are hashed using bcrypt before being stored in the database to enhance security.
- Input validation is performed using express-validator to prevent injection attacks and ensure data integrity.
- Session management is configured with secure cookies and appropriate session expiration settings.

## Installation Setup
To set up the Book Review Platform on your local machine, follow these steps:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/book-review-platform.git
   cd book-review-platform
2. **Install Dependencies Ensure you have Node.js and PostgreSQL installed. Then run:**
   -npm install
3. **Set Up Environment Variables Create a .env file in the root directory and configure your environment variables.**
   ![image](https://github.com/user-attachments/assets/a9146017-6293-4d26-b342-99c087f61f65)
4. **Run Database Migrations Set up your PostgreSQL database and run the necessary migrations. **
5. ** Start the Application. **
   -npm start
6. ** Access the Application Open your web browser and go to http://localhost:3000. ** 


