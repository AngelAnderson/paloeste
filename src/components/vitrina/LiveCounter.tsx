"use client"

import { useEffect, useState, useRef } from "react"

interface LiveCounterProps {
  slug: string
  initialSearches: number
  initialUsers: number
  initialPosition: number
}

export function LiveCounter({ slug, initialSearches, initialUsers, initialPosition }: LiveCounterProps) {
  const [searches, setSearches] = useState(initialSearches)
  const [users, setUsers] = useState(initialUsers)
  const [position, setPosition] = useState(initialPosition)
  const [isLive, setIsLive] = useState(true)
  const prevSearches = useRef(initialSearches)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/vitrina/stats/${encodeURIComponent(slug)}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.searches !== undefined) {
          prevSearches.current = searches
          setSearches(data.searches)
          setUsers(data.users)
          setPosition(data.position)
          setIsLive(true)
        }
      } catch {
        setIsLive(false)
      }
    }

    const interval = setInterval(poll, 60_000) // every 60s
    return () => clearInterval(interval)
  }, [slug, searches])

  return (
    <div className="space-y-6">
      {/* Big number */}
      <div className="text-center">
        <p className="text-7xl md:text-8xl font-black text-red-600 tabular-nums leading-none">
          {searches.toLocaleString()}
        </p>
        <p className="text-lg text-stone-500 mt-2">
          personas buscaron tu categor&iacute;a este mes
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-po-surface border border-po-border rounded-xl p-4">
          <p className="text-2xl font-black text-stone-900">{users}</p>
          <p className="text-stone-500 text-xs">usuarios &uacute;nicos</p>
        </div>
        <div className="bg-po-surface border border-po-border rounded-xl p-4">
          <p className="text-2xl font-black text-stone-900">#{position}</p>
          <p className="text-stone-500 text-xs">tu posici&oacute;n</p>
        </div>
        <div className="bg-po-surface border border-po-border rounded-xl p-4">
          <div className="flex items-center justify-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`} />
            <p className="text-2xl font-black text-stone-900">{isLive ? 'LIVE' : '...'}</p>
          </div>
          <p className="text-stone-500 text-xs">datos en tiempo real</p>
        </div>
      </div>
    </div>
  )
}
