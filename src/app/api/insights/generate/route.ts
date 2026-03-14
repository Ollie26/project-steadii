import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateInsights } from '@/lib/data/insightOrchestrator';

export async function POST() {
  try {
    const [meals, readings, lifestyleLogs, profile, painPoints, previousInsights] = await Promise.all([
      prisma.meal.findMany({
        include: { items: true },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
      prisma.glucoseReading.findMany({
        orderBy: { timestamp: 'desc' },
        take: 5000,
      }),
      prisma.lifestyleLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),
      prisma.userProfile.findUnique({ where: { id: 'default' } }),
      prisma.painPoint.findMany({
        where: { isActive: true },
        orderBy: { priority: 'asc' },
      }),
      prisma.insight.findMany({
        where: { isActive: true },
        orderBy: { generatedAt: 'desc' },
      }),
    ]);

    const safeProfile = profile || { targetLow: 70, targetHigh: 180 };
    const painPointsDescription = painPoints.map((pp) => pp.slug).join(', ');

    const serializeInput = {
      profile: {
        name: profile?.name ?? null,
        age: profile?.age ?? null,
        diabetesType: profile?.diabetesType ?? null,
        diagnosisYear: profile?.diagnosisYear ?? null,
        lastA1C: profile?.lastA1C ?? null,
        targetLow: safeProfile.targetLow,
        targetHigh: safeProfile.targetHigh,
        insulinType: profile?.insulinType ?? null,
        rapidInsulinName: profile?.rapidInsulinName ?? null,
        longActingName: profile?.longActingName ?? null,
        carbRatio: profile?.carbRatio ?? null,
        correctionFactor: profile?.correctionFactor ?? null,
      },
      meals: meals.map((m) => ({
        id: m.id,
        timestamp: m.timestamp,
        mealType: m.mealType,
        name: m.name,
        carbsGrams: m.carbsGrams,
        proteinGrams: m.proteinGrams,
        fatGrams: m.fatGrams,
        fiberGrams: m.fiberGrams,
        calories: m.calories,
        glycemicEstimate: m.glycemicEstimate,
        tirScore: m.tirScore,
        tirColor: m.tirColor,
        bgImpactJson: m.bgImpactJson,
        items: m.items.map((item) => ({
          name: item.name,
          carbsGrams: item.carbsGrams,
          proteinGrams: item.proteinGrams,
          fatGrams: item.fatGrams,
        })),
      })),
      readings: readings.map((r) => ({
        timestamp: r.timestamp,
        value: r.value,
      })),
      lifestyleLogs: lifestyleLogs.map((l) => ({
        timestamp: l.timestamp,
        type: l.type,
        intensity: l.intensity,
        dataJson: l.dataJson,
        notes: l.notes,
      })),
      painPoints: painPoints.map((pp) => ({
        slug: pp.slug,
        label: pp.label,
        priority: pp.priority,
      })),
      previousInsights: previousInsights.map((i) => ({
        title: i.title,
        category: i.category,
        body: i.body,
      })),
    };

    const fallbackInput = {
      meals: meals.map((m) => ({
        id: m.id,
        timestamp: m.timestamp,
        mealType: m.mealType,
        name: m.name,
        carbsGrams: m.carbsGrams,
        proteinGrams: m.proteinGrams,
        fatGrams: m.fatGrams,
        fiberGrams: m.fiberGrams,
        tirScore: m.tirScore,
        tirColor: m.tirColor,
        bgImpactJson: m.bgImpactJson,
        items: m.items.map((item) => ({
          name: item.name,
          carbsGrams: item.carbsGrams,
        })),
      })),
      readings: readings.map((r) => ({
        timestamp: r.timestamp,
        value: r.value,
      })),
      lifestyleLogs: lifestyleLogs.map((l) => ({
        timestamp: l.timestamp,
        type: l.type,
        intensity: l.intensity,
        dataJson: l.dataJson,
      })),
      painPoints: painPoints.map((pp) => ({
        slug: pp.slug,
        label: pp.label,
      })),
      profile: {
        targetLow: safeProfile.targetLow,
        targetHigh: safeProfile.targetHigh,
      },
    };

    const newInsights = await generateInsights(
      serializeInput,
      fallbackInput,
      painPointsDescription
    );

    // Mark old insights as inactive
    await prisma.insight.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Store new insights
    const createdInsights = [];
    for (const insight of newInsights) {
      const created = await prisma.insight.create({
        data: {
          category: insight.category,
          title: insight.title,
          body: insight.body,
          actionable: insight.actionable,
          dataPoints: insight.dataPoints,
          confidence: insight.confidence,
          source: insight.source,
          painPointId: insight.relatedPainPoint,
          isActive: true,
        },
      });
      createdInsights.push(created);
    }

    return NextResponse.json({
      success: true,
      insights: createdInsights,
      count: createdInsights.length,
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
