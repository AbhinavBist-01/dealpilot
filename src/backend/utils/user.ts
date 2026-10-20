import prisma from './db';
import { auth } from './auth';

export async function getOrCreateDemoUser() {
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
  return getOrCreateDemoUser();
}
