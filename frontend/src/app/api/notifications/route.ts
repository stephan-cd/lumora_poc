import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const body = await req.json();
    const { notificationId, all } = body;

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true }
      });
    } else if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, userId: user.id },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiServerError(error);
  }
}
