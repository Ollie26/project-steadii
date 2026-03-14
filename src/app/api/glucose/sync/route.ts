import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const connection = await prisma.dexcomConnection.findUnique({
      where: { id: 'default' },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Dexcom not connected. Please connect your Dexcom account first.' },
        { status: 400 }
      );
    }

    if (!connection.accessToken) {
      return NextResponse.json(
        { error: 'Invalid Dexcom token. Please reconnect your Dexcom account.' },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (connection.tokenExpiry && new Date(connection.tokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'Dexcom token expired. Please reconnect your Dexcom account.' },
        { status: 401 }
      );
    }

    // Placeholder: In production, this would fetch from Dexcom API
    // and upsert readings with source: "dexcom"
    // For now, return a placeholder response since no credentials are configured
    return NextResponse.json({
      success: true,
      message: 'Dexcom sync is not yet configured. Please set up Dexcom API credentials.',
      imported: 0,
      lastSyncAt: connection.lastSyncAt,
    });
  } catch (error) {
    console.error('Error syncing Dexcom data:', error);
    return NextResponse.json(
      { error: 'Failed to sync Dexcom data' },
      { status: 500 }
    );
  }
}
