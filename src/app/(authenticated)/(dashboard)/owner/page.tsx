// src/app/(dashboard)/users/page.tsx
"use client";

import { trpc } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { UserProfileTable } from "./_components/UserProfileTable";

export default function UsersManagementPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const utils = trpc.useUtils();
    const inviteMutation = trpc.user.inviteEmployee.useMutation({
        onSuccess: () => {
            setSuccessMessage(`Undangan berhasil dikirim ke ${email}!`);
            setEmail("");
            utils.user.listProfiles.invalidate();
            setTimeout(() => {
                setIsOpen(false);
                setSuccessMessage(null);
            }, 2000);
        },
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        inviteMutation.mutate({ email });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h1>
                    <p className="text-sm text-gray-500">Daftar seluruh karyawan dan owner yang terdaftar dalam sistem.</p>
                </div>

                {/* Dialog / Modal Invite Employee */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" /> Invite Employee
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleInvite(e);
                        }}>
                            <DialogHeader>
                                <DialogTitle>Undang Karyawan Baru</DialogTitle>
                                <DialogDescription>
                                    Masukkan email karyawan. Mereka akan menerima email tautan untuk membuat password dan mengakses aplikasi.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Karyawan</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="karyawan@umkm.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {inviteMutation.error && (
                                    <p className="text-sm text-red-500">{inviteMutation.error.message}</p>
                                )}
                                {successMessage && (
                                    <p className="text-sm text-green-600 font-medium">{successMessage}</p>
                                )}
                            </div>
                            <DialogFooter>
                                {/* PENTING: Pastikan button submit jelas tipe-nya dan tidak mentrigger reload */}
                                <Button
                                    type="submit"
                                    disabled={inviteMutation.isPending}
                                >
                                    {inviteMutation.isPending ? "Mengirim..." : "Kirim Undangan"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <UserProfileTable />
        </div>
    );
}