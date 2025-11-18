/**
 * Example: How to configure MapElement for precise geographic positioning
 *
 * This file demonstrates three approaches to ensure dots appear at correct locations:
 * 1. Equirectangular projection (simple, works for most world maps)
 * 2. Mercator projection (for navigation-style maps)
 * 3. Calibration-based (for perfect accuracy with any map)
 */

// ============================================
// Approach 1: Equirectangular (RECOMMENDED)
// ============================================
// Best for standard world map images like "World map.png"
// Simple linear mapping that works great for most use cases

const equirectangularConfig = {
  id: 'world-map',
  x: 0,
  y: 0,
  width: 800,
  height: 400,
  mapImage: 'assets/World map.png',
  projection: 'equirectangular',
  bounds: {
    minLat: -60,    // Map doesn't show full -90 to 90
    maxLat: 85,
    minLon: -180,
    maxLon: 180
  },
  showLocationLabel: true,
  locationLabelDuration: 5000
};

// ============================================
// Approach 2: Mercator Projection
// ============================================
// Better for navigation maps, but requires correct bounds

const mercatorConfig = {
  id: 'world-map',
  x: 0,
  y: 0,
  width: 800,
  height: 400,
  mapImage: 'assets/World map.png',
  projection: 'mercator',
  bounds: {
    minLat: -85,
    maxLat: 85,
    minLon: -180,
    maxLon: 180
  },
  showLocationLabel: true
};

// ============================================
// Approach 3: Calibration-Based (MOST ACCURATE)
// ============================================
// Use 2+ known cities to auto-calibrate the coordinate system
// Accounts for any cropping, padding, or distortions in the image

const calibratedConfig = {
  id: 'world-map',
  x: 0,
  y: 0,
  width: 800,
  height: 400,
  mapImage: 'assets/World map.png',
  projection: 'calibrated',
  calibrationPoints: [
    // To calibrate: measure pixel positions of known cities in your map image
    // You can use image editing software to find x,y pixel coordinates
    {
      name: 'New York',
      lat: 40.7128,
      lon: -74.0060,
      x: 275,  // Measure this from your actual map image
      y: 145   // Measure this from your actual map image
    },
    {
      name: 'Rome',
      lat: 41.9028,
      lon: 12.4964,
      x: 520,  // Measure this from your actual map image
      y: 142   // Measure this from your actual map image
    },
    // Optional: Add more points for validation
    {
      name: 'Tokyo',
      lat: 35.6762,
      lon: 139.6503,
      x: 710,  // Measure this from your actual map image
      y: 155   // Measure this from your actual map image
    }
  ],
  showLocationLabel: true
};

// ============================================
// Usage Examples
// ============================================

// Example 1: Add single location with city/country
mapElement.updateData({
  lat: 40.7128,
  lon: -74.0060,
  city: 'New York',
  state: 'NY',
  country: 'USA'
});

// Example 2: Add international location
mapElement.updateData({
  lat: 41.9028,
  lon: 12.4964,
  city: 'Rome',
  country: 'Italy'
});

// Example 3: Add location with custom display name
mapElement.updateData({
  lat: 35.6762,
  lon: 139.6503,
  displayName: 'Tokyo, Japan'
});

// Example 4: Add multiple locations at once
mapElement.updateData([
  { lat: 40.7128, lon: -74.0060, city: 'New York', state: 'NY', country: 'USA' },
  { lat: 41.9028, lon: 12.4964, city: 'Rome', country: 'Italy' },
  { lat: 35.6762, lon: 139.6503, city: 'Tokyo', country: 'Japan' },
  { lat: 51.5074, lon: -0.1278, city: 'London', country: 'UK' }
]);

// Example 5: Just coordinates (no label will show)
mapElement.updateData({
  lat: -33.8688,
  lon: 151.2093
});

// ============================================
// Testing Coordinate Accuracy
// ============================================
// Use these known locations to verify your map alignment

const testLocations = [
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Rome', lat: 41.9028, lon: 12.4964 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357 }
];

// Test all locations
function testMapAccuracy() {
  testLocations.forEach((loc, index) => {
    setTimeout(() => {
      mapElement.updateData({
        lat: loc.lat,
        lon: loc.lon,
        displayName: loc.name
      });
    }, index * 1000); // Add one per second
  });
}

// ============================================
// Configuration Tips
// ============================================
/*
1. START WITH EQUIRECTANGULAR:
   - Set bounds to match visible area of your map
   - Adjust minLat/maxLat if map has padding at poles

2. IF POSITIONS ARE OFF:
   - Switch to calibrated projection
   - Find 2-3 major cities on your map
   - Use image software to measure their pixel positions
   - Add as calibration points

3. LOCATION LABELS:
   - showLocationLabel: true/false - enable/disable label
   - locationLabelDuration: milliseconds (0 = permanent)
   - Labels auto-format: "City, State, Country" or "City, Country"

4. MAP IMAGE:
   - Ensure image loads before adding dots
   - Match container aspect ratio to image aspect ratio for best results
   - Standard world maps work best with equirectangular projection
*/

export { equirectangularConfig, mercatorConfig, calibratedConfig, testLocations };
