-- CreateTable
CREATE TABLE "Property" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onchainId" INTEGER NOT NULL,
    "onchainAddress" TEXT,
    "metadataHash" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "tokensLeft" INTEGER NOT NULL,
    "pricePerTokenWei" TEXT NOT NULL,
    "annualReturnBp" INTEGER NOT NULL,
    "priceUsdTotal" REAL NOT NULL,
    "priceUsdPerToken" REAL NOT NULL,
    "monthlyReturnUsd" REAL NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "areaSqft" REAL NOT NULL,
    "areaSqm" REAL NOT NULL,
    "floor" TEXT NOT NULL,
    "floorsTotal" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletAddress" TEXT,
    "emailAddress" TEXT
);

-- CreateTable
CREATE TABLE "UserFavoriteProperty" (
    "userId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "propertyId"),
    CONSTRAINT "UserFavoriteProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserFavoriteProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserPortfolioProperty" (
    "userId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "propertyId"),
    CONSTRAINT "UserPortfolioProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserPortfolioProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_onchainId_key" ON "Property"("onchainId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_onchainAddress_key" ON "Property"("onchainAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailAddress_key" ON "User"("emailAddress");
