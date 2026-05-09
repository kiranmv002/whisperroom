import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function CreateRoom() {
  const [username, setUsername] = useState('')
  const [code, setCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const createRoom = async () => {
    if (!username.trim()) return
    setLoading(true)
    const res = await axios.post('http://localhost:3001/create-room')
    setCode(res.data.code)
    setLoading(false)
  }

  const enterRoom = () => {
    navigate(`/room/${code}`, { state: { username } })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-black text-white mb-6 text-center">
          Create a Room
        </h2>

        {!code ? (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition"
            />
            <button
              onClick={createRoom}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Generate Room Code'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-gray-400 text-sm">Share this code with friends</p>
            <div className="bg-purple-500/10 border border-dashed border-purple-500/40 rounded-xl py-6">
              <p className="text-xs text-purple-400 mb-2 tracking-widest">ROOM CODE</p>
              <p className="text-4xl font-black text-purple-300 tracking-widest">{code}</p>
            </div>
            <button
              onClick={enterRoom}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition"
            >
              Enter Room
            </button>
          </div>
        )}

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
