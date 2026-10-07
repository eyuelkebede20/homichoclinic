import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: (request) => {
    const origin = request?.headers?.get("origin") || request?.headers?.get("referer");
    const host = request?.headers?.get("host");
    const origins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];
    if (origin) {
      try {
        const u = new URL(origin);
        origins.push(u.origin);
      } catch (e) {}
    }
    if (host) {
      origins.push(`http://${host}`);
      origins.push(`https://${host}`);
    }
    if (process.env.BETTER_AUTH_URL) origins.push(process.env.BETTER_AUTH_URL);
    if (process.env.TRUSTED_ORIGINS) origins.push(...process.env.TRUSTED_ORIGINS.split(",").map(s => s.trim()));
    return Array.from(new Set(origins));
  },
  advanced: {
    cookiePrefix: "clinic_v2",
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => {
        const bcrypt = await import("bcryptjs");
        return bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        const bcrypt = await import("bcryptjs");
        return bcrypt.compare(password, hash);
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false, // Cannot be set by user through standard endpoints
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const count = await prisma.user.count();
          if (count === 0) {
            user.role = "Admin";
          } else {
            user.role = "User";
          }
          return { data: user, cancel: false };
        }
      }
    }
  }
});
