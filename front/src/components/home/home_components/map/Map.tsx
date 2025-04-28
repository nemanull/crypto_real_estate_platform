import React, { useRef, useEffect, useState } from "react"
import mapboxgl, { Map as MapboxMap, Marker, LngLatLike } from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import styles from "./Map.module.css"
import { Property } from "../../../../types/property"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

interface MapProps {
    properties: Property[]
}

const Map: React.FC<MapProps> = ({ properties }) => {
    const mapContainer = useRef<HTMLDivElement | null>(null)
    const map = useRef<MapboxMap | null>(null)
    const markersRef = useRef<Marker[]>([])
    const [lng, setLng] = useState(-123.1207)
    const [lat, setLat] = useState(49.2827)
    const [zoom, setZoom] = useState(11)
    const [isMapLoaded, setIsMapLoaded] = useState(false)

    console.log(
        "Mapbox access token set:",
        mapboxgl.accessToken ? "Yes (token hidden for security)" : "No"
    )

    useEffect(() => {
        if (map.current || !mapContainer.current) return

        if (!mapboxgl.supported()) {
            console.error(
                "Your browser does not support WebGL, which is required by Mapbox GL"
            )
            return
        }

        const mapInstance = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [lng, lat],
            zoom
        })

        mapInstance.on("error", (e) => {
            console.error("Mapbox map error:", e)
        })

        mapInstance.on("style.load", () => {
            console.log("Map style successfully loaded")
        })

        mapInstance.on("styledata", (e) => {
            console.log("Style data event:", e)
        })

        map.current = mapInstance

        mapInstance.on("move", () => {
            if (map.current) {
                setLng(parseFloat(map.current.getCenter().lng.toFixed(4)))
                setLat(parseFloat(map.current.getCenter().lat.toFixed(4)))
                setZoom(parseFloat(map.current.getZoom().toFixed(2)))
            }
        })

        mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right")

        mapInstance.on("load", () => {
            console.log("Map \"load\" event fired.")
            setIsMapLoaded(true)
        })

        return () => {
            console.log("Cleaning up map instance.")
            mapInstance.remove()
            map.current = null
            setIsMapLoaded(false)
            markersRef.current = []
        }
    }, [])

    useEffect(() => {
        if (!isMapLoaded || !map.current || !properties) {
            console.log("Marker effect skipped: Map not loaded or no properties.")
            return
        }

        const currentMapInstance = map.current

        console.log("Map loaded and properties available. Updating markers.")

        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []

        properties.forEach((property) => {
            const placeholderCoords: LngLatLike = [
                -123.1207 + (Math.random() - 0.5) * 0.1,
                49.2827 + (Math.random() - 0.5) * 0.1
            ]

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <h3>${property.addressLine1}</h3>
                <p>$${property.priceUsdTotal.toLocaleString()}</p>
                <p>${property.bedrooms} beds | ${property.areaSqft} sqft</p>
                <a href="#">View Details</a>
            `)

            try {
                const el = document.createElement("div")
                el.className = styles.customMarker

                const marker = new mapboxgl.Marker(el)
                    .setLngLat(placeholderCoords)
                    .setPopup(popup)
                    .addTo(currentMapInstance)

                markersRef.current.push(marker)
            } catch (error) {
                console.error("Error adding marker inside loop:", error, "Property:", property.id)
            }
        })

        console.log(`Added ${markersRef.current.length} markers.`)
    }, [properties, isMapLoaded])

    return <div ref={mapContainer} className={styles.mapContainer} />
}

export default Map
