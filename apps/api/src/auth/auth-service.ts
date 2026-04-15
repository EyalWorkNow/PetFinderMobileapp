import { createRemoteJWKSet, jwtVerify, type JWTPayload, SignJWT } from "jose";
import type { FastifyRequest } from "fastify";
import { compare } from "bcryptjs";
import type { AppConfig } from "../config";
import type { Repository } from "../db/repository";
import type { UserRole } from "../db/models";

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
}

function getBearerToken(header?: string): string | null {
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

export class AuthService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;
  private readonly secret: Uint8Array;

  constructor(
    private readonly config: AppConfig,
    private readonly repository: Repository
  ) {
    this.jwks = config.SUPABASE_URL
      ? createRemoteJWKSet(new URL(`${config.SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
      : null;
    this.secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-for-dev-only");
  }

  async verifyRequest(request: FastifyRequest): Promise<AuthUser | null> {
    const token = getBearerToken(request.headers.authorization);

    if (token && this.jwks && this.config.SUPABASE_URL) {
      try {
        const issuer = `${this.config.SUPABASE_URL}/auth/v1`;
        const { payload } = await jwtVerify(token, this.jwks, {
          issuer,
          audience: this.config.SUPABASE_JWT_AUDIENCE
        });
        const user = this.payloadToUser(payload);
        // Sync role from our DB
        const dbUser = await this.repository.getUserById(user.id);
        return { ...user, role: dbUser?.role ?? "USER" };
      } catch (err) {
        // Might be a local admin token
        try {
          const { payload } = await jwtVerify(token, this.secret);
          return {
            id: String(payload.sub),
            email: String(payload.email),
            phone: null,
            role: payload.role as UserRole
          };
        } catch {
          return null;
        }
      }
    }

    if (this.config.DEV_AUTH_BYPASS) {
      const id = (request.headers["x-user-id"] as string | undefined) ?? "dev-user-1";
      const email = (request.headers["x-user-email"] as string | undefined) ?? null;
      const phone = (request.headers["x-user-phone"] as string | undefined) ?? null;
      const dbUser = await this.repository.getUserById(id);
      return { id, email, phone, role: dbUser?.role ?? "USER" };
    }

    return null;
  }

  async loginWithPassword(email: string, password: string): Promise<{ token: string; user: AuthUser } | null> {
    const user = await this.repository.getUserByEmail(email);
    if (!user || !user.passwordHash) return null;

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) return null;

    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(this.secret);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    };
  }

  private payloadToUser(payload: JWTPayload): Omit<AuthUser, "role"> {
    return {
      id: String(payload.sub),
      email: typeof payload.email === "string" ? payload.email : null,
      phone: typeof payload.phone === "string" ? payload.phone : null
    };
  }
}
