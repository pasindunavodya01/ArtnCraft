import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-blue-400 mb-4">React + Express + Tailwind</h1>
        <p className="text-xl text-slate-300 mb-8">Count: <span className="text-blue-400 font-bold">{count}</span></p>
        <button 
          onClick={() => setCount(count + 1)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
        >
          Increment
        </button>
      </div>
    </div>
  )
}

export default App
