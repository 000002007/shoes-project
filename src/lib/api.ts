import type { Attributes, LookupResponse } from '../types'

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '')
  || 'http://localhost:8787'

export async function lookupModel(model: string): Promise<Attributes> {
  const res = await fetch(`${BASE}/api/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  })
  if (!res.ok) {
    let message = 'Не удалось получить атрибуты'
    try {
      const e = await res.json()
      if (e?.message) message = e.message
    } catch { /* тело не JSON — оставляем дефолтное сообщение */ }
    throw new Error(message)
  }
  const data = (await res.json()) as LookupResponse
  return data.attributes
}
