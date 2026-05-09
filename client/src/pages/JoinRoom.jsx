import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function JoinRoom() {
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const joinRoom = async () => {
    if (!username.trim() || code.length !== 6) return
    const res = await axios.get(`http://localhost:3001/room/${code}`)
    if (res.data.exists) {
      navigate(`/room/${code}`, { state: { username } })
    } else {
      setError('Room not found. Check the code and try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-black text-white mb-6 text-center">
          Join a Room
        </h2>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition"
          />
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            maxLength={6}
            onChange={e => setCode(e.target.value.toUpperCase())}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition text-center tracking-widest font-mono text-lg"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={joinRoom}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition"
          >
            Join Room
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-4 w-full text-gray-500 text-sm hover:text-gray-300 transition"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
