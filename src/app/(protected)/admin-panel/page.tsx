"use client"

import { columns } from "./columns"
import { DataTable } from "./data-table"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useEffect, useState } from "react"
import { User } from "./columns"
import { withRoleCheck } from "@/components/auth/with-role-check"
// import Spotlight from "./spotlight"


function AdminPanel() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users')
            const data = await response.json()
            setUsers(data)
        } catch (error) {
            console.error("Erreur lors de la récupération des utilisateurs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-8">Gestion des utilisateurs</h1>
            {isLoading ? (
                <div>Chargement...</div>
            ) : (
                <DataTable columns={columns} data={users} onDataChange={fetchUsers} />
            )}
            <ToastContainer />
        </div>
    )
}

export default withRoleCheck(AdminPanel)
