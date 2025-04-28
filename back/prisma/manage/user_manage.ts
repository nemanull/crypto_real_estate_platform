import prisma from "../prisma_client";
import { User, Prisma } from "@prisma/client";

export async function findOrCreateUser(walletAddress?: string, emailAddress?: string): Promise<User> {
    if (!walletAddress && !emailAddress) {
        throw new Error("Either walletAddress or emailAddress must be provided");
    }
    const whereClause = walletAddress
        ? { walletAddress: walletAddress.toLowerCase() }
        : { emailAddress: emailAddress?.toLowerCase() };
    try {
        let user = await prisma.user.findUnique({
            where: whereClause
        });
        if (!user) {
            const dataToCreate: { walletAddress?: string; emailAddress?: string } = {};
            if (walletAddress) dataToCreate.walletAddress = walletAddress.toLowerCase();
            if (emailAddress) dataToCreate.emailAddress = emailAddress.toLowerCase();
            user = await prisma.user.create({
                data: dataToCreate
            });
            console.log("Created new user:", user);
        } else {
            console.log("Found existing user:", user);
        }
        return user;
    } catch (error) {
        console.error("Error finding or creating user:", error);
        throw error;
    }
}

export async function getUserById(userId: number): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (user) {
            console.log(`Found user with ID ${userId}:`, user);
        } else {
            console.log(`User with ID ${userId} not found.`);
        }
        return user;
    } catch (error) {
        console.error(`Error fetching user with ID ${userId}:`, error);
        throw error;
    }
}

export async function updateUser(userId: number, userData: Prisma.UserUpdateInput): Promise<User> {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: userData
        });
        console.log(`Updated user with ID ${userId}:`, updatedUser);
        return updatedUser;
    } catch (error) {
        console.error(`Error updating user with ID ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            console.error(`User with ID ${userId} not found for update.`);
        }
        throw error;
    }
}

export async function deleteUser(userId: number): Promise<User> {
    try {
        const deletedUser = await prisma.user.delete({
            where: { id: userId }
        });
        console.log(`Deleted user with ID ${userId}:`, deletedUser);
        return deletedUser;
    } catch (error) {
        console.error(`Error deleting user with ID ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            console.error(`User with ID ${userId} not found for deletion.`);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            console.error(`Cannot delete user with ID ${userId} due to related records.`);
        }
        throw error;
    }
}
