"use client";

import { trpc } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Column, FlexibleTable } from "@/components/ui/flexible-table";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";

interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    role: string;
}

export function UserProfileTable() {
    const { data: profiles, isLoading, error } = trpc.user.listProfiles.useQuery();

    if (isLoading) {
        return <div className="p-4 text-center text-sm text-gray-500">Memuat data profil...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-sm text-red-500">Gagal memuat data: {error.message}</div>;
    }
    const columns: Column<UserProfile>[] = [{
        header: "Nama",
        accessorKey: "fullName",
        cell: (row) => {
            const fullName = row.fullName;
            return <span className="font-medium">{fullName}</span>;
        }
    }, {
        header: "Email",
        accessorKey: "email",
        cell: (row) => {
            const email = row.email;
            return <span className="text-sm text-gray-600">{email}</span>;
        }
    },
    {
        header: "Role",
        accessorKey: "role",
        cell: (row) => {
            const role = row.role;
            return <span className="capitalize">{role}</span>;
        }
    },
    {
        header: "Aksi",
        accessorKey: "actions",
        cell: () => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Trash2 className="mr-2 h-4 w-4" />

                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    }

    ];

    return (
        <>
            {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">Memuat data profil...</div>
            ) : error ? (
                <div className="p-4 text-center text-sm text-red-500">Gagal memuat data: {error}</div>
            ) : (
                <div className="rounded-md border bg-white shadow-sm">
                    <FlexibleTable data={profiles ?? []} columns={columns} />
                </div>
            )}
        </>
    );
}