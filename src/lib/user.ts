import prisma from './db';

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
