I am working on a social media platform project. This is the backend of that project.

## Project Setup

Follow the steps to clone and run this project on your local machine.

- Clone this repo with `git clone` in your machine.
- Install all the dependencies with `npm install`.
- Create a `.env` file from the `.env.example`.
- Give a `PORT` number, `TOKEN_SECRET` for JWT and the database details. Look into the Project Details section for database information.
- Run `npm run dev` and this project should startup and run on your defined port.

## Project Details

### Database

For this project I am using postgresql as my main database. I have 5 tables for this project. Table details are the following:

**User Table**
|uid|first_name|middle_name|last_name|email|hashed_password|dob|bio|profile_pic|is_admin|usr_location|profile_status|social_media_accounts|created_at|account_type|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|serial primary key|varchar(20) not null|varchar(20)|varchar(20) not null|text not null unique|text not null|date|text|text|bool|text|varchar(12)|jsonb default '{}'|timestamp default current_timestamp|enum ('normal', 'premium')|

**Posts Table**
|pid|post_title|post_body|author_id|has_media|media|like_count|
|---|---|---|---|---|---|---|
|serial primary key|varchar(255) not null|text|foreign key|bool not null|text|int not null|

**Post Likes Table** 
|user_id|post_id|liked_at|
|---|---|---|
|int not null|int not null|timestamp default current_timestamp|

> Note: `primary key(user_id, post_id)`

**User Saved Posts Table**
|user_id|post_id|saved_at|
|---|---|---|
|int not null|int not null|timestamp default current_timestamp|

> Note: `primary key(user_id, post_id)`

**Post Comments Table**
|cid|author_id|post_id|body|created_at|
|---|---|---|---|---|
|serial primary key|foreign key|foreign key|text not null|timestamp default current_timestamp|
