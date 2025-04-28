import { Request, Response, NextFunction, RequestHandler } from "express";
import { ethers } from "ethers";
import { generateChallenge, storeChallenge, getChallenge, verifySignature, clearChallenge } from "../blockchain/ethers_login";
import { findOrCreateUser } from "../prisma/manage/user_manage";
import { SessionUser } from "../app";

export const handleRequestChallenge: RequestHandler = (req, res) => {
    const { address } = req.body;
    if (!address || !ethers.isAddress(address)) {
        res.status(400).json({ error: "Invalid address" });
        return;
    }
    const challenge = generateChallenge();
    storeChallenge(address, challenge);
    console.log("Challenge generated for", address);
    res.json({ challenge });
};

export const handleVerifySignature: RequestHandler = async (req, res) => {
    const { address, signature } = req.body;
    if (!address || !signature || !ethers.isAddress(address)) {
        res.status(400).json({ error: "Address or signature missing" });
        return;
    }
    const storedChallenge = getChallenge(address);
    if (!storedChallenge) {
        console.log("No challenge for", address);
        res.status(400).json({ error: "No challenge found" });
        return;
    }
    console.log("Verifying", address);
    const isValid = verifySignature(storedChallenge, signature, address);
    if (isValid) {
        console.log("Signature ok for", address);
        try {
            const dbUser = await findOrCreateUser(address.toLowerCase(), undefined);
            const sessionUser: SessionUser = { id: address.toLowerCase(), authType: "crypto" };
            req.session.user = sessionUser;
            clearChallenge(address);
            res.json({
                isAuthenticated: true,
                user: {
                    id: dbUser.id.toString(),
                    address: address.toLowerCase(),
                    authType: "crypto"
                }
            });
        } catch (error) {
            console.error("User error", error);
            res.status(500).json({ isAuthenticated: false, error: "Server error" });
        }
    } else {
        console.log("Signature failed for", address);
        res.status(401).json({ isAuthenticated: false, error: "Invalid signature" });
    }
};

export const handleAuthStatus = (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
        res.json({
            isAuthenticated: true,
            user: {
                id: req.user.id.toString(),
                authType: "google",
                email: req.user.emailAddress
            }
        });
    } else if (req.session.user) {
        res.json({
            isAuthenticated: true,
            user: {
                id: req.session.user.id,
                authType: "crypto"
            }
        });
    } else {
        res.json({ isAuthenticated: false });
    }
};

export const handleLogout = (req: Request, res: Response, next: NextFunction) => {
    const wasPassportAuthenticated = req.isAuthenticated();
    const passportLogout = (cb: (err?: any) => void) => {
        if (wasPassportAuthenticated) {
            req.logout(cb);
        } else {
            cb();
        }
    };
    passportLogout((err) => {
        if (err) console.error("Passport logout error:", err);
        req.session.destroy((destroyErr) => {
            if (destroyErr) console.error("Session destruction error:", destroyErr);
            res.clearCookie("connect.sid");
            console.log("User logged out");
            res.redirect("/");
        });
    });
};

export const handleLoginFailed = (req: Request, res: Response) => {
    res.status(401).send("Auth failed");
};
