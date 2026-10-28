// src/server/routers/user/user.actions.ts
import { supabaseAdmin } from "@/lib/supabase-admin";
import { TRPCError } from "@trpc/server";
import { IRegisterUser as ICreateProfile } from "./IUser";
import { userRepository } from "./user.repository";

export const userActions = {
    async createProfile(input: ICreateProfile): Promise<void> {
        try {
            // Langgil repository untuk membuat profile baru
            await userRepository.createProfile(input);
        } catch (error) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal mendaftarkan pengguna baru ke database.",
                cause: error,
            });
        }
    },

    async inviteEmployee(email: string) {
        console.log(process.env.NEXT_PUBLIC_URL);
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/update-password`,
        });

        if (error) throw error;
        return data;
    },

    async listProfiles() {
        try {
            const profiles = await userRepository.listProfiles();
            return profiles;
        } catch (error) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal mengambil daftar profil dari database.",
                cause: error,
            });
        }
    },
    
    async getCurrentProfile(userId: string) {
        try {
            const profile = await userRepository.getProfileById(userId);
            if (!profile) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Profil dengan ID ${userId} tidak ditemukan.`,
                });
            }
            return profile;
        } catch (error) {
            if (error instanceof TRPCError) {
                throw error; // lempar error jika sudah berupa TRPCError
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal mengambil profil dari database.",
                cause: error,
            });
        }
    },
};