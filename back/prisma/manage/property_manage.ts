import prisma from "../prisma_client"
import { Property, Prisma } from "@prisma/client"
import fs from "fs"
import path from "path"

export async function getAllProperties(): Promise<Property[]> {
  try {
    const props = await prisma.property.findMany()
    console.log(`Properties fetched: ${props.length}`)
    return props
  } catch (err) {
    console.error("Fetch error", err)
    throw err
  }
}

export async function createProperty(propertyData: Prisma.PropertyCreateInput): Promise<Property> {
  try {
    const prop = await prisma.property.create({ data: propertyData })
    console.log("Property created")
    return prop
  } catch (err) {
    console.error("Create error", err)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      console.error("Duplicate entry")
    }
    throw err
  }
}

export async function getPropertyById(propertyId: number): Promise<Property | null> {
  try {
    const prop = await prisma.property.findUnique({ where: { id: propertyId } })
    if (prop) console.log("Property found")
    else console.log("Property not found")
    return prop
  } catch (err) {
    console.error("Fetch by ID error", err)
    throw err
  }
}

export async function updateProperty(propertyId: number, propertyData: Prisma.PropertyUpdateInput): Promise<Property> {
  try {
    const prop = await prisma.property.update({ where: { id: propertyId }, data: propertyData })
    console.log("Property updated")
    return prop
  } catch (err) {
    console.error("Update error", err)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      console.error("Not found")
    }
    throw err
  }
}

export async function deleteProperty(propertyId: number): Promise<Property> {
  try {
    const prop = await prisma.property.delete({ where: { id: propertyId } })
    console.log("Property deleted")
    return prop
  } catch (err) {
    console.error("Delete error", err)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      console.error("Not found")
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      console.error("Has relations")
    }
    throw err
  }
}

export async function seedPropertiesFromJson(filePath?: string): Promise<void> {
  const defaultPath = path.join(__dirname, "../test_properties.json")
  const resolved = filePath || defaultPath
  console.log("Seeding from", resolved)

  try {
    if (!fs.existsSync(resolved)) {
      console.error("File missing")
      return
    }

    const data = fs.readFileSync(resolved, "utf-8")
    type PJ = Omit<Property, "id" | "createdAt" | "updatedAt" | "pricePerTokenWei"> & { pricePerTokenWei: string }
    const list: PJ[] = JSON.parse(data)

    if (!Array.isArray(list)) {
      console.error("Invalid JSON")
      return
    }

    console.log("Items to seed:", list.length)
    for (const item of list) {
      if (item.onchainId == null) {
        console.warn("Skip missing ID")
        continue
      }
      try {
        await prisma.property.upsert({
          where: { onchainId: item.onchainId },
          update: item,
          create: item,
        })
      } catch (e) {
        console.error("Upsert failed", e)
      }
    }

    console.log("Seeding done")
  } catch (err) {
    console.error("Seeding error", err)
  }
}
