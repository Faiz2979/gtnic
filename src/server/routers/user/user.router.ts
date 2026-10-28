
import { z } from 'zod';
import { Role } from '../../../../lib/generated/prisma/edge';
import { protectedProcedure, publicProcedure, router } from '../../trpc';
import { userActions } from './user.actions';
// berfungsi untuk grouping procedure yang sudah didefinisikan di file lain
// sifatnya tergantung, jika router ini hanya memiliki satu procedure 
// maka bisa langsung di export procedure tersebut tanpa perlu membuat router baru

export const userRouter = router({
    // register procedure untuk registrasi user baru
    createProfile: publicProcedure.input(
        z.object({
            id: z.uuid(),
            email: z.email(),
            fullName: z.string().min(1, "Nama lengkap wajib diisi"),
            role: z.enum(Role).optional(),
        })
    ).mutation(async ({ input }) => {
        await userActions.createProfile(input);
        return { success: true, message: "Pembuatan profil berhasil!" };
    }),

    inviteEmployee: publicProcedure.input(
        z.object({
            email: z.email("Email tidak valid"),
        })
    ).mutation(async ({ input }) => {
        const { email } = input;
        await userActions.inviteEmployee(email);
        return { success: true, message: "Undangan berhasil dikirim!" };
    }),

    listProfiles: publicProcedure.query(async () => {
        return await userActions.listProfiles();
    }),

    getCurrentProfile: protectedProcedure.query(async ({ ctx }) => {
        // ctx.user.id didapat dari middleware/context tRPC yang memvalidasi token Supabase
        return await userActions.getCurrentProfile(ctx.user.id);
    }),
});