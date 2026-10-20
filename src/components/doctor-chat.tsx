import { useEffect, useRef, useState } from "react";
import { CalendarCheck, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ChatDoctor = { name: string; specialty: string; photo: string };

type ChatMessage = { id: string; from: "user" | "doctor"; text: string; at: number };

const QUICK_TOPICS = [
  "Neck pain after long meetings",
  "Lower back stiffness",
  "Wrist pain from typing",
  "Shoulder tension",
];

type Topic = "urgent" | "numb" | "neck" | "back" | "wrist" | "default";

// Checked in order, so urgent/numbness wins over body-area topics.
const TOPIC_PATTERNS: [Topic, RegExp][] = [
  ["urgent", /chest pain|short of breath|can'?t breathe|faint|แน่นหน้าอก|หายใจไม่ออก|หมดสติ/i],
  ["numb", /numb|tingl|ชา|เหน็บ/i],
  ["neck", /neck|shoulder|คอ|บ่า|ไหล่/i],
  ["back", /back|spine|lumbar|หลัง|เอว/i],
  ["wrist", /wrist|hand|finger|typing|ข้อมือ|มือ|นิ้ว/i],
];

const REPLIES: Record<"en" | "th", Record<Topic, string>> = {
  en: {
    urgent: "Those symptoms can be serious. Please contact your local emergency services or go to the nearest hospital right away.",
    numb: "Numbness or tingling is worth a proper check. I'd recommend booking an appointment at Uni Hospital so we can assess it properly.",
    neck: "Thanks for sharing. Neck and shoulder tension is common after long screen time. Try raising your screen to eye level and doing slow side neck stretches every 30–45 minutes. Does the pain spread to your arm?",
    back: "Long sitting blocks can tighten the lower back. Keep your feet flat, support your lower back, and stand up to walk or stretch every 45 minutes. Is it worse in the morning or after sitting?",
    wrist: "Typing-heavy work can strain the wrists. Keep your wrists in a neutral position, take short breaks, and try gentle forearm stretches. Do you feel tingling in your fingers?",
    default: "Thanks for your message. Can you tell me where it hurts, how long it has lasted, and what makes it better or worse?",
  },
  th: {
    urgent: "อาการเหล่านี้อาจร้ายแรง กรุณาติดต่อหน่วยฉุกเฉินหรือไปโรงพยาบาลที่ใกล้ที่สุดทันที",
    numb: "อาการชาหรือเหน็บควรได้รับการตรวจอย่างเหมาะสม แนะนำให้จองนัดที่ Uni Hospital เพื่อประเมินอาการอย่างละเอียด",
    neck: "ขอบคุณที่แจ้ง อาการตึงคอและบ่าพบบ่อยในคนที่จ้องจอนาน ลองปรับจอให้อยู่ระดับสายตา และยืดคอช้า ๆ ทุก 30–45 นาที มีอาการปวดร้าวลงแขนไหม",
    back: "การนั่งนานทำให้หลังส่วนล่างตึงได้ ลองวางเท้าราบกับพื้น หนุนหลังส่วนล่าง และลุกเดินหรือยืดเหยียดทุก 45 นาที อาการแย่ลงตอนเช้าหรือหลังนั่งนานไหม",
    wrist: "งานพิมพ์เยอะอาจทำให้ข้อมือล้าได้ ลองวางข้อมือให้อยู่ในแนวตรง พักสั้น ๆ และยืดกล้ามเนื้อปลายแขน มีอาการเหน็บที่ปลายนิ้วไหม",
    default: "ขอบคุณที่ส่งข้อความมา ช่วยบอกหน่อยว่าปวดตรงไหน เป็นมานานเท่าไร และอะไรทำให้ดีขึ้นหรือแย่ลง",
  },
};

function craftReply(text: string): string {
  const lang = /[\u0E00-\u0E7F]/.test(text) ? "th" : "en";
  const topic = TOPIC_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? "default";
  return REPLIES[lang][topic];
}

function newMessage(from: ChatMessage["from"], text: string): ChatMessage {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, from, text, at: Date.now() };
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as Partial<Record<keyof ChatMessage, unknown>>;
  return typeof m.id === "string" && (m.from === "user" || m.from === "doctor") && typeof m.text === "string" && typeof m.at === "number";
}

function readStored(key: string): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isChatMessage) : [];
  } catch {
    return [];
  }
}

function writeStored(key: string, messages: ChatMessage[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(messages.slice(-100)));
  } catch { /* storage unavailable */ }
}

/**
 * Prototype chat consult. History is kept in localStorage per user + doctor and the
 * doctor's replies are automated (keyword based). Swap `send()` for a Supabase insert
 * + realtime subscription when a real backend is ready.
 */
export function DoctorChat({
  doctor,
  userId,
  onRequireSignIn,
  onBook,
}: {
  doctor: ChatDoctor;
  userId: string | undefined;
  onRequireSignIn: () => void;
  onBook: () => void;
}) {
  const storageKey = userId ? `unistretch:chat:v1:${userId}:${doctor.name}` : null;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [typingKey, setTypingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef(new Map<string, { text: string; timer: number }>());
  const activeKeyRef = useRef(storageKey);
  activeKeyRef.current = storageKey;

  const isTyping = typingKey !== null && typingKey === storageKey;

  // Load history whenever the signed-in user or selected doctor changes.
  useEffect(() => {
    setDraft("");
    if (!storageKey) {
      setMessages([]);
      setLoadedKey(null);
      return;
    }
    setMessages(readStored(storageKey));
    setLoadedKey(storageKey);
  }, [storageKey]);

  // Save only after the matching history has been loaded, so we never overwrite it with stale state.
  useEffect(() => {
    if (!storageKey || loadedKey !== storageKey) return;
    writeStored(storageKey, messages);
  }, [messages, storageKey, loadedKey]);

  // Scroll the chat list itself (not the page) to the newest message.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, isTyping]);

  useEffect(() => {
    const pending = pendingRef.current;
    return () =>
      pending.forEach((entry, key) => {
        window.clearTimeout(entry.timer);
        writeStored(key, [...readStored(key), newMessage("doctor", craftReply(entry.text))]);
      });
  }, []);

  function send(text: string) {
    const clean = text.trim().slice(0, 500);
    if (!clean) return;
    if (!storageKey) {
      onRequireSignIn();
      return;
    }
    const key = storageKey;
    setMessages((prev) => [...prev, newMessage("user", clean)]);
    setDraft("");

    const existing = pendingRef.current.get(key);
    if (existing) {
      // Doctor is already "typing": answer the latest message instead of stacking replies.
      existing.text = clean;
      return;
    }
    const entry = { text: clean, timer: 0 };
    entry.timer = window.setTimeout(() => {
      pendingRef.current.delete(key);
      const reply = newMessage("doctor", craftReply(entry.text));
      if (activeKeyRef.current === key) {
        setMessages((prev) => [...prev, reply]);
      } else {
        // User switched doctor meanwhile: still deliver the reply to the right conversation.
        writeStored(key, [...readStored(key), reply]);
      }
      setTypingKey((current) => (current === key ? null : current));
    }, 1200 + Math.random() * 800);
    pendingRef.current.set(key, entry);
    setTypingKey(key);
  }

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-3xl border border-border bg-surface-soft">
      <div className="flex items-center gap-3 border-b border-border bg-card p-3 sm:p-4">
        <img src={doctor.photo} alt="" width={44} height={44} className="size-11 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-black">{doctor.name}</p>
          <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-success">
            <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
            Online now · {doctor.specialty}
          </p>
        </div>
        <Button type="button" variant="soft" size="sm" onClick={onBook} className="shrink-0">
          <CalendarCheck className="size-4" />
          <span className="hidden sm:inline">Book appointment</span>
          <span className="sm:hidden">Book</span>
        </Button>
      </div>

      <div ref={listRef} role="log" aria-live="polite" aria-label={`Chat with ${doctor.name}`} className="flex-1 space-y-3 overflow-y-auto p-4">
        <p className="rounded-2xl bg-warning/15 p-3 text-xs leading-5 text-foreground">
          Prototype chat: replies are automated demos, not medical advice. In an emergency, contact your local emergency services.
        </p>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="size-6" />
            </div>
            <p className="font-bold">{userId ? `Say hello to ${doctor.name}` : "Login to start a chat"}</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {userId ? "Describe how you feel or pick a topic below." : "Sign in to chat with an online doctor and keep your conversation."}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={cn("flex", message.from === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6",
                  message.from === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border bg-card text-card-foreground",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                <p className={cn("mt-1 text-[10px] opacity-70", message.from === "user" && "text-right")}>
                  {new Date(message.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}

        {isTyping ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
              {doctor.name} is typing…
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-border bg-card px-3 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => send(topic)}
            className="shrink-0 rounded-full border border-border bg-surface-soft px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {topic}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2 bg-card p-3"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <Input
          value={draft}
          maxLength={500}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Describe how you feel…"
          aria-label="Message"
          className="rounded-2xl"
        />
        <Button type="submit" variant="hero" size="icon" aria-label="Send message" disabled={!draft.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
