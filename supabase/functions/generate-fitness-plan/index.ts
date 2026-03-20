import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── Parse & validate request body ────────────────────────────────────────
    let body: { patientId?: string };
    try {
      body = await req.json();
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { patientId } = body;
    if (!patientId || typeof patientId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid patientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Supabase client (service-role — bypasses RLS) ─────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── Fetch full patient profile ────────────────────────────────────────────
    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientErr || !patient) {
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Fetch latest vitals ───────────────────────────────────────────────────
    const { data: vitals } = await supabase
      .from('patient_vitals')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // ── Fetch active hospital admission (if any) ──────────────────────────────
    const { data: admission } = await supabase
      .from('hospital_patients')
      .select('relationship_type, ward, diagnosis')
      .eq('patient_id', patientId)
      .is('discharged_at', null)
      .maybeSingle();

    // ── Fetch latest treatment (medicines / restrictions) ─────────────────────
    const { data: treatment } = await supabase
      .from('patient_treatments')
      .select('current_disease, prescribed_medicines, activity_restrictions, dietary_restrictions')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // ── Derived context ───────────────────────────────────────────────────────
    const age = patient.date_of_birth
      ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31_557_600_000)
      : null;

    const isAdmitted = !!admission;
    const location = isAdmitted ? 'Hospital' : 'Home';

    // ── Deactivate old plans ──────────────────────────────────────────────────
    await supabase
      .from('fitness_plans')
      .update({ is_active: false })
      .eq('patient_id', patientId)
      .eq('is_active', true);

    // ── Build AI prompt ───────────────────────────────────────────────────────
    const aiPrompt = `You are a medical rehabilitation specialist and physiotherapist.
Generate a safe, personalized daily activity plan for a recovering patient.

PATIENT PROFILE:
- Age: ${age ?? 'Unknown'}
- Gender: ${patient.gender ?? 'Unknown'}
- Blood Group: ${patient.blood_group ?? 'Unknown'}
- Chronic Conditions: ${(patient.chronic_conditions ?? []).join(', ') || 'None reported'}
- Known Allergies: ${(patient.allergies ?? []).join(', ') || 'None'}
- Current Medications (from patient profile): ${(patient.current_medications ?? []).join(', ') || 'None'}

CURRENT MEDICAL STATUS:
- Currently Admitted: ${isAdmitted ? `Yes — ${admission?.ward ?? 'General Ward'} — ${admission?.diagnosis ?? ''}` : 'No (home recovery / outpatient)'}
- Active Diagnosis: ${treatment?.current_disease ?? 'Not specified'}
- Hospital-Prescribed Medicines: ${JSON.stringify(treatment?.prescribed_medicines ?? [])}
- Activity Restrictions from Doctor: ${(treatment?.activity_restrictions ?? []).join(', ') || 'None specified'}

CURRENT VITALS (latest recorded):
${vitals
  ? `- Blood Pressure: ${vitals.blood_pressure_sys ?? vitals.reading_value ?? '?'} mmHg
- Heart Rate: ${vitals.heart_rate ?? '?'} bpm
- SpO2: ${vitals.spo2 ?? '?'}%
- Blood Sugar: ${vitals.blood_sugar ?? '?'} mg/dL`
  : '- No recent vitals on record'}

LOCATION: ${location}

YOUR TASK:
Generate a SAFE daily activity plan. Respond ONLY with a valid JSON object — no markdown fences, no explanation, just raw JSON.

Rules:
1. NEVER suggest exercises that raise heart rate above 100 bpm for cardiac patients
2. NEVER suggest weight-bearing exercises if blood pressure > 160/100
3. NEVER suggest exercises requiring bending forward for vertigo patients
4. For SpO2 < 95%, only breathing exercises — no physical activity
5. For admitted patients, only bed/chair exercises
6. For diabetes patients, include post-meal walking (light)
7. Maximum 4 activities per day — never overwhelm a sick person
8. Each activity must take 5–15 minutes maximum
9. Always include at least one breathing exercise
10. Always include a water intake recommendation

JSON FORMAT (respond with ONLY this, no extra text):
{
  "plan_title": "string",
  "plan_summary": "string — 2 sentences, warm and encouraging tone",
  "intensity_level": "Bed Rest | Very Light | Light | Moderate",
  "daily_water_goal_ml": number,
  "weekly_goal_minutes": number,
  "safety_note": "string — one important caution specific to this patient",
  "activities": [
    {
      "activity_name": "string",
      "category": "Breathing | Circulation | Mobility | Strength | Balance | Walking | Relaxation | Posture",
      "description": "string — plain English step-by-step instructions",
      "duration_seconds": number,
      "repetitions": number or null,
      "sets": number,
      "rest_seconds": number,
      "frequency_per_day": number,
      "best_time": "Morning | Afternoon | Evening | After meals | Before sleep | Anytime",
      "difficulty_label": "In Bed | Seated | Standing | Walking",
      "caution_note": "string or null",
      "animation_key": "deep_breath | ankle_circles | seated_arm_raise | leg_lifts | neck_rolls | shoulder_rolls | hand_squeeze | short_walk | standing_balance | progressive_relaxation",
      "day_of_week": ["Daily"]
    }
  ]
}`;

    // ── Call Gemini API ────────────────────────────────────────────────────────
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) throw new Error('GEMINI_API_KEY environment variable is not set');

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: aiPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Gemini API error ${geminiResponse.status}: ${errText}`);
    }

    const geminiData = await geminiResponse.json();

    const rawText: string | undefined =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Invalid response from Gemini: ' + JSON.stringify(geminiData));
    }

    // ── Parse AI JSON output ──────────────────────────────────────────────────
    let planJson: Record<string, unknown>;
    try {
      planJson = JSON.parse(rawText);
    } catch (_parseErr) {
      // Strip markdown fences if Gemini added them
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ??
                    rawText.match(/\{[\s\S]*\}/);
      if (match) {
        planJson = JSON.parse(match[1] ?? match[0]);
      } else {
        throw new Error('Could not parse Gemini response as JSON');
      }
    }

    // ── Validate required top-level fields ────────────────────────────────────
    if (!planJson.plan_title || !Array.isArray(planJson.activities)) {
      throw new Error('Gemini returned an incomplete fitness plan');
    }

    // ── Save plan to database ─────────────────────────────────────────────────
    const { data: savedPlan, error: planError } = await supabase
      .from('fitness_plans')
      .insert([{
        patient_id: patientId,
        generated_by: 'ai',
        patient_age: age,
        patient_condition: patient.chronic_conditions ?? [],
        patient_medicines: patient.current_medications ?? [],
        patient_vitals_snapshot: vitals ?? {},
        patient_location: location,
        intensity_level: planJson.intensity_level,
        plan_title: planJson.plan_title,
        plan_summary: planJson.plan_summary,
        weekly_goal_minutes: planJson.weekly_goal_minutes,
        daily_water_goal_ml: planJson.daily_water_goal_ml,
        safety_note: planJson.safety_note,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      }])
      .select()
      .single();

    if (planError) throw planError;

    // ── Save individual activities ─────────────────────────────────────────────
    const activities = planJson.activities as Record<string, unknown>[];
    const activityRows = activities.map((a, i) => ({
      plan_id: savedPlan.id,
      patient_id: patientId,
      activity_name: a.activity_name,
      category: a.category,
      description: a.description,
      duration_seconds: a.duration_seconds,
      repetitions: a.repetitions ?? null,
      sets: a.sets ?? 1,
      rest_seconds: a.rest_seconds ?? 30,
      frequency_per_day: a.frequency_per_day ?? 1,
      best_time: a.best_time,
      difficulty_label: a.difficulty_label,
      caution_note: a.caution_note ?? null,
      animation_key: a.animation_key,
      day_of_week: Array.isArray(a.day_of_week) ? a.day_of_week : ['Daily'],
      order_in_plan: i + 1,
    }));

    if (activityRows.length > 0) {
      const { error: actErr } = await supabase.from('fitness_activities').insert(activityRows);
      if (actErr) throw actErr;
    }

    // ── Initialise streak record (upsert is idempotent) ───────────────────────
    await supabase
      .from('fitness_streaks')
      .upsert([{ patient_id: patientId }], { onConflict: 'patient_id', ignoreDuplicates: true });

    return new Response(
      JSON.stringify({ success: true, planId: savedPlan.id, plan: planJson }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('[generate-fitness-plan] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
