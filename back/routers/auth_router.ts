import express from "express"
import passport from "../auth/passport_google_auth"
import { handleRequestChallenge, handleVerifySignature, handleAuthStatus, handleLoginFailed } from "../apis/auth_api"

const router = express.Router()

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/api/auth/login-failed" }),
    (req, res) => {
        console.log("Google auth callback successful, req.user:", req.user)
        res.redirect("http://localhost:5173/home")
    }
)

router.get("/login-failed", handleLoginFailed)

router.post("/crypto/request-challenge", handleRequestChallenge)

router.post("/crypto/verify-signature", handleVerifySignature)

router.get("/status", handleAuthStatus)

export default router
