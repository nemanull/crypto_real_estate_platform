import React, { useState } from "react"
import styles from "./Unit.module.css"
import { Property } from "../../../../types/property"
import save_property from "../../../../assets/save_property.svg"
import bed from "../../../../assets/bed.svg"
import property_space from "../../../../assets/property_space.svg"
import floors from "../../../../assets/floors.svg"
import tokens from "../../../../assets/tokens.svg"
import anualized_return from "../../../../assets/anualized_return.svg"
import monthly_return from "../../../../assets/monthly_return.svg"
import created_at from "../../../../assets/created_at.svg"
import more_options from "../../../../assets/more_options.svg"
import Purchase from "../purchase/Purchase"

const PAYMENT_TOKEN_ADDRESS = import.meta.env.VITE_PAYMENT_TOKEN_ADDRESS

interface UnitProps {
  property: Property
  backendUrl: string
  fallbackImage: string
}

const Unit: React.FC<UnitProps> = ({ property, backendUrl, fallbackImage }) => {
  const [isSaved, setIsSaved] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const fullImageUrl = imageError ? fallbackImage : `${backendUrl}${property.imageUrl}`

  const handleImageError = () => {
    setImageError(true)
  }

  const handleSaveClick = () => {
    setIsSaved(!isSaved)
    console.log(`Property ${property.id} save status: ${!isSaved}`)
  }

  const handlePurchaseClick = () => {
    if (property.onchainAddress && property.tokensLeft > 0) {
      setShowPurchaseModal(true)
    } else if (property.tokensLeft <= 0) {
      console.log("Cannot purchase: Property is sold out.")
    } else {
      console.error("Cannot purchase: Property onchain address is missing.")
    }
  }

  const handleCloseModal = () => {
    setShowPurchaseModal(false)
  }

  const handlePurchaseSuccess = () => {
    console.log(`Successfully purchased tokens for property ${property.id}`)
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" }
    const day = new Date(dateString).getDate()
    let suffix = "th"
    if (day === 1 || day === 21 || day === 31) suffix = "st"
    else if (day === 2 || day === 22) suffix = "nd"
    else if (day === 3 || day === 23) suffix = "rd"
    return new Date(dateString)
      .toLocaleDateString("en-US", options)
      .replace(/\d+/, `${day}${suffix}`)
  }

  return (
    <div className={styles.unitContainer}>
      <img
        src={fullImageUrl}
        alt={`Image of ${property.addressLine1}`}
        className={styles.unitImage}
        onError={handleImageError}
      />
      <div className={styles.unitDetails}>
        <div className={styles.unitTopBar}>
          <div className={styles.priceInfo}>
            <span className={styles.totalPrice}>
              $ {property.priceUsdTotal.toLocaleString("en-US")}
            </span>
            <span className={styles.pricePerToken}>
              $ {property.priceUsdPerToken.toFixed(0)} / token
            </span>
          </div>
          <div className={styles.topActions}>
            <span className={styles.creationDate}>
              <img
                src={created_at}
                alt="Created at"
                className={styles.actionIcon}
              />
              Created on {formatDate(property.createdAt)}
            </span>
            <button
              className={`${styles.iconButton} ${styles.saveButton} ${
                isSaved ? styles.saved : ""
              }`}
              onClick={handleSaveClick}
            >
              <img
                src={save_property}
                alt="Save"
                className={styles.actionIcon}
              />
            </button>
            <button className={styles.iconButton}>
              <img
                src={more_options}
                alt="More options"
                className={styles.actionIcon}
              />
            </button>
          </div>
        </div>
        <h3 className={styles.address}>
          {property.addressLine1}, {property.city}, {property.province}{" "}
          {property.postalCode}
        </h3>
        <p className={styles.propertyType}>{property.propertyType}</p>
        <p className={styles.unitDescription}>{property.description}</p>
        <div className={styles.unitSpecs}>
          <span className={styles.specItem}>
            <img src={bed} alt="Bedrooms" className={styles.specIcon} />
            {property.bedrooms} beds
          </span>
          <span className={styles.specItem}>
            <img
              src={property_space}
              alt="Area"
              className={styles.specIcon}
            />
            {property.areaSqft.toFixed(1)} / {property.areaSqm.toFixed(1)} M²
          </span>
          <span className={styles.specItem}>
            <img src={floors} alt="Floor" className={styles.specIcon} />
            floor {property.floor} out of {property.floorsTotal}
          </span>
        </div>
        <div className={styles.tokenInfo}>
          <img src={tokens} alt="Tokens" className={styles.specIcon} />
          Tokens left:{" "}
          <span className={styles.tokensHighlight}>
            {property.tokensLeft}
          </span>{" "}
          / {property.totalTokens}
        </div>
        <div className={styles.returnInfo}>
          <span className={styles.returnItem}>
            <img
              src={anualized_return}
              alt="Annualized Return"
              className={styles.specIcon}
            />
            Annualized Return: {property.annualReturnBp / 100}%
          </span>
          <span className={styles.returnItem}>
            <img
              src={monthly_return}
              alt="Monthly Return"
              className={styles.specIcon}
            />
            Monthly Return/Token: $ {property.monthlyReturnUsd.toFixed(2)} USDT
          </span>
        </div>
        <div className={styles.buttonContainer}>
          <button className={styles.detailsButton}>Details</button>
          <button
            className={styles.purchaseButton}
            onClick={handlePurchaseClick}
            disabled={
              !property.onchainAddress ||
              property.tokensLeft <= 0 ||
              !PAYMENT_TOKEN_ADDRESS
            }
          >
            {property.tokensLeft <= 0 ? "Sold Out" : "Purchase"}
          </button>
        </div>
      </div>
      {showPurchaseModal && property.onchainAddress && PAYMENT_TOKEN_ADDRESS && (
        <Purchase
          propertyId={property.id}
          onchainAddress={property.onchainAddress}
          pricePerTokenWei={property.pricePerTokenWei}
          tokensLeft={property.tokensLeft}
          paymentTokenAddress={PAYMENT_TOKEN_ADDRESS}
          onClose={handleCloseModal}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  )
}

export default Unit
