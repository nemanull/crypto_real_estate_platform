import express from "express";
import { handleGetAllProperties } from "../apis/property_api";

const router = express.Router();

router.get("/", handleGetAllProperties);

export default router;
