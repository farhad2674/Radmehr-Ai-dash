import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { AuthService, AuthenticationError, SESSION_COOKIE_NAME, SessionContext } from './service';

declare global {
  namespace Express {
    interface Request {
      auth?: SessionContext;
    }
  }
}

function cookieToken(request: Request): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === SESSION_COOKIE_NAME) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

function requestContext(request: Request) {
  const requestId = request.header('x-request-id') || undefined;
  return {
    ipAddress: request.ip,
    userAgent: request.header('user-agent') || undefined,
    requestId,
  };
}

function cookieOptions(production: boolean, maxAge?: number) {
  return {
    httpOnly: true,
    secure: production,
    sameSite: 'lax' as const,
    path: '/',
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

export function createRequireAuthentication(service: AuthService): RequestHandler {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      request.auth = await service.authenticate(cookieToken(request));
      next();
    } catch {
      response.status(401).json({ error: 'Authentication required.' });
    }
  };
}

export function createAuthRouter(service: AuthService, production = process.env.NODE_ENV === 'production'): Router {
  const router = Router();

  router.post('/login', async (request: Request, response: Response): Promise<void> => {
    try {
      const identity = request.body?.identity ?? request.body?.username ?? request.body?.email;
      const result = await service.login(identity, request.body?.password, requestContext(request));
      const expiresAt = new Date(result.auth.session.absoluteExpiresAt).getTime();
      response.cookie(SESSION_COOKIE_NAME, result.token, cookieOptions(production, Math.max(0, expiresAt - Date.now())));
      response.json(result.auth);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        response.status(401).json({ error: 'Invalid credentials.' });
        return;
      }
      response.status(500).json({ error: 'Authentication service failed.' });
    }
  });

  router.get('/me', async (request: Request, response: Response): Promise<void> => {
    try {
      response.json(await service.currentSession(cookieToken(request)));
    } catch {
      response.status(401).json({ error: 'Authentication required.' });
    }
  });

  router.post('/logout', async (request: Request, response: Response): Promise<void> => {
    try {
      await service.logout(cookieToken(request), requestContext(request));
    } finally {
      response.clearCookie(SESSION_COOKIE_NAME, cookieOptions(production));
    }
    response.status(204).end();
  });

  return router;
}
