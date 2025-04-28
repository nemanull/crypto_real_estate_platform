import express, { Request, Response } from "express";
import { handleLogout } from "../apis/auth_api";
import { preventUnauthorized } from "../middleware/prevent_unauthorized";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
        const userId = req.user.id;
        const authType = "google";
        const displayId = req.user.emailAddress || `User ${userId}`;
        res.send(`Hello World - Logged in as ${authType} User: ${displayId} <a href="/logout">Logout</a>`);
    } else if (req.session.user) {
        const userId = req.session.user.id;
        const authType = req.session.user.authType;
        res.send(`Hello World - Logged in as ${authType} User: ${userId} <a href="/logout">Logout</a>`);
    } else {
        res.send("Hello World - <a href=\"/api/auth/google\">Login with Google</a> or Connect Wallet");
    }
});

router.get("/logout", handleLogout);

router.get("/home", preventUnauthorized, (req: Request, res: Response) => {
    res.redirect("http://localhost:5173/home");
});

export default router;
