import type { ChatSource } from '@/types';

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function newId(): string {
  return uid();
}

const SUMMARIES = [
  'Here is a concise summary of the content:\n\nThe document presents a structured overview of the topic, organized into clear sections. It opens by establishing context and motivation, then walks through the core concepts with supporting examples. The middle portion addresses practical considerations and edge cases, while the conclusion revisits the main thesis and proposes next steps.\n\nOverall, the material is designed to be both introductory and actionable, giving the reader a working understanding they can apply immediately.',
];

const KEY_POINTS = [
  'Here are the key points extracted from the content:\n\n1. **Core thesis** — the central argument ties the topic to a concrete outcome the reader can achieve.\n2. **Structured approach** — the material is organized into logical sections that build on each other.\n3. **Practical examples** — each concept is illustrated with a real-world scenario.\n4. **Edge cases addressed** — the document acknowledges limitations and offers guidance for uncommon situations.\n5. **Actionable conclusion** — it ends with clear next steps rather than open-ended theory.',
];

const EXPLAIN_SIMPLE = [
  "Here's the simple version:\n\nThink of the content as a recipe. It starts by telling you what you're making and why it matters. Then it lists the ingredients — the key ideas you need to understand. After that, it walks you through the steps, showing how those ideas fit together. By the end, you have a finished dish: a working understanding you can actually use.\n\nThe main thing to remember is that every section builds on the one before it, so it's best to read in order the first time.",
];

const NOTES = [
  'Notes from the content:\n\n• **Introduction** — sets the context and explains why the topic matters.\n• **Key concept 1** — foundational idea that everything else relies on.\n• **Key concept 2** — builds on concept 1 with a practical example.\n• **Application** — how to use these ideas in real situations.\n• **Limitations** — edge cases and things to watch out for.\n• **Conclusion** — summary of takeaways and recommended next steps.',
];

const QUESTIONS = [
  'Questions you might explore from this content:\n\n1. How does the main concept apply to your specific situation?\n2. What would change if one of the assumptions were removed?\n3. Which example is most relevant to your current goal?\n4. Are there any edge cases the document did not cover?\n5. What is the single most important takeaway to remember?',
];

const GENERIC = [
  "Based on the content you provided, here's what I found:\n\nThe material addresses your question directly in a few places. The most relevant section explains the core idea and then reinforces it with an example. The key takeaway is that the concept is meant to be applied rather than just understood — the document repeatedly connects theory to practice.\n\nIf you'd like, I can go deeper on any specific part, pull out the exact relevant passage, or reframe this for a different audience.",
  "Here's what the content says about that:\n\nIt treats this as one of the central themes. The document first defines the concept, then walks through how it works in practice, and finally notes the common pitfalls to avoid. The reasoning is built step by step, so each point depends on the one before it.\n\nI can summarize just this section, compare it to another part of the document, or generate follow-up questions if that would help.",
  "I searched through the content for your question. Here's the relevant answer:\n\nThe document frames this topic as essential. It gives a definition, follows with a worked example, and closes with guidance on when to apply it. Notably, it warns against a common mistake that the example is designed to help you avoid.\n\nWant me to expand on the example, or connect this to a later section in the document?",
];

function pickResponse(question: string): string {
  const q = question.toLowerCase().trim();
  if (q.startsWith('summarize')) return SUMMARIES[0];
  if (q.includes('key point')) return KEY_POINTS[0];
  if (q.includes('explain') && q.includes('simple')) return EXPLAIN_SIMPLE[0];
  if (q.startsWith('create notes') || q.includes('notes')) return NOTES[0];
  if (q.includes('ask questions') || q.includes('questions from')) return QUESTIONS[0];
  return GENERIC[Math.floor(Math.random() * GENERIC.length)];
}

/**
 * Simulate streaming a response. Calls onChunk with progressively longer
 * slices of the full answer, then onComplete with the full text.
 */
export function streamResponse(
  question: string,
  onChunk: (partial: string) => void,
  onComplete: (full: string) => void,
): () => void {
  const full = pickResponse(question);
  const tokens = full.match(/\S+\s*/g) ?? [full];
  let i = 0;
  let acc = '';
  let cancelled = false;

  const tick = () => {
    if (cancelled) return;
    if (i >= tokens.length) {
      onComplete(full);
      return;
    }
    acc += tokens[i];
    i += 1;
    onChunk(acc);
    const delay = 18 + Math.random() * 45;
    setTimeout(tick, delay);
  };

  // small initial delay to simulate "thinking"
  const startTimer = setTimeout(tick, 350);

  return () => {
    cancelled = true;
    clearTimeout(startTimer);
  };
}

export function titleFromSource(source: ChatSource): string {
  if (source.type === 'youtube') return source.name;
  const base = source.name.replace(/\.[^.]+$/, '');
  return base.length > 42 ? base.slice(0, 42) + '…' : base;
}
