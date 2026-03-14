import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        (where.timestamp as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.timestamp as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    const logs = await prisma.lifestyleLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching lifestyle logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lifestyle logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const log = await prisma.lifestyleLog.create({
      data: {
        ...body,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error creating lifestyle log:', error);
    return NextResponse.json(
      { error: 'Failed to create lifestyle log' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      );
    }

    await prisma.lifestyleLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lifestyle log:', error);
    return NextResponse.json(
      { error: 'Failed to delete lifestyle log' },
      { status: 500 }
    );
  }
}
