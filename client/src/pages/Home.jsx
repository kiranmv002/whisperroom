import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black text-white mb-3">
          Whisper<span className="text-purple-400">Room</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Private rooms. Whisper secrets. Panic exit.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate('/create')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition"
        >
          Create Room
        </button>
        <button
          onClick={() => navigate('/join')}
          className="border border-purple-500 text-purple-400 hover:bg-purple-500/10 font-bold py-3 rounded-xl transition"
        >
          Join Room
        </button>
      </div>
    </div>
  )
}
