import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Property } from "../../types/property";
import { PropertyFilters } from "../../types/filters";

import styles from "./Home.module.css";

import logo from "../../assets/header_logo.svg";
import search from "../../assets/search.svg";
import default_user_logo from "../../assets/default_user_logo.svg";
import filter from "../../assets/filter.svg";

import Unit from "./home_components/unit/Unit";
import Map from "./home_components/map/Map";
import Filters from "./home_components/filters/Filters";

const BACKEND_URL = "http://localhost:3000";

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [usdtIsActive, setUsdtIsActive] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<PropertyFilters>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 300);
  };

  const changeCurrency = () => {
    setUsdtIsActive(!usdtIsActive);
    console.log("Currency changed to: ", usdtIsActive ? "USDC" : "USDT");
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BACKEND_URL}/api/properties`, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Property[] = await response.json();
        setProperties(data);
        console.log("Fetched properties:", data);
      } catch (err: any) {
        console.error("Failed to fetch properties:", err);
        setError(err.message || "Failed to load properties.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleApplyFilters = (filters: PropertyFilters) => {
    console.log("Applying filters:", filters);
    setAppliedFilters(filters);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    return properties.filter(property => {
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const searchMatch =
          property.addressLine1.toLowerCase().includes(searchLower) ||
          property.city.toLowerCase().includes(searchLower) ||
          property.province.toLowerCase().includes(searchLower) ||
          property.postalCode.toLowerCase().includes(searchLower) ||
          property.propertyType.toLowerCase().includes(searchLower) ||
          property.description.toLowerCase().includes(searchLower);

        if (!searchMatch) return false;
      }
      if (appliedFilters.propertyType && property.propertyType !== appliedFilters.propertyType) {
        return false;
      }
      if (appliedFilters.minBedrooms !== undefined && property.bedrooms < appliedFilters.minBedrooms) {
        return false;
      }
      if (appliedFilters.minBathrooms !== undefined && property.bathrooms < appliedFilters.minBathrooms) {
        return false;
      }
      if (appliedFilters.minPrice !== undefined && property.priceUsdTotal < appliedFilters.minPrice) {
        return false;
      }
      if (appliedFilters.maxPrice !== undefined && property.priceUsdTotal > appliedFilters.maxPrice) {
        return false;
      }
      if (appliedFilters.minAreaSqft !== undefined && property.areaSqft < appliedFilters.minAreaSqft) {
        return false;
      }
      if (appliedFilters.maxAreaSqft !== undefined && property.areaSqft > appliedFilters.maxAreaSqft) {
        return false;
      }
      return true;
    });
  }, [properties, appliedFilters, debouncedSearchTerm]);

  const availablePropertyTypes = useMemo(() => {
    if (!properties) return [];
    const types = new Set(properties.map(p => p.propertyType));
    return Array.from(types);
  }, [properties]);

  const listingCount = filteredProperties.length;
  const propertyCount = listingCount;

  return (
    <>
      <div className={styles.home_header}>
        <a href="/">
          <img src={logo} alt="Logo" className={styles.logo} />
        </a>
        <div className={styles.header_right}>
          <button className={styles.portfolio_btn}>Portfolio</button>
          <button className={styles.favorites_btn}>Saved</button>
          <div
            className={styles.burger_menu_container}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className={styles.burger_menu}>
              <div className={styles.burger_line}></div>
              <div className={styles.burger_line}></div>
              <div className={styles.burger_line}></div>
            </div>
            <div className={`${styles.dropdown_menu} ${isMenuOpen ? styles.open : ""}`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <a href="/connect" className={styles.dropdown_item}>Connect</a>
              <a href="/team" className={styles.dropdown_item}>Smart Contracts</a>
              <a href="/support" className={styles.dropdown_item}>Support</a>
            </div>
          </div>
        </div>
        <div className={styles.user_profile}>
          <a className={styles.user_profile_top}>
            <img src={default_user_logo} alt="default_user_logo" />
          </a>
          <div className={styles.user_profile_bottom}></div>
        </div>
      </div>

      <div className={styles.home_main_content}>
        <div className={styles.home_main_content_left}>
          <div className={styles.content_top_bar}>
            <div className={styles.breadcrumb}>
              <span>General Private Equity</span>
              <span>&nbsp;&gt;</span>
            </div>
            <div className={styles.currency_selector}>
              <button
                className={`${styles.currency_btn} ${!usdtIsActive ? styles.active : ""}`}
                onClick={changeCurrency}
              >
                USDC
              </button>
              <button
                className={`${styles.currency_btn} ${usdtIsActive ? styles.active : ""}`}
                onClick={changeCurrency}
              >
                USDT
              </button>
            </div>
          </div>

          <div className={styles.search_filter_bar}>
            <div className={styles.content_search_container}>
              <img src={search} alt="search" className={styles.content_search_icon} />
              <input
                type="text"
                placeholder="Search properties..."
                className={styles.content_search_input}
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  className={styles.search_clear_btn}
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <button className={styles.filters_btn} onClick={toggleFilters}>
              <img src={filter} alt="filters" className={styles.filters_icon} />
              Filters
            </button>
          </div>

          <h1 className={styles.content_title}>
            Real Estate Market in Vancouver (secondary market)
          </h1>

          <div className={styles.info_sort_bar}>
            <span className={styles.listing_info}>
              {listingCount} listings across {propertyCount} properties
            </span>
            <button className={styles.sort_btn}>
              Sorted by rating
              <img src={filter} alt="sort" className={styles.sort_icon} />
            </button>
          </div>

          <div className={styles.listings_area}>
            {isLoading && <p>Loading properties...</p>}
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
            {!isLoading && !error && (
              <>
                {filteredProperties.length > 0 ? (
                  filteredProperties.map(property => (
                    <Unit
                      key={property.id}
                      property={property}
                      backendUrl={BACKEND_URL}
                      fallbackImage={default_user_logo}
                    />
                  ))
                ) : (
                  <p>No properties match the current filters.</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className={styles.home_main_content_map}>
          <Map properties={filteredProperties} />
        </div>
      </div>

      {showFilters && (
        <Filters
          initialFilters={appliedFilters}
          availableTypes={availablePropertyTypes}
          onApplyFilters={handleApplyFilters}
          onClose={toggleFilters}
        />
      )}
    </>
  );
};

export default Home;
