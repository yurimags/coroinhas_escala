import { useEffect, useState } from "react"
import { columns } from "@/components/servers/columns"
import { DataTable } from "@/components/servers/data-table"

export default function Home() {
  const [coroinhas, setCoroinhas] = useState([])
  const apiUrl = import.meta.env.VITE_API_URL

  const fetchCoroinhas = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/coroinhas`)
      const data = await response.json()
      setCoroinhas(data)
    } catch (error) {
      console.error('Erro ao buscar coroinhas:', error)
    }
  }

  useEffect(() => {
    fetchCoroinhas()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={coroinhas}
        onUpdate={fetchCoroinhas}
      />
    </div>
  )
} 