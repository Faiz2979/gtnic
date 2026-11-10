// ./IUser.ts

import z from "zod";

export const registerUserSchema = z.object({
    fullName: z.string("masukkan nama").min(1, "Nama wajib diisi"),
    email: z.email("email tidak valid"),
})

export type registerUser = z.infer<typeof registerUserSchema>;