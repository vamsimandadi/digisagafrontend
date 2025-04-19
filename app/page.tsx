'use client'

import { useState } from 'react'

export default function Home() {
  const [message, setMessage] = useState('Click the button to fetch!')

  const handleClick = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    console.log(baseUrl);
    try {
      console.log(baseUrl);
      const res = await fetch(`${baseUrl}/api/greet?name=Alice`)
      console.log("after calling base url...");
      const text = await res.text()
      setMessage(text)
    } catch (err) {
      setMessage('Failed to fetch greeting.')
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">{message}</h1>
      <button 
        onClick={handleClick} 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Fetch Greeting
      </button>
    </main>
  )
}
