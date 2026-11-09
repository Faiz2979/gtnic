// src/server/routers/user/user.repository.ts
import { prisma } from "@/lib/prisma";
import { Role } from "../../../../lib/generated/prisma";
import { IRegisterUser } from "./IUser";

export const userRepository = {
    async createProfile(input: IRegisterUser): Promise<void> {
        await prisma.profile.create({
            data: {
                id: input.id,
                email: input.email,
                fullName: input.fullName,
                role: input.role ?? Role.STAFF,
            },
        });
    },
    async findByEmail(email: string) {
        return await prisma.profile.findUnique({
            where: { email },
        });
    },

    async listProfiles() {
        return await prisma.profile.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        transactions: true,
                    },
                },
            },
        });
    },

    async getProfileById(id: string) {
        return await prisma.profile.findUnique({
            where: { id },
        });
    }
};