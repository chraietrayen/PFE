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

    async createSession(session) {
      const id = uuid()
      await prisma.session.create({
        data: {
          id,
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        },
      })
      return session as AdapterSession
    },

    async getSessionAndUser(sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
      })
      if (!session) return null
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      })
      if (!user) return null

      return {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
          role: user.role || "USER",
        },
      } as { session: AdapterSession; user: AdapterUser & { role: string } }
    },

    async updateSession(session) {
      await prisma.session.update({
        where: { sessionToken: session.sessionToken },
        data: { expires: session.expires },
      })
      return session as AdapterSession
    },

    async deleteSession(sessionToken) {
      await prisma.session.deleteMany({ where: { sessionToken } })
    },

    async createVerificationToken(token) {
      await prisma.verificationToken.create({
        data: {
          identifier: token.identifier,
          token: token.token,
          expires: token.expires,
        },
      })
      return token
    },

    async useVerificationToken({ identifier, token }) {
      const existing = await prisma.verificationToken.findFirst({
        where: { identifier, token },
      })
      if (!existing) return null

      await prisma.verificationToken.deleteMany({
        where: { identifier, token },
      })
      return {
        identifier: existing.identifier,
        token: existing.token,
        expires: existing.expires,
      }
    },
  }
}