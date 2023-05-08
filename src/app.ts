import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
  })
);

// ========================= ROUTES START ========================= //

import apiV1 from './router/v1/api.v1';
app.use('/api/v1', apiV1);

// ========================= ROUTES END ========================= //

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Backend is running');
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});