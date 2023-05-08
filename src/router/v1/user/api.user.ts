import { Request, Response, Router } from "express";

const router = Router();

router.get('/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    res.send(`user id ${id}`);
});

router.get('/:email', (req: Request, res: Response) => {
    const email = req.params.email;
    res.send(`user email ${email}}`);
});

router.get('/', (req: Request, res: Response) => {
    res.send('all users');
});

export default router;