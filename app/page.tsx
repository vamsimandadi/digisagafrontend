'use client'

import { useState } from 'react'

export default function Home() {
  const [message, setMessage] = useState('Click to load greeting')

  const fetchGreeting = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/greet?name=Alice`)
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
        onClick={fetchGreeting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Fetch Greeting
      </button>
    </main>
  )
}
