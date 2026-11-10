import { prisma } from "@/lib/prisma";
import { ROLE } from "@/utils/enums/user-role.enum";
import { registerUser } from "./user.dto";

export const userRepository = {
    async createProfile(id: string, input: registerUser): Promise<void> {
        await prisma.profile.create({
            data: {
                id,
                email: input.email,
                fullName: input.fullName,
                role: ROLE.STAFF,
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