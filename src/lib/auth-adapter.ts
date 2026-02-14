import { Adapter, AdapterUser, AdapterAccount, AdapterSession } from "next-auth/adapters"
import prisma from "./prisma"
import { v4 as uuid } from "uuid"

export function MySQLAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser & { role: string }> {
      const id: string = uuid()
      const created = await prisma.user.create({
        data: {
          id,
          email: user.email,
          name: user.name || null,
          image: user.image || null,
          emailVerified: user.emailVerified || null,
          role: "USER",
        },
      })
      return { ...user, id, role: "USER" } as AdapterUser & { role: string }
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } })
      if (!user) return null
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        role: user.role || "USER",
      } as AdapterUser & { role: string }
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return null
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        role: user.role || "USER",
      } as AdapterUser & { role: string }
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findFirst({
        where: { provider, providerAccountId },
      })
      if (!account) return null
      const user = await prisma.user.findUnique({ where: { id: account.userId } })
      if (!user) return null
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        role: user.role || "USER",
      } as AdapterUser & { role: string }
    },

    async updateUser(user) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || undefined,
          email: user.email || undefined,
          image: user.image || undefined,
          emailVerified: user.emailVerified || undefined,
        },
      })
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        image: updated.image,
        emailVerified: updated.emailVerified,
        role: updated.role || "USER",
      } as AdapterUser & { role: string }
    },

    async deleteUser(id) {
      await prisma.user.delete({ where: { id } })
    },

    async linkAccount(account: AdapterAccount): Promise<AdapterAccount> {
      await prisma.account.create({
        data: {
          id: uuid(),
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token || null,
          access_token: account.access_token || null,
          expires_at: account.expires_at || null,
          token_type: account.token_type || null,
          scope: account.scope || null,
          id_token: account.id_token || null,
          session_state: (account.session_state as string) || null,
        },
      })
      return account as AdapterAccount
    },

    async unlinkAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      const account = await prisma.account.findFirst({
        where: { provider, providerAccountId },
      })
      if (account) {
        await prisma.account.delete({ where: { id: account.id } })
      }
    },

    // Session methods - JWT strategy is used, no DB sessions needed
    async createSession(session) {
      return session as AdapterSession
    },

    async getSessionAndUser(sessionToken) {
      return null
    },

    async updateSession(session) {
      return session as AdapterSession
    },

    async deleteSession(sessionToken) {
      // No-op: JWT strategy handles sessions
    },

    async createVerificationToken(token) {
      return token
    },

    async useVerificationToken({ identifier, token }) {
      return null
    },
  }
}