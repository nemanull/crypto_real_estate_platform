import React, { useState } from "react";
import styles from "./Filters.module.css";
import { PropertyFilters } from "../../../../types/filters";

interface FiltersProps {
  initialFilters: PropertyFilters;
  availableTypes: string[];
  onApplyFilters: (filters: PropertyFilters) => void;
  onClose: () => void;
}

const Filters: React.FC<FiltersProps> = ({
  initialFilters,
  availableTypes,
  onApplyFilters,
  onClose,
}) => {
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numValue = ["min", "max"].some(prefix =>
      name.toLowerCase().startsWith(prefix)
    )
      ? value === "" ? undefined : Number(value)
      : value;

    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: numValue === "" ? undefined : numValue,
    }));
  };

  const handleApply = () => {
    const applied = {} as PropertyFilters;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        (applied as any)[key] = value;
      }
    });

    onApplyFilters(applied);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
    onApplyFilters({});
  };

  return (
    <div className={styles.filtersOverlay}>
      <div className={styles.filtersContainer}>
        <h2>Filters</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <div className={styles.filterGroup}>
          <label htmlFor="propertyType">Property Type</label>
          <select
            id="propertyType"
            name="propertyType"
            value={filters.propertyType || ""}
            onChange={handleChange}
          >
            <option value="">Any</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="minBedrooms">Min Bedrooms</label>
          <input
            type="number"
            id="minBedrooms"
            name="minBedrooms"
            min="0"
            value={filters.minBedrooms ?? ""}
            onChange={handleChange}
            placeholder="Any"
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="minBathrooms">Min Bathrooms</label>
          <input
            type="number"
            id="minBathrooms"
            name="minBathrooms"
            min="0"
            value={filters.minBathrooms ?? ""}
            onChange={handleChange}
            placeholder="Any"
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Price Range (USD Total)</label>
          <div className={styles.rangeInputs}>
            <input
              type="number"
              name="minPrice"
              min="0"
              value={filters.minPrice ?? ""}
              onChange={handleChange}
              placeholder="Min"
            />
            <span>-</span>
            <input
              type="number"
              name="maxPrice"
              min="0"
              value={filters.maxPrice ?? ""}
              onChange={handleChange}
              placeholder="Max"
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label>Area (sqft)</label>
          <div className={styles.rangeInputs}>
            <input
              type="number"
              name="minAreaSqft"
              min="0"
              value={filters.minAreaSqft ?? ""}
              onChange={handleChange}
              placeholder="Min"
            />
            <span>-</span>
            <input
              type="number"
              name="maxAreaSqft"
              min="0"
              value={filters.maxAreaSqft ?? ""}
              onChange={handleChange}
              placeholder="Max"
            />
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button className={styles.clearButton} onClick={handleClear}>Clear All</button>
          <button className={styles.applyButton} onClick={handleApply}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
