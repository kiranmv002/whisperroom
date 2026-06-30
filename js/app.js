// ===== SHARED UTILITY FUNCTIONS =====

// Generate 6-digit room code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// Get current time as HH:MM
function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Save to localStorage
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// Load from localStorage
function load(key) {
  const val = localStorage.getItem(key)
  return val ? JSON.parse(val) : null
}

// Clear key from localStorage
function clear(key) {
  localStorage.removeItem(key)
}

// ===== CLEANUP OLD ROOMS =====
function cleanupOldRooms() {
  const rooms = load('wr_rooms') || {}
  const now = Date.now()
  let changed = false

  for (const code in rooms) {
    const age = now - rooms[code].createdAt
    // Delete rooms older than 2 hours (safety net)
    if (age > 2 * 60 * 60 * 1000) {
      delete rooms[code]
      changed = true
    }
  }

  if (changed) save('wr_rooms', rooms)
}

// Run cleanup on every page load
cleanupOldRooms()
