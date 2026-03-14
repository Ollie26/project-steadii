import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { value, timestamp, trend } = body;

    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: 'value is required' },
        { status: 400 }
      );
    }

    const reading = await prisma.glucoseReading.create({
      data: {
        value: Number(value),
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        source: 'manual',
        trend: trend || null,
      },
    });

    return NextResponse.json(reading);
  } catch (error) {
    console.error('Error creating manual reading:', error);
    return NextResponse.json(
      { error: 'Failed to create manual reading' },
      { status: 500 }
    );
  }
}
