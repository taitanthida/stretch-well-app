import { useState } from "react";
import { Activity, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import neckOne from "@/assets/stretch-neck-step-1.jpg";
import neckTwo from "@/assets/stretch-neck-step-2.jpg";
import neckThree from "@/assets/stretch-neck-step-3.jpg";
import backOne from "@/assets/stretch-back-step-1.jpg";
import backTwo from "@/assets/stretch-back-step-2.jpg";
import backThree from "@/assets/stretch-back-step-3.jpg";
import wristOne from "@/assets/stretch-wrist-step-1.jpg";
import wristTwo from "@/assets/stretch-wrist-step-2.jpg";
import wristThree from "@/assets/stretch-wrist-step-3.jpg";

type GuideStep = {
  image?: string;
  illustration?: "hip" | "shoulder";
  title: string;
  time: string;
  text: string;
  alt: string;
};

type MovementGuide = { name: string; steps: GuideStep[] };

const guides: MovementGuide[] = [
  {
    name: "Neck reset",
    steps: [
      { image: neckOne, title: "Sit tall", time: "5 slow breaths", text: "Rest your hands on your thighs. Look straight ahead and let your shoulders drop.", alt: "Seated upright with a neutral neck and relaxed shoulders" },
      { image: neckTwo, title: "Tilt gently to the side", time: "10–15 sec each side", text: "Bring one ear toward your shoulder without lifting the shoulder. Return to the middle, then switch sides. Do not pull your head.", alt: "Gentle sideways neck tilt with shoulders relaxed" },
      { image: neckThree, title: "Return to the middle", time: "5 slow breaths", text: "Bring your head upright again. Relax your jaw and shoulders before repeating the gentle side bends.", alt: "Head returned to an upright neutral position after the side bend" },
    ],
  },
  {
    name: "Lower back flow",
    steps: [
      { image: backOne, title: "Find a steady seat", time: "5 slow breaths", text: "Place both feet flat on the floor, hip-width apart. Sit tall with your hands resting on your thighs.", alt: "Upright seated posture with both feet flat and hands on thighs" },
      { image: backTwo, title: "Gently round your back", time: "Exhale slowly", text: "Breathe out and gently round your upper back. Let your chin lower slightly, keeping your hips on the seat.", alt: "Seated gentle back rounding with the chin slightly lowered" },
      { image: backThree, title: "Open your chest", time: "Repeat 5–8 times", text: "Breathe in, sit tall and gently lift your chest. Keep the movement small. Alternate with the rounded position without forcing your lower back.", alt: "Seated tall with the chest gently lifted and feet on the floor" },
    ],
  },
  {
    name: "Wrist break",
    steps: [
      { image: wristOne, title: "Open your hands", time: "5 gentle repetitions", text: "Relax your shoulders. Spread your fingers comfortably, then relax them. Keep your wrists loose.", alt: "Both hands open with fingers comfortably spread" },
      { image: wristTwo, title: "Fingers point up", time: "10–15 sec each hand", text: "Reach one arm forward with a soft elbow. Point your fingers up and gently ease them back with your other hand. Switch hands.", alt: "One arm extended with fingers up and the other hand gently supporting the fingers" },
      { image: wristThree, title: "Fingers point down", time: "10–15 sec each hand", text: "Point your fingers down. Use your other hand to gently ease the back of your hand toward you. Keep your elbow soft, then switch hands.", alt: "One arm extended with fingers pointing down and the other hand supporting the back of the hand" },
    ],
  },
  {
    name: "Hip flexor release",
    steps: [
      { illustration: "hip", title: "Set a short lunge", time: "Get steady first", text: "Stand beside a desk or chair for support. Place one foot forward and the other behind you.", alt: "A supported split stance set up for a gentle hip flexor stretch" },
      { illustration: "hip", title: "Shift forward gently", time: "15–20 sec each side", text: "Keep your chest tall and gently tuck your pelvis. Shift forward until you feel a mild stretch at the front of the back hip.", alt: "A gentle supported lunge with the hips shifting forward and torso upright" },
      { illustration: "hip", title: "Breathe, then switch", time: "Repeat on both sides", text: "Breathe slowly without arching your lower back. Return to standing and change sides. Skip this stretch if kneeling or lunging hurts.", alt: "Switching the front and back legs to stretch the other hip" },
    ],
  },
  {
    name: "Shoulder mobility",
    steps: [
      { illustration: "shoulder", title: "Roll your shoulders", time: "5 slow circles", text: "Sit or stand tall. Roll both shoulders up, back, and down without forcing the movement.", alt: "Standing tall while gently rolling the shoulders" },
      { illustration: "shoulder", title: "Reach across", time: "15 sec each side", text: "Bring one arm across your chest. Use the other arm to support it gently above the elbow; keep shoulders relaxed.", alt: "A gentle cross-body shoulder stretch with the arm supported above the elbow" },
      { illustration: "shoulder", title: "Reach overhead", time: "3 slow breaths each side", text: "Lift one arm overhead and lean slightly to the other side. Keep the movement comfortable, then switch.", alt: "A comfortable overhead side reach to open the shoulder and side body" },
    ],
  },
];

export function StretchStepGuide({ initialIndex = 0, showSelector = true, compact = false }: { initialIndex?: number; showSelector?: boolean; compact?: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const guide = guides[selectedIndex] ?? guides[0];
  if (!guide) return null;

  return (
    <section aria-labelledby="stretch-steps-heading" className={compact ? "min-w-0" : "mb-8 min-w-0"}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-primary"><Activity className="size-4" /> Movement guide</p>
          <h3 id="stretch-steps-heading" className={compact ? "mt-1 text-xl font-black" : "mt-2 text-2xl font-black"}>Stretch, step by step</h3>
        </div>
        {showSelector && <div role="group" aria-label="Choose a movement guide" className="flex flex-wrap gap-2">
          {guides.map((item, index) => (
            <Button key={item.name} variant={selectedIndex === index ? "wellness" : "outline"} size="sm" aria-pressed={selectedIndex === index} onClick={() => setSelectedIndex(index)}>{item.name}</Button>
          ))}
        </div>}
      </div>
      <ol aria-label={`${guide.name} exercise steps`} className={compact ? "grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3" : "grid gap-4 md:grid-cols-3"}>
        {guide.steps.map((step, index) => (
          <li key={step.title} className={compact ? "min-w-0 bg-card" : "overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"}>
            <div className={compact ? "relative aspect-[2/1] overflow-hidden bg-muted sm:aspect-[4/3]" : "relative aspect-square overflow-hidden bg-muted"}>
              {step.illustration ? (
                <MovementIllustration area={step.illustration} step={index} alt={step.alt} />
              ) : step.image ? (
                <img src={step.image} alt={step.alt} width={512} height={512} loading="lazy" className="h-full w-full object-contain" />
              ) : null}
              <span className="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground" aria-label={`Step ${index + 1}`}>{index + 1}</span>
            </div>
            <div className={compact ? "space-y-1.5 p-3 sm:p-4" : "space-y-2 p-5"}>
              <p className="flex items-center gap-1.5 text-xs font-bold text-primary"><Clock3 className="size-3.5 shrink-0" />{step.time}</p>
              <h4 className={compact ? "text-sm font-extrabold sm:text-base" : "text-lg font-extrabold"}>{step.title}</h4>
              <p className={compact ? "text-xs leading-5 text-muted-foreground sm:text-sm" : "text-sm leading-6 text-muted-foreground"}>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className={compact ? "mt-2 text-xs leading-5 text-muted-foreground" : "mt-3 text-sm leading-6 text-muted-foreground"}>Move slowly and breathe normally. You should feel a gentle stretch, not pain. Stop if you feel pain, tingling or dizziness.</p>
    </section>
  );
}

function MovementIllustration({ area, step, alt }: { area: "hip" | "shoulder"; step: number; alt: string }) {
  const hip = area === "hip";
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label={alt} className="h-full w-full text-primary">
      <rect width="320" height="200" fill="#e9f7f1" />
      <path d="M28 174H292" stroke="#b9d9cd" strokeWidth="3" strokeLinecap="round" />
      {hip ? (
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9">
          <circle cx="160" cy="35" r="16" fill="#f4d3b4" stroke="#f4d3b4" />
          <path d="M160 53L157 112M157 70L132 93L119 120M160 72L183 91L198 89" />
          <path d={step === 2 ? "M157 112L207 129L240 160M157 112L112 139L91 160" : "M157 112L207 129L240 160M157 112L111 137L108 162"} />
          <path d="M91 160H117M226 160H250" />
          <path d={step === 0 ? "M151 126L119 126" : "M151 126L128 126"} stroke="#e99a21" strokeWidth="5" />
          {step === 1 ? <path d="M134 117L121 126L134 135" stroke="#e99a21" strokeWidth="5" /> : null}
          {step === 2 ? <path d="M258 140C270 128 269 112 257 103" stroke="#e99a21" strokeWidth="5" /> : null}
        </g>
      ) : (
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9">
          <circle cx="160" cy="34" r="16" fill="#f4d3b4" stroke="#f4d3b4" />
          <path d="M160 53V126M160 72L130 82M160 72L190 82M160 126L139 172M160 126L181 172" />
          {step === 1 ? (
            <>
              <path d="M130 82L216 96L197 107M190 82L203 96L216 96" />
              <path d="M231 85C237 97 232 108 222 112" stroke="#e99a21" strokeWidth="5" />
            </>
          ) : step === 2 ? (
            <>
              <path d="M130 82L126 45L146 22M190 82L218 91" />
              <path d="M112 53C105 40 109 28 120 22" stroke="#e99a21" strokeWidth="5" />
            </>
          ) : (
            <>
              <path d="M130 82L116 103L130 112M190 82L204 103L190 112" />
              <path d="M102 72C99 58 107 48 119 45M201 45C213 48 221 58 218 72" stroke="#e99a21" strokeWidth="5" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
