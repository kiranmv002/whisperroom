// ===== JOIN ROOM LOGIC =====

document.addEventListener('DOMContentLoaded', () => {

  // Auto uppercase + only allow valid characters
  const codeInput = document.getElementById('join-code')
  if (codeInput) {
    codeInput.addEventListener('input', () => {
      codeInput.value = codeInput.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
    })
    codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') joinRoom()
    })
  }

  // Enter key on name input
  const nameInput = document.getElementById('join-username')
  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') joinRoom()
    })
  }

})

function joinRoom() {
  const username = document.getElementById('join-username').value.trim()
  const code = document.getElementById('join-code').value.trim().toUpperCase()
  const errorEl = document.getElementById('join-error')

  errorEl.style.display = 'none'

  // Shake helper
  function shake(id) {
    const el = document.getElementById(id)
    el.classList.remove('shake')
    void el.offsetWidth
    el.classList.add('shake')
    setTimeout(() => el.classList.remove('shake'), 400)
  }

  if (!username) { shake('join-username'); return }
  if (code.length !== 6) { shake('join-code'); return }

  const rooms = load('wr_rooms') || {}

  if (!rooms[code]) {
    errorEl.style.display = 'block'
    shake('join-code')
    return
  }

  if (!rooms[code].members.includes(username)) {
    rooms[code].members.push(username)
    save('wr_rooms', rooms)
  }

  save('wr_user', { username, code })
  window.location.href = 'room.html'
}
