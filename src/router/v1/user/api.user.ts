import { Request, Response, Router } from "express";
import { QueryResult } from "pg";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt from "jsonwebtoken";

import { UserSchemaCreate } from "../../../models/users.model";
import pool from "../../../database/postgres.database";

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
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

router.get('/', (req: Request, res: Response) => {
    res.send('all users');
});

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
                const token = jwt.sign(results.rows[0], process.env.TOKEN_SECRET || 'secret', { expiresIn: 60*60*24*7 })
                res.status(201).json({token: token, user: results.rows[0]});
            });
        
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }

});

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
            const token = jwt.sign(user, process.env.TOKEN_SECRET || 'secret', { expiresIn: 60*60*24*7 })
            res.status(200).json({token: token, user: user});
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send('Internal Server Error\n' + error);
    }
});

export default router;