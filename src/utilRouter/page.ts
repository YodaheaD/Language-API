import express, { Express, Request, Response, Router } from "express";

export const router: Router = Router();
import { spanishClass } from "../database/dataSources/lang-spanish";

router.get("/", (req: Request, res: Response) => {
  res.send("Hello from Utils Router");
});


 