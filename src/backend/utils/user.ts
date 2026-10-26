import prisma from './db';
import { auth } from './auth';

export async function getOrCreateDemoUser() {
  // Prioritize active logged-in session user (e.g. Gmail / GitHub user)
  const activeSession = await prisma.session.findFirst({
    where: { expiresAt: { gt: new Date() } },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  if (activeSession?.user) {
    return activeSession.user;
  }

  // Look for any registered real user (e.g. abhinavbist05@gmail.com)
  const realUser = await prisma.user.findFirst({
    where: {
      email: { not: { endsWith: '@dealpilot.ai' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (realUser) {
    return realUser;
  }

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'shopper@dealpilot.ai',
        name: 'DealPilot Pilot User',
      },
    });
  }
  return user;
}

export async function getCurrentUser(request?: Request) {
  if (request?.headers) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      if (session?.user) {
        return session.user;
      }
    } catch {
      // Fallback if session validation is not available or in headless worker mode
    }
  }
  // When called without request (e.g. background worker, test runner, CLI session), return real/demo user fallback
  return getOrCreateDemoUser();
}
