// ===== CREATE ROOM LOGIC =====

let generatedCode = ''

function createRoom() {
  const username = document.getElementById('username').value.trim()

  // Validation
  if (!username) {
    document.getElementById('username').style.borderColor = 'rgba(220,38,38,0.6)'
    return
  }

  // Generate room code
  generatedCode = generateCode()

  // Save room to localStorage
  let rooms = load('wr_rooms') || {}
  rooms[generatedCode] = {
    code: generatedCode,
    createdAt: Date.now(),
    messages: [],
    members: [username]
  }
  save('wr_rooms', rooms)

  // Save current user session
  save('wr_user', { username, code: generatedCode })

  // Show step 2
  document.getElementById('step1').style.display = 'none'
  document.getElementById('step2').style.display = 'block'
  document.getElementById('room-code-display').textContent = generatedCode
}

function copyCode() {
  navigator.clipboard.writeText(generatedCode).catch(() => {})
  document.getElementById('copy-hint').textContent = '✅ Copied!'
  setTimeout(() => {
    document.getElementById('copy-hint').textContent = 'Tap to copy'
  }, 2000)
}

function enterRoom() {
  window.location.href = 'room.html'
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('username')
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') createRoom()
    })
  }
})
