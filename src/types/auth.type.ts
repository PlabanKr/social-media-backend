import { Request } from 'express';

export type TokenPayload = {
    email: string;
}

export type RequestWithUser = Request & {
    user?: string;
}