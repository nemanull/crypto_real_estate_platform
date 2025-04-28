import { Request, Response } from "express";
import { getAllProperties } from "../prisma/manage/property_manage";

export const handleGetAllProperties = async (req: Request, res: Response) => {
    try {
        const properties = await getAllProperties();
        const propertiesWithStringBigInts = properties.map(prop => ({
            ...prop,
            pricePerTokenWei: prop.pricePerTokenWei.toString(),
            onchainAddress: prop.onchainAddress
        }));
        res.json(propertiesWithStringBigInts);
    } catch (error) {
        console.error("Error getting properties", error);
        res.status(500).json({ error: "Error fetching properties" });
    }
};
