import { Request, Response, NextFunction } from "express";

export const preventUnauthorized = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() || req.session.user) {
    return next();
  }
  console.log("Unauthorized");
  res.status(401).json({ error: "Unauthorized: Please log in to access the page." });
};
