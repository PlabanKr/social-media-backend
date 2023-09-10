// Library Imports
import { Request, Response, Router } from "express";
import { QueryResult } from "pg";
import multer from "multer";
import path from "path";

// Middleware Imports
import { verifyToken } from "../../../middleware/auth.middleware";

// Model and DB Pool Imports
import pool from "../../../database/postgres.database";
import { RequestWithUser } from "../../../types/auth.type";

const router = Router();

// Multer Storage and Update config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        
        const today = new Date();
        // .replace(/:/g, '-') is to replace all colons with dashes because windows doesn't allow colons in file names
        const fileName = "IMG " + today.toUTCString().replace(/:/g, '-') + path.extname(file.originalname);
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage });



/* --- GET ALL POSTS --- */
router.get('/', async (req: Request, res: Response) => {
    try {
        pool.query("SELECT * FROM posts", (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            res.status(200).json(results.rows);
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

/* --- GET POST BY ID --- */
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        pool.query("SELECT * FROM posts WHERE pid = $1", [id], (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            res.status(200).json(results.rows);
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

/* --- CREATE NEW POST WITH IMAGE --- */
router.post('/media', verifyToken, upload.single('image'), async (req: RequestWithUser, res: Response) => {
    try {
        const { title, content } = req.body;
        const image = req.file?.path;
        pool.query('SELECT uid FROM users WHERE email = $1', [req.user], (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            const author = results.rows[0].uid;
            pool.query('INSERT INTO posts (post_title, post_body, author_id, has_media, media, like_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [
                title || null,
                content || null,
                author || null,
                true,
                image || null,
                0
            ],
            (error: Error, results: QueryResult<any>) => {
                if(error) {
                    throw error;
                }
                res.status(201).json(results.rows[0]);
            });
        });
        // res.status(201).json({image: image, usr: req.user});
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

/* --- CREATE NEW POST WITH NO IMAGE --- */
router.post('/', verifyToken, async (req: RequestWithUser, res: Response) => {
    try {
        const { title, content } = req.body;
        pool.query('SELECT uid FROM users WHERE email = $1', [req.user], (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            const author = results.rows[0].uid;
            pool.query('INSERT INTO posts (post_title, post_body, author_id, has_media, media, like_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [
                title || null,
                content || null,
                author || null,
                false,
                null,
                0
            ],
            (error: Error, results: QueryResult<any>) => {
                if(error) {
                    throw error;
                }
                res.status(201).json(results.rows[0]);
            });
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

/* --- LIKE A POST --- */
router.post('/like/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        pool.query('SELECT uid FROM users WHERE email = $1', [req.user], (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            const user = results.rows[0].uid;
            pool.query('INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2) RETURNING *',
            [
                user,
                id
            ],
            (error: Error, results: QueryResult<any>) => {
                if(error) {
                    throw error;
                }
                const post_like = results.rows[0];
                pool.query('UPDATE posts SET like_count = like_count + 1 WHERE pid = $1', [id], (error: Error, results: QueryResult<any>) => {
                    if(error) {
                        throw error;
                    }
                    res.status(201).json({
                        like_count: results.rows[0],
                        post_like: post_like
                    });
                });
            });
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

/* --- REMOVE LIKE FROM A POST --- */
router.delete('/dislike/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        pool.query('SELECT uid FROM users WHERE email = $1', [req.user], (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            const user = results.rows[0].uid;
            pool.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2 RETURNING *',
            [
                user,
                id
            ],
            (error: Error, results: QueryResult<any>) => {
                if(error) {
                    throw error;
                }
                const post_like = results.rows[0];
                pool.query('UPDATE posts SET like_count = like_count - 1 WHERE pid = $1', [id], (error: Error, results: QueryResult<any>) => {
                    if(error) {
                        throw error;
                    }
                    res.status(204).json({
                        message: 'Post like removed',
                        post_like: post_like,
                        like_count: results.rows[0]
                    });
                });
            });
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

/* --- SAVE A POST --- */
router.post('/save/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        pool.query('SELECT uid FROM users WHERE email = $1', [req.user], (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            const user = results.rows[0].uid;
            pool.query('INSERT INTO user_saved_posts (user_id, post_id) VALUES ($1, $2) RETURNING *',
            [
                user,
                id
            ],
            (error: Error, results: QueryResult<any>) => {
                if(error) {
                    throw error;
                }
                res.status(201).json(results.rows[0]);
            });
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

/* --- REMOVE SAVED POST --- */
router.delete('/save/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        pool.query('SELECT uid FROM users WHERE email = $1', [req.user], (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            const user = results.rows[0].uid;
            pool.query('DELETE FROM user_saved_posts WHERE user_id = $1 AND post_id = $2 RETURNING *',
            [
                user,
                id
            ],
            (error: Error, results: QueryResult<any>) => {
                if(error) {
                    throw error;
                }
                res.status(204).json({
                    message: 'Post removed from saved posts',
                    post: results.rows[0]
                });
            });
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});


export default router;