"use client";

import { trpc } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";

export function UserProfileTable() {
    const { data: profiles, isLoading, error } = trpc.user.listProfiles.useQuery();

    if (isLoading) {
        return <div className="p-4 text-center text-sm text-gray-500">Memuat data profil...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-sm text-red-500">Gagal memuat data: {error.message}</div>;
    }

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Lengkap</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Bergabung</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {profiles && profiles.length > 0 ? (
                        profiles.map((profile) => (
                            <TableRow key={profile.id}>
                                <TableCell className="font-medium">{profile.fullName}</TableCell>
                                <TableCell>{profile.email}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-px px-2.5 py-0.5 text-xs font-semibold ${
                                        profile.role === 'OWNER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {profile.role}
                                    </span>
                                </TableCell>
                                <TableCell>{new Date(profile.createdAt).toLocaleDateString("id-ID")}</TableCell>
                                <TableCell className="text-right">
                                    {/* Action Button / Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Buka menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => alert(`Lihat detail: ${profile.id}`)}>
                                                <Eye className="mr-2 h-4 w-4" /> Detail
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-red-600" 
                                                onClick={() => {
                                                    alert(`Hapus user: ${profile.email}`);
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                Belum ada profil terdaftar.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}