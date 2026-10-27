// src/server/routers/user/user.actions.ts
import { supabaseAdmin } from "@/lib/supabase-admin";
import { TRPCError } from "@trpc/server";
import { IRegisterUser as ICreateProfile } from "./IUser";
import { userRepository } from "./user.repository";

export const userActions = {
    async createProfile(input: ICreateProfile): Promise<void> {
        const existingUser = await supabaseAdmin.auth.admin.getUserById(input.id);

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
    }
};