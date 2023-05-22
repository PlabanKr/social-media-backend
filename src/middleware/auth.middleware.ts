import { Response, NextFunction } from 'express';
import jwt from "jsonwebtoken";
import { TokenPayload, RequestWithUser } from '../types/auth.type';


export const verifyToken = (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if(!authHeader) {
        return res.status(401).json({ message: 'Authorization header is missing!' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET || 'secret') as TokenPayload;
        req.user = decoded.email;
        next();
    } catch (error) {
        console.log('Error: ', error);
    }
} 