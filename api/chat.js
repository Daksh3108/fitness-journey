// api/chat.js
// Secure backend for the site's chatbot.
//
// WHY THIS FILE EXISTS:
// Your DeepSeek API key must NEVER live in the browser (script.js), or anyone
// could steal it and run up your bill. This file runs on Vercel's servers, not
// in the visitor's browser, so the key stays secret. The chat widget talks to
// THIS endpoint (/api/chat); only this endpoint talks to DeepSeek.
//
// The key is read from process.env.DEEPSEEK_API_KEY — an Environment Variable
// you set in the Vercel dashboard. It is never written in the code.

const SYSTEM_PROMPT = `You are the friendly assistant for "Daksh Avtani | My Fitness Journey" (myfitnessjourney.com).
Your job is to answer visitors' questions and clear their doubts about Daksh's fitness journey, training, diet, and beginner advice, using ONLY the facts below.

ABOUT DAKSH:
- Started training in December 2024 because of body dysmorphia, to build confidence and discipline.
- Began at 63 kg (skinny-fat), now 73.5 kg and more muscular. Goal: a shredded physique within ~2 months.
- Biggest struggle: eating a good diet while living in a hostel.

TRAINING:
- First 6-8 months: traditional split — Mon Chest, Tue Back, Wed Shoulders, Thu Arms, Fri Legs.
- Current phase: Push, Pull, Legs (PPL). Push = chest/shoulders/triceps, Pull = back/biceps/rear delts, Legs = quads/hamstrings/glutes/calves. PPL runs Mon-Sat, rest Sunday.
- Core rule: you don't need 5 different exercises for one muscle. Enough hard sets, clean form, and recovery beat more volume.
- Training near failure: for beginners, stop with 0-2 clean reps left. Go closer to true failure on safer machine/isolation moves (curls, lateral raises, pushdowns, leg extensions); be careful on heavy presses, squats, Romanian deadlifts.
- A superset = two or more exercises back-to-back with no rest. Abs example: leg raises, cable crunches, hip raises continuously, then rest 2-3 min, repeat twice more.
- The site has a tool to download either split as a calendar (.ics) file, and a video exercise library.

DIET:
- Start by finding your calorie target with a TDEE calculator (Mifflin-St Jeor formula). Treat it as a starting point and adjust by your weight trend over 2-3 weeks.
- Breakfast: high-protein oatmeal (oats, 350-500 ml milk, peanut butter, chocolate protein powder, honey) ~40-50 g protein.
- Lunch: roti, rice, vegetables to calorie goal; lighter (often one roti) during a cut.
- Dinner: ~300 g chicken breast at home, or a 5-6 egg omelette in hostel.
- Supplements: protein powder since April 2025, creatine since February 2026. Beginners can wait 3-4 months, build consistency, then add creatine.
- Total calories, protein, and consistency matter most. Spread protein across the day. ~4 L water for an active person; sleep 7-8 hours for recovery.

BEGINNER GUIDE (first 12 weeks):
- Week 1: full-body 4-5 days, very light weights to learn form.
- Weeks 2-4: train 3-5 days/week, repeat the same basic movements.
- Weeks 5-8: push harder sets with clean technique.
- Weeks 9-12: track lifts, body weight, food, sleep, and progress photos. Abs 2-3x/week if time allows.
- Mistakes to avoid: changing plans every week; only training chest and arms; not enough protein; skipping sleep; lifting heavy with bad form.

RULES:
- Be warm, concise, and encouraging. Keep replies short (2-4 sentences unless asked for detail).
- Answer ONLY from the facts above plus general, safe fitness basics. If something isn't covered, say you're not sure and point them to the relevant section of the site.
- You are NOT a doctor. For injuries, medical conditions, or medication, tell them to consult a qualified professional.
- Never invent specific numbers Daksh didn't state.`;

module.exports = async (req, res) => {
  // Only allow POST — this endpoint is for sending chat messages.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY is not set in the environment.");
      return res.status(500).json({ error: "Server is not configured yet." });
    }

    // Vercel parses JSON bodies automatically, but guard just in case.
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    // Guardrails: keep only valid user/assistant turns, cap history and length
    // so a visitor can't blow up your token bill.
    const history = incoming
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (history.length === 0) {
      return res.status(400).json({ error: "No message provided." });
    }

    // Call DeepSeek (OpenAI-compatible API).
    const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        max_tokens: 700,
        temperature: 0.4,
      }),
    });

    if (!dsRes.ok) {
      const detail = await dsRes.text();
      console.error("DeepSeek error:", dsRes.status, detail);
      return res.status(502).json({ error: "The assistant is unavailable right now." });
    }

    const data = await dsRes.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't come up with a reply. Try rephrasing your question.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat handler crashed:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
