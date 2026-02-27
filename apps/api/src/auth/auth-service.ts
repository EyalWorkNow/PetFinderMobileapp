import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { FastifyRequest } from "fastify";
import type { AppConfig } from "../config";

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
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

  constructor(private readonly config: AppConfig) {
    this.jwks = config.SUPABASE_URL
      ? createRemoteJWKSet(new URL(`${config.SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
      : null;
  }

  async verifyRequest(request: FastifyRequest): Promise<AuthUser | null> {
    const token = getBearerToken(request.headers.authorization);

    if (token && this.jwks && this.config.SUPABASE_URL) {
      const issuer = `${this.config.SUPABASE_URL}/auth/v1`;
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer,
        audience: this.config.SUPABASE_JWT_AUDIENCE
      });
      return this.payloadToUser(payload);
    }

    if (this.config.DEV_AUTH_BYPASS) {
      const id = (request.headers["x-user-id"] as string | undefined) ?? "dev-user-1";
      const email = (request.headers["x-user-email"] as string | undefined) ?? null;
      const phone = (request.headers["x-user-phone"] as string | undefined) ?? null;
      return { id, email, phone };
    }

    return null;
  }

  private payloadToUser(payload: JWTPayload): AuthUser {
    return {
      id: String(payload.sub),
      email: typeof payload.email === "string" ? payload.email : null,
      phone: typeof payload.phone === "string" ? payload.phone : null
    };
  }
}
