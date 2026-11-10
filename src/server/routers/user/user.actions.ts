import { supabaseAdmin } from "@/lib/supabase-admin";
import { TRPCError } from "@trpc/server";
import { registerUser } from "./user.dto";
import { userRepository } from "./user.repository";

export const userActions = {
    async createProfile(id: string, input: registerUser): Promise<void> {
        try {
            await userRepository.createProfile(id, input);
        } catch (error) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal mendaftarkan pengguna baru ke database.",
                cause: error,
            });
        }
    },

    async inviteEmployee(email: string) {
        const siteUrl = process.env.NEXT_PUBLIC_URL;

        try {
            const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
            });

            if (error) throw error;
            return { user: data.user, inviteLink: null };
        } catch (err: unknown) {
            console.warn("inviteUserByEmail fallback to generateLink:", err);
            const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: "invite",
                email,
                options: {
                    redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
                },
            });
            if (linkError) throw linkError;
            return {
                user: linkData.user,
                inviteLink: linkData.properties?.action_link || null,
            };
        }
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