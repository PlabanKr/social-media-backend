// Library Imports
import { Request, Response, Router } from "express";
import { QueryResult } from "pg";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Middleware Imports
import { verifyToken } from "../../../middleware/auth.middleware";

// Model and DB Pool Imports
import { UserSchemaCreate } from "../../../models/users.model";
import pool from "../../../database/postgres.database";

const router = Router();

/* --- GET USER BY ID --- */
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        pool.query("SELECT * FROM users WHERE uid = $1", [id], (error: Error, results: QueryResult<any>) => {
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

/* --- GET ALL USERS --- */
router.get('/', verifyToken, (req: Request, res: Response) => {
    res.send('all users');
});

/* --- CREATE NEW USER --- */
router.post('/', async (req: Request, res: Response) => {
    try {
        const userCreate: z.infer<typeof UserSchemaCreate> = req.body;
        const saltRounds = 5;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(userCreate.password, salt);
        const newUser = {...userCreate, password: hashedPassword};
        pool.query('INSERT INTO users (first_name, middle_name, last_name, email, hashed_password, dob, bio, profile_pic, is_admin, usr_location, profile_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *', 
            [
                newUser.first_name || null, 
                newUser.middle_name || null, 
                newUser.last_name || null, 
                newUser.email || null, 
                newUser.password || null, 
                newUser.dob || null, 
                newUser.bio || null, 
                newUser.profile_pic || null, 
                newUser.is_admin || false, 
                newUser.usr_location || null, 
                newUser.profile_status || 'public'
            ], 
            (error: Error, results: QueryResult<any>) => {
                if(error) {
                    throw error;
                }
                const email = results.rows[0].email;
                const token = jwt.sign({ email }, process.env.TOKEN_SECRET || 'secret', { expiresIn: "7d" })
                res.status(201).json({token: token, user: results.rows[0]});
            });
        
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }

});

/* --- USER LOGIN --- */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        pool.query('SELECT * FROM users WHERE email = $1', [email], async (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            if(results.rows.length === 0) {
                return res.status(400).send('Email or Password is wrong');
            }
            const user = results.rows[0];
            const validPassword = await bcrypt.compare(password, user.hashed_password);
            if(!validPassword) {
                return res.status(400).send('Email or Password is wrong');
            }
            const token = jwt.sign({ email: user.email }, process.env.TOKEN_SECRET || 'secret', { expiresIn: "7d" })
            res.status(200).json({token: token, user: user});
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

/* --- UPDATE USER --- */
router.put('/update', verifyToken, (req: Request, res: Response) => {
    try {
        const { email, update } = req.body;
        if(!req.body) {
            // TODO: implement throw error after adding error handling
            // throw new Error('No query parameters provided');
            return res.status(400).send('No query parameters provided');
        }
        pool.query(`SELECT uid FROM users WHERE email = $1`, [email], (error: Error, results: QueryResult<any>) => {
            if(error) {
                throw error;
            }
            const id = results.rows[0].uid;
            pool.query(
                `UPDATE users
                SET ${Object.keys(update).map((key, index) => `${key} = $${index + 1}`).join(", ")}
                WHERE uid = $${Object.keys(update).length + 1};`
                , [...Object.values(update), id], (error: Error) => {
                    if(error) {
                        throw error;
                    }
                    pool.query(
                        `SELECT * FROM users WHERE uid = $1`, [id], (error: Error, selectResults: QueryResult<any>) => {
                        if(error) {
                            throw error;
                        }
                        res.status(201).json({ message: "User updated successfully",data: selectResults.rows[0] });
                    });
                });
        });
        // pool.query(
        //     `UPDATE users
        //     SET ${Object.keys(query).map(key => `${key} = $${key}`).join(", ")}
        //     WHERE id = $1;`
        //     ,);
        // return res.status(200).send(update);
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

export default router;