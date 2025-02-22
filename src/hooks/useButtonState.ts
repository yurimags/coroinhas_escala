import { useState, useCallback } from 'react'

export function useButtonState() {
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(async (callback: () => Promise<void>) => {
    try {
      setLoading(true)
      await callback()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    handleClick
  }
} 