"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { toast, Bounce } from 'react-toastify'

export type User = {
    id: string
    email: string
    name: string
    role: string
    lastLogin: string
}

async function updateUserRole(userId: string, newRole: string, onUpdate?: () => void) {
    try {
        const response = await fetch('/api/users/updateRole', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, newRole })
        })

        if (!response.ok) throw new Error('Erreur lors de la mise à jour')

        toast('Rôle mis à jour avec succès!', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            transition: Bounce,
        })

        if (onUpdate) onUpdate()
    } catch (error) {
        toast.error('Erreur lors de la mise à jour du rôle', {
            position: "top-right",
            theme: "dark",
            transition: Bounce,
        })
    }
}

async function deleteUser(userId: string, onDelete?: () => void) {
    try {
        const response = await fetch('/api/users/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        })

        if (!response.ok) throw new Error('Erreur lors de la suppression')

        toast('Utilisateur supprimé avec succès!', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            transition: Bounce,
        })

        if (onDelete) onDelete()
    } catch (error) {
        toast.error('Erreur lors de la suppression', {
            position: "top-right",
            theme: "dark",
            transition: Bounce,
        })
    }
}

function UserActions({ user, onDataChange }: { user: User; onDataChange?: () => void }) {
    const { user: currentUser } = useUser()
    const [currentUserRole, setCurrentUserRole] = useState<string>("étudiant")
    
    // Vérifier si c'est le compte actuel
    const isCurrentUser = currentUser?.emailAddresses?.[0]?.emailAddress === user.email

    useEffect(() => {
        fetchUserRole()
    }, [currentUser?.emailAddresses])

    const fetchUserRole = async () => {
        if (!currentUser?.emailAddresses?.[0]?.emailAddress) return
        
        try {
            const response = await fetch(`/api/users/role?email=${encodeURIComponent(currentUser.emailAddresses[0].emailAddress)}`)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const data = await response.json()
            setCurrentUserRole(data.role)
        } catch (error) {
            console.error("Erreur lors de la récupération du rôle:", error)
        }
    }

    // Si on n'est ni admin ni enseignant, on ne montre pas les actions
    if (currentUserRole !== "admin" && currentUserRole !== "enseignant") {
        return null
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                {/* Admin peut tout faire sauf sur lui-même */}
                {currentUserRole === "admin" && !isCurrentUser && (
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Changer le rôle</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem
                                onClick={() => updateUserRole(user.id, "admin", onDataChange)}
                            >
                                Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => updateUserRole(user.id, "enseignant", onDataChange)}
                            >
                                Enseignant
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => updateUserRole(user.id, "étudiant", onDataChange)}
                            >
                                Étudiant
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                )}

                {/* Enseignant peut seulement gérer les étudiants */}
                {currentUserRole === "enseignant" && user.role === "étudiant" && (
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Changer le rôle</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem
                                onClick={() => updateUserRole(user.id, "enseignant", onDataChange)}
                            >
                                Enseignant
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                )}

                {/* Admin peut supprimer n'importe qui sauf lui-même */}
                {currentUserRole === "admin" && !isCurrentUser && (
                    <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteUser(user.id, onDataChange)}
                    >
                        Supprimer
                    </DropdownMenuItem>
                )}

                {/* Enseignant peut seulement supprimer les étudiants */}
                {currentUserRole === "enseignant" && user.role === "étudiant" && (
                    <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteUser(user.id, onDataChange)}
                    >
                        Supprimer
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const columns: ColumnDef<User>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Tout sélectionner"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Sélectionner"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                Nom
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                Email
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "role",
        header: "Rôle",
        cell: ({ row }) => <div className="capitalize">{row.getValue("role")}</div>,
    },
    {
        accessorKey: "lastLogin",
        header: "Dernière connexion",
        cell: ({ row }) => {
            return (
                <div>{new Date(row.getValue("lastLogin")).toLocaleDateString("fr-FR")}</div>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row, table }) => (
            <UserActions
                user={row.original}
                onDataChange={(table.options.meta as any)?.onDataChange}
            />
        )
    },
]
