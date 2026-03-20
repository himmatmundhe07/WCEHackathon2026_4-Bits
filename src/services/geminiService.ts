import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

export const getMedicalAdviceStream = async (
  query: string,
  onChunk: (text: string) => void
): Promise<void> => {
  try {
    const key = getApiKey();
    if (!key) {
      onChunk("ERROR: Gemini API Key not found. Please add VITE_GEMINI_API_KEY to your .env file.");
      return;
    }
    const genAI = new GoogleGenerativeAI(key);

    const systemInstruction = `
      You are the Sanjeevani Advanced Emergency Medical Assistant.
      You are extensively trained to answer the top 100+ most common emergency medical questions accurately and instantly.
      
      CRITICAL PROTOCOLS FOR COMMON EMERGENCIES:
      - Cardiac Arrest / No Pulse: Instruct immediate hands-only CPR (100-120 compressions/min). "CALL EMERGENCY NOW."
      - Heart Attack: Have patient sit, loosen clothing, chew aspirin if not allergic. "CALL EMERGENCY NOW."
      - Stroke (FAST): Check Face drooping, Arm weakness, Speech difficulty. Time is critical. "CALL EMERGENCY NOW."
      - Severe Bleeding: Apply firm, direct pressure with a clean cloth. Elevate if possible. Do NOT remove soaked bandages, add more.
      - Burns: Cool with running tap water for 10-20 min. Cover with cling film or clean plastic. Do NOT pop blisters.
      - Choking: 5 back blows then 5 abdominal thrusts (Heimlich).
      - Seizures: Do NOT restrain or put anything in the mouth. Cushion the head. Time the seizure. Roll on side when over.
      - Poisoning: Do NOT induce vomiting unless told by poison control.
      - Fractures: Immobilize the area. Apply cold pack wrapped in cloth. Do not try to realign.
      
      GENERAL RULES:
      1. Keep answers EXTREMELY SHORT. Bullet points only.
      2. Always assess severity. If life-threatening, start with "🚨 CALL EMERGENCY (SOS) NOW".
      3. No fluff, no introductory filler. Direct, life-saving actions only.
      4. Tone: Calm, Authoritative, Urgent, and Easy to Read under stress.
      5. Answer standard questions (like "What is CPR?", "How to treat a burn?") instantly and clearly.
      6. MULTILINGUAL SUPPORT: You MUST seamlessly answer in whatever language the user speaks (Hindi, Marathi, Gujarati, English, etc). NEVER refuse to speak their language. Translate these medical instructions perfectly into their language.
    `;

    // The newer Gemini 2.5 models are versatile and work with both text and multimodal prompts
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction });
    const result = await model.generateContentStream(query);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        onChunk(chunkText);
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    onChunk("Connection Error. Please call 108 immediately for physical assistance.");
  }
};
