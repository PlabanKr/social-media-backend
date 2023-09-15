// Library Imports
import { Request, Response, Router } from "express";
import { QueryResult } from "pg";

// Middleware Imports
import { verifyToken } from "../../../middleware/auth.middleware";

// Model and DB Pool Imports
import pool from "../../../database/postgres.database";
import { RequestWithUser } from "../../../types/auth.type";

const router = Router();

/* --- GET ALL COMMENTS --- */
router.get('/', async (req: Request, res: Response) => {
    try {
        pool.query("SELECT * FROM post_comments", (error: Error, results: QueryResult<any>) => {
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

/* --- GET COMMENT BY ID --- */
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        pool.query("SELECT * FROM post_comments WHERE cid = $1", [id], (error: Error, results: QueryResult<any>) => {
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

/* --- CREATE COMMENT --- */
router.post('/', verifyToken, async (req: RequestWithUser, res: Response) => {
    try {
        const {post_id, body} = req.body;
        pool.query("SELECT uid FROM users WHERE email = $1", [req.user], (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            const author_id = results.rows[0].uid;
            pool.query("INSERT INTO post_comments (author_id, post_id, body) VALUES ($1, $2, $3)", 
            [
                author_id, 
                post_id, 
                body
            ], 
            (error: Error, results: QueryResult<any>) => {
                if(error) {
                    throw error;
                }
                res.status(201).json(results.rows);
            });
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

export default router;