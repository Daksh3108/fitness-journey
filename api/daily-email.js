// api/daily-email.js
const nodemailer = require("nodemailer");

const ABS = "Abs superset: leg raises, cable crunches, hip raises";

const PPL = {
  1: { title: "Push 1 — Chest, shoulders, triceps", items: ["Incline smith machine press", "Dumbbell bench press", "Pec deck fly", "Shoulder press", "Straight bar tricep pushdown", "Cable lateral raise or lateral raise machine", "Skull crushers"] },
  2: { title: "Pull 1 — Back, biceps, traps, abs", items: ["Preacher curls", "Wide-grip lat pulldown", "T-bar rows", "Incline dumbbell curls", "Shrugs", ABS] },
  3: { title: "Legs 1 — Quads, hamstrings, calves", items: ["Leg press or squats", "Leg extension", "Hamstring curls", "Standing calf raises (incl. smith machine option)", "Romanian deadlifts"] },
  4: { title: "Push 2 — Chest, shoulders, triceps (variation)", items: ["Dumbbell bench press", "Incline smith machine press", "Decline bench press", "Shoulder press", "Straight bar tricep pushdown", "Cable lateral raise", "Skull crushers"] },
  5: { title: "Pull 2 — Back, biceps, rear delts", items: ["Preacher curls", "Wide-grip lat pulldown", "Seated cable rows", "Cable curls", "Rear delts on pec deck fly", "Hammer curls"] },
  6: { title: "Legs 2 — Optional second leg day", items: ["Leg press or squats", "Leg extension", "Hamstring curls", "Standing calf raises", "Romanian deadlifts"] },
};

const TRAD = {
  1: { title: "Chest (+ abs)", items: ["Incline smith machine press", "Flat dumbbell bench press", "Decline bench press", "Pec deck fly", "Cable crossover", ABS] },
  2: { title: "Back (+ abs)", items: ["Deadlifts", "Wide-grip lat pulldown", "T-bar rows", "Seated cable rows", "Shrugs", ABS] },
  3: { title: "Shoulders (+ abs)", items: ["Seated shoulder press", "Dumbbell lateral raises", "Cable lateral raises", "Rear delts on pec deck fly", "Face pulls", ABS] },
  4: { title: "Arms", items: ["Preacher curls", "Incline dumbbell curls", "Hammer curls", "Straight bar tricep pushdown", "Skull crushers", "Overhead tricep extension"] },
  5: { title: "Legs", items: ["Squats", "Leg press", "Leg extension", "Hamstring curls", "Romanian deadlifts", "Standing calf raises"] },
};

function istParts() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "long" }).format(now);
  const dateStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" }).format(now);
  const map = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  return { dow: map[weekday], weekday, dateStr };
}

function block(name, workout) {
  if (!workout) {
    return `<div style="margin:0 0 18px;padding:16px 18px;background:#11160f;border:1px solid #1f2a18;border-radius:14px">
      <div style="font:700 13px Arial,sans-serif;color:#c4f64a;text-transform:uppercase;letter-spacing:.5px">${name}</div>
      <div style="font:600 16px Arial,sans-serif;color:#f2f5ef;margin-top:6px">Rest &amp; recovery day 💤</div>
      <div style="font:400 14px Arial,sans-serif;color:#9aa394;margin-top:4px">Eat well, hydrate, and sleep 7–8 hours.</div>
    </div>`;
  }
  const lis = workout.items.map((i) => `<li style="margin:4px 0">${i}</li>`).join("");
  return `<div style="margin:0 0 18px;padding:16px 18px;background:#11160f;border:1px solid #1f2a18;border-radius:14px">
    <div style="font:700 13px Arial,sans-serif;color:#c4f64a;text-transform:uppercase;letter-spacing:.5px">${name}</div>
    <div style="font:600 16px Arial,sans-serif;color:#f2f5ef;margin:6px 0 8px">${workout.title}</div>
    <ul style="font:400 14px/1.6 Arial,sans-serif;color:#cdd4c6;margin:0;padding-left:20px">${lis}</ul>
  </div>`;
}

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || "";
    const provided = auth.replace("Bearer ", "") || (req.query && req.query.secret) || "";
    if (provided !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = (process.env.EMAIL_TO || "").split(",").map((s) => s.trim()).filter(Boolean);
  const fromName = process.env.EMAIL_FROM || "Daksh's Fitness Journey";

  if (!user || !pass || to.length === 0) {
    console.error("Missing GMAIL_USER, GMAIL_APP_PASSWORD, or EMAIL_TO.");
    return res.status(500).json({ error: "Email is not configured. Set GMAIL_USER, GMAIL_APP_PASSWORD, and EMAIL_TO in Vercel." });
  }

  const { dow, weekday, dateStr } = istParts();

  const html = `<div style="max-width:560px;margin:0 auto;padding:24px;background:#080a08;border-radius:18px">
    <div style="font:800 22px Arial,sans-serif;color:#c4f64a;letter-spacing:.5px">Today's Training</div>
    <div style="font:400 14px Arial,sans-serif;color:#9aa394;margin:4px 0 20px">${weekday}, ${dateStr} · myfitnessjourney.com</div>
    ${block("Push / Pull / Legs", PPL[dow])}
    ${block("Traditional 5-day", TRAD[dow])}
    <div style="font:400 13px Arial,sans-serif;color:#6f786a;margin-top:8px">Train hard, clean form, then recover. — Daksh's Fitness Journey</div>
  </div>`;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `${fromName} <${user}>`,
      to,
      subject: `🏋️ ${weekday}'s workout — PPL & 5-day split`,
      html,
    });

    return res.status(200).json({ ok: true, sent_to: to, id: info.messageId });
  } catch (err) {
    console.error("daily-email crashed:", err);
    return res.status(502).json({ error: "Could not send the email.", detail: String(err && err.message || err) });
  }
};
