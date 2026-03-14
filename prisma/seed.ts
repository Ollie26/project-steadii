import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data in dependency order
  await prisma.insight.deleteMany();
  await prisma.lifestyleLog.deleteMany();
  await prisma.mealItem.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.glucoseReading.deleteMany();
  await prisma.painPoint.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.dexcomConnection.deleteMany();

  // ---------------------------------------------------------------------------
  // 1. User profile
  // ---------------------------------------------------------------------------
  await prisma.userProfile.create({
    data: {
      id: 'default',
      name: 'Alex',
      age: 21,
      heightCm: 175,
      weightKg: 72,
      gender: 'male',
      diabetesType: 'type1',
      diagnosisYear: 2021,
      lastA1C: 7.2,
      lastA1CDate: new Date('2024-02-15'),
      insulinType: 'mdi',
      rapidInsulinName: 'Novolog',
      longActingName: 'Lantus',
      carbRatio: 12,
      correctionFactor: 45,
      targetLow: 70,
      targetHigh: 180,
      glucoseUnit: 'mgdl',
      weightUnit: 'lbs',
      heightUnit: 'in',
      onboardingComplete: true,
    },
  });

  console.log('Created user profile');

  // ---------------------------------------------------------------------------
  // 2. Pain points
  // ---------------------------------------------------------------------------
  const painPoints = [
    {
      slug: 'post_meal_spikes',
      label: 'Post-meal spikes',
      description: 'My blood sugar shoots up after eating',
      priority: 0,
    },
    {
      slug: 'stress_highs',
      label: 'Stress-related highs',
      description: 'Stress makes my sugar hard to control',
      priority: 1,
    },
    {
      slug: 'carb_counting_fatigue',
      label: 'Carb counting fatigue',
      description: "I'm tired of guessing how many carbs are in everything",
      priority: 2,
    },
  ];

  for (const pp of painPoints) {
    await prisma.painPoint.create({ data: pp });
  }

  console.log('Created pain points');

  // ---------------------------------------------------------------------------
  // 3. Generate 14 days of glucose readings (288/day = every 5 min)
  // ---------------------------------------------------------------------------
  const now = new Date();
  const readings: Array<{
    timestamp: Date;
    value: number;
    trend: string;
    source: string;
  }> = [];

  const baseDate = new Date(now);
  baseDate.setHours(0, 0, 0, 0);

  for (let day = 13; day >= 0; day--) {
    for (let reading = 0; reading < 288; reading++) {
      const timestamp = new Date(baseDate.getTime() - day * 24 * 60 * 60 * 1000 + reading * 5 * 60 * 1000);

      // Base sinusoidal pattern around 130 mg/dL
      const hour = (reading * 5) / 60;
      let value = 130 + 25 * Math.sin(((hour - 6) * Math.PI) / 12);

      // Add meal spikes (breakfast ~7:30, lunch ~12:30, dinner ~18:30)
      const mealHours = [7.5, 12.5, 18.5];
      for (const mealHour of mealHours) {
        const timeSinceMeal = hour - mealHour;
        if (timeSinceMeal > 0 && timeSinceMeal < 3) {
          const spikeAmount = 40 + Math.random() * 80;
          value +=
            spikeAmount * Math.exp(-2 * (timeSinceMeal - 0.75) ** 2);
        }
      }

      // Overnight lows (some nights)
      if (day % 3 === 0 && hour > 2 && hour < 5) {
        value -= 30 + Math.random() * 25;
      }

      // Dawn phenomenon (some days)
      if (day % 4 === 0 && hour > 5 && hour < 7) {
        value += 20 + Math.random() * 30;
      }

      // Stress days (days 3, 4 - "finals week")
      if ((day === 3 || day === 4) && hour > 10 && hour < 18) {
        value += 20 + Math.random() * 30;
      }

      // Random noise
      value += (Math.random() - 0.5) * 30;
      value = Math.max(45, Math.min(350, Math.round(value)));

      // Determine trend from previous reading
      let trend = 'flat';
      if (readings.length > 0) {
        const prev = readings[readings.length - 1]?.value ?? value;
        const diff = value - prev;
        if (diff > 15) trend = 'rising_fast';
        else if (diff > 5) trend = 'rising';
        else if (diff < -15) trend = 'falling_fast';
        else if (diff < -5) trend = 'falling';
      }

      readings.push({ timestamp, value, trend, source: 'csv' });
    }
  }

  // Batch insert readings (100 at a time using createMany where possible)
  const BATCH_SIZE = 100;
  for (let i = 0; i < readings.length; i += BATCH_SIZE) {
    const batch = readings.slice(i, i + BATCH_SIZE);
    await prisma.glucoseReading.createMany({ data: batch });
  }

  console.log(`Created ${readings.length} glucose readings`);

  // ---------------------------------------------------------------------------
  // 4. Generate 30 meals across 14 days
  // ---------------------------------------------------------------------------
  const mealTemplates = [
    // Breakfasts
    {
      name: 'Oatmeal with banana',
      mealType: 'breakfast',
      items: [
        {
          name: 'Oatmeal',
          servingSize: '1 cup',
          carbsGrams: 27,
          proteinGrams: 5,
          fatGrams: 3,
          fiberGrams: 4,
          calories: 150,
        },
        {
          name: 'Banana',
          servingSize: '1 medium',
          carbsGrams: 27,
          proteinGrams: 1,
          fatGrams: 0,
          fiberGrams: 3,
          calories: 105,
        },
      ],
    },
    {
      name: 'Eggs and toast',
      mealType: 'breakfast',
      items: [
        {
          name: 'Scrambled eggs',
          servingSize: '2 eggs',
          carbsGrams: 2,
          proteinGrams: 12,
          fatGrams: 10,
          fiberGrams: 0,
          calories: 140,
        },
        {
          name: 'Wheat toast',
          servingSize: '2 slices',
          carbsGrams: 24,
          proteinGrams: 6,
          fatGrams: 2,
          fiberGrams: 4,
          calories: 140,
        },
      ],
    },
    {
      name: 'Greek yogurt parfait',
      mealType: 'breakfast',
      items: [
        {
          name: 'Greek yogurt',
          servingSize: '1 cup',
          carbsGrams: 8,
          proteinGrams: 17,
          fatGrams: 5,
          fiberGrams: 0,
          calories: 150,
        },
        {
          name: 'Granola',
          servingSize: '1/3 cup',
          carbsGrams: 23,
          proteinGrams: 3,
          fatGrams: 4,
          fiberGrams: 2,
          calories: 140,
        },
        {
          name: 'Blueberries',
          servingSize: '1/2 cup',
          carbsGrams: 11,
          proteinGrams: 1,
          fatGrams: 0,
          fiberGrams: 2,
          calories: 42,
        },
      ],
    },
    // Lunches
    {
      name: 'Turkey sandwich',
      mealType: 'lunch',
      items: [
        {
          name: 'Wheat bread',
          servingSize: '2 slices',
          carbsGrams: 24,
          proteinGrams: 6,
          fatGrams: 2,
          fiberGrams: 4,
          calories: 140,
        },
        {
          name: 'Turkey breast',
          servingSize: '4 oz',
          carbsGrams: 0,
          proteinGrams: 24,
          fatGrams: 2,
          fiberGrams: 0,
          calories: 120,
        },
        {
          name: 'Cheese',
          servingSize: '1 slice',
          carbsGrams: 1,
          proteinGrams: 5,
          fatGrams: 7,
          fiberGrams: 0,
          calories: 80,
        },
      ],
    },
    {
      name: 'Chicken salad',
      mealType: 'lunch',
      items: [
        {
          name: 'Grilled chicken',
          servingSize: '6 oz',
          carbsGrams: 0,
          proteinGrams: 38,
          fatGrams: 4,
          fiberGrams: 0,
          calories: 190,
        },
        {
          name: 'Mixed greens',
          servingSize: '2 cups',
          carbsGrams: 4,
          proteinGrams: 2,
          fatGrams: 0,
          fiberGrams: 2,
          calories: 20,
        },
        {
          name: 'Dressing',
          servingSize: '2 tbsp',
          carbsGrams: 4,
          proteinGrams: 0,
          fatGrams: 12,
          fiberGrams: 0,
          calories: 120,
        },
      ],
    },
    {
      name: 'Burrito bowl',
      mealType: 'lunch',
      items: [
        {
          name: 'Rice',
          servingSize: '1 cup',
          carbsGrams: 45,
          proteinGrams: 4,
          fatGrams: 1,
          fiberGrams: 1,
          calories: 205,
        },
        {
          name: 'Black beans',
          servingSize: '1/2 cup',
          carbsGrams: 20,
          proteinGrams: 8,
          fatGrams: 0,
          fiberGrams: 8,
          calories: 114,
        },
        {
          name: 'Chicken',
          servingSize: '4 oz',
          carbsGrams: 0,
          proteinGrams: 26,
          fatGrams: 3,
          fiberGrams: 0,
          calories: 130,
        },
        {
          name: 'Salsa & toppings',
          servingSize: '1/4 cup',
          carbsGrams: 4,
          proteinGrams: 1,
          fatGrams: 3,
          fiberGrams: 1,
          calories: 40,
        },
      ],
    },
    // Dinners
    {
      name: 'Pasta with marinara',
      mealType: 'dinner',
      items: [
        {
          name: 'Spaghetti',
          servingSize: '2 cups',
          carbsGrams: 86,
          proteinGrams: 14,
          fatGrams: 2,
          fiberGrams: 4,
          calories: 420,
        },
        {
          name: 'Marinara sauce',
          servingSize: '1 cup',
          carbsGrams: 16,
          proteinGrams: 4,
          fatGrams: 4,
          fiberGrams: 4,
          calories: 100,
        },
      ],
    },
    {
      name: 'Grilled salmon with rice',
      mealType: 'dinner',
      items: [
        {
          name: 'Salmon fillet',
          servingSize: '6 oz',
          carbsGrams: 0,
          proteinGrams: 34,
          fatGrams: 18,
          fiberGrams: 0,
          calories: 300,
        },
        {
          name: 'Brown rice',
          servingSize: '1 cup',
          carbsGrams: 45,
          proteinGrams: 5,
          fatGrams: 2,
          fiberGrams: 4,
          calories: 215,
        },
        {
          name: 'Broccoli',
          servingSize: '1 cup',
          carbsGrams: 6,
          proteinGrams: 3,
          fatGrams: 0,
          fiberGrams: 2,
          calories: 30,
        },
      ],
    },
    {
      name: 'Pizza night',
      mealType: 'dinner',
      items: [
        {
          name: 'Pizza',
          servingSize: '3 slices',
          carbsGrams: 99,
          proteinGrams: 36,
          fatGrams: 30,
          fiberGrams: 6,
          calories: 810,
        },
      ],
    },
    {
      name: 'Stir-fry with rice',
      mealType: 'dinner',
      items: [
        {
          name: 'White rice',
          servingSize: '1.5 cups',
          carbsGrams: 68,
          proteinGrams: 6,
          fatGrams: 1,
          fiberGrams: 1,
          calories: 308,
        },
        {
          name: 'Chicken & vegetables',
          servingSize: '1.5 cups',
          carbsGrams: 12,
          proteinGrams: 28,
          fatGrams: 8,
          fiberGrams: 3,
          calories: 230,
        },
        {
          name: 'Stir-fry sauce',
          servingSize: '2 tbsp',
          carbsGrams: 8,
          proteinGrams: 1,
          fatGrams: 0,
          fiberGrams: 0,
          calories: 35,
        },
      ],
    },
    // Snacks
    {
      name: 'Apple with peanut butter',
      mealType: 'snack',
      items: [
        {
          name: 'Apple',
          servingSize: '1 medium',
          carbsGrams: 25,
          proteinGrams: 0,
          fatGrams: 0,
          fiberGrams: 4,
          calories: 95,
        },
        {
          name: 'Peanut butter',
          servingSize: '2 tbsp',
          carbsGrams: 6,
          proteinGrams: 8,
          fatGrams: 16,
          fiberGrams: 2,
          calories: 190,
        },
      ],
    },
    {
      name: 'Protein bar',
      mealType: 'snack',
      items: [
        {
          name: 'Protein bar',
          servingSize: '1 bar',
          carbsGrams: 25,
          proteinGrams: 20,
          fatGrams: 8,
          fiberGrams: 3,
          calories: 250,
        },
      ],
    },
    {
      name: 'Trail mix',
      mealType: 'snack',
      items: [
        {
          name: 'Trail mix',
          servingSize: '1/3 cup',
          carbsGrams: 18,
          proteinGrams: 5,
          fatGrams: 14,
          fiberGrams: 2,
          calories: 210,
        },
      ],
    },
  ];

  const tirColors = [
    'green',
    'green',
    'green',
    'green',
    'amber',
    'amber',
    'amber',
    'red',
    'red',
  ] as const;

  for (let i = 0; i < 30; i++) {
    const template = mealTemplates[i % mealTemplates.length];
    const day = Math.floor(i / 2.2); // spread across 14 days
    const mealDate = new Date(now);
    mealDate.setDate(mealDate.getDate() - day);

    // Set time based on meal type
    switch (template.mealType) {
      case 'breakfast':
        mealDate.setHours(
          7 + Math.floor(Math.random() * 2),
          Math.floor(Math.random() * 60),
          0,
          0,
        );
        break;
      case 'lunch':
        mealDate.setHours(
          11 + Math.floor(Math.random() * 2),
          Math.floor(Math.random() * 60),
          0,
          0,
        );
        break;
      case 'dinner':
        mealDate.setHours(
          17 + Math.floor(Math.random() * 3),
          Math.floor(Math.random() * 60),
          0,
          0,
        );
        break;
      case 'snack':
        mealDate.setHours(
          14 + Math.floor(Math.random() * 4),
          Math.floor(Math.random() * 60),
          0,
          0,
        );
        break;
    }

    const totalCarbs = template.items.reduce(
      (s, item) => s + item.carbsGrams,
      0,
    );
    const totalProtein = template.items.reduce(
      (s, item) => s + item.proteinGrams,
      0,
    );
    const totalFat = template.items.reduce(
      (s, item) => s + item.fatGrams,
      0,
    );
    const totalFiber = template.items.reduce(
      (s, item) => s + (item.fiberGrams || 0),
      0,
    );
    const totalCal = template.items.reduce(
      (s, item) => s + item.calories,
      0,
    );

    const tirColor =
      tirColors[Math.floor(Math.random() * tirColors.length)];
    const tirScore =
      tirColor === 'green'
        ? 70 + Math.random() * 30
        : tirColor === 'amber'
          ? 50 + Math.random() * 20
          : 20 + Math.random() * 30;

    const peakDelta =
      tirColor === 'green'
        ? 20 + Math.random() * 30
        : tirColor === 'amber'
          ? 40 + Math.random() * 40
          : 70 + Math.random() * 60;

    const preMealBG = 100 + Math.random() * 60;
    const peakDeltaRounded = Math.round(peakDelta);
    const peakBG = Math.round(preMealBG + peakDeltaRounded);
    const threeHourDelta = Math.round((Math.random() - 0.3) * 40);
    const threeHourBG = Math.round(preMealBG + threeHourDelta);

    const bgImpact = {
      preMealBG: Math.round(preMealBG),
      peakBG,
      peakDelta: peakDeltaRounded,
      peakTimeMinutes: 30 + Math.round(Math.random() * 60),
      threeHourBG,
      threeHourDelta,
      nadirBG: null as number | null,
      returnToBaselineMinutes: 90 + Math.round(Math.random() * 90),
      areaUnderCurve: Math.round(peakDelta * 60),
      tirPercent: Math.round(tirScore),
      classification:
        peakDelta < 30
          ? 'minimal'
          : peakDelta < 60
            ? 'moderate'
            : peakDelta < 100
              ? 'significant'
              : 'severe',
    };

    await prisma.meal.create({
      data: {
        timestamp: mealDate,
        mealType: template.mealType,
        name: template.name,
        logMethod: 'search',
        carbsGrams: totalCarbs,
        proteinGrams: totalProtein,
        fatGrams: totalFat,
        fiberGrams: totalFiber,
        calories: totalCal,
        bgImpactJson: JSON.stringify(bgImpact),
        tirScore: Math.round(tirScore),
        tirColor,
        isFavorite: i < 3, // first 3 are favorites
        items: {
          create: template.items.map((item) => ({
            name: item.name,
            servingSize: item.servingSize,
            carbsGrams: item.carbsGrams,
            proteinGrams: item.proteinGrams,
            fatGrams: item.fatGrams,
            fiberGrams: item.fiberGrams,
            calories: item.calories,
            source: 'manual',
          })),
        },
      },
    });
  }

  console.log('Created 30 meals with items');

  // ---------------------------------------------------------------------------
  // 5. Lifestyle logs (15 total)
  // ---------------------------------------------------------------------------
  const lifestyleLogs: Array<{
    timestamp: Date;
    type: string;
    intensity: number;
    dataJson: string;
    notes: string | null;
  }> = [];

  // Stress logs
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (i * 2 + 1));
    d.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0);
    lifestyleLogs.push({
      timestamp: d,
      type: 'stress',
      intensity:
        i < 2
          ? 4 + Math.floor(Math.random() * 2)
          : 2 + Math.floor(Math.random() * 2),
      dataJson: JSON.stringify({
        level: i < 2 ? 4 : 2,
        source: i < 2 ? 'finals' : 'normal day',
      }),
      notes: i < 2 ? 'Finals week, multiple exams' : null,
    });
  }

  // Exercise logs
  const activities = ['running', 'lifting', 'walking', 'cycling', 'yoga'];
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 2);
    d.setHours(7 + Math.floor(Math.random() * 3), 0, 0, 0);
    lifestyleLogs.push({
      timestamp: d,
      type: 'exercise',
      intensity: 2 + Math.floor(Math.random() * 3),
      dataJson: JSON.stringify({
        activity: activities[i],
        durationMinutes: 20 + Math.floor(Math.random() * 40),
      }),
      notes: null,
    });
  }

  // Sleep logs
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (i * 2 + 1));
    d.setHours(7, 0, 0, 0);
    lifestyleLogs.push({
      timestamp: d,
      type: 'sleep',
      intensity:
        i < 2 ? 2 : 3 + Math.floor(Math.random() * 2),
      dataJson: JSON.stringify({
        hoursSlept: i < 2 ? 4.5 + Math.random() : 6.5 + Math.random() * 2,
        quality: i < 2 ? 2 : 4,
      }),
      notes: i < 2 ? 'Stayed up studying' : null,
    });
  }

  for (const log of lifestyleLogs) {
    await prisma.lifestyleLog.create({ data: log });
  }

  console.log('Created 15 lifestyle logs');

  // ---------------------------------------------------------------------------
  // 6. Pre-generated insights (8)
  // ---------------------------------------------------------------------------
  const insights = [
    {
      category: 'food',
      title: 'Pizza causes significant spikes',
      body: 'Across 3 pizza meals, your average peak delta was +105 mg/dL with only 32% Time in Range. The high-carb, high-fat combo delays absorption and creates a prolonged spike.',
      actionable:
        'Try having 2 slices instead of 3, or dose 15 minutes before eating. Adding a side salad slows absorption.',
      dataPoints: 3,
      confidence: 'medium',
      source: 'fallback',
    },
    {
      category: 'food',
      title: 'You handle chicken salad really well',
      body: 'Your chicken salad meals average only +22 mg/dL peak and 88% Time in Range. The high protein and low carbs keep you steady.',
      actionable:
        'This is a great go-to meal. Consider keeping grilled chicken on hand for easy lunches.',
      dataPoints: 4,
      confidence: 'medium',
      source: 'fallback',
    },
    {
      category: 'time_of_day',
      title: 'Dinner is your toughest meal',
      body: 'Your dinner meals average 52% TIR vs 71% at breakfast and 68% at lunch. Dinner spikes average +72 mg/dL compared to +38 mg/dL at breakfast.',
      actionable:
        'Try dosing your dinner insulin 10-15 minutes before eating, and consider lower-carb dinner options.',
      dataPoints: 12,
      confidence: 'high',
      source: 'fallback',
    },
    {
      category: 'stress',
      title: 'Stress is hitting your numbers hard',
      body: 'During high-stress periods (finals week), your average BG was 185 mg/dL vs 138 mg/dL on normal days. That is a 47 mg/dL difference.',
      actionable:
        'On high-stress days, consider checking more frequently and being more aggressive with corrections.',
      dataPoints: 8,
      confidence: 'high',
      source: 'fallback',
    },
    {
      category: 'exercise',
      title: 'Exercise days are your best days',
      body: 'On days you exercise, your average BG is 125 mg/dL with 74% TIR. Non-exercise days average 148 mg/dL with 58% TIR.',
      actionable:
        'Even a 20-minute walk after meals can make a significant difference in your post-meal numbers.',
      dataPoints: 10,
      confidence: 'high',
      source: 'fallback',
    },
    {
      category: 'general',
      title: 'Your Time in Range is improving!',
      body: 'This week your TIR is 64%, up from 57% last week. Keep up the great work! Your average BG dropped from 152 to 141 mg/dL.',
      actionable:
        'You are trending in the right direction. The changes you are making are working.',
      dataPoints: 14,
      confidence: 'high',
      source: 'fallback',
    },
    {
      category: 'sleep',
      title: 'Bad sleep = harder day',
      body: 'On nights with under 6 hours of sleep, your next-day average BG is 22 mg/dL higher and your TIR drops by 15%.',
      actionable:
        'Try to protect your sleep, especially during stressful periods. It compounds the cortisol effect.',
      dataPoints: 5,
      confidence: 'medium',
      source: 'fallback',
    },
    {
      category: 'warning',
      title: '3 overnight lows this week',
      body: 'You went below 70 mg/dL during sleep 3 times this week, mostly between 2-4 AM. Lowest was 52 mg/dL.',
      actionable:
        'Consider having a small protein snack before bed, or talk to your doctor about adjusting your long-acting insulin dose.',
      dataPoints: 3,
      confidence: 'high',
      source: 'fallback',
    },
  ];

  for (const insight of insights) {
    await prisma.insight.create({ data: insight });
  }

  console.log('Created 8 insights');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\nSeed data created successfully!');
  console.log(`- ${readings.length} glucose readings`);
  console.log('- 30 meals with items');
  console.log('- 15 lifestyle logs');
  console.log('- 8 insights');
  console.log('- 3 pain points');
  console.log('- 1 user profile (Alex)');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
