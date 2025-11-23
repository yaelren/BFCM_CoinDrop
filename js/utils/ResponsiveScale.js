/**
 * ResponsiveScale Utility
 * Handles conversion between design pixels and responsive units
 *
 * Reference Design: 4640px × 1760px (LED Dashboard)
 * Storage Format: Design pixels (normalized to 4640px width)
 * Display Format: Container query units (cqw) or viewport-relative units
 */

export const REFERENCE_WIDTH = 4640;
export const REFERENCE_HEIGHT = 1760;

/**
 * Converts design pixels to responsive CSS calc() string
 * @param {number} designPixels - Value in pixels at reference design size (4640px width)
 * @returns {string} CSS calc() string using custom property --px
 *
 * Example: toResponsiveUnit(32) → "calc(32 * var(--px))"
 */
export function toResponsiveUnit(designPixels) {
  return `calc(${designPixels} * var(--px))`;
}

/**
 * Converts design pixels to container query width units
 * @param {number} designPixels - Value in pixels at reference design size
 * @returns {string} CSS value in cqw units
 *
 * Example: toCQW(32) → "0.689655cqw" (32 / 4640 * 100)
 */
export function toCQW(designPixels) {
  const cqwValue = (designPixels / REFERENCE_WIDTH) * 100;
  return `${cqwValue.toFixed(6)}cqw`;
}

/**
 * Calculates current scale factor for JavaScript/canvas elements
 * @param {HTMLElement} dashboardElement - The .led-dashboard element
 * @returns {number} Scale factor (currentWidth / referenceWidth)
 *
 * Example: If dashboard is 2320px wide, returns 0.5
 */
export function getScaleFactor(dashboardElement = null) {
  const dashboard = dashboardElement || document.querySelector('.led-dashboard');
  if (!dashboard) {
    // console.warn('Dashboard element not found, using scale factor 1');
    return 1;
  }

  const currentWidth = dashboard.offsetWidth;
  return currentWidth / REFERENCE_WIDTH;
}

/**
 * Converts design pixels to actual pixels at current scale
 * @param {number} designPixels - Value in pixels at reference design size
 * @param {HTMLElement} dashboardElement - Optional dashboard element
 * @returns {number} Actual pixels at current screen size
 *
 * Example: toActualPixels(32) → 16 (if dashboard is half reference width)
 */
export function toActualPixels(designPixels, dashboardElement = null) {
  const scale = getScaleFactor(dashboardElement);
  return designPixels * scale;
}

/**
 * Converts actual pixels to design pixels (reverse conversion)
 * @param {number} actualPixels - Current screen pixel value
 * @param {HTMLElement} dashboardElement - Optional dashboard element
 * @returns {number} Design pixels (normalized to reference size)
 *
 * Example: toDesignPixels(16) → 32 (if dashboard is half reference width)
 */
export function toDesignPixels(actualPixels, dashboardElement = null) {
  const scale = getScaleFactor(dashboardElement);
  return actualPixels / scale;
}

/**
 * Creates a responsive style object for applying to elements
 * @param {Object} config - Configuration with design pixel values
 * @param {number} config.fontSize - Font size in design pixels
 * @param {number} config.borderRadius - Border radius in design pixels
 * @returns {Object} Style object with responsive CSS values
 */
export function createResponsiveStyles(config) {
  const styles = {};

  if (config.fontSize !== undefined) {
    styles.fontSize = toResponsiveUnit(config.fontSize);
  }

  if (config.borderRadius !== undefined) {
    styles.borderRadius = toResponsiveUnit(config.borderRadius);
  }

  return styles;
}

/**
 * Utility to log current scaling information (for debugging)
 */
export function logScaleInfo() {
  const dashboard = document.querySelector('.led-dashboard');
  if (!dashboard) {
    // console.log('Dashboard not found');
    return;
  }

  const width = dashboard.offsetWidth;
  const height = dashboard.offsetHeight;
  const scale = getScaleFactor(dashboard);

  // console.log('=== Responsive Scale Info ===');
  // console.log(`Reference: ${REFERENCE_WIDTH}px × ${REFERENCE_HEIGHT}px`);
  // console.log(`Current: ${width.toFixed(0)}px × ${height.toFixed(0)}px`);
  // console.log(`Scale Factor: ${scale.toFixed(4)}`);
  // console.log(`Example: 32px design = ${toActualPixels(32, dashboard).toFixed(2)}px actual`);
  // console.log('=============================');
}
