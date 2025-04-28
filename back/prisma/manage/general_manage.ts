import prisma from "../prisma_client"
import { Property, Prisma } from "@prisma/client"

export async function getAllProperties(): Promise<Property[]> {
  try {
    const properties = await prisma.property.findMany()
    console.log(`Fetched ${properties.length} properties.`)
    return properties
  } catch (error) {
    console.error("Error fetching properties:", error)
    throw error
  }
}

export async function createProperty(propertyData: Prisma.PropertyCreateInput): Promise<Property> {
  try {
    const newProperty = await prisma.property.create({
      data: propertyData,
    })
    console.log("Created new property:", newProperty)
    return newProperty
  } catch (error) {
    console.error("Error creating property:", error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        console.error("Failed to create property")
      }
    }
    throw error
  }
}
