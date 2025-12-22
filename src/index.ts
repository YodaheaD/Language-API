import express, { Express, Request, Response } from 'express';
import cors from "cors";
import Logger from './utils/logger';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
dotenv.config();
const app:Express = express();

const PORT = process.env.PORT 
import { router as pageRouter } from './data';
import { router as utilsRouter }  from './utilRouter/page';
//src\ops\page.ts 
import { router as opsRouter }  from './ops/page';
// src\setRouter\page.ts
import { router as setRouter }  from './setRouter/page';
app.use(express.static('public'));
//const PORT = process.env.PORT;
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


app.use('/data', pageRouter);
app.use('/utils', utilsRouter);
app.use('/ops', opsRouter);
app.use('/sets', setRouter);
app.get('/', (req:Request, res:Response) => {
    res.send("Hello from Express Api")
})

app.listen(PORT, () => {
    Logger.info(` Server running on port ${PORT} in Environment: ${process.env.CURRENT_ENV} with user: ${process.env.DB_USER}`);
 }) 