// Utility functions for managing circle names in localStorage
// Since the smart contract doesn't store names, we store them locally

const CIRCLE_NAMES_KEY = 'esusu_circle_names'

/**
 * Get all circle names from localStorage
 * @returns {Object} - Object with circleId as key and name as value
 */
export function getAllCircleNames() {
  try {
    const stored = localStorage.getItem(CIRCLE_NAMES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading circle names from localStorage:', error)
    return {}
  }
}

/**
 * Save a circle name to localStorage
 * @param {number} circleId - The circle ID
 * @param {string} name - The circle name
 */
export function saveCircleName(circleId, name) {
  try {
    // Ensure circleId is a string for consistent key storage
    const key = String(circleId)
    const allNames = getAllCircleNames()
    allNames[key] = name
    localStorage.setItem(CIRCLE_NAMES_KEY, JSON.stringify(allNames))
    console.log(`✅ Saved circle name: "${name}" for Circle #${key}`)
    console.log('📦 All stored names:', allNames)
  } catch (error) {
    console.error('Error saving circle name to localStorage:', error)
  }
}

/**
 * Get a specific circle name
 * @param {number} circleId - The circle ID
 * @returns {string|null} - The circle name or null if not found
 */
export function getCircleName(circleId) {
  // Ensure circleId is a string for consistent key lookup
  const key = String(circleId)
  const allNames = getAllCircleNames()
  const name = allNames[key] || null
  // Only log when name is not found for debugging
  if (!name) {
    console.log(`⚠️ Circle name not found for circle #${key}. Available names:`, Object.keys(allNames))
  }
  return name
}

/**
 * Get circle display name (returns name if exists, otherwise "Circle #[ID]")
 * @param {number} circleId - The circle ID
 * @returns {string} - The display name
 */
export function getCircleDisplayName(circleId) {
  const name = getCircleName(circleId)
  return name || `Circle #${circleId}`
}

/**
 * Delete a circle name from localStorage
 * @param {number} circleId - The circle ID
 */
export function deleteCircleName(circleId) {
  try {
    const allNames = getAllCircleNames()
    delete allNames[circleId]
    localStorage.setItem(CIRCLE_NAMES_KEY, JSON.stringify(allNames))
  } catch (error) {
    console.error('Error deleting circle name from localStorage:', error)
  }
}
