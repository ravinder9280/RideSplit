// If you have a TS path alias "@/lib/*"
import { PrismaClient } from '@/lib/generated/prisma'
// Otherwise use a relative path:
// import { PrismaClient } from '../../lib/generated/prisma'

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
