# Steadii -- Your Blood Sugar, Understood

> A personal blood sugar intelligence app that connects to your Dexcom CGM (or accepts CSV uploads), lets you log meals via text search, barcode scan, or photo, and reveals exactly how YOUR body responds to food, stress, sleep, and lifestyle -- so you can take insulin with confidence and stay in range.

---

## 1. Product Vision

### The Problem
Managing insulin-dependent diabetes means playing a constant guessing game: "How will this food affect me? Did stress from finals just spike me? Why am I always high after dinner but fine after lunch?" Existing apps are either too clinical, too tedious to log in, or too generic to give personally useful answers. Nobody wants to spend 5 minutes logging a meal. Nobody wants insights that say "eat less carbs."

### What Steadii Does Differently
Steadii is built around one core idea: **your body is unique, and your data tells a story nobody else's can.** It learns YOUR patterns and gives YOU specific, actionable recommendations.

Inspired by the best in the space:
- **Undermyfork's** color-coded meal-to-BG correlation (green/amber/red meals based on post-meal Time in Range)
- **mySugr's** clean dashboard, estimated A1C, and motivating UX
- **Sugarmate's** beautiful graphs and customizable data tiles
- **Dexcom Clarity's** trend analysis and pattern detection

But Steadii goes further by:
1. **Tracking lifestyle factors** (stress, sleep, exercise, mood) alongside meals and BG -- because a college student during finals week responds differently to the same meal than during summer break
2. **Customizing the experience to YOUR pain points** -- you tell Steadii what you struggle with (post-meal spikes, overnight lows, stress-related highs, dawn phenomenon, etc.) and the dashboard, insights, and recommendations prioritize accordingly
3. **Making logging stupidly fast** -- quick-tap favorites, recent meals, a searchable food database, barcode scan for packaged foods, and photo capture (AI-analyzed when enabled, thumbnail kept for reference)
4. **Giving direct, specific recommendations** -- not "eat fewer carbs" but "your post-lunch spikes are 40% worse when you eat rice vs. pasta -- consider swapping, or adding protein to slow absorption"

### Target User
A college-age person with insulin-dependent diabetes who wants to understand their body better, reduce the mental load of daily management, and gain confidence in their insulin decisions.

### AI-Powered Intelligence (Primary Engine)
AI is the **primary** insight and analysis engine in Steadii. When enabled, Claude analyzes the user's full data holistically -- finding non-obvious correlations, generating natural-language explanations, and giving direct personalized recommendations that no set of hardcoded rules could match.

**AI powers three things:**
1. **Food photo analysis** -- Snap a photo, Claude Vision estimates carbs/macros/GI instantly
2. **Pattern insights** -- Claude looks at meal + BG + lifestyle data together and finds patterns a rule engine would miss (e.g., "you spike more on days you had coffee before breakfast AND slept under 6 hours")
3. **Conversational Q&A** -- "How does pizza affect me?" answered in plain English with your own data

AI is gated behind `AI_ENABLED` in `.env` (default: `false`). When disabled, a **rule-based fallback engine** provides basic pattern detection using deterministic math (averages, grouping, threshold comparisons). This fallback gives ~60-70% of the value but misses the nuanced, cross-cutting insights AI can find.

**Enabling AI is a one-line change:** set `AI_ENABLED=true` and add an `ANTHROPIC_API_KEY`. The AI engine fully replaces the rule-based fallback -- it does everything the rules do, plus much more. Cost is roughly $0.01-0.03 per insight generation and $0.01-0.03 per food photo analysis.

---

## 2. Tech Stack

### Core
- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (local dev) / Turso (production) via Prisma ORM with libsql adapter
  - Local: plain SQLite file, zero setup
  - Production: Turso (cloud-hosted SQLite, free tier: 500M reads/month, 10M writes/month, 5GB storage)
  - Same Prisma schema, same queries. Adapter auto-selected based on env vars.
- **Charts**: Recharts for blood sugar visualization
- **State**: React Context + hooks
- **Icons**: Lucide React
- **Hosting**: Vercel (free Hobby tier -- auto-deploys from GitHub, 100GB bandwidth, 150K function calls/month)

### External APIs (Free, No Keys Needed)
- **Open Food Facts API**: Barcode lookup for packaged food nutrition data
  - Endpoint: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
  - Returns: product name, nutrition facts per serving (carbs, protein, fat, fiber, calories, serving size)
  - No API key needed. Free and open source.
- **USDA FoodData Central API**: Searchable food database for manual text entry
  - Endpoint: `https://api.nal.usda.gov/fdc/v1/foods/search?query={query}&api_key=DEMO_KEY`
  - The `DEMO_KEY` is a real, functional key provided by USDA for low-volume use (30 requests/hour). For higher volume, user can get a free key from https://fdc.nal.usda.gov/api-key-signup
  - Returns: food descriptions, nutrition data per 100g, branded food data

### External APIs (Keys Required)
- **Dexcom API** (OAuth2): Pull CGM glucose readings
  - Developer portal: https://developer.dexcom.com
  - Sandbox available for testing with fake data
  - Support Dexcom G6/G7 via their public API
  - Auth: OAuth2 authorization code grant
  - Key endpoints: `/v3/users/self/egvs`, `/v3/users/self/dataRange`

### AI Engine (Primary, Disabled by Default)
- **Anthropic Claude API** (claude-sonnet-4-20250514): Food photo analysis, pattern insight generation, conversational data Q&A
  - This is the PRIMARY insight engine. When enabled, it fully replaces the rule-based fallback.
  - Include complete prompt templates, API call structure, response parsing, and error handling
  - Gate behind `AI_ENABLED` env flag (default: false)
  - When `AI_ENABLED=false`, the rule-based fallback engine in `lib/data/insightEngineFallback.ts` is used instead
  - When `AI_ENABLED=true`, all insight generation routes through `lib/ai/generateInsights.ts` and food photo analysis routes through `lib/ai/analyzeFood.ts`

### Architecture for Mobile Transition
Keep business logic portable for future React Native migration:
- All non-UI logic lives in `/lib` (API calls, data processing, calculations, prompts)
- Components are flat, modular, and avoid Next.js-specific patterns where possible
- Data fetching happens in API routes, not in components directly
- Shared TypeScript types in `/types`

---

## 3. Data Model (Prisma Schema)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL") // Local: "file:./steadii.db" | Turso: "libsql://your-db-name-your-username.turso.io"
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"] // Required for Turso adapter
}

// ============================================
// USER PROFILE
// ============================================
model UserProfile {
  id                  String   @id @default("default")
  name                String?
  age                 Int?
  heightCm            Float?   // stored in cm internally
  weightKg            Float?   // stored in kg internally
  gender              String?  // "male", "female", "other", "prefer_not_to_say"
  diabetesType        String?  // "type1", "type2", "gestational", "other"
  diagnosisYear       Int?     // year diagnosed
  lastA1C             Float?   // most recent A1C percentage
  lastA1CDate         DateTime?
  
  // Insulin configuration
  insulinType         String?  // "mdi" (multiple daily injections), "pump", "pen"
  rapidInsulinName    String?  // e.g. "Humalog", "Novolog", "Fiasp"
  longActingName      String?  // e.g. "Lantus", "Tresiba", "Levemir"
  carbRatio           Float?   // grams of carbs per 1 unit of rapid insulin
  correctionFactor    Float?   // how much 1 unit drops BG (mg/dL)
  
  // Target ranges
  targetLow           Float    @default(70)   // mg/dL
  targetHigh          Float    @default(180)  // mg/dL
  
  // Units preference
  glucoseUnit         String   @default("mgdl") // "mgdl" or "mmol"
  weightUnit          String   @default("lbs")  // "lbs" or "kg"
  heightUnit          String   @default("in")   // "in" or "cm"
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

// ============================================
// PAIN POINTS (user's self-identified challenges)
// ============================================
model PainPoint {
  id          String   @id @default(cuid())
  slug        String   @unique // "post_meal_spikes", "overnight_lows", "stress_highs", etc.
  label       String   // "Post-meal spikes"
  description String?  // "My blood sugar shoots up after eating"
  isActive    Boolean  @default(true)
  priority    Int      @default(0) // user-ranked priority (lower = more important)
  createdAt   DateTime @default(now())
}

// ============================================
// BLOOD SUGAR READINGS
// ============================================
model GlucoseReading {
  id          String   @id @default(cuid())
  timestamp   DateTime
  value       Float    // mg/dL (always stored as mg/dL, converted for display)
  trend       String?  // "rising_fast", "rising", "flat", "falling", "falling_fast"
  source      String   // "dexcom", "csv", "manual"
  createdAt   DateTime @default(now())

  @@unique([timestamp, source]) // prevent duplicates
  @@index([timestamp])
}

// ============================================
// MEALS
// ============================================
model Meal {
  id              String   @id @default(cuid())
  timestamp       DateTime
  mealType        String   // "breakfast", "lunch", "dinner", "snack"
  name            String?  // user label or auto-generated from items
  photoUrl        String?  // path to compressed thumbnail (~50x50px, few KB) kept as visual reference
  logMethod       String   // "search", "barcode", "manual", "photo", "favorite", "recent"
  
  // Nutritional totals
  carbsGrams      Float?
  proteinGrams    Float?
  fatGrams        Float?
  fiberGrams      Float?
  calories        Float?
  
  glycemicEstimate String?  // "low", "medium", "high" -- user selects or inferred from food types
  
  // Barcode-specific
  barcode         String?
  productName     String?
  
  // Post-meal BG impact (computed after enough data exists)
  bgImpactJson    String?  // JSON: BGImpact object (see Section 5.3)
  tirScore        Float?   // Time in Range % for 3 hours post-meal
  tirColor        String?  // "green" (>=70% TIR), "amber" (50-69%), "red" (<50%)
  
  // AI analysis (active when AI_ENABLED=true, null otherwise)
  aiAnalysisJson  String?  // JSON blob from Claude Vision photo analysis
  
  notes           String?
  isFavorite      Boolean  @default(false) // user can star meals for quick re-logging
  createdAt       DateTime @default(now())

  items           MealItem[]
  
  @@index([timestamp])
  @@index([isFavorite])
}

// Individual food items within a meal
model MealItem {
  id              String  @id @default(cuid())
  mealId          String
  meal            Meal    @relation(fields: [mealId], references: [id], onDelete: Cascade)
  name            String  // "Brown rice", "Grilled chicken breast"
  servingSize     String? // "1 cup", "6 oz"
  servingGrams    Float?  // weight in grams if known
  carbsGrams      Float?
  proteinGrams    Float?
  fatGrams        Float?
  fiberGrams      Float?
  calories        Float?
  source          String? // "usda", "openfoodfacts", "manual"
  sourceId        String? // USDA fdcId or OpenFoodFacts barcode

  @@index([mealId])
}

// ============================================
// LIFESTYLE FACTORS
// ============================================
model LifestyleLog {
  id          String   @id @default(cuid())
  timestamp   DateTime
  type        String   // "stress", "exercise", "sleep", "mood", "illness", "alcohol", "caffeine", "menstrual"
  
  // Severity/intensity (1-5 scale)
  intensity   Int?     // 1=minimal, 5=extreme
  
  // Type-specific data stored as JSON
  // stress: { level: 4, source: "finals" }
  // exercise: { activity: "running", durationMinutes: 30, intensity: 3 }
  // sleep: { hoursSlept: 5.5, quality: 2 }
  // mood: { feeling: "anxious", notes: "..." }
  dataJson    String?
  
  notes       String?
  createdAt   DateTime @default(now())

  @@index([timestamp])
  @@index([type])
}

// ============================================
// INSIGHTS (generated from pattern analysis)
// ============================================
model Insight {
  id          String   @id @default(cuid())
  category    String   // "food", "time_of_day", "stress", "exercise", "sleep", "general", "warning"
  title       String   // "Pizza causes delayed spikes for you"
  body        String   // Full insight text with specific numbers
  actionable  String?  // Concrete suggestion
  dataPoints  Int      // How many data points support this
  confidence  String   // "low" (<5 points), "medium" (5-15), "high" (>15)
  source      String   // "ai" or "fallback" -- tracks which engine generated this
  painPointId String?  // links to which pain point this addresses
  metadata    String?  // JSON with supporting data
  isActive    Boolean  @default(true)
  generatedAt DateTime @default(now())
  
  @@index([category])
  @@index([painPointId])
}

// ============================================
// SETTINGS & CONNECTIONS
// ============================================
model DexcomConnection {
  id                String    @id @default("default")
  accessToken       String?
  refreshToken      String?
  tokenExpiry       DateTime?
  lastSyncAt        DateTime?
  isConnected       Boolean   @default(false)
}
```

---

## 4. Application Architecture

### Directory Structure
```
steadii/
  src/
    app/
      layout.tsx              # Root layout with bottom nav bar
      page.tsx                # Dashboard
      onboarding/
        page.tsx              # First-time setup flow
      log/
        page.tsx              # Log meal (primary logging interface)
      meals/
        page.tsx              # Meal history with filters
        [id]/page.tsx         # Individual meal detail + BG impact view
      insights/
        page.tsx              # AI insights & patterns page
      you/
        page.tsx              # Profile, pain points, settings, connections
      api/
        glucose/
          sync/route.ts       # Dexcom sync
          upload/route.ts     # CSV upload
          manual/route.ts     # Manual BG entry
        meals/
          route.ts            # CRUD meals
          [id]/route.ts       # Single meal operations
          impact/route.ts     # Compute/refresh BG impact
          favorites/route.ts  # Get favorite meals
          recent/route.ts     # Get recent meals for quick re-log
        food/
          search/route.ts     # USDA food search proxy
          barcode/route.ts    # Open Food Facts lookup proxy
        lifestyle/
          route.ts            # Log lifestyle factors
        insights/
          generate/route.ts   # Generate insights from data
          route.ts            # CRUD insights
        profile/
          route.ts            # User profile CRUD
          pain-points/route.ts # Pain points CRUD
        dexcom/
          auth/route.ts       # OAuth2 redirect handler
          callback/route.ts   # OAuth2 callback
        ai/
          analyze-photo/route.ts  # Claude Vision food analysis (returns null if AI_ENABLED=false)
          analyze-text/route.ts   # Claude text food analysis (returns null if AI_ENABLED=false)
          generate-insights/route.ts # Insight generation (routes to AI or fallback)
          ask/route.ts            # "Ask about your data" conversational Q&A (AI-only)
          meal-commentary/route.ts # Per-meal "what happened?" explanation (AI-only)
    components/
      onboarding/
        WelcomeStep.tsx       # Name, diabetes type
        BodyStep.tsx          # Age, height, weight, gender
        InsulinStep.tsx       # Insulin config, carb ratio, correction factor
        PainPointsStep.tsx    # Select and rank pain points
        ConnectStep.tsx       # Dexcom or CSV upload
        OnboardingProgress.tsx # Step indicator
      dashboard/
        GlucoseChart.tsx      # Main BG timeline (THE centerpiece)
        CurrentBG.tsx         # Current reading display (large, prominent)
        QuickStats.tsx        # Time in range, avg, estimated A1C
        RecentMeals.tsx       # Last 3-5 meals with TIR color dots
        ActiveInsight.tsx     # Rotating insight card
        LifestyleQuickLog.tsx # Quick-tap stress/exercise/sleep logging
        DayNavigator.tsx      # Swipe or tap to change days
      log/
        MealLogger.tsx        # Main logging orchestrator
        FoodSearch.tsx        # Search USDA database with typeahead
        BarcodeScanner.tsx    # Camera-based barcode scanning (quagga2)
        PhotoCapture.tsx      # Camera/upload, holds photo in memory, generates thumbnail on confirm
        ManualEntry.tsx       # Manual carb/macro entry
        FavoriteMeals.tsx     # Quick re-log from favorites
        RecentMealsList.tsx   # Quick re-log from recent
        MealItemCard.tsx      # Individual food item in the meal being built
        MealSummary.tsx       # Review totals before saving
        ServingSizeAdjuster.tsx # Adjust portions with +/- or slider
        GlycemicSelector.tsx  # Low/Medium/High GI quick select
      meals/
        MealCard.tsx          # Meal display with TIR color indicator
        MealDetail.tsx        # Full meal view with BG overlay chart
        MealFilters.tsx       # Filter by type, TIR color, date range
        BGImpactChart.tsx     # Post-meal BG curve visualization
        MealCommentary.tsx    # AI "What happened?" explanation (AI-only, hidden when disabled)
      insights/
        InsightCard.tsx       # Individual insight display
        PatternChart.tsx      # Visual for a specific pattern
        PainPointProgress.tsx # How are you doing on your pain points?
        FoodRanking.tsx       # Best/worst foods for the user
        TimeOfDayAnalysis.tsx # Patterns by meal time
        StressCorrelation.tsx # Stress level vs. BG correlation
        AskSteadii.tsx        # "Ask about your data" chat input (AI-only, hidden when disabled)
        AIBanner.tsx          # "Basic insights active" banner shown when AI is off
      you/
        ProfileEditor.tsx     # Edit profile info
        PainPointManager.tsx  # Add/remove/reorder pain points
        InsulinSettings.tsx   # Insulin configuration
        DexcomConnect.tsx     # OAuth connection UI
        CSVUpload.tsx         # Drag-and-drop CSV upload
        DataExport.tsx        # Export all data
        TargetRangeSlider.tsx # Adjust target range (70-180 default)
      shared/
        BottomNav.tsx         # Persistent bottom navigation bar
        BGBadge.tsx           # Color-coded BG value display
        TrendArrow.tsx        # Directional trend arrow
        TIRDot.tsx            # Green/amber/red dot for meal TIR
        LoadingSpinner.tsx    # Consistent loading state
        EmptyState.tsx        # Friendly empty state with call to action
        Toast.tsx             # Success/error notifications
        Modal.tsx             # Reusable modal/bottom sheet
    lib/
      ai/
        analyzeFood.ts       # Claude Vision food photo analysis (PRIMARY when AI_ENABLED)
        analyzeFoodText.ts   # Claude text-based food analysis (PRIMARY when AI_ENABLED)
        generateInsights.ts  # Claude insight generation (PRIMARY when AI_ENABLED)
        prompts.ts           # All AI prompt templates
        aiClient.ts          # Shared Anthropic SDK client with error handling + retry
      dexcom/
        auth.ts              # OAuth2 helpers
        client.ts            # API client for fetching EGVs
        types.ts             # Dexcom response types
      food/
        usdaClient.ts        # USDA FoodData Central search
        openFoodFacts.ts     # Barcode lookup client
        commonFoods.ts       # Built-in list of ~200 common foods with nutrition data (offline fallback)
        nutritionUtils.ts    # Convert between serving sizes, calculate totals
      data/
        csvParser.ts         # Parse Dexcom Clarity CSV exports
        bgImpact.ts          # Post-meal BG impact calculator
        tirCalculator.ts     # Time in Range calculator
        patterns.ts          # Pattern grouping and analysis
        stats.ts             # Statistical helpers (avg, stddev, percentiles)
        insightOrchestrator.ts  # Routes to AI engine or fallback based on AI_ENABLED flag
        insightEngineFallback.ts # Rule-based fallback (used ONLY when AI_ENABLED=false)
        dataSerializer.ts    # Serialize user data into structured text for AI prompts
      hooks/
        useGlucoseData.ts    # Fetch and cache glucose readings
        useMeals.ts          # Meal CRUD operations
        useProfile.ts        # Profile data hook
        useInsights.ts       # Insights hook
      utils/
        dateUtils.ts         # Date formatting, ranges, time-of-day classification
        glucoseUtils.ts      # BG value formatting, range classification, trend mapping
        unitConversion.ts    # mg/dL <-> mmol/L, lbs <-> kg, in <-> cm
      db.ts                  # Prisma client singleton (with Turso adapter for production)
    types/
      index.ts               # All shared TypeScript types
  prisma/
    schema.prisma
    seed.ts                  # Seed script with sample data for development
  public/
    fonts/                   # Custom fonts
  .env.example
```

### Environment Variables (.env.example)
```env
# Database (local dev uses SQLite file, production uses Turso)
DATABASE_URL="file:./steadii.db"
# For Turso (production): DATABASE_URL="libsql://your-db-name-your-username.turso.io"
TURSO_AUTH_TOKEN=                # Required for Turso, leave blank for local SQLite

# AI Engine (primary intelligence -- set to true + add API key to activate)
AI_ENABLED=false
ANTHROPIC_API_KEY=

# Optional: Dexcom API credentials
DEXCOM_CLIENT_ID=
DEXCOM_CLIENT_SECRET=
DEXCOM_REDIRECT_URI=http://localhost:3000/api/dexcom/callback
DEXCOM_ENV=sandbox  # "sandbox" or "production"

# Optional: USDA API key (DEMO_KEY works for low volume)
USDA_API_KEY=DEMO_KEY
```

---

## 5. Core Feature Specifications

### 5.0 Onboarding Flow

First-time users go through a 5-step onboarding that feels welcoming, not clinical. Each step should have smooth transitions and feel like a conversation, not a form.

**Step 1: Welcome**
- "Hey! Let's set up Steadii for you."
- Name input
- Diabetes type selection (Type 1, Type 2, Gestational, Other)
- Year diagnosed (optional)
- Last A1C value and date (optional, with note: "We'll also estimate this from your data as it comes in")

**Step 2: About You**
- Age, height, weight, gender
- Support both imperial and metric units with a toggle
- Explain why we ask: "This helps us give you more accurate recommendations"

**Step 3: Your Insulin**
- Insulin delivery method: MDI (injections), Pump, Pen
- Rapid-acting insulin name (dropdown with common options + custom)
- Long-acting insulin name (if applicable)
- Carb ratio (grams per unit) -- with helper text: "If you eat 60g of carbs and take 4 units, your ratio is 15:1"
- Correction factor (mg/dL per unit) -- with helper text: "If 1 unit drops you about 50 mg/dL, enter 50"
- Target range (default 70-180, adjustable with a dual-thumb slider)

**Step 4: Your Challenges** (THIS IS KEY)
- "What do you struggle with most? Pick all that apply, then drag to rank them."
- Pre-defined pain points the user can select:
  - **Post-meal spikes** -- "My blood sugar shoots up after eating"
  - **Overnight lows** -- "I go low while sleeping"
  - **Dawn phenomenon** -- "I wake up with high blood sugar"
  - **Stress-related highs** -- "Stress (like exams or deadlines) makes my sugar hard to control"
  - **Exercise unpredictability** -- "Working out tanks or spikes my sugar unpredictably"
  - **Carb counting fatigue** -- "I'm tired of guessing how many carbs are in everything"
  - **Delayed spikes** -- "Some foods spike me hours later, not right away"
  - **Insulin timing** -- "I never know when to dose -- before, during, or after eating"
  - **Roller coaster days** -- "My sugar bounces between high and low all day"
  - **Social eating stress** -- "Eating out or at parties is stressful to manage"
- User selects the relevant ones, then can drag to rank by priority
- These pain points drive: dashboard layout priorities, which insights are generated first, what recommendations emphasize, and what data is highlighted

**Step 5: Connect Your Data**
- "Let's get your blood sugar data in"
- Three options:
  1. Connect Dexcom (OAuth flow)
  2. Upload a CSV from Dexcom Clarity
  3. Skip for now (can do later in settings, will use manual BG entry)
- If CSV: drag-and-drop upload zone, immediate parsing and preview ("Found 2,847 readings from Jan 1 - Mar 14")
- Big "Get Started" button

### 5.1 Dashboard (Main Page)

The dashboard is the home screen. It adapts based on the user's pain points.

**Always present (top section):**

1. **Current BG Hero** (the first thing you see)
   - Current glucose value, LARGE (48px+ font, monospace)
   - Trend arrow (animated SVG arrows: double up, single up, 45-degree up, flat, 45-degree down, single down, double down)
   - Color-coded background glow: in-range = soft teal glow, high = warm amber glow, low = soft red glow
   - Time since last reading ("2 min ago")
   - If no Dexcom connected and no recent data: show "No recent data" with a CTA to connect or enter manually

2. **24-Hour Glucose Chart** (the centerpiece)
   - Smooth, continuous line chart using Recharts
   - Shaded band for target range (default 70-180)
   - Line color changes based on value: teal for in-range, amber for high, coral for low
   - Meal markers on the timeline: small colored dots (green/amber/red based on TIR score) with a tiny fork icon
   - Lifestyle markers: small icons for stress (brain), exercise (runner), sleep (moon)
   - Tap a meal marker to see a tooltip with meal name, carbs, and BG impact summary
   - Time range selector: 3h | 6h | 12h | 24h | 3d | 7d (pill-style toggle)
   - Smooth pan/scroll within the chart
   - Horizontal line at current BG that extends as a dotted "you are here" indicator

3. **Quick Stats Row** (compact, horizontal scroll)
   - Time in Range (big percentage, color-coded)
   - Average BG
   - Estimated A1C (formula: `(averageBG + 46.7) / 28.7`)
   - Standard deviation (labeled "Variability" for readability)
   - Highs count (above target) and Lows count (below target)
   - Each stat shows the selected time period and a tiny up/down arrow vs. previous period

**Pain-point adaptive sections (below stats, order based on user's ranked pain points):**

4. **Recent Meals** (always shown, but prominence varies)
   - Last 3-5 meals as compact cards
   - Each shows: meal type icon, name/description, total carbs, TIR color dot, mini BG curve sparkline
   - Tap to expand to full meal detail

5. **Active Insight** (card that rotates through recent insights)
   - Prioritized by the user's top pain points
   - E.g., if "stress-related highs" is #1 pain point, show stress-related insights first
   - Swipeable to see more insights

6. **Lifestyle Quick-Log** (if stress or exercise are in pain points)
   - Quick-tap row: "How's your stress right now?" with 1-5 emoji scale
   - Or: "Did you exercise today?" with quick activity selector
   - These should be ultra-fast, one-tap interactions

7. **Pattern Spotlight** (if enough data exists)
   - "Your best meal this week" (greenest TIR score)
   - "Watch out for..." (food/time combo that consistently causes issues)

**Bottom Navigation Bar** (always visible, 4 tabs):
- **Home** (dashboard) -- house icon
- **Log** (log a meal) -- plus-circle icon, slightly larger/accented
- **Meals** (meal history) -- utensils icon  
- **You** (profile, settings, connections) -- user icon

### 5.2 Meal Logging (The Log Tab)

This is the most-used screen. It MUST be fast. Target: log a meal in under 30 seconds.

**The logging screen has a top tab bar with four methods:**

#### Tab 1: Search (Default, Primary)
- Large search input at top with auto-focus
- Typeahead search powered by USDA FoodData Central API
- As user types, show results in real-time with food name, brand (if branded), and carbs per serving
- Tap a result to add it to the current meal with default serving size
- Below search: "Common Foods" grid of ~20-30 most frequently eaten items (bread, rice, pasta, chicken, apple, banana, milk, eggs, etc.) with icons, for one-tap adding
- Below that: "Your Favorites" (meals the user has starred) for instant re-logging
- Below that: "Recent" (last 10 unique meals) for quick re-logging

**How food search works under the hood:**
1. User types in search box
2. After 300ms debounce, send query to `/api/food/search` 
3. API route calls USDA FoodData Central: `https://api.nal.usda.gov/fdc/v1/foods/search?query={query}&api_key={key}&pageSize=15&dataType=Foundation,SR%20Legacy,Branded`
4. Parse results, extract: description, fdcId, brandName, servingSize, and nutrients (carbs, protein, fat, fiber, calories)
5. Return to client for display
6. On select: add as MealItem with default serving, user can adjust

#### Tab 2: Barcode
- Full-screen camera view using quagga2 library
- Scan area overlay (rectangular guide in center of screen)
- Configure quagga2 for EAN-13 and UPC-A readers (these cover virtually all food barcodes)
- On successful scan:
  1. Decode barcode number
  2. Call `/api/food/barcode` which proxies to Open Food Facts: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
  3. Extract: product_name, nutriments (carbohydrates_100g, proteins_100g, fat_100g, fiber_100g, energy-kcal_100g), serving_size
  4. Show product card with nutrition info
  5. User adjusts serving count and confirms
- If barcode not found in Open Food Facts: show "Product not found" with option to enter manually
- Permission handling: show clear message if camera permission denied

**Quagga2 configuration for the barcode scanner:**
```typescript
// Use these specific settings for food barcodes
const quaggaConfig = {
  inputStream: {
    type: "LiveStream",
    target: scannerRef.current, // DOM element
    constraints: {
      facingMode: "environment", // back camera
      width: { min: 640 },
      height: { min: 480 },
    },
  },
  decoder: {
    readers: [
      "ean_reader",      // EAN-13 (most international food products)
      "ean_8_reader",    // EAN-8 (smaller products)
      "upc_reader",      // UPC-A (US products)
      "upc_e_reader",    // UPC-E (compressed UPC)
    ],
  },
  locate: true,
  frequency: 10, // scans per second
};
```

#### Tab 3: Photo
- Camera capture or photo upload from gallery
- Photo is held **in memory only** (not saved to disk or database). It exists temporarily for AI analysis and user reference during the logging session.
- **When AI_ENABLED=true**: Photo is immediately sent to Claude Vision API via `/api/ai/analyze-photo`. Claude returns estimated nutrition data that auto-populates the meal items list. User reviews, adjusts if needed, and confirms. This is the magic moment -- snap a photo and get instant carb estimates.
- **When AI_ENABLED=false**: After photo is taken, show the photo preview with: "Add the nutrition info for this meal:" followed by the search bar and manual entry form.
- **On meal confirmation**: Generate a tiny compressed thumbnail (~50x50px, just a few KB) from the original photo and save it as a base64 string in the database (`Meal.photoUrl`). Then discard the full-size photo entirely. The thumbnail serves as a visual memory aid in meal history ("oh that was the burrito from Boloco") without eating storage.
- Show a subtle indicator of which mode is active. When AI is off, show: "Enable AI in settings for automatic food analysis from photos"

#### Tab 4: Manual
- Simple form: total carbs (required), protein, fat, fiber, calories (all optional)
- Meal name/description text field
- This is the fallback for when nothing else works

**Shared across all tabs (bottom of logging screen):**

- **Meal type selector**: Breakfast | Lunch | Dinner | Snack (auto-selected based on time of day: breakfast 5-10am, lunch 10am-2pm, dinner 4-8pm, snack otherwise)
- **Current meal items list**: Shows all added food items with individual macros and an X to remove
- **Running total**: Carbs, protein, fat, calories displayed prominently as items are added
- **Serving size adjuster**: For each item, a +/- stepper or slider to adjust portion (0.25x, 0.5x, 1x, 1.5x, 2x, 3x, or custom)
- **Glycemic estimate**: Optional quick-select: Low | Medium | High (with tooltip explaining what each means)
- **Notes field**: Optional, for things like "ate this really fast" or "had it with a lot of water"
- **Photo button**: Quick-add a photo to any meal regardless of logging method (thumbnail saved, full photo discarded after confirmation)
- **Star/favorite button**: Save this meal for quick re-logging later
- **"Log Meal" button**: Big, prominent, satisfying. Saves the meal and returns to dashboard.
- **Pre-meal prediction panel** (appears after items added, if historical data exists):
  - "Based on similar meals:" average peak delta, time to peak, range of responses
  - Or "Not enough data yet for this food -- log it and we'll learn!"

### 5.3 BG Impact Calculation

After a meal is logged, the system computes its blood sugar impact once sufficient post-meal data exists.

```typescript
// lib/data/bgImpact.ts

interface BGImpact {
  preMealBG: number;          // BG closest to (but before) meal time
  peakBG: number;             // Highest BG in post-meal window
  peakDelta: number;          // peakBG - preMealBG
  peakTimeMinutes: number;    // Minutes from meal to peak
  threeHourBG: number;        // BG at 3 hours post-meal
  threeHourDelta: number;     // Change from pre-meal to 3-hour mark
  nadirBG: number | null;     // Lowest BG in post-meal window (detect lows)
  returnToBaselineMinutes: number | null; // Time to return within 20 mg/dL of pre-meal
  areaUnderCurve: number;     // Trapezoidal sum of (BG - preMealBG) over window
  tirPercent: number;         // % of readings in target range during post-meal window
  classification: "minimal" | "moderate" | "significant" | "severe";
}
```

**Calculation logic (in `bgImpact.ts`):**
1. **Trigger**: Recompute on page load for meals that have `bgImpactJson === null` and have 3+ hours of post-meal data
2. **Pre-meal BG**: Closest reading within 15 minutes BEFORE meal timestamp. If none, use closest within 30 minutes.
3. **Post-meal window**: 3 hours after meal by default (configurable). Use 4 hours if user has "delayed spikes" pain point.
4. **Peak**: Highest reading in the window
5. **Nadir**: Lowest reading in the window (important for detecting post-meal lows)
6. **AUC**: Trapezoidal integration of readings above pre-meal baseline
7. **TIR**: Percentage of readings within user's target range during the window
8. **TIR Color**:
   - Green: >= 70% TIR (good response)
   - Amber: 50-69% TIR (moderate response)
   - Red: < 50% TIR (poor response)
9. **Classification thresholds** (peak delta):
   - Minimal: < 30 mg/dL
   - Moderate: 30-60 mg/dL
   - Significant: 60-100 mg/dL
   - Severe: > 100 mg/dL
10. Store computed result as JSON in `Meal.bgImpactJson`, TIR in `Meal.tirScore`, color in `Meal.tirColor`

### 5.4 Meal History (The Meals Tab)

A scrollable, filterable list of all logged meals with their BG impact.

**Layout:**
- Date headers grouping meals by day
- Each meal card shows:
  - TIR color dot (green/amber/red) on the left edge
  - Meal type icon + time
  - Meal name/description
  - Total carbs (bold) + other macros (subtle)
  - Mini sparkline showing the 3-hour post-meal BG curve
  - Photo thumbnail if one exists (tiny, rendered from base64)
  - Star icon if favorited

**Tap a meal** to see the full detail view:
- Meal items breakdown with individual nutrition
- Photo thumbnail if one was captured (small visual reference only -- full photo was discarded after logging)
- Large post-meal BG chart (overlayed on the glucose timeline, with the meal timestamp marked)
- BG impact stats: peak delta, time to peak, TIR score, classification
- **"What happened?" AI commentary** (AI-only): A 2-3 sentence natural language explanation of why this meal caused the BG response it did, considering food composition, time of day, stress level, sleep, and other context. Hidden when AI_ENABLED=false.
- "Similar meals" section showing other times the user ate similar foods and how they responded
- Edit and Delete buttons

**Filters** (horizontal scrollable pills at top):
- By meal type: All | Breakfast | Lunch | Dinner | Snack
- By TIR color: All | Green | Amber | Red
- By date range: Today | This Week | This Month | Custom
- Search by food name

### 5.5 Insights & Patterns

The insights page surfaces the user's personal patterns. Insights are generated by a **two-tier engine** controlled by the `AI_ENABLED` flag.

#### Insight Orchestrator (`lib/data/insightOrchestrator.ts`)

This is the central router. All insight requests go through it.

```typescript
// lib/data/insightOrchestrator.ts
// 
// if (process.env.AI_ENABLED === 'true' && process.env.ANTHROPIC_API_KEY) {
//   return generateInsightsAI(userData, painPoints);  // PRIMARY: full Claude analysis
// } else {
//   return generateInsightsFallback(userData, painPoints);  // FALLBACK: rule-based
// }
```

Insight generation triggers:
- Manual: User clicks "Refresh Insights"
- Automatic: After every 5th new meal logged
- On demand: "How does [food] affect me?" query (AI-only feature, disabled in fallback)

#### PRIMARY: AI-Powered Insight Engine (`lib/ai/generateInsights.ts`)

When `AI_ENABLED=true`, insights are generated by sending the user's full correlated data to Claude, which analyzes everything holistically.

**Why AI is better for this:**
- It can find **cross-cutting correlations** that rules can't anticipate (e.g., "you spike more after pizza, but ONLY on days you also had coffee and slept under 6 hours -- the combination seems to be the issue")
- It generates **natural language** that reads like a knowledgeable friend explaining your data, not template-filled robot text
- It can **reason about causality** and provide nuanced recommendations ("your stress-related highs during finals aren't just cortisol -- you're also snacking more on high-GI foods late at night, which compounds the effect")
- It adapts to whatever data exists without needing pre-written rules for every possible pattern

**How AI insight generation works:**

1. **Data serialization** (`lib/data/dataSerializer.ts`): Gather and format the user's data into a structured text payload:
   - User profile (age, diabetes type, A1C, insulin config)
   - Active pain points with rankings
   - Last 30 days of meals with BG impact data (food name, carbs, macros, TIR score, peak delta, time-of-day)
   - Last 30 days of lifestyle logs (stress levels with timestamps, exercise, sleep quality)
   - Summary statistics (average BG, TIR %, variability, highs/lows count per week)
   - Previous insights (so Claude doesn't repeat itself)

2. **Claude API call** with the `INSIGHT_GENERATION_PROMPT` (see Section 6). Include the serialized data and the user's pain points.

3. **Parse response**: Claude returns structured JSON array of insights. Validate with Zod schema.

4. **Store**: Clear old insights (or mark inactive), insert new ones with `source: "ai"`.

5. **Error handling**: If the Claude API call fails (rate limit, network, malformed response), automatically fall back to the rule-based engine for this generation cycle. Log the error. Show insights with a subtle note: "Generated from basic analysis -- AI insights available when connected."

**AI also powers these additional features (disabled in fallback mode):**
- **Ask about your data**: Text input on the insights page where the user can type natural questions like "How does pizza affect me?" or "Am I doing better this week?" -- routed to Claude with the user's data context
- **Food photo analysis**: On the Log tab's Photo sub-tab, when AI is enabled, the in-memory photo is sent to Claude Vision which returns estimated nutrition data that auto-fills the meal items. The full photo is discarded after the user confirms -- only a tiny thumbnail is saved.
- **Meal-specific commentary**: On the meal detail view, a "What happened?" AI-generated paragraph explaining why this particular meal may have caused the BG response it did, considering time of day, stress levels, what they ate earlier, etc.

#### FALLBACK: Rule-Based Insight Engine (`lib/data/insightEngineFallback.ts`)

When `AI_ENABLED=false`, this engine generates basic insights using deterministic rules. It handles the core patterns but lacks nuance, natural language quality, and cross-cutting analysis.

**Fallback insight categories and rules:**

1. **Food Rankings** (requires 3+ instances of similar foods)
   - Group meals by primary food item name (normalize: "brown rice" and "rice, brown" are the same)
   - For each food with 3+ meals, compute average TIR score and peak delta
   - Generate: "Best foods for you" (top 5 by TIR) and "Foods to watch" (bottom 5 by TIR)
   - Template: "[Food] -- avg peak of +[X] mg/dL, [TIR]% in range across [N] meals"

2. **Time-of-Day Patterns** (requires 10+ meals total)
   - Group meals by mealType (breakfast/lunch/dinner/snack)
   - Compare average TIR scores across meal times
   - If difference > 15% between best and worst meal time:
   - Template: "Your [worst time] meals average [X]% in range vs. [Y]% at [best time]. Consider adjusting your [worst time] insulin timing or food choices."

3. **Stress Correlation** (requires 5+ stress logs with concurrent BG data)
   - Compare average BG during high-stress periods (intensity >= 4) vs. low-stress (intensity <= 2)
   - If difference > 20 mg/dL:
   - Template: "When you're highly stressed, your average BG runs [X] mg/dL higher. On high-stress days, you might need to be more active or check more frequently."

4. **Post-meal spike patterns** (requires 5+ meals with BG impact data)
   - Identify meals where peak delta > 60 mg/dL
   - Look for commonalities: high carb? low fiber? high GI? specific food? time of day?
   - Template: "Your biggest spikes tend to come from [pattern]. Your spikes are [X]% smaller when you [have protein with carbs / eat earlier / etc.]."

5. **Exercise effect** (requires 5+ exercise logs with concurrent BG data)
   - Compare BG trends on exercise days vs. non-exercise days
   - Template: "On days you exercise, your average BG is [X] mg/dL lower and your TIR is [Y]% higher."

6. **Overnight patterns** (if "overnight lows" or "dawn phenomenon" is a pain point)
   - Analyze BG between 10pm and 7am
   - Detect frequency of lows (< target low) and morning rises
   - Template: "You've gone below [target] during the night [X] times in the past [period]. Most happened between [time range]."

7. **General stats-based insights**
   - Weekly trends: is TIR improving, declining, or stable?
   - Celebrate improvements: "Your Time in Range improved from [X]% to [Y]% this week!"
   - Note concerns: "You've had [X] lows this week, up from [Y] last week."

All fallback insights are stored with `source: "fallback"`.

#### Insights Page Layout (same for both engines)
- Top section: "Your Pain Points" -- progress cards for each pain point showing relevant metrics and trends
- **"Ask Steadii"** text input (AI-only; hidden when `AI_ENABLED=false`): "How does pizza affect me?"
- "Smart Recommendations" section: actionable insights ranked by confidence and relevance to pain points
- "Food Report Card" section: best and worst foods with TIR grades
- "Patterns" section: time-of-day, stress, exercise, and sleep correlations
- Each insight card has: title, body text with specific numbers, confidence indicator (low/medium/high), and the number of data points supporting it
- When running in fallback mode, show a subtle banner at the top: "Basic insights active. Enable AI in settings for deeper, personalized analysis."

### 5.6 You Tab (Profile, Settings, Connections)

**Sections:**
- **Profile**: Edit all onboarding data (name, body stats, diabetes info)
- **Insulin Settings**: Carb ratio, correction factor, insulin names
- **Pain Points**: Add, remove, reorder pain points -- changes reprioritize the entire app experience
- **Target Range**: Dual-thumb slider for low/high targets
- **Connections**: Dexcom connect/disconnect, last sync time, sync now button
- **Data Import**: CSV upload zone (drag-and-drop, with format detection)
- **Manual BG Entry**: Quick form for manually entering a blood sugar reading (for users without CGM)
- **Data Export**: Export all data as CSV
- **Units**: Toggle mg/dL vs mmol/L, lbs vs kg, inches vs cm
- **App Info**: Version, data storage info
- **AI Settings**: Toggle AI on/off, API key input field, current AI status indicator. When off, show: "AI is disabled. Insights are generated using basic pattern matching. Enable AI for deeper, personalized analysis." When on, show estimated API cost for the current month.

---

## 6. AI Prompt Templates & Engine

These live in `lib/ai/prompts.ts` and are the **primary** intelligence engine. They are fully implemented with complete API call logic, response parsing, and error handling. When `AI_ENABLED=false`, these are bypassed in favor of the rule-based fallback -- but the code is always present and ready.

**AI Client (`lib/ai/aiClient.ts`):**
```typescript
// Shared client setup
// import Anthropic from '@anthropic-ai/sdk';
// 
// const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// 
// All AI calls should:
// 1. Check AI_ENABLED flag first. If false, return null (caller falls back).
// 2. Wrap in try/catch. On ANY error, return null (caller falls back).
// 3. Validate response JSON with Zod before using.
// 4. Use model: "claude-sonnet-4-20250514" for all calls.
// 5. Set max_tokens: 2000 for insights, 1000 for food analysis.
```

**Prompts:**

```typescript
// lib/ai/prompts.ts

export const FOOD_PHOTO_PROMPT = `You are a nutrition analysis assistant helping someone with insulin-dependent diabetes understand what they're about to eat. Analyze this food photo and provide your best estimates.

IMPORTANT:
- Identify specific food items and estimate portion sizes based on visual cues (plate size, utensil scale, etc.)
- Err on the side of HIGHER carb estimates -- underestimating carbs is dangerous for insulin dosing
- Account for hidden carbs: sauces, breading, glazes, condiments, starchy sides
- If uncertain about an item, say so and provide a range

Respond ONLY with valid JSON, no other text:
{
  "description": "Brief meal description",
  "items": [
    {
      "name": "Food item",
      "estimatedPortion": "e.g., '1.5 cups', '2 slices'",
      "carbsGrams": 45,
      "proteinGrams": 12,
      "fatGrams": 8,
      "fiberGrams": 3,
      "calories": 300
    }
  ],
  "totals": { "carbsGrams": 45, "proteinGrams": 12, "fatGrams": 8, "fiberGrams": 3, "calories": 300 },
  "glycemicIndex": "low | medium | high",
  "glycemicNotes": "Expected absorption speed and BG impact pattern",
  "confidence": "low | medium | high",
  "warnings": ["Any caveats about the estimate"]
}`;

export const FOOD_TEXT_PROMPT = (userInput: string) => `You are a nutrition analysis assistant for someone with insulin-dependent diabetes. They described their meal as:

"${userInput}"

Estimate the nutritional content. Err on the side of HIGHER carb estimates. Assume typical serving sizes if not specified.

Respond ONLY with valid JSON, no other text:
{
  "description": "Cleaned up meal description",
  "items": [
    { "name": "Item", "estimatedPortion": "portion", "carbsGrams": 0, "proteinGrams": 0, "fatGrams": 0, "fiberGrams": 0, "calories": 0 }
  ],
  "totals": { "carbsGrams": 0, "proteinGrams": 0, "fatGrams": 0, "fiberGrams": 0, "calories": 0 },
  "glycemicIndex": "low | medium | high",
  "confidence": "low | medium | high",
  "warnings": []
}`;

export const INSIGHT_GENERATION_PROMPT = (userData: string, painPoints: string) => `You are a personal diabetes analyst. Review this person's meal and blood sugar data to find specific, actionable patterns.

The user's top concerns are: ${painPoints}

Data:
${userData}

Generate insights prioritizing their stated concerns. Be specific with numbers. Be direct with recommendations -- tell them exactly what to consider changing and why, based on their own data.

Rules:
- Only state patterns backed by data. Cite the number of data points.
- Be direct: "Swap white rice for brown rice at dinner -- your data shows it reduces your spike by ~35 mg/dL on average" is better than "Consider lower GI options"
- Include timing advice when relevant: "Dosing 15 minutes before your pasta meals instead of at mealtime could help -- your fastest-absorbing meals spike within 20 minutes"
- Look for NON-OBVIOUS cross-cutting patterns: Does sleep quality + specific food combos matter? Does stress + time-of-day interact? Does exercise timing relative to meals change outcomes? These multi-factor insights are your unique value.
- If data is insufficient for a pattern (<3 data points), say so
- Give at least one encouraging/positive insight ("You handle X really well")

Respond ONLY with valid JSON:
{
  "insights": [
    {
      "category": "food | time_of_day | stress | exercise | sleep | general | warning",
      "title": "Short title",
      "body": "2-4 sentences with specific numbers from their data",
      "actionable": "Direct, specific recommendation",
      "dataPoints": 5,
      "confidence": "low | medium | high",
      "relatedPainPoint": "slug of related pain point or null"
    }
  ]
}`;

// NEW: Ask about your data -- conversational Q&A
export const DATA_QA_PROMPT = (question: string, userData: string, painPoints: string) => `You are a personal diabetes assistant. The user is asking a question about their own blood sugar and meal data. Answer conversationally, specifically, and with numbers from their data.

User's question: "${question}"
User's top concerns: ${painPoints}

Their data:
${userData}

Rules:
- Answer the specific question with specific numbers from their data
- Be conversational and warm, like a knowledgeable friend
- If the question is about a food, find all instances of that food and summarize the BG response pattern
- If you don't have enough data to answer confidently, say so honestly
- Keep it concise -- 2-5 sentences max
- Give a direct recommendation if relevant

Respond with plain text (NOT JSON). Just answer naturally.`;

// NEW: Meal-specific commentary for meal detail view
export const MEAL_COMMENTARY_PROMPT = (mealData: string, contextData: string) => `You are a diabetes data analyst. A user is looking at a specific meal and its blood sugar impact. Explain what happened and why, considering the full context.

Meal details:
${mealData}

Context (what else was happening that day -- stress, exercise, sleep, other meals, time of day):
${contextData}

Write a short (2-3 sentence) explanation of why this meal may have caused the blood sugar response it did. Consider all factors, not just the food itself. Be specific. If the response was surprisingly good or bad compared to similar meals, say why that might be.

Respond with plain text, not JSON.`;
```

**API Route Pattern (`api/insights/generate/route.ts`):**
```typescript
// Insight generation endpoint pattern:
// 
// 1. Fetch user's data (meals + BG + lifestyle + profile + pain points)
// 2. Call insightOrchestrator(data, painPoints)
//    - If AI_ENABLED: serialize data -> call Claude -> parse JSON -> validate with Zod
//    - If not AI_ENABLED (or AI call fails): run rule-based fallback
// 3. Clear old insights, store new ones
// 4. Return insights to client
// 
// The food analysis endpoints (api/ai/analyze-photo, api/ai/analyze-text) follow similar pattern:
// 1. Check AI_ENABLED. If false, return { aiEnabled: false } and client shows manual entry.
// 2. If true, call Claude with the photo/text. Parse response. Return structured nutrition data.
// 3. On error, return { error: true, fallback: true } and client shows manual entry.
```


---

## 7. Dexcom API Integration

### OAuth2 Flow
1. User clicks "Connect Dexcom" on the You/Settings page
2. App redirects to Dexcom auth URL:
   - Sandbox: `https://sandbox-api.dexcom.com/v2/oauth2/login?client_id={ID}&redirect_uri={URI}&response_type=code&scope=egv`
   - Production: `https://api.dexcom.com/v2/oauth2/login?...`
3. User authorizes in Dexcom's UI
4. Dexcom redirects back to `/api/dexcom/callback?code=...`
5. Server exchanges code for tokens via POST to `/v2/oauth2/token`
6. Store access_token, refresh_token, expiry in DexcomConnection table
7. Immediately trigger initial sync

### Token Refresh
- Access tokens expire after ~2 hours
- Before any API call, check if token is expired (or will expire within 5 minutes)
- If so, use refresh_token to get new access_token via POST to `/v2/oauth2/token` with `grant_type=refresh_token`
- If refresh fails, mark connection as disconnected and show "Reconnect Dexcom" prompt

### Data Sync
- Fetch endpoint: GET `/v3/users/self/egvs?startDate={ISO}&endDate={ISO}`
- Sync the last 24 hours on each sync (overlap is fine, deduplicate by timestamp)
- On initial connection: sync last 30 days of data
- Response fields to map:
  - `records[].value` -> GlucoseReading.value (mg/dL)
  - `records[].displayTime` -> GlucoseReading.timestamp
  - `records[].trend` -> GlucoseReading.trend (map Dexcom's "doubleUp"/"singleUp"/"fortyFiveUp"/"flat"/"fortyFiveDown"/"singleDown"/"doubleDown" to our format)
- Auto-sync: **client-side** polling every 5 minutes when the app is open (use setInterval with cleanup on unmount). This matches Dexcom's CGM update frequency -- new readings arrive every 5 minutes, so polling faster would be pointless. No server-side cron or websockets needed.
- Manual sync: "Sync Now" button in settings

### CSV Fallback
Support Dexcom Clarity CSV export format:

```typescript
// lib/data/csvParser.ts
// 
// Dexcom Clarity CSV quirks:
// - First ~10 rows are metadata (device info, patient info, export date)
// - Header row contains: "Index", "Timestamp (YYYY-MM-DDThh:mm:ss)", "Event Type", 
//   "Event Subtype", "Patient Info", "Device Info", "Source Device ID", 
//   "Glucose Value (mg/dL)", "Insulin Value (u)", "Carb Value (grams)", ...
// - EGV rows have Event Type === "EGV"
// 
// Algorithm:
// 1. Split file by lines
// 2. Find the header row (contains "Timestamp" and "Glucose Value" or "Event Type")
// 3. Parse columns by header names (don't assume column positions)
// 4. Filter for EGV rows
// 5. Extract timestamp and glucose value
// 6. Validate: glucose 40-400 mg/dL, timestamp is valid date
// 7. Sort by timestamp ascending
// 8. Return parsed readings
//
// Also support simpler Dexcom receiver CSV format:
// - Columns: GlucoseDisplayTime, GlucoseValue (or similar)
// - No Event Type filtering needed
// - Detect format by checking header names
```

---

## 8. UI/UX Design Direction

### Design Philosophy
Steadii should feel like a modern wellness app, not a medical device. Think: the calm confidence of a Headspace or Oura Ring UI, but for blood sugar. The user should feel supported, not surveilled.

### Light, Modern, Clean Aesthetic

**Color Palette:**
- **Background**: Clean white (#FFFFFF) with very subtle warm gray (#F8F7F5) for card backgrounds
- **Primary accent**: Soft violet/lavender (#8B7EC8 or similar) -- distinctive, calming, modern
- **Secondary accent**: Soft blue (#6BA3E8) for secondary actions and data
- **In range (good)**: Soft teal/mint (#4ECDC4)
- **High warning**: Warm peach/amber (#F4A261)
- **Low warning**: Soft coral (#E76F6F)
- **Severe/critical**: Deeper versions of above
- **Text primary**: Dark charcoal (#1A1A2E) -- not pure black
- **Text secondary**: Medium gray (#6B7280)
- **Borders/dividers**: Very light gray (#E5E7EB)
- **Card shadows**: Subtle, warm-toned (`0 2px 8px rgba(0,0,0,0.04)`)

**Typography:**
- **Body font**: "Plus Jakarta Sans" (from Google Fonts) -- clean, modern, friendly, highly readable
- **Glucose numbers**: "JetBrains Mono" or "IBM Plex Mono" -- monospace for data, gives a "smart" feel without being clinical
- **Headings**: Plus Jakarta Sans bold/semibold
- **Font scale**: Base 16px, headings 20-28px, BG hero display 48-64px

**Design Tokens (CSS Variables):**
```css
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F7F5;
  --bg-card: #FFFFFF;
  --accent-primary: #8B7EC8;
  --accent-primary-light: #B8ADE8;
  --accent-secondary: #6BA3E8;
  --color-in-range: #4ECDC4;
  --color-high: #F4A261;
  --color-low: #E76F6F;
  --color-severe-high: #E07B39;
  --color-severe-low: #D14545;
  --text-primary: #1A1A2E;
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;
  --border: #E5E7EB;
  --border-light: #F3F4F6;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.08);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Component Styling Guidelines

**Cards**: White background, subtle shadow, generous padding (16-20px), rounded corners (12-16px radius). No harsh borders -- use shadows for depth.

**Buttons**: 
- Primary: Solid accent-primary background, white text, rounded-full (pill shape), subtle hover shadow lift
- Secondary: Light accent-primary-light background, accent-primary text
- Destructive: Soft coral background
- All buttons: 44px minimum tap target height

**Charts (THE most important visual element):**
- Clean, minimal axes -- no grid lines, just subtle horizontal reference lines at key values (70, 120, 180, 250)
- Smooth curved lines (use `type="monotone"` in Recharts)
- Target range shown as a very subtle tinted band (mint/teal at ~10% opacity)
- Line color transitions smoothly between in-range (teal), high (amber), and low (coral)
- Meal markers: small filled circles with the TIR color, positioned at the BG value at meal time
- Lifestyle markers: small, subtle icons above/below the chart
- No clutter. If in doubt, remove it.
- The chart should feel like a piece of data art -- something you'd want to look at

**Inputs**: Rounded corners, light border, generous padding, large font. On focus: accent-primary border with subtle glow.

**Bottom Navigation**: 
- Fixed at bottom, white background with subtle top border
- 4 items, evenly spaced
- Active tab: accent-primary color, slight scale-up
- The "Log" tab (center-ish) should be visually emphasized -- slightly larger icon, or a subtle accent background circle

**Transitions/Animations**:
- Page transitions: subtle fade-in (200ms)
- Card appearances: stagger fade-in from bottom (100ms delay between cards)
- BG hero value: number counting animation on change
- TIR color dots: soft pulse on first appearance
- Tab switches: smooth cross-fade
- All transitions should feel buttery and calm -- nothing aggressive or bouncy

**Empty States**: 
- Friendly illustration (can be simple SVG) + encouraging copy
- Clear CTA button
- "No meals logged yet? Tap + to log your first one -- it takes 30 seconds!"
- "Connect your Dexcom to see your glucose chart come alive"

**Responsive Design**:
- Mobile-first (this will be used on phone browsers)
- Max-width container at 480px for phone browsers
- Desktop: center the app in a phone-sized container (like a phone preview)
- All tap targets: minimum 44x44px

---

## 9. Built-in Common Foods Database

Include a static list of ~200 common foods in `lib/food/commonFoods.ts` as a fallback and for the "Common Foods" quick-add grid. This ensures the app works offline and provides instant results.

```typescript
// lib/food/commonFoods.ts
export interface CommonFood {
  id: string;
  name: string;
  emoji: string;        // for visual display in the grid
  category: string;     // "grain", "protein", "dairy", "fruit", "vegetable", "snack", "drink", "mixed"
  defaultServing: string; // "1 slice", "1 cup", "1 medium"
  defaultServingGrams: number;
  carbsGrams: number;   // per default serving
  proteinGrams: number;
  fatGrams: number;
  fiberGrams: number;
  calories: number;
  glycemicEstimate: "low" | "medium" | "high";
}

// Include at minimum these categories:
// Grains: white rice, brown rice, white bread, wheat bread, pasta, oatmeal, cereal, tortilla, bagel, pancakes
// Proteins: chicken breast, ground beef, salmon, eggs, tofu, turkey, steak, shrimp
// Dairy: milk (whole, skim), cheese, yogurt, greek yogurt, cottage cheese, ice cream
// Fruits: apple, banana, orange, grapes, strawberries, blueberries, watermelon, mango
// Vegetables: broccoli, carrots, spinach, potatoes, sweet potato, corn, peas, green beans
// Snacks: chips, cookies, crackers, granola bar, trail mix, popcorn, pretzels, candy bar
// Drinks: orange juice, soda, beer, coffee with cream, smoothie, protein shake
// Mixed/Common meals: pizza (1 slice), burger, burrito, sandwich, sushi roll, tacos, mac and cheese, ramen, fried rice, pad thai
// Fast food: McDonald's Big Mac, Chipotle burrito bowl, Subway 6-inch, Chick-fil-A sandwich
```

---

## 10. Seed Data for Development

Create a seed script (`prisma/seed.ts`) that populates the database with realistic sample data so the app looks alive during development and testing.

**Generate:**
1. **User profile**: Filled out with sample data matching the target user (college student, Type 1, diagnosed 5 years ago, A1C 7.2)
2. **Pain points**: "post_meal_spikes" (#1), "stress_highs" (#2), "carb_counting_fatigue" (#3)
3. **14 days of glucose readings**: 
   - 288 readings/day (every 5 minutes)
   - Base pattern: sinusoidal around 130 mg/dL
   - Add meal-triggered spikes (peak 60-120 mg/dL above baseline, peaking 45-90 minutes post-meal)
   - Add some overnight lows (dipping to 55-65 mg/dL)
   - Add some stress-related sustained highs (180-220 mg/dL for 3-4 hours)
   - Add dawn phenomenon (gradual rise 5am-7am on some days)
   - Add normal variability (random noise +/- 15 mg/dL)
4. **30 meals** spread across the 14 days:
   - Mix of breakfast/lunch/dinner/snack
   - Various foods with realistic nutrition data
   - Pre-computed BG impact data
   - TIR scores: roughly 40% green, 35% amber, 25% red
   - Some meals favorited
5. **15 lifestyle logs**: 
   - 5 stress logs (2 high-stress during "finals week", 3 moderate)
   - 5 exercise logs (mix of running, lifting, walking)
   - 5 sleep logs (mix of good and bad nights)
6. **8 insights**: Pre-generated from the seed data patterns

---

## 11. Implementation Priorities

Build in this exact order. Each phase should result in a working app.

### Phase 1: Foundation + Data Import (GET DATA IN FIRST)
1. Next.js project init with TypeScript, Tailwind, Prisma, SQLite
2. Install all dependencies
3. Run Prisma migrations
4. Run seed script to populate dev data
5. Basic layout with bottom nav (Home, Log, Meals, You tabs)
6. Settings/You page with CSV upload (drag-and-drop, parse Dexcom CSVs)
7. Manual BG entry form
8. Basic glucose chart on dashboard (Recharts, showing seed data)

### Phase 2: Onboarding + Profile
9. Full onboarding flow (5 steps with smooth transitions)
10. Profile editing on You page
11. Pain point selection and ranking
12. Target range configuration with slider
13. Insulin settings form

### Phase 3: Meal Logging (THE CORE FEATURE)
14. Meal logger screen with 4-tab layout
15. USDA food search with typeahead
16. Common foods quick-add grid
17. Manual entry form
18. Serving size adjuster
19. Meal item list with running totals
20. Barcode scanner (quagga2 + Open Food Facts)
21. Photo capture (AI auto-analysis when enabled, manual fallback when disabled)
22. Favorite meals and recent meals for quick re-logging
23. Meal type auto-selection by time of day

### Phase 4: Intelligence
24. BG impact calculation engine
25. TIR score and color assignment for meals
26. Meal markers on glucose chart (colored dots)
27. Meal detail view with post-meal BG overlay chart
28. Lifestyle logging (stress, exercise, sleep quick-log)
29. Lifestyle markers on glucose chart
30. Insight orchestrator + rule-based FALLBACK engine
31. AI insight engine (full implementation, gated behind AI_ENABLED flag)
32. AI food photo analysis (full implementation, gated behind AI_ENABLED flag)
33. "Ask Steadii" conversational Q&A (AI-only, hidden when disabled)
34. Meal commentary generation (AI-only, hidden when disabled)
35. Insights page with pain point progress
36. Food ranking (best/worst foods)
37. Pre-meal prediction on the logging screen

### Phase 5: Dexcom Live
38. Dexcom OAuth2 connect flow
39. Token storage and refresh logic
40. Automated data sync (every 5 minutes)
41. Current BG hero display with client-side polling (every 5 min, matching CGM update frequency)

### Phase 6: Polish
42. All CSS transitions and animations
43. Empty states with CTAs
44. Loading states (skeleton screens, not spinners)
45. Error handling with user-friendly messages everywhere
46. Toast notifications for actions (meal logged, sync complete, etc.)
47. Responsive design verification on mobile browsers
48. Data export functionality
49. AI settings page (toggle, API key input, status indicator)
50. Turso database setup + Vercel deployment (see Sections 14-15)

---

## 12. Package Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "@prisma/adapter-libsql": "^5.0.0",
    "@libsql/client": "^0.6.0",
    "recharts": "^2.10.0",
    "tailwindcss": "^3.4.0",
    "@ericblade/quagga2": "^1.8.0",
    "date-fns": "^3.0.0",
    "react-dropzone": "^14.0.0",
    "lucide-react": "^0.300.0",
    "zod": "^3.22.0",
    "next-themes": "^0.3.0",
    "@anthropic-ai/sdk": "latest"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.0.0"
  }
}
```

**Google Fonts to include** (in `layout.tsx` via `next/font/google`):
- Plus Jakarta Sans (weights: 400, 500, 600, 700)
- JetBrains Mono (weights: 400, 500, 600)

---

## 13. Important Technical Notes

### Performance
- Glucose readings: ~288/day. Index timestamp column. For charts, downsample to 15-minute averages for 7-day view.
- Food search: 300ms debounce on USDA API calls. Cache recent search results in memory.
- BG impact computation: run async, don't block UI. Show "Calculating..." placeholder on meal cards until done.

### Photo Handling (Ephemeral by Design)
- Full-size meal photos are **never persisted**. They exist only in browser memory during the logging session.
- When AI is enabled, the full photo is sent to Claude Vision for analysis, then discarded after the user confirms the nutrition data.
- On meal confirmation, a tiny thumbnail (~50x50px) is generated client-side using the canvas API, converted to a base64 string, and stored directly in the `Meal.photoUrl` database field. At ~2-4KB per thumbnail, even 1,000 meals would use roughly 2-4MB total.
- This approach means zero file storage needed -- no `/public/uploads/` directory, no Vercel static file limits, no storage costs. Everything lives in the database.

### Error Handling
- All API calls wrapped in try/catch with user-friendly error messages
- Food search failures: gracefully fall back to common foods list
- Barcode not found: clear message + option to enter manually
- Dexcom sync failure: show last sync time + retry button
- CSV parse errors: show what went wrong with line numbers if possible

### Security
- All external API calls proxied through Next.js API routes (server-side)
- Dexcom tokens never exposed to client
- Turso auth token and Anthropic API key stored in Vercel env vars (server-side only)
- All secrets in `.env` locally, never committed to git (`.gitignore` must include `.env`)

### Accessibility
- All interactive elements have aria labels
- Color is never the ONLY indicator (TIR dots also have text labels on hover/tap)
- Minimum contrast ratios for all text
- Focus indicators on all interactive elements

---

## 14. Database Setup (Turso + Prisma)

### Prisma Client with Turso Adapter (`lib/db.ts`)

The Prisma client needs a driver adapter to talk to Turso in production. For local dev, it talks to the SQLite file directly.

```typescript
// lib/db.ts
//
// import { PrismaClient } from '@prisma/client';
// import { PrismaLibSQL } from '@prisma/adapter-libsql';
// import { createClient } from '@libsql/client';
//
// function createPrismaClient() {
//   // Production (Turso): use libsql adapter
//   if (process.env.TURSO_AUTH_TOKEN) {
//     const libsql = createClient({
//       url: process.env.DATABASE_URL!,
//       authToken: process.env.TURSO_AUTH_TOKEN,
//     });
//     const adapter = new PrismaLibSQL(libsql);
//     return new PrismaClient({ adapter });
//   }
//
//   // Local dev (SQLite file): no adapter needed
//   return new PrismaClient();
// }
//
// // Singleton pattern to prevent multiple instances in dev (Next.js hot reload)
// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
// export const prisma = globalForPrisma.prisma ?? createPrismaClient();
// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

This means:
- `DATABASE_URL="file:./steadii.db"` + no `TURSO_AUTH_TOKEN` = local SQLite (dev)
- `DATABASE_URL="libsql://..."` + `TURSO_AUTH_TOKEN=...` = Turso cloud (production)
- Same Prisma schema, same queries, zero code changes between environments.

### Setting Up Turso (One-Time, ~5 Minutes)

```bash
# 1. Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Sign up / log in (free, no credit card)
turso auth signup    # or: turso auth login

# 3. Create a database
turso db create steadii

# 4. Get your connection URL
turso db show steadii --url
# Output: libsql://steadii-yourname.turso.io

# 5. Create an auth token
turso db tokens create steadii
# Output: eyJhbGci... (long token string)

# 6. These two values go into your .env (and Vercel env vars):
#    DATABASE_URL=libsql://steadii-yourname.turso.io
#    TURSO_AUTH_TOKEN=eyJhbGci...
```

**Turso free tier limits (more than enough for Steadii):**
- 500 million row reads/month
- 10 million row writes/month  
- 5 GB storage
- No pausing, no credit card, no expiration

For context: Dexcom generates ~288 glucose readings/day (~8,640/month), and logging 5 meals/day is ~150/month. You'd use roughly 0.002% of the free tier.

### Pushing the Schema to Turso

After creating the Turso database, push the Prisma schema:

```bash
# For local dev (SQLite file)
npx prisma db push

# For Turso (set the env vars first, then push)
DATABASE_URL="libsql://steadii-yourname.turso.io" TURSO_AUTH_TOKEN="eyJ..." npx prisma db push
```

---

## 15. Deployment (Vercel)

### Why Vercel
- Free tier is permanent (no credit card for Hobby plan)
- Native Next.js support -- zero configuration for API routes, SSR, static assets
- 100 GB bandwidth, 150K serverless function invocations/month -- massive overkill for a single-user app
- Push to GitHub, auto-deploys. That's it.

### Deploying to Vercel (One-Time, ~10 Minutes)

**Prerequisites:**
- App code pushed to a GitHub repo
- Turso database created (see Section 14)

**Steps:**

```
1. Go to vercel.com, sign up with GitHub (free)

2. Click "Add New Project" > Import your Steadii repo

3. Vercel auto-detects Next.js. Leave the defaults.

4. Add environment variables (Settings > Environment Variables):
   
   DATABASE_URL        = libsql://steadii-yourname.turso.io
   TURSO_AUTH_TOKEN    = eyJhbGci... (from turso db tokens create)
   USDA_API_KEY        = DEMO_KEY
   AI_ENABLED          = false
   ANTHROPIC_API_KEY   = (leave blank for now)
   DEXCOM_CLIENT_ID    = (if you have one)
   DEXCOM_CLIENT_SECRET = (if you have one)
   DEXCOM_REDIRECT_URI = https://your-app.vercel.app/api/dexcom/callback
   DEXCOM_ENV          = sandbox

5. Click "Deploy"

6. Vercel builds and gives you a URL: https://steadii-xyz.vercel.app
```

**After first deploy:**
- Run `npx prisma db push` against the Turso database (see Section 14) to create the tables
- Every subsequent `git push` to main auto-deploys
- Preview URLs are generated for every branch/PR

### Vercel Free Tier Limits (For Reference)
- 100 GB bandwidth/month
- 150,000 serverless function invocations/month
- 100 GB-hours of serverless execution/month
- 6,000 build minutes/month
- Custom domains (free)
- HTTPS (automatic)
- No credit card required

A single-user diabetes app will use a tiny fraction of these limits.

### Dexcom Redirect URI Update

When deploying, update the Dexcom redirect URI:
- Local dev: `http://localhost:3000/api/dexcom/callback`
- Production: `https://your-app.vercel.app/api/dexcom/callback`
- Update this both in your Vercel env vars AND in your Dexcom developer app settings at developer.dexcom.com

### Local Development vs. Production

| | Local Dev | Production (Vercel) |
|---|---|---|
| Database | SQLite file (`file:./steadii.db`) | Turso (`libsql://...`) |
| Run command | `npm run dev` | Auto-deployed on git push |
| AI | Same flag (`AI_ENABLED`) | Same flag |
| Dexcom | Sandbox API | Production or Sandbox API |
| Cost | Free | Free (Vercel + Turso free tiers) |

---

## Summary for the AI Developer

You are building **Steadii**, a personal blood sugar management app for a college student with diabetes. The core loop:

1. **Get glucose data in** -- Dexcom API, CSV upload, or manual entry
2. **Log meals fast** -- food search, barcode scan, quick favorites, AI-powered photo analysis (when enabled)
3. **Track lifestyle** -- stress, exercise, sleep (because finals week is different from summer)
4. **Correlate everything** -- automatically link meals and lifestyle to the BG curve that follows
5. **Surface personal patterns** -- AI is the PRIMARY insight engine (holistic, cross-cutting, natural language); rule-based engine is the FALLBACK when AI is disabled
6. **Give direct recommendations** -- specific, actionable, based on their own data. "Swap rice for pasta at dinner" not "consider lower GI options"

**Architecture principle: AI-primary, fallback-safe.** Every AI-powered feature has a clean degradation path. The `insightOrchestrator` checks the `AI_ENABLED` flag and routes accordingly. AI calls are wrapped in try/catch and fall back to rules on failure. The user should never see a broken state -- just a less intelligent one. When AI is enabled, it fully replaces (not supplements) the rule-based engine. The AI engine does everything the rules do, plus finds non-obvious multi-factor patterns, generates natural conversational text, and powers the "Ask Steadii" Q&A and per-meal commentary features.

The app should feel **light, modern, and refreshing** -- soft purples, clean whites, beautiful smooth charts, generous whitespace, calming but confident. Think wellness app, not hospital dashboard. Fast logging. Encouraging tone. Celebrate wins.

**Build it as a fully functional Next.js app that runs with `npm run dev`.** Start with Phase 1 (foundation + data import) and work through each phase sequentially. Seed data should make the app look great from the first run. AI features are fully implemented but gated behind `AI_ENABLED=false` by default -- one env var flip + API key to activate.

**Deployment stack: Vercel (hosting, free) + Turso (database, free) + Anthropic API (AI, ~$5 when ready).** The Prisma client auto-detects which database to use based on whether `TURSO_AUTH_TOKEN` is set. Local dev uses a SQLite file, production uses Turso. Zero code changes between environments.
