import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import passport from "./auth/passport_google_auth";
import { getAllProperties, seedPropertiesFromJson } from "./prisma/manage/property_manage";
import path from "path";
import prisma from "./prisma/prisma_client";
import { User } from "@prisma/client";

import rootRouter from "./routers/root_router";
import authRouter from "./routers/auth_router";
import propertyRouter from "./routers/property_router";

export interface SessionUser {
    id: string;
    authType: "crypto";
}

declare module "express-serve-static-core" {
    interface Request {
        user?: User;
        session: session.Session & Partial<session.SessionData> & { user?: SessionUser };
    }
}

const app = express();
dotenv.config();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json());

const mediaPath = path.join(__dirname, "media");
console.log("Serving static files at", mediaPath);
app.use("/media", express.static(mediaPath));

app.use(
    session({
        secret: process.env.SESSION_SECRET_KEY || "very_bad_secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRouter);
app.use("/api/properties", propertyRouter);
app.use("/", rootRouter);

const startServer = async () => {
    try {
        console.log("Clearing properties...");
        const deleteResult = await prisma.property.deleteMany({});
        console.log("Deleted properties:", deleteResult.count);
        await seedPropertiesFromJson();
        const allProps = await getAllProperties();
        console.log(
            "Properties after seeding:",
            JSON.stringify(
                allProps,
                (key, value) => (typeof value === "bigint" ? value.toString() : value),
                2
            )
        );
        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });
    } catch (error) {
        console.error("Server init failed:", error);
        process.exit(1);
    }
};

startServer();
