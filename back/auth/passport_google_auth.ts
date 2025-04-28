import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { findOrCreateUser } from "../prisma/manage/user_manage";
import prisma from "../prisma/prisma_client";
import { User } from "@prisma/client";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.CALLBACK_URL!,
      scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("Email not found"), false);
        }
        const user = await findOrCreateUser(undefined, email.toLowerCase());
        return done(null, user);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const userId = typeof id === "string" ? parseInt(id, 10) : (id as number);
    if (isNaN(userId)) {
      return done(new Error("Invalid user ID"), false);
    }
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    done(null, user);
  } catch (err) {
    done(err, false);
  }
});

export default passport;
