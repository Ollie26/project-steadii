import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseDexcomCSV } from '@/lib/data/csvParser';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'File content is required' },
        { status: 400 }
      );
    }

    const result = parseDexcomCSV(content);

    if (result.errors.length > 0 && result.readings.length === 0) {
      return NextResponse.json(
        { error: 'Failed to parse CSV', details: result.errors },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const reading of result.readings) {
      try {
        await prisma.glucoseReading.upsert({
          where: {
            timestamp_source: {
              timestamp: reading.timestamp,
              source: 'csv',
            },
          },
          update: {
            value: reading.value,
          },
          create: {
            timestamp: reading.timestamp,
            value: reading.value,
            source: 'csv',
          },
        });
        importedCount++;
      } catch {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      total: result.count,
      format: result.format,
      dateRange: result.dateRange,
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV upload' },
      { status: 500 }
    );
  }
}
