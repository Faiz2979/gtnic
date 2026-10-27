// ./IUser.ts

import { Role } from "../../../../lib/generated/prisma";

export interface IRegisterUser {
    id: string;
    email: string;
    fullName: string;
    role?: Role; // Opsional karena di schema sudah ada @default(STAFF)
}