import { useState, useRef, useEffect } from "react";
import {
  BookOpen, Search, Plus, Trash2, Edit3, MessageCircle,
  ExternalLink, Check, Clock, Star, BarChart3, Headphones,
  Video, FileText, Users, ChevronRight, Send, Sparkles, X,
  Home, Bookmark, Globe, Award, TrendingUp, Settings,
  PlayCircle, Hash, Target, Lightbulb, ArrowRight, Zap,
  Compass, ThumbsUp, ThumbsDown, Map, ChevronDown, ChevronUp,
  Mountain, Flag, Footprints, Shield, LogOut, Info
} from "lucide-react";

import PixelLogo from "./components/PixelLogo";

// ─── RANK SYSTEM ───
const RANKS = [
  { min: 0, title: "Hiker", gear: "walking-stick", color: "#78716c", tierColor: "bg-stone-100 text-stone-600", desc: "Every journey starts with a first step" },
  { min: 100, title: "Trail Runner", gear: "compass", color: "#0d9488", tierColor: "bg-teal-100 text-teal-700", desc: "You've found your path" },
  { min: 300, title: "Mountaineer", gear: "rope", color: "#15803d", tierColor: "bg-emerald-100 text-emerald-700", desc: "Tackling real challenges" },
  { min: 600, title: "Alpine Guide", gear: "ice-axe", color: "#7c3aed", tierColor: "bg-violet-100 text-violet-700", desc: "Leading your own way" },
  { min: 1000, title: "Summiteer", gear: "full-kit", color: "#c2410c", tierColor: "bg-orange-100 text-orange-700", desc: "Conquering the hardest peaks" },
  { min: 2000, title: "Cartographer", gear: "telescope", color: "#be185d", tierColor: "bg-pink-100 text-pink-700", desc: "Charting new territory for others" },
];
const getRank = (score) => [...RANKS].reverse().find(r => score >= r.min) || RANKS[0];
const getNextRank = (score) => RANKS.find(r => r.min > score) || null;

// ─── MOUNTAINEER CHARACTER SVG ───
const MountaineerSVG = ({ rank, size = 80 }) => {
  const r = rank || RANKS[0];
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} xmlns="http://www.w3.org/2000/svg">
      {/* Mountain backdrop */}
      <polygon points="10,100 50,25 90,100" fill="#e7e5e4" stroke="#d6d3d1" strokeWidth="1"/>
      <polygon points="30,100 55,45 80,100" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="0.5"/>
      {/* Snow cap */}
      <polygon points="42,40 50,25 58,40" fill="white" stroke="#d6d3d1" strokeWidth="0.5"/>
      {/* Character body */}
      <circle cx="50" cy="58" r="7" fill={r.color}/>
      <rect x="46" y="65" width="8" height="14" rx="2" fill={r.color}/>
      {/* Legs */}
      <line x1="48" y1="79" x2="45" y2="90" stroke={r.color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="52" y1="79" x2="55" y2="90" stroke={r.color} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Arms */}
      <line x1="46" y1="68" x2="38" y2="74" stroke={r.color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="54" y1="68" x2="62" y2="74" stroke={r.color} strokeWidth="2" strokeLinecap="round"/>
      {/* Hat */}
      <ellipse cx="50" cy="53" rx="9" ry="2.5" fill={r.color}/>
      <rect x="45" y="48" width="10" height="5" rx="2" fill={r.color}/>
      {/* Gear based on rank */}
      {r.gear === "compass" && <circle cx="62" cy="74" r="3" fill="none" stroke="#2563eb" strokeWidth="1.5"/>}
      {r.gear === "rope" && <path d="M38,74 Q32,68 36,62" fill="none" stroke="#16a34a" strokeWidth="1.5"/>}
      {r.gear === "ice-axe" && <><line x1="62" y1="74" x2="68" y2="60" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round"/><line x1="65" y1="63" x2="70" y2="61" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round"/></>}
      {r.gear === "full-kit" && <><circle cx="62" cy="74" r="2.5" fill="none" stroke="#d97706" strokeWidth="1.2"/><line x1="38" y1="74" x2="32" y2="62" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/><rect x="45" y="66" width="10" height="6" rx="1" fill="none" stroke="#d97706" strokeWidth="0.8"/></>}
      {r.gear === "telescope" && <><line x1="62" y1="70" x2="72" y2="60" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/><circle cx="73" cy="59" r="2.5" fill="none" stroke="#dc2626" strokeWidth="1.2"/></>}
      {/* Flag at summit for high ranks */}
      {(r.gear === "full-kit" || r.gear === "telescope") && (
        <><line x1="50" y1="25" x2="50" y2="15" stroke="#d97706" strokeWidth="1"/><polygon points="50,15 60,18 50,21" fill="#d97706"/></>
      )}
    </svg>
  );
};

// ─── SUMMIT MAP SVG ───
const SummitMapSVG = ({ goals, arcs, arcActivePhase: aap, score }) => {
  const peaks = goals.map((g, i) => {
    const arc = arcs.find(a => a.goalId === g.id);
    const activeIdx = arc ? (aap[arc.id] || 0) : 0;
    const totalPhases = arc ? arc.phases.length : 1;
    const pct = arc ? Math.round((activeIdx / totalPhases) * 100) : 0;
    const x = 60 + i * 160;
    const height = 40 + (g.priority === "high" ? 0 : g.priority === "medium" ? 15 : 30);
    return { goal: g, arc, pct, x, peakY: height, baseY: 140, hasArc: !!arc, activeIdx, totalPhases };
  });
  const w = Math.max(400, peaks.length * 160 + 80);
  return (
    <svg viewBox={`0 0 ${w} 170`} width="100%" height="170" xmlns="http://www.w3.org/2000/svg" className="rounded-xl">
      {/* Sky gradient */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe"/>
          <stop offset="100%" stopColor="#fef3c7"/>
        </linearGradient>
      </defs>
      <rect width={w} height="170" fill="url(#sky)"/>
      {/* Ground */}
      <rect x="0" y="135" width={w} height="35" fill="#d6d3d1" rx="0"/>
      <rect x="0" y="135" width={w} height="5" fill="#a8a29e" rx="0"/>
      {/* Peaks */}
      {peaks.map((p, i) => {
        const flagPlanted = p.pct >= 100;
        return (
          <g key={p.goal.id}>
            {/* Mountain shape */}
            <polygon points={`${p.x - 50},${p.baseY} ${p.x},${p.peakY} ${p.x + 50},${p.baseY}`} fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1"/>
            <polygon points={`${p.x - 8},${p.peakY + 8} ${p.x},${p.peakY} ${p.x + 8},${p.peakY + 8}`} fill="white"/>
            {/* Trail/progress up the mountain */}
            {p.hasArc && (
              <line x1={p.x - 20} y1={p.baseY - 5} x2={p.x - 20 + (40 * p.pct / 100)} y2={p.baseY - 5 - ((p.baseY - p.peakY - 10) * p.pct / 100)} stroke="#d97706" strokeWidth="2" strokeDasharray={p.pct < 100 ? "3,3" : "none"} strokeLinecap="round"/>
            )}
            {/* Flag at top if completed */}
            {flagPlanted && (
              <g><line x1={p.x} y1={p.peakY} x2={p.x} y2={p.peakY - 15} stroke="#d97706" strokeWidth="1.5"/><polygon points={`${p.x},${p.peakY - 15} ${p.x + 12},${p.peakY - 12} ${p.x},${p.peakY - 9}`} fill="#d97706"/></g>
            )}
            {/* Camps */}
            {p.hasArc && p.arc.phases.map((phase, pi) => {
              const campPct = (pi + 1) / p.totalPhases;
              const cx = p.x - 20 + (40 * campPct);
              const cy = p.baseY - 5 - ((p.baseY - p.peakY - 10) * campPct);
              const isDone = pi < p.activeIdx;
              const isActive = pi === p.activeIdx;
              return (
                <g key={pi}>
                  <circle cx={cx} cy={cy} r={isActive ? 4 : 3} fill={isDone ? "#16a34a" : isActive ? "#d97706" : "#d6d3d1"} stroke="white" strokeWidth="1"/>
                </g>
              );
            })}
            {/* Label */}
            <text x={p.x} y={p.baseY + 15} textAnchor="middle" fontSize="9" fill="#57534E" fontFamily="Arial">{p.goal.title.length > 18 ? p.goal.title.slice(0, 16) + "..." : p.goal.title}</text>
            {p.hasArc && <text x={p.x} y={p.baseY + 25} textAnchor="middle" fontSize="7" fill="#a8a29e" fontFamily="Arial">{p.activeIdx}/{p.totalPhases} camps</text>}
          </g>
        );
      })}
      {/* Elevation marker */}
      <text x="15" y="20" fontSize="8" fill="#57534E" fontFamily="Arial" fontWeight="bold">ELEVATION</text>
      <text x="15" y="32" fontSize="14" fill="#d97706" fontFamily="Georgia" fontWeight="bold">{score}</text>
    </svg>
  );
};

const COURSES = [
  { id: 1, title: "Machine Learning Specialization", platform: "Coursera", progress: 65, status: "in-progress", notes: "Week 8 — Neural Networks", category: "AI/ML", url: "" },
  { id: 2, title: "Complete Web Dev Bootcamp", platform: "Udemy", progress: 30, status: "in-progress", notes: "Starting React section", category: "Web Dev", url: "" },
  { id: 3, title: "Spanish B1", platform: "Duolingo", progress: 45, status: "in-progress", notes: "245-day streak! Subjunctive tense", category: "Language", url: "" },
  { id: 4, title: "CS50x", platform: "edX", progress: 100, status: "completed", notes: "Completed — great foundation", category: "CS", url: "" },
  { id: 5, title: "Deep Learning Specialization", platform: "Coursera", progress: 12, status: "in-progress", notes: "Just started Course 1", category: "AI/ML", url: "" },
];

const BOOKS = [
  { id: 1, title: "Designing Machine Learning Systems", author: "Chip Huyen", genre: "AI/ML", progress: 60, status: "reading", rating: 4, notes: "Excellent practical guide", keyTakeaways: "Focus on data quality over model complexity" },
  { id: 2, title: "Atomic Habits", author: "James Clear", genre: "Self-improvement", progress: 100, status: "completed", rating: 5, notes: "Changed my daily routine", keyTakeaways: "1% better every day; habit stacking; environment design" },
  { id: 3, title: "Deep Learning", author: "Goodfellow, Bengio, Courville", genre: "AI/ML", progress: 0, status: "want-to-read", rating: 0, notes: "The Bible of DL", keyTakeaways: "" },
  { id: 4, title: "The Pragmatic Programmer", author: "Hunt & Thomas", genre: "Software Engineering", progress: 100, status: "completed", rating: 4, notes: "Classic SE wisdom", keyTakeaways: "DRY principle; tracer bullets; rubber duck debugging" },
];

const ARTICLES = [
  { id: 1, title: "Attention Is All You Need", source: "arXiv", tags: ["transformers", "AI"], read: false, notes: "", url: "" },
  { id: 2, title: "The Bitter Lesson", source: "Rich Sutton", tags: ["AI", "philosophy"], read: true, notes: "General methods + compute > hand-crafted features", url: "" },
  { id: 3, title: "Scaling Laws for Neural Language Models", source: "arXiv", tags: ["scaling", "LLMs"], read: false, notes: "", url: "" },
  { id: 4, title: "A Survey of Large Language Models", source: "arXiv", tags: ["LLMs", "survey"], read: false, notes: "", url: "" },
  { id: 5, title: "Why Greatness Cannot Be Planned", source: "Blog", tags: ["creativity"], read: false, notes: "Recommended by a friend", url: "" },
];

const RESEARCHERS = [
  { id: 1, name: "Andrej Karpathy", institution: "Independent / ex-Tesla, OpenAI", field: "Deep Learning", papers: ["Neural Network Training Recipes", "Visualizing CNNs"], notes: "YouTube lectures are gold", url: "" },
  { id: 2, name: "Yann LeCun", institution: "Meta AI / NYU", field: "Deep Learning, CNNs", papers: ["Gradient-Based Learning for Document Recognition"], notes: "Pioneer of convolutional networks", url: "" },
  { id: 3, name: "Fei-Fei Li", institution: "Stanford", field: "Computer Vision, AI for Health", papers: ["ImageNet"], notes: "Co-director of Stanford HAI", url: "" },
];

const RESOURCES = [
  { id: 1, title: "How Transformers Work — A Visual Guide", type: "twitter-thread", author: "@jayalammar", notes: "Best visual explanation of attention", url: "" },
  { id: 2, title: "Product Management Masterclass", type: "linkedin", author: "Lenny Rachitsky", notes: "Great frameworks for prioritization", url: "" },
  { id: 3, title: "Stanford CS229 Lecture Notes", type: "expert-doc", author: "Andrew Ng", notes: "Comprehensive ML math foundations", url: "" },
  { id: 4, title: "The AI Landscape in 2026", type: "twitter-thread", author: "@emollick", notes: "", url: "" },
  { id: 5, title: "Building LLM Applications", type: "expert-doc", author: "Chip Huyen", notes: "Practical architecture patterns", url: "" },
];

const MEDIA = [
  { id: 1, title: "Neural Networks: Zero to Hero", type: "video", platform: "YouTube", creator: "Andrej Karpathy", status: "in-progress", notes: "Up to episode 5", url: "" },
  { id: 2, title: "Lex Fridman #401 — John Carmack", type: "podcast", platform: "Spotify", creator: "Lex Fridman", status: "completed", notes: "Fascinating on programming & AI", url: "" },
  { id: 3, title: "Essence of Linear Algebra", type: "video", platform: "YouTube", creator: "3Blue1Brown", status: "want-to-watch", notes: "", url: "" },
  { id: 4, title: "ML Street Talk #95", type: "podcast", platform: "YouTube", creator: "MLST", status: "want-to-watch", notes: "Discussion on reasoning in LLMs", url: "" },
];

const DEF_SCORING = { courseComplete: 100, coursePerPct: 1, bookComplete: 50, bookPerPct: 0.5, articleRead: 15, mediaComplete: 10, resourceSaved: 5 };

const pColor = (p) => ({ Coursera: "bg-teal-100 text-teal-700", Udemy: "bg-violet-100 text-violet-700", Duolingo: "bg-emerald-100 text-emerald-700", edX: "bg-orange-100 text-orange-700", YouTube: "bg-rose-100 text-rose-700", Spotify: "bg-emerald-100 text-emerald-700" }[p] || "bg-stone-100 text-stone-600");
const rColor = (t) => ({ "twitter-thread": "bg-sky-100 text-sky-700", linkedin: "bg-teal-100 text-teal-700", "expert-doc": "bg-violet-100 text-violet-700" }[t] || "bg-stone-100 text-stone-600");
const rLabel = (t) => ({ "twitter-thread": "Twitter Thread", linkedin: "LinkedIn", "expert-doc": "Expert Doc" }[t] || t);

// ─── CURATED CONTENT DISCOVERY DATABASE ───
// Real, high-quality educational resources organized by topic.
// The discovery engine matches these against the user's profile and goals.
const DISCOVERY_DB = [
  // AI / Machine Learning
  { id: "d1", title: "Stanford CS231n: CNNs for Visual Recognition", url: "https://youtube.com/playlist?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv", type: "video", platform: "YouTube", author: "Fei-Fei Li & Andrej Karpathy", topics: ["ai", "machine learning", "computer vision", "deep learning", "cnn", "neural"], difficulty: "intermediate", reason: "Gold-standard university course, taught by pioneers in the field" },
  { id: "d2", title: "Fast.ai — Practical Deep Learning for Coders", url: "https://course.fast.ai", type: "course", platform: "fast.ai", author: "Jeremy Howard", topics: ["ai", "deep learning", "machine learning", "practical", "neural", "python"], difficulty: "beginner", reason: "Top-down teaching approach gets you building real models in week 1" },
  { id: "d3", title: "The Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/", type: "article", platform: "Blog", author: "Jay Alammar", topics: ["transformers", "ai", "attention", "llm", "deep learning", "neural"], difficulty: "intermediate", reason: "The single best visual explanation of how transformers work" },
  { id: "d4", title: "Andrej Karpathy: Let's Build GPT from Scratch", url: "https://www.youtube.com/watch?v=kCc8FmEb1nY", type: "video", platform: "YouTube", author: "Andrej Karpathy", topics: ["ai", "gpt", "llm", "transformers", "deep learning", "neural"], difficulty: "intermediate", reason: "Build a GPT from scratch in pure Python — best hands-on LLM tutorial" },
  { id: "d5", title: "Practical MLOps", url: "https://www.oreilly.com/library/view/practical-mlops/9781098103002/", type: "book", platform: "O'Reilly", author: "Noah Gift & Alfredo Deza", topics: ["ai", "machine learning", "mlops", "deployment", "production"], difficulty: "intermediate", reason: "Bridge the gap between training models and running them in production" },
  { id: "d6", title: "Mathematics for Machine Learning", url: "https://mml-book.github.io/", type: "book", platform: "Open Access", author: "Deisenroth, Faisal & Ong", topics: ["ai", "machine learning", "math", "linear algebra", "statistics", "calculus"], difficulty: "beginner", reason: "Free textbook covering the exact math foundations ML requires" },
  { id: "d7", title: "Full Stack Deep Learning", url: "https://fullstackdeeplearning.com/", type: "course", platform: "FSDL", author: "Pieter Abbeel et al.", topics: ["ai", "deep learning", "machine learning", "production", "mlops", "deployment"], difficulty: "advanced", reason: "Teaches the entire lifecycle of shipping ML products, not just model training" },
  { id: "d8", title: "The Batch — Andrew Ng's Weekly Newsletter", url: "https://www.deeplearning.ai/the-batch/", type: "article", platform: "DeepLearning.AI", author: "Andrew Ng", topics: ["ai", "machine learning", "deep learning", "news", "trends"], difficulty: "beginner", reason: "Weekly AI news curated by Andrew Ng, approachable for all levels" },
  { id: "d9", title: "Yannic Kilcher: ML Paper Explanations", url: "https://www.youtube.com/@YannicKilcher", type: "video", platform: "YouTube", author: "Yannic Kilcher", topics: ["ai", "machine learning", "papers", "research", "deep learning"], difficulty: "advanced", reason: "Deep dives into the latest ML papers with clear explanations" },
  { id: "d10", title: "Chip Huyen: Designing ML Systems (Blog Posts)", url: "https://huyenchip.com/blog/", type: "article", platform: "Blog", author: "Chip Huyen", topics: ["ai", "machine learning", "systems", "production", "mlops"], difficulty: "intermediate", reason: "Practical insights from someone who's built ML systems at scale" },

  // LLMs specifically
  { id: "d11", title: "State of GPT — Andrej Karpathy (Microsoft Build)", url: "https://www.youtube.com/watch?v=bZQun8Y4L2A", type: "video", platform: "YouTube", author: "Andrej Karpathy", topics: ["llm", "gpt", "ai", "transformers", "training"], difficulty: "intermediate", reason: "Comprehensive overview of how LLMs are trained, from pretraining to RLHF" },
  { id: "d12", title: "LLM University by Cohere", url: "https://docs.cohere.com/docs/llmu", type: "course", platform: "Cohere", author: "Cohere Team", topics: ["llm", "ai", "nlp", "embeddings", "rag"], difficulty: "beginner", reason: "Structured curriculum for understanding and building with LLMs" },
  { id: "d13", title: "Prompt Engineering Guide", url: "https://www.promptingguide.ai/", type: "article", platform: "Open Source", author: "DAIR.AI", topics: ["llm", "ai", "prompting", "gpt", "practical"], difficulty: "beginner", reason: "Comprehensive reference for getting the most out of language models" },

  // Web Development
  { id: "d14", title: "The Odin Project", url: "https://www.theodinproject.com/", type: "course", platform: "Open Source", author: "Community", topics: ["web", "javascript", "html", "css", "react", "fullstack", "full-stack"], difficulty: "beginner", reason: "Free, project-based full-stack curriculum trusted by thousands of self-taught devs" },
  { id: "d15", title: "Epic React by Kent C. Dodds", url: "https://epicreact.dev/", type: "course", platform: "epicreact.dev", author: "Kent C. Dodds", topics: ["react", "javascript", "web", "frontend", "hooks", "patterns"], difficulty: "intermediate", reason: "The most thorough React course available, built around hands-on exercises" },
  { id: "d16", title: "Josh Comeau: CSS for JavaScript Developers", url: "https://css-for-js.dev/", type: "course", platform: "css-for-js.dev", author: "Josh W. Comeau", topics: ["css", "web", "frontend", "design", "javascript"], difficulty: "intermediate", reason: "Finally understand CSS properly, with interactive lessons and real-world patterns" },
  { id: "d17", title: "Fireship: 100 Seconds of Code (Playlist)", url: "https://www.youtube.com/@Fireship", type: "video", platform: "YouTube", author: "Fireship", topics: ["web", "javascript", "react", "programming", "tools", "fullstack"], difficulty: "beginner", reason: "Fast, entertaining explainers on every web technology imaginable" },
  { id: "d18", title: "Dan Abramov: Overreacted Blog", url: "https://overreacted.io/", type: "article", platform: "Blog", author: "Dan Abramov", topics: ["react", "javascript", "web", "mental models", "programming"], difficulty: "intermediate", reason: "Deep thinking about React patterns from one of its core contributors" },
  { id: "d19", title: "web.dev by Google", url: "https://web.dev/learn", type: "article", platform: "web.dev", author: "Google Chrome Team", topics: ["web", "performance", "html", "css", "javascript", "accessibility"], difficulty: "intermediate", reason: "Official web platform learning resources with interactive courses" },

  // Spanish / Language Learning
  { id: "d20", title: "Dreaming Spanish", url: "https://www.dreamingspanish.com/", type: "video", platform: "YouTube", author: "Pablo", topics: ["spanish", "language", "comprehensible input", "listening"], difficulty: "beginner", reason: "Comprehensible input method — just watch and your brain acquires the language" },
  { id: "d21", title: "Language Transfer: Complete Spanish", url: "https://www.languagetransfer.org/complete-spanish", type: "podcast", platform: "Language Transfer", author: "Mihalis Eleftheriou", topics: ["spanish", "language", "grammar", "speaking"], difficulty: "beginner", reason: "Free audio course that teaches grammar through thinking, not memorization" },
  { id: "d22", title: "SpanishPod101", url: "https://www.spanishpod101.com/", type: "podcast", platform: "SpanishPod101", author: "Innovative Language", topics: ["spanish", "language", "listening", "vocabulary", "grammar"], difficulty: "beginner", reason: "Huge library of graded audio lessons from absolute beginner to advanced" },
  { id: "d23", title: "Easy Spanish (Street Interviews)", url: "https://www.youtube.com/@EasySpanish", type: "video", platform: "YouTube", author: "Easy Languages", topics: ["spanish", "language", "listening", "culture", "real conversation"], difficulty: "intermediate", reason: "Real street conversations with subtitles in Spanish and English" },
  { id: "d24", title: "Kwiziq Spanish Grammar", url: "https://spanish.kwiziq.com/", type: "article", platform: "Kwiziq", author: "Kwiziq Team", topics: ["spanish", "language", "grammar", "b1", "b2", "subjunctive"], difficulty: "intermediate", reason: "Adaptive grammar drills that identify and fill your specific gaps" },

  // Computer Science / Programming
  { id: "d25", title: "Neetcode.io — Coding Interview Patterns", url: "https://neetcode.io/", type: "course", platform: "Neetcode", author: "NeetCode", topics: ["programming", "algorithms", "data structures", "cs", "leetcode"], difficulty: "intermediate", reason: "Structured roadmap through the most important algorithm patterns" },
  { id: "d26", title: "MIT 6.006 Introduction to Algorithms", url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/", type: "course", platform: "MIT OCW", author: "Erik Demaine", topics: ["algorithms", "cs", "data structures", "programming", "math"], difficulty: "intermediate", reason: "Free MIT course with lectures, problem sets, and exams" },
  { id: "d27", title: "Crafting Interpreters", url: "https://craftinginterpreters.com/", type: "book", platform: "Open Access", author: "Robert Nystrom", topics: ["programming", "cs", "compilers", "interpreters", "languages"], difficulty: "advanced", reason: "Build a complete programming language from scratch — beautifully written and illustrated" },
  { id: "d28", title: "The Missing Semester (MIT)", url: "https://missing.csail.mit.edu/", type: "course", platform: "MIT", author: "MIT CSAIL", topics: ["programming", "cs", "tools", "terminal", "git", "shell"], difficulty: "beginner", reason: "Everything CS programs don't teach: shell, git, debugging, profiling" },

  // Data Science / Statistics
  { id: "d29", title: "StatQuest with Josh Starmer", url: "https://www.youtube.com/@statquest", type: "video", platform: "YouTube", author: "Josh Starmer", topics: ["statistics", "machine learning", "data science", "math", "probability"], difficulty: "beginner", reason: "Makes statistics genuinely fun — BAM! Best visual stats explanations on YouTube" },
  { id: "d30", title: "Seeing Theory: A Visual Introduction to Probability", url: "https://seeing-theory.brown.edu/", type: "article", platform: "Brown University", author: "Daniel Kunin", topics: ["statistics", "probability", "math", "data science", "visualization"], difficulty: "beginner", reason: "Interactive visualizations that build intuition for probability and statistics" },

  // Productivity / Learning How to Learn
  { id: "d31", title: "Learning How to Learn", url: "https://www.coursera.org/learn/learning-how-to-learn", type: "course", platform: "Coursera", author: "Barbara Oakley", topics: ["learning", "productivity", "memory", "study", "habits"], difficulty: "beginner", reason: "The most enrolled online course ever — teaches the science of effective learning" },
  { id: "d32", title: "Building a Second Brain", url: "https://www.buildingasecondbrain.com/", type: "book", platform: "Book", author: "Tiago Forte", topics: ["productivity", "note-taking", "knowledge management", "learning", "organization"], difficulty: "beginner", reason: "Framework for organizing digital information into a personal knowledge system" },
  { id: "d33", title: "Ali Abdaal: Evidence-Based Study Tips", url: "https://www.youtube.com/@aliabdaal", type: "video", platform: "YouTube", author: "Ali Abdaal", topics: ["productivity", "study", "learning", "habits", "self-improvement"], difficulty: "beginner", reason: "Practical, evidence-based advice on studying and productivity" },
  { id: "d34", title: "Huberman Lab: Focus & Concentration", url: "https://www.youtube.com/watch?v=LG53Vxum0as", type: "podcast", platform: "YouTube", author: "Andrew Huberman", topics: ["productivity", "focus", "neuroscience", "habits", "learning", "science"], difficulty: "beginner", reason: "Neuroscience-backed protocols for improving focus and learning ability" },

  // Research / Academic
  { id: "d35", title: "Distill.pub — Interactive ML Research", url: "https://distill.pub/", type: "article", platform: "Distill", author: "Various Researchers", topics: ["ai", "machine learning", "research", "visualization", "deep learning"], difficulty: "advanced", reason: "ML research articles with beautiful interactive visualizations — the gold standard" },
  { id: "d36", title: "Papers We Love", url: "https://paperswelove.org/", type: "article", platform: "Community", author: "Papers We Love", topics: ["cs", "research", "papers", "algorithms", "systems"], difficulty: "advanced", reason: "Curated collection of CS papers with community discussions and meetups" },
  { id: "d37", title: "Two Minute Papers", url: "https://www.youtube.com/@TwoMinutePapers", type: "video", platform: "YouTube", author: "Karoly Zsolnai-Feher", topics: ["ai", "research", "papers", "computer vision", "deep learning"], difficulty: "beginner", reason: "Entertaining 2-minute summaries of cutting-edge AI research papers" },

  // Design / UX
  { id: "d38", title: "Refactoring UI", url: "https://www.refactoringui.com/", type: "book", platform: "Book", author: "Steve Schoger & Adam Wathan", topics: ["design", "ui", "ux", "css", "web", "frontend"], difficulty: "beginner", reason: "Practical UI design tips for developers who aren't designers" },
  { id: "d39", title: "Laws of UX", url: "https://lawsofux.com/", type: "article", platform: "Web", author: "Jon Yablonski", topics: ["design", "ux", "psychology", "ui", "web"], difficulty: "beginner", reason: "Beautifully illustrated collection of UX principles backed by psychology research" },

  // Podcasts (general tech/learning)
  { id: "d40", title: "Lex Fridman Podcast", url: "https://lexfridman.com/podcast/", type: "podcast", platform: "Multiple", author: "Lex Fridman", topics: ["ai", "science", "programming", "philosophy", "research", "deep learning"], difficulty: "beginner", reason: "Long-form conversations with the most brilliant minds in AI and beyond" },
  { id: "d41", title: "Syntax.fm — Web Development", url: "https://syntax.fm/", type: "podcast", platform: "Syntax", author: "Wes Bos & Scott Tolinski", topics: ["web", "javascript", "react", "css", "frontend", "fullstack"], difficulty: "beginner", reason: "Entertaining, practical web dev podcast covering tools, tips, and techniques" },
  { id: "d42", title: "Gradient Dissent — W&B ML Podcast", url: "https://wandb.ai/fully-connected/gradient-dissent", type: "podcast", platform: "Weights & Biases", author: "Lukas Biewald", topics: ["ai", "machine learning", "mlops", "research", "production"], difficulty: "intermediate", reason: "ML practitioners discussing real-world challenges of building with AI" },
];

// ─── LEARN ARC TEMPLATES ───
// AI-generated arc phases based on common learning goals
const ARC_TEMPLATES = {
  "ml": { title: "Machine Learning Mastery", phases: [
    { name: "Foundations", desc: "Math prerequisites and core concepts", weeks: 4, topics: ["math", "statistics", "linear algebra", "probability"] },
    { name: "Core Algorithms", desc: "Classical ML algorithms and when to use them", weeks: 6, topics: ["machine learning", "algorithms", "supervised", "unsupervised"] },
    { name: "Deep Learning", desc: "Neural networks, CNNs, RNNs, and training", weeks: 6, topics: ["deep learning", "neural", "cnn", "training"] },
    { name: "Modern AI", desc: "Transformers, LLMs, and generative models", weeks: 4, topics: ["transformers", "llm", "gpt", "attention"] },
    { name: "Production", desc: "MLOps, deployment, and real-world systems", weeks: 4, topics: ["mlops", "production", "deployment", "systems"] },
  ]},
  "web": { title: "Full-Stack Web Development", phases: [
    { name: "HTML/CSS Foundations", desc: "Semantic markup, layout, responsive design", weeks: 3, topics: ["html", "css", "web", "design", "responsive"] },
    { name: "JavaScript Deep Dive", desc: "ES6+, async, DOM, and core patterns", weeks: 4, topics: ["javascript", "programming", "web", "async"] },
    { name: "React & Frontend", desc: "Components, hooks, state, and modern tooling", weeks: 5, topics: ["react", "frontend", "hooks", "javascript", "web"] },
    { name: "Backend & APIs", desc: "Node.js, databases, REST, and authentication", weeks: 4, topics: ["backend", "node", "api", "database", "fullstack"] },
    { name: "Deploy & Scale", desc: "CI/CD, hosting, performance, and monitoring", weeks: 3, topics: ["deployment", "performance", "devops", "web"] },
  ]},
  "spanish": { title: "Spanish Fluency Path", phases: [
    { name: "Core Grammar", desc: "Present tense, ser/estar, everyday vocab", weeks: 6, topics: ["spanish", "grammar", "vocabulary", "language"] },
    { name: "Past Tenses", desc: "Preterite, imperfect, and storytelling", weeks: 4, topics: ["spanish", "grammar", "past tense", "language"] },
    { name: "Subjunctive & Complex", desc: "Subjunctive mood, conditionals, advanced grammar", weeks: 6, topics: ["spanish", "subjunctive", "grammar", "b1", "language"] },
    { name: "Immersion Input", desc: "Podcasts, shows, books, and conversations", weeks: 8, topics: ["spanish", "listening", "comprehensible input", "culture", "language"] },
    { name: "Fluency Practice", desc: "Speaking practice, writing, and real conversations", weeks: 8, topics: ["spanish", "speaking", "writing", "fluency", "language"] },
  ]},
  "general": { title: "Custom Learning Path", phases: [
    { name: "Explore", desc: "Survey the field and identify key concepts", weeks: 4, topics: [] },
    { name: "Build Foundations", desc: "Core knowledge and fundamental skills", weeks: 6, topics: [] },
    { name: "Go Deeper", desc: "Advanced topics and hands-on practice", weeks: 6, topics: [] },
    { name: "Apply & Create", desc: "Projects, synthesis, and real-world application", weeks: 4, topics: [] },
  ]},
};

export default function LearningHub({ user, profile, initialData, onSave, onUpdateProfile, onSignOut }) {
  // ─── HYDRATE STATE FROM SUPABASE OR DEFAULTS ───
  const d = initialData || {};
  const [view, setView] = useState("home");
  const [courses, setCourses] = useState(d.courses || COURSES);
  const [books, setBooks] = useState(d.books || BOOKS);
  const [articles, setArticles] = useState(d.articles || ARTICLES);
  const [researchers, setResearchers] = useState(d.researchers || RESEARCHERS);
  const [resources, setResources] = useState(d.resources || RESOURCES);
  const [media, setMedia] = useState(d.media || MEDIA);
  const [scoring, setScoring] = useState(d.scoring || DEF_SCORING);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [chat, setChat] = useState(d.chat || []);
  const [chatIn, setChatIn] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [fcIdx, setFcIdx] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcMastery, setFcMastery] = useState(d.fcMastery || {});
  const [todayChecked, setTodayChecked] = useState(d.todayChecked || {});
  const [goals, setGoals] = useState(d.goals || [
    { id: 1, title: "Master ML fundamentals", priority: "high" },
    { id: 2, title: "Improve Spanish fluency", priority: "medium" },
    { id: 3, title: "Build full-stack web skills", priority: "medium" },
  ]);
  const [goalInput, setGoalInput] = useState("");
  const [goalPriority, setGoalPriority] = useState("medium");
  const [showGoalForm, setShowGoalForm] = useState(false);
  // Discovery & Learn Arc state
  const [discoveryVotes, setDiscoveryVotes] = useState(d.discoveryVotes || {}); // { [id]: 1 | -1 }
  const [discoveryAdded, setDiscoveryAdded] = useState(d.discoveryAdded || {}); // { [id]: true }
  const [arcs, setArcs] = useState(d.arcs || []);
  const [arcBuilderGoal, setArcBuilderGoal] = useState(null); // goal being built into an arc
  const [arcActivePhase, setArcActivePhase] = useState(d.arcActivePhase || {}); // { [arcId]: phaseIndex }
  const [onboarded, setOnboarded] = useState(profile?.onboarded || false);
  const [obStep, setObStep] = useState(0);
  const [obName, setObName] = useState(profile?.display_name || user?.user_metadata?.display_name || "");
  const [obBulk, setObBulk] = useState("");
  const [obManual, setObManual] = useState("");
  const chatEnd = useRef(null);
  const nid = useRef(100);

  const [syncStatus, setSyncStatus] = useState(null); // null | { platform, count, time }

  // ─── AUTO-SAVE TO SUPABASE (debounced, skips first render) ───
  const saveTimerRef = useRef(null);
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (firstRenderRef.current) { firstRenderRef.current = false; return; }
    if (!onSave) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSave({
        courses, books, articles, researchers, resources, media,
        scoring, goals, arcs, arcActivePhase,
        chat, todayChecked, fcMastery,
        discoveryVotes, discoveryAdded,
      });
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [courses, books, articles, researchers, resources, media, scoring, goals, arcs, arcActivePhase, chat, todayChecked, fcMastery, discoveryVotes, discoveryAdded]);

  // ─── COMPLETE ONBOARDING (update profile + save data) ───
  const completeOnboarding = () => {
    setOnboarded(true);
    if (onUpdateProfile) {
      onUpdateProfile({ display_name: obName, onboarded: true });
    }
    // Force an immediate save
    if (onSave) {
      onSave({
        courses, books, articles, researchers, resources, media,
        scoring, goals, arcs, arcActivePhase,
        chat, todayChecked, fcMastery,
        discoveryVotes, discoveryAdded,
      });
    }
  };

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  // Extension sync listener — receives platform data from the Learnspace Sync Chrome extension
  useEffect(() => {
    const handleSync = (e) => {
      const platformData = e.detail;
      if (!platformData) return;
      Object.entries(platformData).forEach(([platform, data]) => {
        const incoming = data.courses || [];
        if (incoming.length === 0) return;
        setCourses(existing => {
          const updated = [...existing];
          incoming.forEach(ic => {
            const title = ic.title || "";
            if (!title) return;
            const idx = updated.findIndex(c => c.title.toLowerCase() === title.toLowerCase() && c.platform === platform);
            if (idx >= 0) {
              // Update progress
              if (ic.progress != null) updated[idx] = { ...updated[idx], progress: ic.progress, status: ic.progress >= 100 ? "completed" : "in-progress" };
            } else {
              // Add new course
              updated.push({
                id: nid.current++,
                title,
                platform,
                progress: ic.progress || 0,
                status: ic.progress >= 100 ? "completed" : "in-progress",
                notes: ic.xp ? `${ic.xp.toLocaleString()} XP` : "",
                category: ic.category || (platform === "Duolingo" ? "Language" : ""),
                url: ic.url || "",
              });
            }
          });
          return updated;
        });
        setSyncStatus({ platform, count: incoming.length, time: new Date().toLocaleTimeString() });
      });
    };
    // Receive saved items from extension (articles, videos, threads, etc.)
    const handleSavedItems = (e) => {
      const items = e.detail;
      if (!items || !items.length) return;
      let artCount = 0, mediaCount = 0, resCount = 0;
      items.forEach(item => {
        const id = nid.current++;
        if (item.section === "article") {
          setArticles(prev => {
            if (prev.find(a => a.url === item.url)) return prev;
            artCount++;
            return [...prev, { id, title: item.title, source: item.subtype === "paper" ? "Paper" : "", tags: item.subtype ? [item.subtype] : [], read: false, notes: item.notes || "", url: item.url }];
          });
        } else if (item.section === "media") {
          setMedia(prev => {
            if (prev.find(m => m.title === item.title)) return prev;
            mediaCount++;
            return [...prev, { id, title: item.title, type: item.subtype || "video", platform: item.platform || "YouTube", creator: item.author || "", status: "want-to-watch", notes: item.notes || "", url: item.url }];
          });
        } else if (item.section === "resource") {
          setResources(prev => {
            if (prev.find(r => r.url === item.url)) return prev;
            resCount++;
            return [...prev, { id, title: item.title, type: item.subtype || "expert-doc", author: item.author || "", notes: item.notes || "", url: item.url }];
          });
        }
      });
      const total = artCount + mediaCount + resCount;
      if (total > 0) setSyncStatus({ platform: "Extension", count: total, time: new Date().toLocaleTimeString() });
    };

    window.addEventListener("learnspace-sync", handleSync);
    window.addEventListener("learnspace-saved-items", handleSavedItems);
    return () => {
      window.removeEventListener("learnspace-sync", handleSync);
      window.removeEventListener("learnspace-saved-items", handleSavedItems);
    };
  }, []);

  // Score
  const score = (() => {
    let s = { courses: 0, books: 0, articles: 0, media: 0, resources: 0, total: 0 };
    courses.forEach(c => { s.courses += c.status === "completed" ? scoring.courseComplete : Math.floor(c.progress * scoring.coursePerPct); });
    books.forEach(b => { s.books += b.status === "completed" ? scoring.bookComplete : Math.floor(b.progress * scoring.bookPerPct); });
    articles.forEach(a => { if (a.read) s.articles += scoring.articleRead; });
    media.forEach(m => { if (m.status === "completed") s.media += scoring.mediaComplete; });
    resources.forEach(() => { s.resources += scoring.resourceSaved; });
    s.total = s.courses + s.books + s.articles + s.media + s.resources;
    return s;
  })();

  // Flashcards from learnings
  const flashcards = (() => {
    const cards = [];
    books.filter(b => b.keyTakeaways).forEach(b => cards.push({ id: `bk-${b.id}`, front: `What are the key takeaways from "${b.title}"?`, back: b.keyTakeaways, src: b.title, cat: "book" }));
    articles.filter(a => a.read && a.notes).forEach(a => cards.push({ id: `ar-${a.id}`, front: `What did you learn from "${a.title}"?`, back: a.notes, src: a.title, cat: "article" }));
    courses.filter(c => c.notes).forEach(c => cards.push({ id: `co-${c.id}`, front: `What are you learning in "${c.title}"?`, back: c.notes, src: c.title, cat: "course" }));
    researchers.forEach(r => cards.push({ id: `re-${r.id}`, front: `What is ${r.name} known for?`, back: `${r.field} at ${r.institution}. ${r.notes || ""}`, src: r.name, cat: "researcher" }));
    resources.filter(r => r.notes).forEach(r => cards.push({ id: `rs-${r.id}`, front: `Key insight from "${r.title}"?`, back: r.notes, src: r.author, cat: "resource" }));
    return cards;
  })();

  // ── Smart keyword matching engine ──
  const goalKeywords = (goal) => {
    const t = goal.title.toLowerCase();
    const words = t.split(/\s+/).filter(w => w.length > 2 && !["the", "and", "for", "with", "from", "into", "about", "learn", "master", "improve", "build", "get", "become", "better"].includes(w));
    // Expand common abbreviations and synonyms
    const expansions = { ml: ["machine learning", "ml", "neural", "deep learning", "ai"], ai: ["artificial intelligence", "ai", "machine learning", "ml", "llm", "neural"], web: ["web", "react", "javascript", "frontend", "backend", "fullstack", "full-stack", "html", "css", "node"], spanish: ["spanish", "español", "duolingo", "language", "b1", "b2"], python: ["python", "programming", "code", "scripting"], math: ["math", "linear algebra", "calculus", "statistics", "probability"], dl: ["deep learning", "neural network", "cnn", "rnn", "transformer"] };
    const expanded = new Set(words);
    words.forEach(w => { if (expansions[w]) expansions[w].forEach(e => expanded.add(e)); });
    // Also add multi-word phrases from the title
    if (t.includes("machine learning")) expanded.add("machine learning");
    if (t.includes("deep learning")) expanded.add("deep learning");
    if (t.includes("full-stack") || t.includes("full stack") || t.includes("fullstack")) { expanded.add("web"); expanded.add("react"); expanded.add("javascript"); expanded.add("fullstack"); }
    if (t.includes("spanish") || t.includes("language")) { expanded.add("spanish"); expanded.add("duolingo"); expanded.add("language"); }
    if (t.includes("data science")) { expanded.add("data"); expanded.add("science"); expanded.add("statistics"); expanded.add("ml"); }
    return [...expanded];
  };

  const matchScore = (text, keywords) => {
    if (!text) return 0;
    const lo = text.toLowerCase();
    return keywords.reduce((sc, kw) => sc + (lo.includes(kw) ? (kw.length > 4 ? 3 : 1) : 0), 0);
  };

  const itemRelevance = (item, allGoals) => {
    let best = { score: 0, goal: null };
    allGoals.forEach(g => {
      const kws = goalKeywords(g);
      const fields = [item.title, item.notes, item.category, item.field, item.genre, item.creator, item.author, (item.tags || []).join(" "), item.platform, item.source].filter(Boolean).join(" ");
      const sc = matchScore(fields, kws) * (g.priority === "high" ? 2 : g.priority === "medium" ? 1.5 : 1);
      if (sc > best.score) best = { score: sc, goal: g };
    });
    return best;
  };

  // ── Goal-driven daily study plan ──
  const todayPlan = (() => {
    const plan = [];
    const used = new Set();

    // 1. Goal-matched course recommendations (prioritize by goal relevance × progress proximity)
    const ipCourses = courses.filter(c => c.status === "in-progress");
    const scoredCourses = ipCourses.map(c => {
      const rel = itemRelevance(c, goals);
      const proximityBoost = c.progress >= 70 ? 5 : c.progress >= 50 ? 3 : c.progress >= 25 ? 1 : 0;
      return { ...c, rel, totalScore: rel.score + proximityBoost };
    }).sort((a, b) => b.totalScore - a.totalScore);

    scoredCourses.slice(0, 2).forEach((c, i) => {
      const goalTag = c.rel.goal ? `Aligns with: ${c.rel.goal.title}` : "";
      const progressHint = c.progress >= 70 ? "Almost there — finish strong!" : c.progress >= 50 ? "Past the halfway mark!" : "Building momentum";
      plan.push({
        id: `c${i}`, type: "course", icon: BookOpen, title: c.title,
        time: i === 0 ? "30 min" : "20 min",
        reason: `${c.progress}% done — ${progressHint}${goalTag ? ` • ${goalTag}` : ""}`,
        color: "text-blue-500", goalMatch: c.rel.goal?.title || null
      });
      used.add(`course-${c.id}`);
    });

    // 2. Goal-matched book
    const readingBooks = books.filter(b => b.status === "reading");
    const wantBooks = books.filter(b => b.status === "want-to-read");
    const bookCandidates = [...readingBooks, ...wantBooks];
    const scoredBooks = bookCandidates.map(b => ({ ...b, rel: itemRelevance(b, goals) })).sort((a, b) => b.rel.score - a.rel.score);
    if (scoredBooks[0]) {
      const b = scoredBooks[0];
      const goalTag = b.rel.goal ? `Supports: ${b.rel.goal.title}` : "";
      const hint = b.status === "reading" ? `${b.progress}% through — keep the streak going` : "Start this one today";
      plan.push({ id: "b1", type: "book", icon: Bookmark, title: b.title, time: "20 min", reason: `${hint}${goalTag ? ` • ${goalTag}` : ""}`, color: "text-purple-500", goalMatch: b.rel.goal?.title || null });
      used.add(`book-${b.id}`);
    }

    // 3. Goal-matched articles (prioritize unread that match goals)
    const unread = articles.filter(a => !a.read);
    const scoredArticles = unread.map(a => ({ ...a, rel: itemRelevance(a, goals) })).sort((a, b) => b.rel.score - a.rel.score);
    if (scoredArticles[0]) {
      const a = scoredArticles[0];
      const goalTag = a.rel.goal ? `Related to: ${a.rel.goal.title}` : "";
      plan.push({ id: "a1", type: "article", icon: FileText, title: a.title, time: "15 min", reason: `${unread.length} in your queue${goalTag ? ` • ${goalTag}` : ""}`, color: "text-orange-500", goalMatch: a.rel.goal?.title || null });
      used.add(`article-${a.id}`);
    }
    // If there's a second high-relevance article, suggest it too
    if (scoredArticles[1] && scoredArticles[1].rel.score > 2) {
      const a2 = scoredArticles[1];
      plan.push({ id: "a2", type: "article", icon: FileText, title: a2.title, time: "10 min", reason: `Also relevant to: ${a2.rel.goal?.title || "your interests"}`, color: "text-orange-500", goalMatch: a2.rel.goal?.title || null });
      used.add(`article-${a2.id}`);
    }

    // 4. Goal-matched media
    const unwatched = media.filter(m => m.status !== "completed");
    const scoredMedia = unwatched.map(m => ({ ...m, rel: itemRelevance(m, goals) })).sort((a, b) => b.rel.score - a.rel.score);
    if (scoredMedia[0]) {
      const m = scoredMedia[0];
      const goalTag = m.rel.goal ? `Supports: ${m.rel.goal.title}` : "";
      plan.push({ id: "m1", type: "media", icon: m.type === "video" ? Video : Headphones, title: m.title, time: "20 min", reason: `${m.type === "video" ? "Watch" : "Listen"} to deepen your understanding${goalTag ? ` • ${goalTag}` : ""}`, color: "text-red-500", goalMatch: m.rel.goal?.title || null });
    }

    // 5. Goal-matched resources
    const scoredResources = resources.map(r => ({ ...r, rel: itemRelevance(r, goals) })).sort((a, b) => b.rel.score - a.rel.score);
    if (scoredResources[0] && scoredResources[0].rel.score > 1) {
      const r = scoredResources[0];
      plan.push({ id: "r1", type: "resource", icon: Globe, title: r.title, time: "10 min", reason: `Saved resource by ${r.author || "an expert"} • Relevant to: ${r.rel.goal?.title || "your goals"}`, color: "text-sky-500", goalMatch: r.rel.goal?.title || null });
    }

    // 6. Flashcards always
    if (flashcards.length > 0) plan.push({ id: "fc", type: "flashcard", icon: Sparkles, title: "Review Flashcards", time: "10 min", reason: `${flashcards.length} cards to reinforce your learning`, color: "text-teal-600", goalMatch: null });

    // 7. AI-discovered content teaser
    // (discoveries computed later, but we insert a placeholder that the view will fill with live data)
    plan.push({ id: "discover", type: "discover", icon: Compass, title: "Explore AI Discoveries", time: "15 min", reason: "Content sourced from the web matching your goals and learning profile", color: "text-indigo-500", goalMatch: null });

    return plan;
  })();

  // ── Content suggestions: unconsumed items most relevant to goals ──
  const contentSuggestions = (() => {
    if (goals.length === 0) return [];
    const suggestions = [];
    // Pool all unconsumed content
    articles.filter(a => !a.read).forEach(a => suggestions.push({ ...a, _type: "article", _icon: "article", rel: itemRelevance(a, goals) }));
    media.filter(m => m.status !== "completed").forEach(m => suggestions.push({ ...m, _type: "media", _icon: m.type, rel: itemRelevance(m, goals) }));
    resources.forEach(r => suggestions.push({ ...r, _type: "resource", _icon: r.type, rel: itemRelevance(r, goals) }));
    books.filter(b => b.status === "want-to-read").forEach(b => suggestions.push({ ...b, _type: "book", _icon: "book", rel: itemRelevance(b, goals) }));
    courses.filter(c => c.status !== "completed" && c.progress < 10).forEach(c => suggestions.push({ ...c, _type: "course", _icon: "course", rel: itemRelevance(c, goals) }));
    // Sort by relevance and take top items that actually match
    return suggestions.filter(s => s.rel.score > 0).sort((a, b) => b.rel.score - a.rel.score).slice(0, 6);
  })();

  // ── Profile Analyzer: extract topic weights from all saved content ──
  const profileTopics = (() => {
    const counts = {};
    const bump = (text, weight = 1) => {
      if (!text) return;
      const lo = text.toLowerCase();
      const topicMap = {
        "machine learning": ["ai", "machine learning"], "deep learning": ["ai", "deep learning"], "neural": ["ai", "neural", "deep learning"],
        "transformer": ["ai", "transformers"], "llm": ["ai", "llm"], "gpt": ["ai", "llm", "gpt"], "nlp": ["ai", "nlp"],
        "react": ["web", "react", "javascript"], "javascript": ["web", "javascript"], "css": ["web", "css"], "html": ["web", "html"],
        "node": ["web", "backend", "node"], "frontend": ["web", "frontend"], "fullstack": ["web", "fullstack"],
        "spanish": ["spanish", "language"], "duolingo": ["spanish", "language"], "french": ["language"], "subjunctive": ["spanish", "grammar"],
        "python": ["programming", "python"], "algorithm": ["cs", "algorithms"], "data struct": ["cs", "data structures"],
        "statistics": ["statistics", "math"], "probability": ["statistics", "probability"], "linear algebra": ["math", "linear algebra"],
        "productivity": ["productivity"], "habits": ["productivity", "habits"], "design": ["design", "ui"],
        "research": ["research"], "paper": ["research", "papers"],
      };
      Object.entries(topicMap).forEach(([key, topics]) => {
        if (lo.includes(key)) topics.forEach(t => { counts[t] = (counts[t] || 0) + weight; });
      });
    };
    courses.forEach(c => { bump(c.title, 3); bump(c.category, 2); bump(c.notes, 1); });
    books.forEach(b => { bump(b.title, 3); bump(b.genre, 2); bump(b.notes, 1); bump(b.keyTakeaways, 1); });
    articles.forEach(a => { bump(a.title, 2); bump((a.tags || []).join(" "), 2); bump(a.notes, 1); });
    researchers.forEach(r => { bump(r.field, 3); bump(r.notes, 1); });
    resources.forEach(r => { bump(r.title, 2); bump(r.notes, 1); });
    media.forEach(m => { bump(m.title, 2); bump(m.notes, 1); bump(m.creator, 1); });
    goals.forEach(g => { bump(g.title, g.priority === "high" ? 5 : g.priority === "medium" ? 3 : 1); });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  })();

  // ── Discovery Engine: match curated DB against profile + apply vote feedback ──
  const discoveries = (() => {
    const topTopics = profileTopics.slice(0, 15).map(([t]) => t);
    if (topTopics.length === 0) return [];

    // Build set of already-owned titles (lowercase) for dedup
    const owned = new Set();
    courses.forEach(c => owned.add(c.title.toLowerCase()));
    books.forEach(b => owned.add(b.title.toLowerCase()));
    articles.forEach(a => owned.add(a.title.toLowerCase()));
    media.forEach(m => owned.add(m.title.toLowerCase()));
    resources.forEach(r => owned.add(r.title.toLowerCase()));

    // Collect downvoted topics to learn from negative signals
    const downvotedTopics = {};
    const upvotedTopics = {};
    Object.entries(discoveryVotes).forEach(([id, vote]) => {
      const item = DISCOVERY_DB.find(d => d.id === id);
      if (!item) return;
      const target = vote > 0 ? upvotedTopics : downvotedTopics;
      item.topics.forEach(t => { target[t] = (target[t] || 0) + 1; });
    });

    return DISCOVERY_DB
      .filter(d => !owned.has(d.title.toLowerCase()) && !discoveryAdded[d.id] && discoveryVotes[d.id] !== -1)
      .map(d => {
        // Score by topic overlap with profile
        let score = d.topics.reduce((s, t) => {
          const profileWeight = profileTopics.find(([pt]) => pt === t)?.[1] || 0;
          return s + profileWeight;
        }, 0);
        // Boost from upvoted topic patterns
        d.topics.forEach(t => { if (upvotedTopics[t]) score += upvotedTopics[t] * 2; });
        // Penalize from downvoted topic patterns
        d.topics.forEach(t => { if (downvotedTopics[t]) score -= downvotedTopics[t] * 1.5; });
        // Find best matching goal
        let bestGoal = null;
        goals.forEach(g => {
          const gkws = goalKeywords(g);
          const overlap = d.topics.filter(t => gkws.includes(t)).length;
          if (overlap > 0 && (!bestGoal || overlap > bestGoal.overlap)) bestGoal = { goal: g, overlap };
        });
        // Find matching arc phase
        let arcPhase = null;
        arcs.forEach(arc => {
          const activeIdx = arcActivePhase[arc.id] || 0;
          const phase = arc.phases[activeIdx];
          if (phase) {
            const overlap = d.topics.filter(t => phase.topics.includes(t)).length;
            if (overlap > 0) arcPhase = { arcTitle: arc.title, phaseName: phase.name };
          }
        });
        return { ...d, score, bestGoal: bestGoal?.goal || null, arcPhase };
      })
      .filter(d => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  })();

  // ── Arc helpers ──
  const buildArc = (goal) => {
    const lo = goal.title.toLowerCase();
    let templateKey = "general";
    if (lo.includes("ml") || lo.includes("machine learning") || lo.includes("ai") || lo.includes("deep learning")) templateKey = "ml";
    else if (lo.includes("web") || lo.includes("react") || lo.includes("full-stack") || lo.includes("fullstack") || lo.includes("javascript")) templateKey = "web";
    else if (lo.includes("spanish") || lo.includes("language") || lo.includes("fluency")) templateKey = "spanish";
    const tmpl = ARC_TEMPLATES[templateKey];
    const arc = { id: Date.now(), goalId: goal.id, title: `${goal.title} Arc`, templateKey, phases: tmpl.phases.map((p, i) => ({ ...p, id: i, completed: false })) };
    setArcs(prev => [...prev, arc]);
    setArcActivePhase(prev => ({ ...prev, [arc.id]: 0 }));
    setArcBuilderGoal(null);
  };

  const addDiscoveryToLibrary = (item) => {
    const id = nid.current++;
    if (item.type === "video" || item.type === "podcast") {
      setMedia(prev => [...prev, { id, title: item.title, type: item.type, platform: item.platform, creator: item.author, status: "want-to-watch", notes: `AI-discovered: ${item.reason}`, url: item.url }]);
    } else if (item.type === "course") {
      setCourses(prev => [...prev, { id, title: item.title, platform: item.platform, progress: 0, status: "want-to-start", notes: `AI-discovered: ${item.reason}`, category: "", url: item.url }]);
    } else if (item.type === "book") {
      setBooks(prev => [...prev, { id, title: item.title, author: item.author, genre: "", progress: 0, status: "want-to-read", rating: 0, notes: `AI-discovered: ${item.reason}`, keyTakeaways: "", url: item.url }]);
    } else {
      setArticles(prev => [...prev, { id, title: item.title, source: item.platform, tags: item.topics?.slice(0, 3) || [], read: false, notes: `AI-discovered: ${item.reason}`, url: item.url }]);
    }
    setDiscoveryAdded(prev => ({ ...prev, [item.id]: true }));
  };

  const q = search.toLowerCase();
  const fil = (items, fields) => !q ? items : items.filter(i => fields.some(f => String(i[f] || "").toLowerCase().includes(q)));

  const openAdd = (t) => { setEditItem(null); setForm({}); setModal(t); };
  const openEdit = (t, item) => { setEditItem(item); setForm({ ...item }); setModal(t); };

  const saveItem = () => {
    const id = editItem ? editItem.id : nid.current++;
    const item = { ...form, id };
    const up = (arr, set) => editItem ? set(arr.map(x => x.id === id ? item : x)) : set([item, ...arr]);
    if (modal === "course") up(courses, setCourses);
    else if (modal === "book") up(books, setBooks);
    else if (modal === "article") up(articles, setArticles);
    else if (modal === "researcher") up(researchers, setResearchers);
    else if (modal === "resource") up(resources, setResources);
    else if (modal === "media") up(media, setMedia);
    setModal(null);
  };

  const del = (t, id) => {
    const m = { course: [courses, setCourses], book: [books, setBooks], article: [articles, setArticles], researcher: [researchers, setResearchers], resource: [resources, setResources], media: [media, setMedia] };
    if (m[t]) m[t][1](m[t][0].filter(x => x.id !== id));
  };

  // Onboarding
  const OB_STEPS = [
    { title: "Courses", desc: "Online courses from Udemy, Coursera, Duolingo, edX, etc.", hint: "Paste course names, one per line", type: "course", Icon: BookOpen },
    { title: "Books", desc: "Books you're reading or want to read.", hint: "Paste titles (\"Title by Author\" format), one per line", type: "book", Icon: Bookmark },
    { title: "Reading List", desc: "Articles, papers, and blog posts.", hint: "Paste article titles or URLs, one per line", type: "article", Icon: FileText },
    { title: "Research", desc: "Academics and researchers you follow.", hint: "Paste names (\"Name, Institution, Field\" format), one per line", type: "researcher", Icon: Users },
    { title: "Resources", desc: "Twitter threads, LinkedIn masterclasses, expert docs.", hint: "Paste resource titles, one per line", type: "resource", Icon: Globe },
    { title: "Media", desc: "Videos and podcasts you're watching or listening to.", hint: "Paste titles, one per line", type: "media", Icon: PlayCircle },
  ];

  const startOb = () => { setCourses([]); setBooks([]); setArticles([]); setResearchers([]); setResources([]); setMedia([]); setObStep(1); };

  const bulkAdd = (type) => {
    const lines = obBulk.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const items = lines.map(line => {
      const id = nid.current++;
      if (type === "course") return { id, title: line, platform: "Other", progress: 0, status: "in-progress", notes: "", category: "", url: "" };
      if (type === "book") { const p = line.split(" by "); return { id, title: p[0], author: p[1] || "", genre: "", progress: 0, status: "want-to-read", rating: 0, notes: "", keyTakeaways: "" }; }
      if (type === "article") return { id, title: line, source: "", tags: [], read: false, notes: "", url: line.startsWith("http") ? line : "" };
      if (type === "researcher") { const p = line.split(",").map(s => s.trim()); return { id, name: p[0], institution: p[1] || "", field: p[2] || "", papers: [], notes: "", url: "" }; }
      if (type === "resource") return { id, title: line, type: "expert-doc", author: "", notes: "", url: "" };
      return { id, title: line, type: "video", platform: "YouTube", creator: "", status: "want-to-watch", notes: "", url: "" };
    });
    const setters = { course: setCourses, book: setBooks, article: setArticles, researcher: setResearchers, resource: setResources, media: setMedia };
    setters[type](prev => [...prev, ...items]);
    setObBulk("");
  };

  const manualAdd = (type) => {
    if (!obManual.trim()) return;
    const id = nid.current++;
    const t = obManual.trim();
    const item = type === "course" ? { id, title: t, platform: "Other", progress: 0, status: "in-progress", notes: "", category: "", url: "" }
      : type === "book" ? { id, title: t.split(" by ")[0], author: t.split(" by ")[1] || "", genre: "", progress: 0, status: "want-to-read", rating: 0, notes: "", keyTakeaways: "" }
      : type === "article" ? { id, title: t, source: "", tags: [], read: false, notes: "", url: "" }
      : type === "researcher" ? { id, name: t, institution: "", field: "", papers: [], notes: "", url: "" }
      : type === "resource" ? { id, title: t, type: "expert-doc", author: "", notes: "", url: "" }
      : { id, title: t, type: "video", platform: "YouTube", creator: "", status: "want-to-watch", notes: "", url: "" };
    const setters = { course: setCourses, book: setBooks, article: setArticles, researcher: setResearchers, resource: setResources, media: setMedia };
    setters[type](prev => [...prev, item]);
    setObManual("");
  };

  const obItems = (type) => type === "course" ? courses : type === "book" ? books : type === "article" ? articles : type === "researcher" ? researchers : type === "resource" ? resources : media;

  // AI Chat
  const sendChat = () => {
    if (!chatIn.trim()) return;
    const msg = chatIn.trim();
    setChat(c => [...c, { role: "user", text: msg }]);
    setChatIn("");
    setChatLoading(true);
    setTimeout(() => {
      const lo = msg.toLowerCase();
      const ip = courses.filter(c => c.status === "in-progress");
      const ur = articles.filter(a => !a.read);
      let r;
      if (lo.includes("score") || lo.includes("points") || lo.includes("performance")) {
        r = `Your elevation is ${score.total} ft! You're a ${getRank(score.total).title}.\n\nTrails: ${score.courses} ft (${courses.filter(c => c.status === "completed").length} summited, ${ip.length} in progress)\nBooks: ${score.books} ft (${books.filter(b => b.status === "completed").length} completed)\nArticles: ${score.articles} ft (${articles.filter(a => a.read).length} read)\nMedia: ${score.media} ft\nResources: ${score.resources} ft\n\n${getNextRank(score.total) ? `${getNextRank(score.total).min - score.total} ft to reach ${getNextRank(score.total).title}!` : "You've reached the highest peak!"} Focus on "${ip[0]?.title}" to climb higher!`;
      } else if (lo.includes("recommend") || lo.includes("next") || lo.includes("should")) {
        r = `Based on your profile:\n\n1. You're ${ip[0]?.progress}% through "${ip[0]?.title}" — push to finish!\n2. "${ur[0]?.title}" from your reading list pairs nicely with your coursework.\n3. ${books.find(b => b.status === "want-to-read") ? '"' + books.find(b => b.status === "want-to-read").title + '" is a great next read.' : "Add a new book to your list!"}\n\nWhat topic interests you most?`;
      } else if (lo.includes("progress") || lo.includes("how am i") || lo.includes("summary")) {
        const avg = Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length);
        r = `Learning snapshot:\n\n${courses.filter(c => c.status === "completed").length}/${courses.length} courses done (avg: ${avg}%)\n${books.filter(b => b.status === "completed").length}/${books.length} books finished\n${articles.filter(a => a.read).length}/${articles.length} articles read\n${media.filter(m => m.status === "completed").length}/${media.length} media consumed\n${resources.length} resources saved\nScore: ${score.total} pts\n\nKeep going — consistency is everything!`;
      } else if (lo.includes("hello") || lo.includes("hi") || lo.includes("hey")) {
        r = `Hey ${obName}! I'm your Altius guide. I can:\n\n- Check your elevation & rank\n- Suggest your next trail\n- Discuss your courses & reading\n- Find connections across your learning map\n\nWhat peak are we tackling?`;
      } else {
        r = `Great area to explore! Based on your focus in ${ip[0]?.category || "your courses"}, I'd connect this to "${ur[0]?.title || "your saved articles"}" from your reading list.\n\nResearchers like ${researchers[0]?.name || "those you follow"} have relevant work here.\n\nWant a study plan or deeper dive into a specific topic?`;
      }
      setChat(c => [...c, { role: "ai", text: r }]);
      setChatLoading(false);
    }, 1200);
  };

  // UI helpers
  const Bdg = ({ children, c }) => <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c}`}>{children}</span>;
  const PBar = ({ v }) => <div className="w-full bg-stone-200 rounded-full h-2"><div className="bg-teal-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, v)}%` }} /></div>;
  const StarsUI = ({ n }) => <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className={i <= n ? "fill-orange-400 text-teal-500" : "text-stone-300"} />)}</div>;

  const Chips = ({ opts, val, onChange }) => (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {opts.map(o => <button key={o.v} onClick={() => onChange(o.v)} className={`text-xs px-3 py-1 rounded-full transition-colors ${val === o.v ? "bg-orange-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>{o.l}</button>)}
    </div>
  );

  const FF = (label, key, type = "text", opts) => (
    <div className="mb-3" key={key}>
      <label className="text-xs font-medium text-stone-500 mb-1 block">{label}</label>
      {type === "textarea" ? <textarea className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white resize-none" rows={3} value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
        : type === "select" ? <select className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white" value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}><option value="">Select...</option>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select>
        : type === "number" ? <input type="number" min={0} max={9999} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white" value={form[key] ?? ""} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} />
        : <input type="text" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white" value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />}
    </div>
  );

  const formFields = () => {
    if (modal === "course") return [FF("Title", "title"), FF("Platform", "platform", "select", ["Coursera", "Udemy", "Duolingo", "edX", "Skillshare", "LinkedIn Learning", "Other"]), FF("Category", "category"), FF("Progress (%)", "progress", "number"), FF("Status", "status", "select", ["in-progress", "completed", "paused", "want-to-start"]), FF("URL", "url"), FF("Notes", "notes", "textarea")];
    if (modal === "book") return [FF("Title", "title"), FF("Author", "author"), FF("Genre", "genre"), FF("Progress (%)", "progress", "number"), FF("Status", "status", "select", ["reading", "completed", "want-to-read", "paused"]), FF("Rating (1-5)", "rating", "number"), FF("Notes", "notes", "textarea"), FF("Key Takeaways", "keyTakeaways", "textarea")];
    if (modal === "article") return [FF("Title", "title"), FF("Source", "source"), FF("Tags (comma separated)", "tagsStr"), FF("URL", "url"), FF("Notes", "notes", "textarea")];
    if (modal === "researcher") return [FF("Name", "name"), FF("Institution", "institution"), FF("Field", "field"), FF("Papers (comma separated)", "papersStr"), FF("URL", "url"), FF("Notes", "notes", "textarea")];
    if (modal === "resource") return [FF("Title", "title"), FF("Type", "type", "select", ["twitter-thread", "linkedin", "expert-doc"]), FF("Author", "author"), FF("URL", "url"), FF("Notes", "notes", "textarea")];
    if (modal === "media") return [FF("Title", "title"), FF("Type", "type", "select", ["video", "podcast"]), FF("Platform", "platform", "select", ["YouTube", "Spotify", "Apple Podcasts", "Other"]), FF("Creator", "creator"), FF("Status", "status", "select", ["in-progress", "completed", "want-to-watch"]), FF("URL", "url"), FF("Notes", "notes", "textarea")];
    if (modal === "scoring") return Object.entries(scoring).map(([k, v]) => (
      <div key={k} className="flex items-center justify-between mb-2">
        <span className="text-sm text-stone-600">{k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}</span>
        <input type="number" min={0} max={999} className="w-20 border border-stone-200 rounded px-2 py-1 text-sm text-right" value={v} onChange={e => setScoring(s => ({ ...s, [k]: Number(e.target.value) }))} />
      </div>
    ));
    return [];
  };

  const handleSave = () => {
    if (modal === "scoring") { setModal(null); return; }
    if (modal === "article") { form.tags = (form.tagsStr || "").split(",").map(t => t.trim()).filter(Boolean); if (!editItem) form.read = false; }
    if (modal === "researcher") { form.papers = (form.papersStr || "").split(",").map(t => t.trim()).filter(Boolean); }
    saveItem();
  };

  const nav = [
    { id: "home", label: "The Trail", Icon: Footprints },
    { group: "Progress" },
    { id: "dashboard", label: "Dashboard", Icon: Home },
    { id: "today", label: "Today's Plan", Icon: Target },
    { id: "flashcards", label: "Flashcards", Icon: Award, cnt: flashcards.length },
    { group: "Discover" },
    { id: "discover", label: "Discover", Icon: Compass, cnt: discoveries.length },
    { id: "arcs", label: "Learn Arcs", Icon: Map, cnt: arcs.length },
    { group: "Library" },
    { id: "courses", label: "Courses", Icon: BookOpen, cnt: courses.length },
    { id: "books", label: "Books", Icon: Bookmark, cnt: books.length },
    { id: "reading", label: "Reading List", Icon: FileText, cnt: articles.filter(a => !a.read).length },
    { id: "research", label: "Research", Icon: Users, cnt: researchers.length },
    { id: "resources", label: "Resources", Icon: Globe, cnt: resources.length },
    { id: "media", label: "Media", Icon: PlayCircle, cnt: media.length },
    { group: "Tools" },
    { id: "chat", label: "AI Assistant", Icon: Sparkles },
    { id: "about", label: "About", Icon: Info },
  ];

  // ─── ONBOARDING WIZARD ───
  if (!onboarded) {
    const cs = OB_STEPS[obStep - 1];
    const items = cs ? obItems(cs.type) : [];
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div className="w-full max-w-xl">
          {obStep > 0 && obStep < 8 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-stone-400 mb-2">
                <span>Step {obStep} of 7</span>
                <span>{Math.round((obStep / 7) * 100)}%</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-1.5"><div className="bg-teal-600 h-1.5 rounded-full transition-all" style={{ width: `${(obStep / 7) * 100}%` }} /></div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">

            {obStep === 0 && (
              <div className="text-center">
                <div className="flex justify-center mb-2"><PixelLogo size={48} /></div>
                <h1 className="text-3xl font-bold text-stone-800 mb-2" style={{ fontFamily: "Georgia, serif" }}>Welcome to Altius</h1>
                <p className="text-stone-500 mb-8">Learn More, Climb Higher. Let's map your courses, books, articles, and everything you're learning onto your personal summit.</p>
                <div className="mb-6 text-left">
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Your name</label>
                  <input type="text" className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400" value={obName} onChange={e => setObName(e.target.value)} />
                </div>
                <button onClick={startOb} className="w-full bg-orange-700 hover:bg-orange-800 text-white py-3 rounded-xl text-sm font-medium transition-colors mb-3">Get Started</button>
                <button onClick={() => completeOnboarding()} className="w-full text-stone-400 hover:text-stone-600 py-2 text-sm transition-colors">Skip & explore with sample data</button>
              </div>
            )}

            {obStep >= 1 && obStep <= 6 && cs && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <cs.Icon size={24} className="text-teal-600" />
                  <h2 className="text-xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>{cs.title}</h2>
                </div>
                <p className="text-sm text-stone-500 mb-6">{cs.desc}</p>

                <div className="mb-4">
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Bulk add</label>
                  <textarea className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white resize-none" rows={4} placeholder={cs.hint} value={obBulk} onChange={e => setObBulk(e.target.value)} />
                  <button onClick={() => bulkAdd(cs.type)} disabled={!obBulk.trim()} className="mt-2 px-4 py-1.5 bg-orange-700 hover:bg-orange-800 text-white rounded-lg text-xs font-medium transition-colors" style={{ opacity: obBulk.trim() ? 1 : 0.4 }}>
                    Add {obBulk.split("\n").filter(l => l.trim()).length || 0} items
                  </button>
                </div>

                <div className="relative flex items-center my-4">
                  <div className="flex-1 border-t border-stone-200" />
                  <span className="px-3 text-xs text-stone-400">or add one at a time</span>
                  <div className="flex-1 border-t border-stone-200" />
                </div>

                <div className="flex gap-2">
                  <input type="text" placeholder={`${cs.title.replace(/s$/, "")} title...`} className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    value={obManual} onChange={e => setObManual(e.target.value)} onKeyDown={e => { if (e.key === "Enter") manualAdd(cs.type); }} />
                  <button onClick={() => manualAdd(cs.type)} className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg text-sm hover:bg-stone-200 transition-colors">Add</button>
                </div>

                {items.length > 0 && (
                  <div className="mt-4 border-t border-stone-100 pt-4">
                    <p className="text-xs font-medium text-stone-500 mb-2">{items.length} added</p>
                    <div className="space-y-1" style={{ maxHeight: 128, overflowY: "auto" }}>
                      {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs bg-stone-50 rounded px-2 py-1">
                          <span className="text-stone-700 truncate">{item.title || item.name}</span>
                          <button onClick={() => del(cs.type, item.id)} className="text-stone-400 hover:text-red-500 ml-2"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button onClick={() => { setObBulk(""); setObManual(""); setObStep(s => s - 1); }} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700">Back</button>
                  <div className="flex gap-2">
                    <button onClick={() => { setObBulk(""); setObManual(""); setObStep(s => s + 1); }} className="px-4 py-2 text-sm text-stone-400 hover:text-stone-600">Skip</button>
                    <button onClick={() => { setObBulk(""); setObManual(""); setObStep(s => s + 1); }} className="px-4 py-2 text-sm bg-orange-700 hover:bg-orange-800 text-white rounded-lg transition-colors">Next</button>
                  </div>
                </div>
              </div>
            )}

            {obStep === 7 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Award size={24} className="text-teal-600" />
                  <h2 className="text-xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>Set Your Scoring Rules</h2>
                </div>
                <p className="text-sm text-stone-500 mb-6">Earn points as you learn. Customize how much each activity is worth.</p>
                <div className="space-y-3">
                  {Object.entries(scoring).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">{k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} max={999} className="w-20 border border-stone-200 rounded px-2 py-1 text-sm text-right" value={v} onChange={e => setScoring(s => ({ ...s, [k]: Number(e.target.value) }))} />
                        <span className="text-xs text-stone-400">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-8">
                  <button onClick={() => setObStep(6)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700">Back</button>
                  <button onClick={() => setObStep(8)} className="px-4 py-2 text-sm bg-orange-700 hover:bg-orange-800 text-white rounded-lg transition-colors">Finish Setup</button>
                </div>
              </div>
            )}

            {obStep === 8 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2" style={{ fontFamily: "Georgia, serif" }}>You're all set, {obName}!</h2>
                <p className="text-stone-500 mb-6">Your summit awaits. Start climbing.</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[["Courses", courses.length], ["Books", books.length], ["Articles", articles.length], ["Researchers", researchers.length], ["Resources", resources.length], ["Media", media.length]].map(([l, v]) => (
                    <div key={l} className="bg-stone-50 rounded-lg p-3">
                      <p className="text-lg font-bold text-stone-800">{v}</p>
                      <p className="text-xs text-stone-500">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-orange-50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-orange-900">Starting Elevation: {score.total} ft</p>
                  <p className="text-xs text-orange-700">Complete trails, read articles, and conquer peaks to climb higher!</p>
                </div>
                <button onClick={() => completeOnboarding()} className="w-full bg-orange-700 hover:bg-orange-800 text-white py-3 rounded-xl text-sm font-medium transition-colors">Go to Dashboard</button>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN APP ───
  return (
    <div className="flex h-screen bg-stone-50" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <nav className="w-52 bg-stone-100 border-r border-stone-200 flex flex-col" style={{ minWidth: 208 }}>
        <div className="px-4 py-4 border-b border-stone-200">
          <h1 className="text-lg font-bold text-stone-800 flex items-center gap-2" style={{ fontFamily: "Georgia, serif" }}>
            <PixelLogo size={22} /> Altius
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">Learn More, Climb Higher</p>
        </div>
        <div className="flex-1 py-1 overflow-auto">
          {nav.map((n, i) => n.group ? (
            <p key={n.group} className="px-4 pt-4 pb-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">{n.group}</p>
          ) : (
            <button key={n.id} onClick={() => { setView(n.id); setSearch(""); setFilter("all"); }}
              className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-sm transition-colors ${view === n.id ? "bg-orange-50 text-orange-900 font-medium" : "text-stone-600 hover:bg-stone-200"}`}
              style={view === n.id ? { borderRight: "2px solid #f59e0b" } : {}}>
              <n.Icon size={15} />
              <span className="flex-1 text-left">{n.label}</span>
              {n.cnt != null && <span className="text-[11px] text-stone-400">{n.cnt}</span>}
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-stone-200">
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <MountaineerSVG rank={getRank(score.total)} size={50} />
            <p className="text-[10px] font-bold mt-1" style={{ color: getRank(score.total).color }}>{getRank(score.total).title}</p>
            <p className="text-[9px] text-stone-400 italic">{getRank(score.total).desc}</p>
            <div className="flex items-center justify-center gap-1 mt-1.5">
              <Mountain size={10} className="text-orange-700" />
              <span className="text-xs font-medium text-orange-800">Elevation</span>
            </div>
            <p className="text-xl font-bold text-orange-900" style={{ fontFamily: "Georgia, serif" }}>{score.total}</p>
            {getNextRank(score.total) && (
              <div className="mt-1">
                <div className="w-full bg-stone-200 rounded-full h-1">
                  <div className="bg-teal-600 h-1 rounded-full transition-all" style={{ width: `${Math.min(100, ((score.total - getRank(score.total).min) / (getNextRank(score.total).min - getRank(score.total).min)) * 100)}%` }} />
                </div>
                <p className="text-[8px] text-stone-400 mt-0.5">{getNextRank(score.total).min - score.total} to {getNextRank(score.total).title}</p>
              </div>
            )}
            <button onClick={() => { setForm({}); setEditItem(null); setModal("scoring"); }} className="text-[10px] text-orange-700 hover:underline mt-1 flex items-center gap-1 mx-auto">
              <Settings size={8} /> Scoring
            </button>
          </div>
          {onSignOut && (
            <button onClick={onSignOut} className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 py-2 mt-1 transition-colors">
              <LogOut size={12} /> Sign out
            </button>
          )}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          {!["home", "dashboard", "chat", "today", "flashcards", "discover", "arcs", "about"].includes(view) && (
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 text-stone-400" style={{ transform: "translateY(-50%)" }} />
              <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}

          {/* ═══ THE TRAIL — Retro Oregon-Trail Home ═══ */}
          {view === "home" && (() => {
            const rank = getRank(score.total);
            const nextRank = getNextRank(score.total);
            // Trail waypoints mapped to SVG coordinates
            const wp = [
              { x: 80, y: 248, min: 0, title: "Base Camp" },
              { x: 160, y: 212, min: 100, title: "Trail Runner" },
              { x: 270, y: 168, min: 300, title: "Mountaineer" },
              { x: 370, y: 118, min: 600, title: "Alpine Guide" },
              { x: 460, y: 72, min: 1000, title: "Summiteer" },
              { x: 540, y: 42, min: 2000, title: "Summit" },
            ];
            // Interpolate character position along the trail
            const charPos = (() => {
              const s = score.total;
              if (s >= 2000) return { x: 540, y: 42 };
              for (let i = 1; i < wp.length; i++) {
                if (s < wp[i].min) {
                  const p = wp[i - 1], n = wp[i];
                  const pct = (s - p.min) / (n.min - p.min);
                  return { x: p.x + (n.x - p.x) * pct, y: p.y + (n.y - p.y) * pct };
                }
              }
              return { x: 80, y: 248 };
            })();
            // 8-bit pixel hiker (8 wide × 11 tall, pixel size 3)
            const hPx = ["...TT...","..TTTT..",".TTTTTT.","...SS...","..SWWS..","..OOOO..",".OOBOO..",".OOOOOO.","..P..P..","..P..P..",".DD..DD."];
            const hC = { T:"#0d9488",S:"#deb887",W:"#ffffff",O:"#c2410c",B:"#78716c",P:"#44403c",D:"#292524" };
            const pxSz = 3;
            // Oregon Trail-style messages from actual user data
            const msgs = [];
            msgs.push(`Day ${Math.max(1, Math.floor(score.total / 8) + 1)} on the Altius Trail.`);
            msgs.push(`Elevation: ${score.total} ft  \u2502  Rank: ${rank.title}`);
            const ip = courses.filter(c => c.status === "in-progress");
            if (ip.length) msgs.push(`${ip.length} course${ip.length > 1 ? "s" : ""} in progress. The path continues.`);
            const ur = articles.filter(a => !a.read);
            if (ur.length) msgs.push(`${ur.length} unread article${ur.length > 1 ? "s" : ""} stowed in your pack.`);
            const compBooks = books.filter(b => b.status === "completed");
            if (compBooks.length) msgs.push(`${compBooks.length} book${compBooks.length > 1 ? "s" : ""} completed. Hard-won knowledge.`);
            if (nextRank) msgs.push(`Next camp: ${nextRank.title} (${nextRank.min - score.total} ft to go)`);
            else msgs.push("You stand at the summit. The world spreads below.");
            const fl = ["The air grows thinner. Your knowledge deepens.","A fellow climber waves from a distant ridge.","The weather is clear. Good conditions for study.","You spot a cairn left by a previous learner.","The summit gleams in the morning light.","Your pack is full of good books. Onward.","Stars dot the sky. A good night for reflection."];
            msgs.push(fl[new Date().getDay() % fl.length]);
            return (
            <div>
              <style>{`@keyframes crt-blink{0%,100%{opacity:1}50%{opacity:0}} @keyframes crt-flicker{0%,100%{opacity:1}92%{opacity:1}93%{opacity:.85}94%{opacity:1}}`}</style>
              {/* Monitor bezel */}
              <div style={{ background:"linear-gradient(180deg,#57534e 0%,#44403c 40%,#292524 100%)", borderRadius:20, padding:"14px 12px 18px", boxShadow:"0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <div style={{ textAlign:"center", marginBottom:8 }}>
                  <span style={{ fontFamily:"'Courier New',monospace", fontSize:9, color:"#a8a29e", letterSpacing:4, textTransform:"uppercase" }}>Altius Computing Co. \u2014 Est. 2026</span>
                </div>
                {/* CRT Screen */}
                <div style={{ background:"#0f172a", borderRadius:10, overflow:"hidden", position:"relative", boxShadow:"inset 0 0 80px rgba(0,0,0,0.6)", border:"2px solid #1e293b", animation:"crt-flicker 8s infinite" }}>
                  {/* Scanlines overlay */}
                  <div style={{ position:"absolute",inset:0,zIndex:10,pointerEvents:"none",borderRadius:8, background:"repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)" }} />
                  {/* Vignette */}
                  <div style={{ position:"absolute",inset:0,zIndex:9,pointerEvents:"none",borderRadius:8, boxShadow:"inset 0 0 120px rgba(0,0,0,0.4)" }} />

                  {/* Title bar */}
                  <div style={{ padding:"10px 20px", borderBottom:"1px solid #1e293b", fontFamily:"'Courier New',monospace", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"#4ade80", fontSize:14, textShadow:"0 0 10px rgba(74,222,128,0.35)", letterSpacing:3, fontWeight:"bold", display:"inline-flex", alignItems:"center", gap:8 }}>
                      <PixelLogo size={18} /> ALTIUS TRAIL v2.0
                    </span>
                    <span style={{ color:"#334155", fontSize:10, fontFamily:"'Courier New',monospace" }}>
                      {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}
                    </span>
                  </div>

                  {/* ═══ MOUNTAIN SCENE SVG ═══ */}
                  <svg viewBox="0 0 640 300" width="100%" style={{ display:"block" }} xmlns="http://www.w3.org/2000/svg">
                    {/* Sky */}
                    <rect width="640" height="300" fill="#0f172a"/>
                    {/* Stars */}
                    {[[50,18],[123,42],[198,12],[285,32],[375,22],[448,8],[518,38],[582,16],[68,58],[162,68],[338,48],[502,62],[612,28],[28,78],[242,72],[418,56],[96,10],[312,6],[478,44],[558,58],[178,28],[392,65],[44,50],[268,26],[140,80],[520,14],[350,72],[85,36],[430,18],[265,55],[600,48],[155,48],[490,30]].map(([cx,cy],i) => (
                      <rect key={`s${i}`} x={cx} y={cy} width={i%4===0?2:1} height={i%4===0?2:1} fill={i%7===0?"#5eead4":i%5===0?"#fbbf24":"#64748b"} opacity={0.3+(i%5)*0.12}/>
                    ))}
                    {/* Moon */}
                    <circle cx="580" cy="35" r="14" fill="#fef3c7" opacity="0.15"/>
                    <circle cx="585" cy="32" r="12" fill="#0f172a"/>
                    {/* Far mountains (background layer) */}
                    <polygon points="0,220 45,175 90,195 140,155 195,180 250,135 310,165 370,120 425,150 480,100 530,125 575,95 610,140 640,180 640,300 0,300" fill="#1e293b"/>
                    {/* Mid mountains */}
                    <polygon points="0,255 35,230 80,240 130,205 185,225 240,190 300,210 350,175 400,150 450,120 500,90 540,65 560,55 580,68 610,100 640,155 640,300 0,300" fill="#27303f"/>
                    {/* Main mountain (with trail) */}
                    <polygon points="0,270 55,252 110,238 170,215 230,195 290,170 350,145 410,115 460,82 510,55 540,38 555,42 580,62 610,100 640,160 640,300 0,300" fill="#334155"/>
                    {/* Snow cap */}
                    <polygon points="528,48 540,38 555,42 548,46 535,47" fill="#94a3b8" opacity="0.4"/>
                    {/* Ground */}
                    <rect x="0" y="260" width="640" height="40" fill="#1a2e1a"/>
                    <rect x="0" y="260" width="640" height="3" fill="#2d4a2d" opacity="0.7"/>
                    {/* Pixel trees at base */}
                    {[[25,252],[52,254],[88,250],[118,252],[142,248],[610,250],[585,252],[555,246],[630,254]].map(([tx,ty],i) => (
                      <g key={`t${i}`}>
                        <rect x={tx} y={ty-2} width={2} height={10+i%3*2} fill="#3f3f2e"/>
                        <polygon points={`${tx-4},${ty-1} ${tx+1},${ty-14-i%4*3} ${tx+6},${ty-1}`} fill={i%2===0?"#14532d":"#1a4a2e"}/>
                        <polygon points={`${tx-3},${ty-6} ${tx+1},${ty-18-i%3*2} ${tx+5},${ty-6}`} fill={i%2===0?"#166534":"#1a5a2e"}/>
                      </g>
                    ))}
                    {/* Campfire at base camp (pixel art) */}
                    <rect x="72" y="244" width="2" height="4" fill="#78716c"/>
                    <rect x="78" y="244" width="2" height="4" fill="#78716c"/>
                    <rect x="74" y="244" width="6" height="2" fill="#78716c"/>
                    <rect x="74" y="240" width="2" height="4" fill="#f59e0b"/>
                    <rect x="76" y="238" width="2" height="6" fill="#ef4444"/>
                    <rect x="78" y="240" width="2" height="4" fill="#f59e0b"/>
                    <rect x="76" y="236" width="2" height="2" fill="#fbbf24" opacity="0.7"/>
                    {/* Trail (dashed, not yet reached) */}
                    <polyline points={wp.map(w=>`${w.x},${w.y}`).join(" ")} fill="none" stroke="#c2410c" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.3"/>
                    {/* Trail (solid, reached portion) */}
                    {(() => {
                      const pts = [];
                      for (let i = 0; i < wp.length; i++) {
                        if (score.total >= wp[i].min) { pts.push(`${wp[i].x},${wp[i].y}`); }
                        else { pts.push(`${Math.round(charPos.x)},${Math.round(charPos.y)}`); break; }
                      }
                      return <polyline points={pts.join(" ")} fill="none" stroke="#4ade80" strokeWidth="2" opacity="0.8"/>;
                    })()}
                    {/* Camp markers at each rank waypoint */}
                    {wp.map((w,i) => {
                      const reached = score.total >= w.min;
                      const isSummit = i === wp.length - 1;
                      return (
                        <g key={`wp${i}`}>
                          {/* Tent icon at intermediate camps */}
                          {!isSummit && i > 0 && (
                            <g opacity={reached ? 1 : 0.35}>
                              <polygon points={`${w.x-6},${w.y+5} ${w.x},${w.y-5} ${w.x+6},${w.y+5}`} fill={reached?"#4ade80":"#475569"} opacity="0.6"/>
                              <rect x={w.x-1} y={w.y+1} width={2} height={4} fill={reached?"#4ade80":"#475569"} opacity="0.5"/>
                            </g>
                          )}
                          {/* Flag at summit */}
                          {isSummit && (
                            <g opacity={reached ? 1 : 0.3}>
                              <rect x={w.x} y={w.y-18} width="2" height="18" fill={reached?"#fbbf24":"#475569"}/>
                              <polygon points={`${w.x+2},${w.y-18} ${w.x+14},${w.y-14} ${w.x+2},${w.y-10}`} fill={reached?"#fbbf24":"#475569"}/>
                            </g>
                          )}
                          {/* Base camp marker */}
                          {i === 0 && !isSummit && (
                            <rect x={w.x-3} y={w.y-3} width="6" height="6" fill={reached?"#4ade80":"#475569"} opacity="0.7" rx="1"/>
                          )}
                          {/* Label */}
                          <text x={w.x} y={w.y+(isSummit?-22:16)} textAnchor="middle" fill={reached?"#4ade80":"#475569"} fontSize="7" fontFamily="'Courier New',monospace" fontWeight={reached?"bold":"normal"} style={{textShadow:reached?"0 0 4px rgba(74,222,128,0.3)":"none"}}>{w.title}</text>
                          {i > 0 && <text x={w.x} y={w.y+(isSummit?-32:24)} textAnchor="middle" fill={reached?"#5eead4":"#334155"} fontSize="6" fontFamily="'Courier New',monospace">{w.min} ft</text>}
                        </g>
                      );
                    })}
                    {/* ═══ PIXEL HIKER CHARACTER ═══ */}
                    {hPx.map((row,ry) => [...row].map((c,rx) => {
                      if (c!=="." && hC[c]) return <rect key={`h${ry}${rx}`} x={Math.round(charPos.x)-12+rx*pxSz} y={Math.round(charPos.y)-33+ry*pxSz} width={pxSz} height={pxSz} fill={hC[c]}/>;
                      return null;
                    }))}
                    {/* Walking stick (Trail Runner+) */}
                    {score.total >= 100 && <line x1={Math.round(charPos.x)+14} y1={Math.round(charPos.y)-22} x2={Math.round(charPos.x)+18} y2={Math.round(charPos.y)+2} stroke="#a8a29e" strokeWidth="2" strokeLinecap="round"/>}
                    {/* Compass (Mountaineer+) */}
                    {score.total >= 300 && <><circle cx={Math.round(charPos.x)-14} cy={Math.round(charPos.y)-16} r="4" fill="none" stroke="#4ade80" strokeWidth="1.2"/><circle cx={Math.round(charPos.x)-14} cy={Math.round(charPos.y)-16} r="1" fill="#4ade80"/></>}
                    {/* Rope coil (Alpine Guide+) */}
                    {score.total >= 600 && <ellipse cx={Math.round(charPos.x)+3} cy={Math.round(charPos.y)-26} rx="5" ry="3" fill="none" stroke="#fbbf24" strokeWidth="1.2"/>}
                    {/* Ice axe (Summiteer+) */}
                    {score.total >= 1000 && <><line x1={Math.round(charPos.x)-16} y1={Math.round(charPos.y)-25} x2={Math.round(charPos.x)-22} y2={Math.round(charPos.y)-12} stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round"/><line x1={Math.round(charPos.x)-20} y1={Math.round(charPos.y)-13} x2={Math.round(charPos.x)-24} y2={Math.round(charPos.y)-15} stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round"/></>}
                    {/* Telescope (Cartographer) */}
                    {score.total >= 2000 && <><line x1={Math.round(charPos.x)+16} y1={Math.round(charPos.y)-28} x2={Math.round(charPos.x)+26} y2={Math.round(charPos.y)-36} stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/><circle cx={Math.round(charPos.x)+27} cy={Math.round(charPos.y)-37} r="3" fill="none" stroke="#f59e0b" strokeWidth="1.2"/></>}
                    {/* Character label */}
                    <text x={Math.round(charPos.x)} y={Math.round(charPos.y)-36} textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="'Courier New',monospace" fontWeight="bold" style={{textShadow:"0 0 6px rgba(74,222,128,0.4)"}}>{obName}</text>
                    {/* Elevation badge near character */}
                    <rect x={Math.round(charPos.x)+18} y={Math.round(charPos.y)-10} width="40" height="12" rx="2" fill="#0f172a" stroke="#4ade80" strokeWidth="0.8" opacity="0.85"/>
                    <text x={Math.round(charPos.x)+38} y={Math.round(charPos.y)-1} textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="'Courier New',monospace" fontWeight="bold">{score.total}ft</text>
                  </svg>

                  {/* ═══ TRAIL LOG ═══ */}
                  <div style={{ padding:"14px 20px", borderTop:"1px solid #1e293b", fontFamily:"'Courier New',monospace" }}>
                    {msgs.map((m,i) => (
                      <p key={i} style={{ color:i===0?"#4ade80":i===1?"#5eead4":"#64748b", fontSize:12, marginBottom:3, textShadow:i<2?"0 0 6px rgba(74,222,128,0.15)":"none", letterSpacing:0.5, lineHeight:"1.6" }}>
                        <span style={{ color:"#4ade80", marginRight:6 }}>&gt;</span>{m}
                      </p>
                    ))}
                    <p style={{ color:"#4ade80", fontSize:12, marginTop:2 }}>
                      <span style={{ marginRight:6 }}>&gt;</span>
                      <span style={{ animation:"crt-blink 1s step-start infinite" }}>{"\u2588"}</span>
                    </p>
                  </div>

                  {/* ═══ STATS BAR ═══ */}
                  <div style={{ padding:"8px 20px", borderTop:"1px solid #1e293b", display:"flex", gap:16, fontFamily:"'Courier New',monospace", fontSize:10, color:"#4ade80", textShadow:"0 0 4px rgba(74,222,128,0.15)", letterSpacing:1, flexWrap:"wrap" }}>
                    <span>RANK:<span style={{color:"#fbbf24",marginLeft:4}}>{rank.title.toUpperCase()}</span></span>
                    <span>ELEV:<span style={{color:"#fbbf24",marginLeft:4}}>{score.total}FT</span></span>
                    <span>COURSES:<span style={{color:"#5eead4",marginLeft:4}}>{courses.length}</span></span>
                    <span>BOOKS:<span style={{color:"#5eead4",marginLeft:4}}>{books.length}</span></span>
                    <span>ARTICLES:<span style={{color:"#5eead4",marginLeft:4}}>{articles.length}</span></span>
                    <span>MEDIA:<span style={{color:"#5eead4",marginLeft:4}}>{media.length}</span></span>
                    {nextRank && <span>NEXT:<span style={{color:"#fbbf24",marginLeft:4}}>{nextRank.title.toUpperCase()} ({nextRank.min}FT)</span></span>}
                  </div>

                  {/* ═══ PROGRESS BAR ═══ */}
                  {nextRank && (
                    <div style={{ padding:"6px 20px 10px", fontFamily:"'Courier New',monospace" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ color:"#475569", fontSize:9, minWidth:60 }}>{rank.title}</span>
                        <div style={{ flex:1, height:6, background:"#1e293b", borderRadius:1, overflow:"hidden", border:"1px solid #334155" }}>
                          <div style={{ height:"100%", background:"linear-gradient(90deg,#0d9488,#4ade80)", borderRadius:1, transition:"width 0.5s", width:`${Math.min(100,((score.total-rank.min)/(nextRank.min-rank.min))*100)}%` }} />
                        </div>
                        <span style={{ color:"#475569", fontSize:9, minWidth:60, textAlign:"right" }}>{nextRank.title}</span>
                      </div>
                    </div>
                  )}

                  {/* ═══ MENU OPTIONS ═══ */}
                  <div style={{ padding:"14px 20px 18px", borderTop:"1px solid #1e293b", fontFamily:"'Courier New',monospace" }}>
                    <p style={{ color:"#4ade80", fontSize:12, marginBottom:10, letterSpacing:1, textShadow:"0 0 6px rgba(74,222,128,0.2)" }}>
                      What would you like to do?
                    </p>
                    {[
                      { key:"1", label:"Continue on the trail", v:"today", desc:"Today's Plan" },
                      { key:"2", label:"Survey from camp", v:"dashboard", desc:"Dashboard" },
                      { key:"3", label:"Scout new paths", v:"discover", desc:"Discover" },
                      { key:"4", label:"Chart your route", v:"arcs", desc:"Learn Arcs" },
                      { key:"5", label:"Review your journal", v:"flashcards", desc:"Flashcards" },
                      { key:"6", label:"Talk to the guide", v:"chat", desc:"AI Assistant" },
                    ].map(opt => (
                      <button key={opt.key} onClick={() => setView(opt.v)}
                        className="group"
                        style={{ display:"block", background:"transparent", border:"none", fontFamily:"'Courier New',monospace", fontSize:13, color:"#64748b", cursor:"pointer", padding:"5px 0", textAlign:"left", width:"100%", letterSpacing:0.5, transition:"color 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color="#4ade80"; e.currentTarget.style.textShadow="0 0 8px rgba(74,222,128,0.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color="#64748b"; e.currentTarget.style.textShadow="none"; }}>
                        <span style={{ color:"#fbbf24", marginRight:8 }}>{opt.key}.</span>
                        {opt.label}
                        <span style={{ color:"#334155", marginLeft:8, fontSize:11 }}>[ {opt.desc} ]</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Power LED and brand */}
                <div style={{ display:"flex", justifyContent:"center", alignItems:"center", marginTop:10, gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 8px rgba(74,222,128,0.6)" }} />
                  <span style={{ fontFamily:"'Courier New',monospace", fontSize:8, color:"#78716c", letterSpacing:2 }}>POWER</span>
                </div>
              </div>
            </div>
            );
          })()}

          {/* DASHBOARD */}
          {view === "dashboard" && (
            <div>
              <h2 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: "Georgia, serif" }}>Welcome back, {obName}</h2>
              <p className="text-stone-500 text-sm mb-2">Here's your ascent at a glance.</p>
              {/* Summit Map */}
              {goals.length > 0 && (
                <div className="mb-5">
                  <SummitMapSVG goals={goals} arcs={arcs} arcActivePhase={arcActivePhase} score={score.total} />
                </div>
              )}

              {syncStatus && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 mb-4 text-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-emerald-700">Synced {syncStatus.count} courses from <strong>{syncStatus.platform}</strong> at {syncStatus.time}</span>
                  <button onClick={() => window.dispatchEvent(new Event("learnspace-request-sync"))} className="ml-auto text-xs text-emerald-600 hover:underline">Re-sync</button>
                </div>
              )}

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><Mountain size={20} className="text-orange-700" /><span className="text-sm font-medium text-orange-800">Elevation</span><span className={`text-xs px-2 py-0.5 rounded-full ${getRank(score.total).tierColor}`}>{getRank(score.total).title}</span></div>
                    <p className="text-4xl font-bold text-orange-900" style={{ fontFamily: "Georgia, serif" }}>{score.total}<span className="text-lg text-stone-400 ml-1">ft</span></p>
                  </div>
                  <div className="text-right text-xs text-orange-800 space-y-0.5">
                    <p>Trails: {score.courses} ft</p><p>Books: {score.books} ft</p><p>Articles: {score.articles} ft</p><p>Media: {score.media} ft</p><p>Resources: {score.resources} ft</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {[
                  { I: BookOpen, l: "Courses", v: courses.length, c: "text-blue-500" },
                  { I: Bookmark, l: "Books", v: books.length, c: "text-purple-500" },
                  { I: FileText, l: "Unread", v: articles.filter(a => !a.read).length, c: "text-orange-500" },
                  { I: Users, l: "Researchers", v: researchers.length, c: "text-green-500" },
                  { I: Globe, l: "Resources", v: resources.length, c: "text-sky-500" },
                  { I: PlayCircle, l: "Media", v: media.length, c: "text-red-500" },
                ].map(s => (
                  <div key={s.l} className="bg-white rounded-lg border border-stone-200 p-4">
                    <div className="flex items-center gap-2 mb-1"><s.I size={15} className={s.c} /><span className="text-xs text-stone-500">{s.l}</span></div>
                    <p className="text-xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>{s.v}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mt-6 mb-3">In Progress</h3>
              <div className="space-y-2 mb-6">
                {courses.filter(c => c.status === "in-progress").slice(0, 4).map(c => (
                  <div key={c.id} className="bg-white rounded-lg border border-stone-200 p-3 flex items-center gap-3">
                    <BookOpen size={16} className="text-stone-400" />
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div className="flex items-center gap-2"><span className="text-sm font-medium text-stone-800 truncate">{c.title}</span><Bdg c={pColor(c.platform)}>{c.platform}</Bdg></div>
                      <PBar v={c.progress} />
                    </div>
                    <span className="text-xs text-stone-500">{c.progress}%</span>
                  </div>
                ))}
                {books.filter(b => b.status === "reading").slice(0, 2).map(b => (
                  <div key={b.id} className="bg-white rounded-lg border border-stone-200 p-3 flex items-center gap-3">
                    <Bookmark size={16} className="text-stone-400" />
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div className="flex items-center gap-2"><span className="text-sm font-medium text-stone-800 truncate">{b.title}</span><span className="text-xs text-stone-400">by {b.author}</span></div>
                      <PBar v={b.progress} />
                    </div>
                    <span className="text-xs text-stone-500">{b.progress}%</span>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Quick Add</h3>
              <div className="flex flex-wrap gap-2">
                {[["course", "Course"], ["book", "Book"], ["article", "Article"], ["resource", "Resource"], ["media", "Media"]].map(([t, l]) => (
                  <button key={t} onClick={() => openAdd(t)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 hover:border-orange-400 hover:text-orange-800 transition-colors">
                    <Plus size={13} /> {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TODAY'S PLAN */}
          {view === "today" && (
            <div>
              <h2 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: "Georgia, serif" }}>Today's Study Plan</h2>
              <p className="text-stone-500 text-sm mb-4">Personalized recommendations based on your goals and saved content.</p>

              {/* ── Learning Goals Section ── */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-orange-700" />
                    <span className="text-sm font-semibold text-stone-800">Learning Goals</span>
                  </div>
                  <button onClick={() => setShowGoalForm(f => !f)} className="text-xs flex items-center gap-1 text-orange-700 hover:text-orange-800 font-medium">
                    <Plus size={12} /> Add Goal
                  </button>
                </div>

                {goals.length === 0 && !showGoalForm && (
                  <p className="text-xs text-stone-400 text-center py-3">Add learning goals to get personalized recommendations across all your saved content.</p>
                )}

                <div className="flex flex-wrap gap-2 mb-2">
                  {goals.map(g => (
                    <div key={g.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${g.priority === "high" ? "bg-orange-100 text-orange-900 border border-orange-200" : g.priority === "medium" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-stone-100 text-stone-600 border border-stone-200"}`}>
                      <Target size={10} />
                      {g.title}
                      <span className={`text-[9px] px-1 rounded ${g.priority === "high" ? "bg-orange-200 text-orange-900" : g.priority === "medium" ? "bg-blue-100 text-blue-800" : "bg-stone-200 text-stone-700"}`}>{g.priority}</span>
                      <button onClick={() => setGoals(gs => gs.filter(x => x.id !== g.id))} className="ml-0.5 hover:text-red-500 transition-colors"><X size={10} /></button>
                    </div>
                  ))}
                </div>

                {showGoalForm && (
                  <div className="flex gap-2 items-end mt-3 pt-3 border-t border-stone-100">
                    <div className="flex-1">
                      <label className="text-[10px] font-medium text-stone-400 mb-0.5 block">WHAT DO YOU WANT TO LEARN?</label>
                      <input type="text" placeholder="e.g., Master ML fundamentals, Learn React..." className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                        value={goalInput} onChange={e => setGoalInput(e.target.value)} onKeyDown={e => {
                          if (e.key === "Enter" && goalInput.trim()) {
                            setGoals(gs => [...gs, { id: Date.now(), title: goalInput.trim(), priority: goalPriority }]);
                            setGoalInput(""); setShowGoalForm(false);
                          }
                        }} />
                    </div>
                    <select value={goalPriority} onChange={e => setGoalPriority(e.target.value)} className="border border-stone-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-orange-400">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <button onClick={() => {
                      if (goalInput.trim()) {
                        setGoals(gs => [...gs, { id: Date.now(), title: goalInput.trim(), priority: goalPriority }]);
                        setGoalInput(""); setShowGoalForm(false);
                      }
                    }} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors">Add</button>
                  </div>
                )}
              </div>

              {/* ── AI Recommendation Banner ── */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-orange-700" />
                  <span className="text-sm font-semibold text-orange-900">AI Recommendation</span>
                </div>
                <p className="text-sm text-orange-800">
                  {goals.length > 0 ? (() => {
                    const highGoals = goals.filter(g => g.priority === "high");
                    const goalMatched = todayPlan.filter(p => p.goalMatch);
                    const nearFinish = courses.filter(c => c.status === "in-progress" && c.progress >= 70);
                    if (nearFinish.length > 0 && highGoals.length > 0) {
                      return `You're close to finishing ${nearFinish.length} course${nearFinish.length > 1 ? "s" : ""} — today's plan prioritizes that alongside your "${highGoals[0].title}" goal. ${goalMatched.length} of ${todayPlan.length} items directly support your goals.`;
                    } else if (highGoals.length > 0) {
                      return `Today's plan is tuned to your top goal: "${highGoals[0].title}". I found ${goalMatched.length} items across your saved content that align. ${contentSuggestions.length > 0 ? `Plus ${contentSuggestions.length} saved items waiting to be explored.` : ""}`;
                    } else {
                      return `Your plan balances ${goals.length} active goals. ${goalMatched.length} of today's ${todayPlan.length} items align directly with your learning priorities.`;
                    }
                  })() : `Add learning goals above to get smarter, personalized recommendations. I'll match your saved articles, videos, and courses to what you want to learn.`}
                </p>
                <p className="text-xs text-orange-700 mt-2">Est. total: ~{todayPlan.reduce((s, p) => s + parseInt(p.time), 0)} min</p>
              </div>

              {/* ── Today's Tasks ── */}
              <div className="space-y-3">
                {todayPlan.map((p, i) => (
                  <div key={p.id} className={`bg-white rounded-xl border border-stone-200 p-4 flex items-start gap-4 transition-all ${todayChecked[p.id] ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-stone-300" style={{ fontFamily: "Georgia, serif" }}>{i + 1}</span>
                      <button onClick={() => setTodayChecked(tc => ({ ...tc, [p.id]: !tc[p.id] }))}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todayChecked[p.id] ? "bg-emerald-500 border-emerald-500" : "border-stone-300 hover:border-orange-400"}`}>
                        {todayChecked[p.id] && <Check size={14} className="text-white" />}
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p.icon size={15} className={p.color} />
                        <h3 className={`text-sm font-semibold ${todayChecked[p.id] ? "text-stone-400 line-through" : "text-stone-800"}`}>{p.title}</h3>
                      </div>
                      <p className="text-xs text-stone-500">{p.reason}</p>
                      {p.goalMatch && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-orange-800 bg-orange-50 px-2 py-0.5 rounded-full">
                          <Target size={8} /> {p.goalMatch}
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-medium bg-stone-100 text-stone-600 px-2 py-1 rounded-full">{p.time}</span>
                      {p.type === "flashcard" && (
                        <button onClick={() => { setView("flashcards"); }} className="block text-xs text-orange-700 hover:underline mt-1">Start</button>
                      )}
                      {p.type === "discover" && (
                        <button onClick={() => { setView("discover"); }} className="block text-xs text-indigo-600 hover:underline mt-1">Browse</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Content Suggestions (from saved items) ── */}
              {contentSuggestions.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={16} className="text-teal-600" />
                    <h3 className="text-sm font-semibold text-stone-700">Saved Content That Matches Your Goals</h3>
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
                    {contentSuggestions.map((s, i) => {
                      const typeIcon = s._type === "article" ? FileText : s._type === "media" ? (s.type === "podcast" ? Headphones : Video) : s._type === "book" ? Bookmark : s._type === "course" ? BookOpen : Globe;
                      const typeColor = s._type === "article" ? "text-orange-500" : s._type === "media" ? "text-red-500" : s._type === "book" ? "text-purple-500" : s._type === "course" ? "text-blue-500" : "text-sky-500";
                      const TypeIcon = typeIcon;
                      return (
                        <div key={`sug-${i}`} className="bg-white border border-stone-200 rounded-lg p-3 hover:border-orange-300 transition-colors">
                          <div className="flex items-start gap-2">
                            <TypeIcon size={14} className={`${typeColor} mt-0.5 flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-stone-800 truncate">{s.title || s.name}</p>
                              <p className="text-[10px] text-stone-400 mt-0.5">{s._type} {s.author || s.creator || s.source || s.platform || ""}</p>
                              {s.rel.goal && (
                                <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-medium text-orange-800 bg-orange-50 px-1.5 py-0.5 rounded-full">
                                  <Target size={7} /> {s.rel.goal.title}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {Array.from({ length: Math.min(3, Math.ceil(s.rel.score / 2)) }, (_, j) => (
                                <Zap key={j} size={8} className="text-teal-500 fill-orange-400" />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 text-center">Relevance based on keyword matching between your goals and saved content</p>
                </div>
              )}

              {/* ── Completion celebration ── */}
              {Object.values(todayChecked).filter(Boolean).length === todayPlan.length && todayPlan.length > 0 && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                  <Award size={32} className="text-emerald-500 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-emerald-800" style={{ fontFamily: "Georgia, serif" }}>Plan Complete!</h3>
                  <p className="text-sm text-emerald-600">Amazing work today. Consistency compounds.</p>
                </div>
              )}
            </div>
          )}

          {/* DISCOVER */}
          {view === "discover" && (
            <div>
              <h2 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: "Georgia, serif" }}>Discover</h2>
              <p className="text-stone-500 text-sm mb-4">High-quality content sourced for you based on your learning profile, goals, and feedback.</p>

              {/* Topic profile summary */}
              {profileTopics.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={14} className="text-orange-700" />
                    <span className="text-xs font-semibold text-stone-700">Your Learning Profile</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profileTopics.slice(0, 12).map(([topic, weight], i) => (
                      <span key={topic} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${i < 3 ? "bg-orange-100 text-orange-900" : i < 7 ? "bg-blue-50 text-blue-700" : "bg-stone-100 text-stone-500"}`}>
                        {topic} <span className="opacity-50">{weight}</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2">Weights are auto-computed from your courses, books, articles, goals, and saved content. Upvotes and downvotes refine these signals.</p>
                </div>
              )}

              {/* Discovery cards */}
              {discoveries.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                  <Compass size={40} className="text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-600 font-medium">No discoveries yet</p>
                  <p className="text-xs text-stone-400 mt-1">Add learning goals and content to your library — the AI will start sourcing relevant material.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {discoveries.map(d => {
                    const vote = discoveryVotes[d.id] || 0;
                    const typeIcons = { video: Video, podcast: Headphones, course: BookOpen, book: Bookmark, article: FileText };
                    const typeColors = { video: "text-red-500", podcast: "text-green-500", course: "text-blue-500", book: "text-purple-500", article: "text-orange-500" };
                    const TypeIcon = typeIcons[d.type] || Globe;
                    return (
                      <div key={d.id} className={`bg-white rounded-xl border p-4 transition-all ${vote > 0 ? "border-emerald-200 bg-emerald-50/30" : "border-stone-200 hover:border-orange-200"}`}>
                        <div className="flex items-start gap-3">
                          {/* Vote buttons */}
                          <div className="flex flex-col items-center gap-1 pt-1">
                            <button onClick={() => setDiscoveryVotes(v => ({ ...v, [d.id]: v[d.id] === 1 ? 0 : 1 }))}
                              className={`p-1 rounded transition-colors ${vote > 0 ? "text-emerald-600 bg-emerald-100" : "text-stone-300 hover:text-emerald-500 hover:bg-emerald-50"}`}>
                              <ThumbsUp size={14} />
                            </button>
                            <button onClick={() => setDiscoveryVotes(v => ({ ...v, [d.id]: -1 }))}
                              className={`p-1 rounded transition-colors ${vote < 0 ? "text-red-500 bg-red-50" : "text-stone-300 hover:text-red-400 hover:bg-red-50"}`}>
                              <ThumbsDown size={14} />
                            </button>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <TypeIcon size={14} className={typeColors[d.type] || "text-stone-400"} />
                              <h3 className="text-sm font-semibold text-stone-800">{d.title}</h3>
                            </div>
                            <p className="text-xs text-stone-500 mb-1">by {d.author} &middot; {d.platform}</p>
                            <p className="text-xs text-stone-600 mb-2">{d.reason}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${d.difficulty === "beginner" ? "bg-green-100 text-green-700" : d.difficulty === "intermediate" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-700"}`}>
                                {d.difficulty}
                              </span>
                              {d.bestGoal && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-orange-800 bg-orange-50 px-1.5 py-0.5 rounded-full">
                                  <Target size={7} /> {d.bestGoal.title}
                                </span>
                              )}
                              {d.arcPhase && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                  <Map size={7} /> {d.arcPhase.phaseName}
                                </span>
                              )}
                              {d.topics.slice(0, 4).map(t => (
                                <span key={t} className="text-[9px] text-stone-400 bg-stone-50 px-1 py-0.5 rounded">{t}</span>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <button onClick={() => addDiscoveryToLibrary(d)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-orange-700 hover:bg-orange-800 text-white rounded-lg text-xs font-medium transition-colors">
                              <Plus size={12} /> Add
                            </button>
                            {d.url && (
                              <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-stone-400 hover:text-orange-700">
                                <ExternalLink size={10} /> Open
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {Object.values(discoveryVotes).filter(v => v !== 0).length > 0 && (
                <p className="text-[10px] text-stone-400 mt-4 text-center">
                  {Object.values(discoveryVotes).filter(v => v > 0).length} upvoted, {Object.values(discoveryVotes).filter(v => v < 0).length} downvoted — the algorithm is learning your taste
                </p>
              )}
            </div>
          )}

          {/* LEARN ARCS */}
          {view === "arcs" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>Learn Arcs</h2>
              </div>
              <p className="text-stone-500 text-sm mb-5">Structured learning paths built from your goals. The AI sources content for each phase.</p>

              {/* Arc builder prompt */}
              {goals.filter(g => !arcs.find(a => a.goalId === g.id)).length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-orange-700" />
                    <span className="text-sm font-semibold text-orange-900">Build an Arc from a Goal</span>
                  </div>
                  <p className="text-xs text-orange-800 mb-3">Select a goal and the AI will generate a phased learning path with curated content for each stage.</p>
                  <div className="flex flex-wrap gap-2">
                    {goals.filter(g => !arcs.find(a => a.goalId === g.id)).map(g => (
                      <button key={g.id} onClick={() => buildArc(g)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs font-medium text-orange-900 hover:bg-orange-100 transition-colors">
                        <Target size={11} /> {g.title} <ArrowRight size={10} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing arcs */}
              {arcs.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                  <Map size={40} className="text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-600 font-medium">No arcs yet</p>
                  <p className="text-xs text-stone-400 mt-1">Add goals in Today's Plan, then come here to build structured learning paths.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {arcs.map(arc => {
                    const activeIdx = arcActivePhase[arc.id] || 0;
                    const completedCount = arc.phases.filter((_, i) => i < activeIdx).length;
                    const pct = Math.round((completedCount / arc.phases.length) * 100);
                    const matchingGoal = goals.find(g => g.id === arc.goalId);
                    // Find discoveries matching current phase
                    const phaseDiscoveries = discoveries.filter(d => {
                      const phase = arc.phases[activeIdx];
                      if (!phase) return false;
                      return d.topics.some(t => phase.topics.includes(t));
                    }).slice(0, 4);

                    return (
                      <div key={arc.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                        {/* Arc header */}
                        <div className="p-4 border-b border-stone-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Map size={16} className="text-teal-600" />
                              <h3 className="text-base font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>{arc.title}</h3>
                            </div>
                            {matchingGoal && (
                              <span className="text-[10px] font-medium text-orange-800 bg-orange-50 px-2 py-0.5 rounded-full">
                                {matchingGoal.priority} priority
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-stone-200 rounded-full h-1.5">
                              <div className="bg-teal-600 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-stone-500">{completedCount}/{arc.phases.length} phases</span>
                          </div>
                        </div>

                        {/* Phases */}
                        <div className="p-4">
                          <div className="space-y-2">
                            {arc.phases.map((phase, idx) => {
                              const isActive = idx === activeIdx;
                              const isDone = idx < activeIdx;
                              return (
                                <div key={phase.id} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${isActive ? "bg-orange-50 border border-orange-200" : isDone ? "bg-emerald-50/50" : "bg-stone-50"}`}>
                                  <div className="flex-shrink-0 mt-0.5">
                                    {isDone ? (
                                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={12} className="text-white" /></div>
                                    ) : isActive ? (
                                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"><span className="text-xs text-white font-bold">{idx + 1}</span></div>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center"><span className="text-xs text-stone-500">{idx + 1}</span></div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-semibold ${isDone ? "text-emerald-700 line-through" : isActive ? "text-orange-900" : "text-stone-500"}`}>{phase.name}</h4>
                                    <p className={`text-xs ${isActive ? "text-orange-800" : "text-stone-400"}`}>{phase.desc} &middot; ~{phase.weeks} weeks</p>
                                    {isActive && phase.topics.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {phase.topics.map(t => <span key={t} className="text-[9px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full">{t}</span>)}
                                      </div>
                                    )}
                                  </div>
                                  {isActive && (
                                    <button onClick={() => setArcActivePhase(prev => ({ ...prev, [arc.id]: Math.min(activeIdx + 1, arc.phases.length - 1) }))}
                                      className="flex items-center gap-1 px-2 py-1 bg-orange-700 text-white rounded text-xs font-medium hover:bg-orange-600 transition-colors flex-shrink-0">
                                      <Check size={10} /> Done
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Phase-matched discoveries */}
                          {phaseDiscoveries.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-stone-100">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Compass size={12} className="text-teal-600" />
                                <span className="text-xs font-semibold text-stone-600">Sourced for this phase</span>
                              </div>
                              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                                {phaseDiscoveries.map(d => {
                                  const typeIcons = { video: Video, podcast: Headphones, course: BookOpen, book: Bookmark, article: FileText };
                                  const TypeIcon = typeIcons[d.type] || Globe;
                                  return (
                                    <div key={d.id} className="bg-stone-50 rounded-lg p-2.5 flex items-start gap-2">
                                      <TypeIcon size={12} className="text-stone-400 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-stone-700 truncate">{d.title}</p>
                                        <p className="text-[10px] text-stone-400">{d.author}</p>
                                      </div>
                                      <button onClick={() => addDiscoveryToLibrary(d)} className="text-teal-600 hover:text-orange-700 flex-shrink-0"><Plus size={12} /></button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Delete arc */}
                        <div className="px-4 py-2 border-t border-stone-100 flex justify-end">
                          <button onClick={() => setArcs(prev => prev.filter(a => a.id !== arc.id))} className="text-xs text-stone-400 hover:text-red-500 transition-colors">Remove arc</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FLASHCARDS */}
          {view === "flashcards" && (
            <div>
              <h2 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: "Georgia, serif" }}>Flashcard Review</h2>
              <p className="text-stone-500 text-sm mb-6">Reinforce what you've learned. {flashcards.length} cards from your notes, takeaways, and research.</p>

              {flashcards.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                  <Award size={40} className="text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-600 font-medium">No flashcards yet</p>
                  <p className="text-xs text-stone-400 mt-1">Add notes and key takeaways to your books, articles, and courses to generate flashcards.</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-stone-500">Card {fcIdx + 1} of {flashcards.length}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400">{Object.values(fcMastery).filter(v => v >= 2).length} mastered</span>
                      <div className="w-32 bg-stone-200 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(Object.values(fcMastery).filter(v => v >= 2).length / flashcards.length) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFcFlipped(f => !f)}
                    className="bg-white rounded-xl border-2 border-stone-200 hover:border-orange-300 transition-all cursor-pointer"
                    style={{ minHeight: 250, perspective: 1000 }}>
                    <div className="p-8 flex flex-col items-center justify-center" style={{ minHeight: 250 }}>
                      {!fcFlipped ? (
                        <div className="text-center">
                          <Bdg c={flashcards[fcIdx].cat === "book" ? "bg-purple-100 text-purple-700" : flashcards[fcIdx].cat === "article" ? "bg-orange-100 text-orange-700" : flashcards[fcIdx].cat === "course" ? "bg-blue-100 text-blue-700" : flashcards[fcIdx].cat === "researcher" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-800"}>
                            {flashcards[fcIdx].cat}
                          </Bdg>
                          <p className="text-lg font-semibold text-stone-800 mt-4" style={{ fontFamily: "Georgia, serif" }}>{flashcards[fcIdx].front}</p>
                          <p className="text-xs text-stone-400 mt-4">Tap to reveal answer</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-orange-700 font-medium mb-2">Answer</p>
                          <p className="text-base text-stone-700 leading-relaxed">{flashcards[fcIdx].back}</p>
                          <p className="text-xs text-stone-400 mt-4">Source: {flashcards[fcIdx].src}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button onClick={() => {
                      setFcMastery(m => ({ ...m, [flashcards[fcIdx].id]: Math.max((m[flashcards[fcIdx].id] || 0) - 1, 0) }));
                      setFcFlipped(false);
                      setFcIdx(i => (i + 1) % flashcards.length);
                    }} className="px-5 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                      Review Again
                    </button>
                    <button onClick={() => {
                      setFcFlipped(false);
                      setFcIdx(i => (i + 1) % flashcards.length);
                    }} className="px-5 py-2 bg-stone-100 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors">
                      Next
                    </button>
                    <button onClick={() => {
                      setFcMastery(m => ({ ...m, [flashcards[fcIdx].id]: (m[flashcards[fcIdx].id] || 0) + 1 }));
                      setFcFlipped(false);
                      setFcIdx(i => (i + 1) % flashcards.length);
                    }} className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
                      Got It!
                    </button>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">All Cards</h3>
                    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                      {flashcards.map((c, i) => (
                        <button key={c.id} onClick={() => { setFcIdx(i); setFcFlipped(false); }}
                          className={`text-left p-3 rounded-lg border transition-colors ${i === fcIdx ? "border-orange-400 bg-orange-50" : "border-stone-200 bg-white hover:border-stone-300"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <Bdg c={c.cat === "book" ? "bg-purple-100 text-purple-700" : c.cat === "article" ? "bg-orange-100 text-orange-700" : c.cat === "course" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}>{c.cat}</Bdg>
                            {(fcMastery[c.id] || 0) >= 2 && <Check size={12} className="text-emerald-500" />}
                          </div>
                          <p className="text-xs text-stone-600 truncate">{c.front}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COURSES */}
          {view === "courses" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>Courses</h2>
                <button onClick={() => openAdd("course")} className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={14} /> Add</button>
              </div>
              <Chips val={filter} onChange={setFilter} opts={[{ v: "all", l: "All" }, { v: "in-progress", l: "In Progress" }, { v: "completed", l: "Completed" }, { v: "paused", l: "Paused" }]} />
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))" }}>
                {fil(courses, ["title", "platform", "category"]).filter(c => filter === "all" || c.status === filter).map(c => (
                  <div key={c.id} className="bg-white rounded-lg border border-stone-200 p-4 hover:border-stone-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <Bdg c={pColor(c.platform)}>{c.platform}</Bdg>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit("course", c)} className="p-1 text-stone-400 hover:text-orange-700"><Edit3 size={13} /></button>
                        <button onClick={() => del("course", c.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-stone-800 mb-1">{c.title}</h3>
                    {c.category && <span className="text-xs text-stone-400">{c.category}</span>}
                    <div className="flex items-center gap-2 mt-3"><PBar v={c.progress} /><span className="text-xs font-medium text-stone-600">{c.progress}%</span></div>
                    {c.notes && <p className="text-xs text-stone-500 mt-2">{c.notes}</p>}
                    <div className="flex items-center gap-1 mt-2">
                      {c.status === "completed" ? <Check size={12} className="text-emerald-500" /> : <Clock size={12} className="text-teal-600" />}
                      <span className="text-xs text-stone-400">{c.status.replace(/-/g, " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOOKS */}
          {view === "books" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>Books</h2>
                <button onClick={() => openAdd("book")} className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={14} /> Add</button>
              </div>
              <Chips val={filter} onChange={setFilter} opts={[{ v: "all", l: "All" }, { v: "reading", l: "Reading" }, { v: "completed", l: "Completed" }, { v: "want-to-read", l: "Want to Read" }]} />
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {fil(books, ["title", "author", "genre"]).filter(b => filter === "all" || b.status === filter).map(b => (
                  <div key={b.id} className="bg-white rounded-lg border border-stone-200 p-4 hover:border-stone-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <Bdg c="bg-purple-100 text-purple-700">{b.genre || "Book"}</Bdg>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit("book", b)} className="p-1 text-stone-400 hover:text-orange-700"><Edit3 size={13} /></button>
                        <button onClick={() => del("book", b.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-stone-800">{b.title}</h3>
                    <p className="text-xs text-stone-400 mb-2">by {b.author}</p>
                    {b.status !== "want-to-read" && <div className="flex items-center gap-2 mb-2"><PBar v={b.progress} /><span className="text-xs font-medium text-stone-600">{b.progress}%</span></div>}
                    {b.rating > 0 && <StarsUI n={b.rating} />}
                    {b.notes && <p className="text-xs text-stone-500 mt-2">{b.notes}</p>}
                    {b.keyTakeaways && <div className="mt-2 bg-orange-50 rounded p-2"><p className="text-xs text-orange-900"><strong>Takeaways:</strong> {b.keyTakeaways}</p></div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* READING LIST */}
          {view === "reading" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>Reading List</h2>
                <button onClick={() => openAdd("article")} className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={14} /> Add</button>
              </div>
              <Chips val={filter} onChange={setFilter} opts={[{ v: "all", l: "All" }, { v: "unread", l: "Unread" }, { v: "read", l: "Read" }]} />
              <div className="space-y-2">
                {fil(articles, ["title", "source"]).filter(a => filter === "all" || (filter === "read" ? a.read : !a.read)).map(a => (
                  <div key={a.id} className="bg-white rounded-lg border border-stone-200 p-3 flex items-center gap-3">
                    <button onClick={() => setArticles(arr => arr.map(x => x.id === a.id ? { ...x, read: !x.read } : x))}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${a.read ? "bg-emerald-500 border-emerald-500" : "border-stone-300 hover:border-orange-400"}`}>
                      {a.read && <Check size={12} className="text-white" />}
                    </button>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <h3 className={`text-sm font-medium ${a.read ? "text-stone-400 line-through" : "text-stone-800"}`}>{a.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-stone-400">{a.source}</span>
                        {a.tags?.map(t => <Bdg key={t} c="bg-stone-100 text-stone-500">{t}</Bdg>)}
                      </div>
                      {a.notes && <p className="text-xs text-stone-500 mt-1">{a.notes}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit("article", { ...a, tagsStr: (a.tags || []).join(", ") })} className="p-1 text-stone-400 hover:text-orange-700"><Edit3 size={13} /></button>
                      <button onClick={() => del("article", a.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESEARCH */}
          {view === "research" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>Research & Academics</h2>
                <button onClick={() => openAdd("researcher")} className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={14} /> Add</button>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                {fil(researchers, ["name", "field", "institution"]).map(r => (
                  <div key={r.id} className="bg-white rounded-lg border border-stone-200 p-4 hover:border-stone-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div><h3 className="text-sm font-semibold text-stone-800">{r.name}</h3><p className="text-xs text-stone-400">{r.institution}</p></div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit("researcher", { ...r, papersStr: (r.papers || []).join(", ") })} className="p-1 text-stone-400 hover:text-orange-700"><Edit3 size={13} /></button>
                        <button onClick={() => del("researcher", r.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <Bdg c="bg-emerald-100 text-emerald-700">{r.field}</Bdg>
                    {r.papers?.length > 0 && <div className="mt-3"><p className="text-xs font-medium text-stone-500 mb-1">Key Papers</p>{r.papers.map((p, i) => <p key={i} className="text-xs text-stone-600 flex items-center gap-1"><ChevronRight size={10} /> {p}</p>)}</div>}
                    {r.notes && <p className="text-xs text-stone-500 mt-2 italic">{r.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESOURCES */}
          {view === "resources" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>Resources</h2>
                <button onClick={() => openAdd("resource")} className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={14} /> Add</button>
              </div>
              <Chips val={filter} onChange={setFilter} opts={[{ v: "all", l: "All" }, { v: "twitter-thread", l: "Twitter Threads" }, { v: "linkedin", l: "LinkedIn" }, { v: "expert-doc", l: "Expert Docs" }]} />
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))" }}>
                {fil(resources, ["title", "author"]).filter(r => filter === "all" || r.type === filter).map(r => (
                  <div key={r.id} className="bg-white rounded-lg border border-stone-200 p-4 hover:border-stone-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <Bdg c={rColor(r.type)}>{rLabel(r.type)}</Bdg>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit("resource", r)} className="p-1 text-stone-400 hover:text-orange-700"><Edit3 size={13} /></button>
                        <button onClick={() => del("resource", r.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-stone-800 mb-1">{r.title}</h3>
                    <p className="text-xs text-stone-400">{r.author}</p>
                    {r.notes && <p className="text-xs text-stone-500 mt-2">{r.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEDIA */}
          {view === "media" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>Media</h2>
                <button onClick={() => openAdd("media")} className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={14} /> Add</button>
              </div>
              <Chips val={filter} onChange={setFilter} opts={[{ v: "all", l: "All" }, { v: "video", l: "Videos" }, { v: "podcast", l: "Podcasts" }]} />
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))" }}>
                {fil(media, ["title", "creator", "platform"]).filter(m => filter === "all" || m.type === filter).map(m => (
                  <div key={m.id} className="bg-white rounded-lg border border-stone-200 p-4 hover:border-stone-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {m.type === "video" ? <Video size={14} className="text-red-500" /> : <Headphones size={14} className="text-green-500" />}
                        <Bdg c={pColor(m.platform)}>{m.platform}</Bdg>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit("media", m)} className="p-1 text-stone-400 hover:text-orange-700"><Edit3 size={13} /></button>
                        <button onClick={() => del("media", m.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-stone-800">{m.title}</h3>
                    <p className="text-xs text-stone-400 mb-2">by {m.creator}</p>
                    <div className="flex items-center gap-1">
                      {m.status === "completed" ? <Check size={12} className="text-emerald-500" /> : m.status === "in-progress" ? <Clock size={12} className="text-teal-600" /> : <PlayCircle size={12} className="text-stone-400" />}
                      <span className="text-xs text-stone-400">{m.status.replace(/-/g, " ")}</span>
                    </div>
                    {m.notes && <p className="text-xs text-stone-500 mt-2">{m.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI CHAT */}
          {view === "about" && (
            <div className="max-w-3xl mx-auto">
              {/* Hero */}
              <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                    <PixelLogo size={64} />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-stone-800 mb-3" style={{ fontFamily: "Georgia, serif" }}>
                  Altius
                </h1>
                <p className="text-lg text-stone-500 italic" style={{ fontFamily: "Georgia, serif" }}>
                  Learn More, Climb Higher.
                </p>
              </div>

              {/* Philosophy */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 mb-6">
                <p className="text-stone-600 leading-relaxed mb-4" style={{ fontFamily: "Georgia, serif", fontSize: "15px" }}>
                  Every great summit begins with a single step on the trail. Altius is built on a simple belief: that the most extraordinary thing a person can do is decide to learn — and then keep climbing. Through morning fog, steep switchbacks, and those breathless moments where the path disappears into cloud, the learner who presses on discovers views the valley could never imagine.
                </p>
                <p className="text-stone-600 leading-relaxed mb-4" style={{ fontFamily: "Georgia, serif", fontSize: "15px" }}>
                  We built Altius for the self-taught, the endlessly curious, the midnight readers and weekend coders. For anyone who has twenty browser tabs of courses, a shelf of half-finished books, and a burning feeling that all of it connects — if only there were a map.
                </p>
                <p className="text-stone-600 leading-relaxed" style={{ fontFamily: "Georgia, serif", fontSize: "15px" }}>
                  This is that map. Your personal base camp. A place to organize everything you're learning across every platform, chart your path up the mountain, and watch yourself ascend — one completed course, one finished chapter, one new idea at a time.
                </p>
              </div>

              {/* How It Works */}
              <h2 className="text-2xl font-bold text-stone-800 mb-4" style={{ fontFamily: "Georgia, serif" }}>
                How It Works
              </h2>

              <div className="space-y-4 mb-8">
                {[
                  {
                    icon: Footprints, color: "text-teal-600", bg: "bg-teal-50",
                    title: "The Trail — Your Home Base",
                    desc: "Start here. A retro-inspired summit view shows exactly where you stand on your journey. Watch your 8-bit mountaineer climb higher as you learn. Your trail log records every milestone — courses completed, books finished, new resources discovered."
                  },
                  {
                    icon: Home, color: "text-orange-700", bg: "bg-orange-50",
                    title: "Dashboard — The Full Picture",
                    desc: "Your command center. See all your scores at a glance, track elevation across categories, and manage your learning goals. This is where ambition meets organization."
                  },
                  {
                    icon: Target, color: "text-rose-600", bg: "bg-rose-50",
                    title: "Today's Plan — AI-Powered Daily Focus",
                    desc: "Every morning, Altius looks at your goals, your progress, and what's been gathering dust — then builds a personalized plan for the day. Smart recommendations that actually know what you're working toward."
                  },
                  {
                    icon: Compass, color: "text-violet-600", bg: "bg-violet-50",
                    title: "Discover — Find Your Next Obsession",
                    desc: "Our AI content engine scours a curated database of the best courses, videos, books, and articles across the internet — then matches them to your interests and goals. Vote to refine your recommendations. Every great learner needs a great librarian."
                  },
                  {
                    icon: Map, color: "text-emerald-600", bg: "bg-emerald-50",
                    title: "Learn Arcs — Structured Paths",
                    desc: "Turn a vague goal like 'Learn Machine Learning' into a phased curriculum with milestones. Arcs break big ambitions into base camps — each one a checkpoint on the way to the summit."
                  },
                  {
                    icon: Award, color: "text-amber-600", bg: "bg-amber-50",
                    title: "Flashcards — Remember What Matters",
                    desc: "Automatically generated from your notes, key takeaways, and course highlights. Flip through what you've learned and track your mastery. Knowledge isn't knowledge if it fades."
                  },
                  {
                    icon: BookOpen, color: "text-sky-600", bg: "bg-sky-50",
                    title: "Your Library — Courses, Books, Articles & More",
                    desc: "Track everything in one place: online courses across every platform, books you're reading, articles and papers, researchers you follow, social media threads, podcasts, videos. Add notes, set progress, mark completions. Nothing falls through the cracks."
                  },
                  {
                    icon: Sparkles, color: "text-pink-600", bg: "bg-pink-50",
                    title: "AI Assistant — Your Trail Guide",
                    desc: "A conversational companion that knows your entire learning profile. Ask for recommendations, check your progress, discuss what you're studying. It's like having a wise guide who's read everything on your bookshelf."
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex gap-4">
                    <div className={`${item.bg} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <item.icon size={20} className={item.color} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800 mb-1" style={{ fontFamily: "Georgia, serif" }}>{item.title}</h3>
                      <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* The Rank System */}
              <h2 className="text-2xl font-bold text-stone-800 mb-4" style={{ fontFamily: "Georgia, serif" }}>
                The Rank System
              </h2>
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-6">
                <p className="text-sm text-stone-500 mb-5 leading-relaxed">
                  Everything you do earns Elevation — a score that reflects the depth and breadth of your learning. As your elevation rises, you ascend through the ranks of a mountaineer, earning new gear and titles along the way.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {RANKS.map(r => (
                    <div key={r.title} className="text-center p-3 rounded-lg bg-stone-50">
                      <MountaineerSVG rank={r} size={44} />
                      <p className="text-xs font-bold mt-1" style={{ color: r.color }}>{r.title}</p>
                      <p className="text-[10px] text-stone-400">{r.min}+ elevation</p>
                      <p className="text-[10px] text-stone-400 italic mt-0.5">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Elevation Scoring */}
              <h2 className="text-2xl font-bold text-stone-800 mb-4" style={{ fontFamily: "Georgia, serif" }}>
                How Elevation Works
              </h2>
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-6">
                <p className="text-sm text-stone-500 mb-4 leading-relaxed">
                  Your elevation score is calculated from real progress — not just logging in. Every completed course, every finished book, every article read and resource saved adds to your altitude. You can customize point values in the Scoring settings.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(scoring).map(([k, v]) => {
                    const labels = { courseComplete: "Course completed", coursePerPct: "Course per % done", bookComplete: "Book finished", bookPerPct: "Book per % read", articleRead: "Article read", mediaComplete: "Media completed", resourceSaved: "Resource saved" };
                    return (
                      <div key={k} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                        <span className="text-xs text-stone-600">{labels[k] || k}</span>
                        <span className="text-xs font-bold text-orange-700">+{v} pts</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Closing */}
              <div className="bg-gradient-to-br from-teal-50 to-orange-50 rounded-2xl border border-stone-200 p-8 mb-6 text-center">
                <Mountain size={28} className="text-teal-600 mx-auto mb-3" />
                <p className="text-stone-700 leading-relaxed italic" style={{ fontFamily: "Georgia, serif", fontSize: "15px" }}>
                  "The summit is not the point. The climb is the point. The view from the top is just proof that you kept going."
                </p>
                <p className="text-xs text-stone-400 mt-4" style={{ fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>
                  ALTIUS COMPUTING CO. — EST. 2026
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Built for learners, by learners. Keep climbing.
                </p>
              </div>
            </div>
          )}

          {view === "chat" && (
            <div className="flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
              <h2 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: "Georgia, serif" }}>AI Learning Assistant</h2>
              <p className="text-sm text-stone-500 mb-4">Chat about your learning, get recommendations, and track progress.</p>
              <div className="flex-1 bg-white border border-stone-200 rounded-xl overflow-auto p-4 mb-3">
                {chat.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles size={32} className="text-teal-500 mx-auto mb-3" />
                    <p className="text-stone-600 font-medium mb-1">Start a conversation</p>
                    <p className="text-xs text-stone-400 mb-4">Ask about your progress, get recommendations, or discuss any topic.</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["How am I doing?", "What should I learn next?", "Tell me about my score"].map(s => (
                        <button key={s} onClick={() => setChatIn(s)} className="text-xs px-3 py-1.5 bg-orange-50 text-orange-800 rounded-full hover:bg-orange-100 transition-colors">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {chat.map((m, i) => (
                  <div key={i} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-orange-700 text-white" : "bg-stone-100 text-stone-800"}`}
                      style={{ borderBottomRightRadius: m.role === "user" ? 4 : undefined, borderBottomLeftRadius: m.role === "ai" ? 4 : undefined }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-stone-100 rounded-2xl px-4 py-3" style={{ borderBottomLeftRadius: 4 }}>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Ask about your learning..." className="flex-1 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white"
                  value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} />
                <button onClick={sendChat} disabled={chatLoading || !chatIn.trim()} className="bg-orange-700 hover:bg-orange-800 text-white px-4 rounded-xl transition-colors" style={{ opacity: chatLoading || !chatIn.trim() ? 0.5 : 1 }}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0,0,0,0.3)" }} onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-auto" style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h3 className="font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>
                {modal === "scoring" ? "Scoring Rules (pts)" : `${editItem ? "Edit" : "Add"} ${modal.charAt(0).toUpperCase() + modal.slice(1)}`}
              </h3>
              <button onClick={() => setModal(null)} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
            </div>
            <div className="p-4">
              {formFields()}
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-orange-700 hover:bg-orange-800 text-white rounded-lg">{modal === "scoring" ? "Done" : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}