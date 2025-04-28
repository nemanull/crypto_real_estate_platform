export interface Property {
    id: number;
    onchainAddress: string | null; 
    metadataHash: string;
    imageUrl: string;
    totalTokens: number;
    tokensLeft: number;
    pricePerTokenWei: string; 
    annualReturnBp: number;
    priceUsdTotal: number;
    priceUsdPerToken: number;
    monthlyReturnUsd: number;
    addressLine1: string;
    city: string;
    province: string;
    postalCode: string;
    propertyType: string;
    description: string;
    bedrooms: number;
    bathrooms: number;
    areaSqft: number;
    areaSqm: number;
    floor: string;
    floorsTotal: number;
    createdAt: string; 
    updatedAt: string; 
  }