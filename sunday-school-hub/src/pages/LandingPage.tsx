import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  CalendarDays,
  BookOpen,
  LineChart,
  MessageSquareText,
  CreditCard,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { JourneyPath } from "@/components/shared/JourneyPath";
import { GeometricPatternDense } from "@/components/shared/GeometricPatternDense";
import { OrnateFlourish } from "@/components/shared/OrnateFlourish";

const features = [
  {
    icon: CalendarDays,
    title: "Classes & schedule",
    desc: "Build classes, assign teachers, and publish the weekly session calendar in minutes.",
    accent: "aurora",
  },
  {
    icon: BookOpen,
    title: "Homework board",
    desc: "A kanban-style board moves each lesson from assigned to graded, visible to every family.",
    accent: "amber",
  },
  {
    icon: LineChart,
    title: "Student progress",
    desc: "Attendance, milestones, and badges roll up into a progress view parents actually check.",
    accent: "grow",
  },
  {
    icon: MessageSquareText,
    title: "Family updates",
    desc: "Post an update once — to one family, one class, or everyone — and it lands right in their portal.",
    accent: "coral",
  },
  {
    icon: CreditCard,
    title: "Online payments",
    desc: "Registration, term, and event fees collected securely through Square, right from the portal.",
    accent: "aurora",
  },
  {
    icon: ShieldCheck,
    title: "Built for trust",
    desc: "Role-based access keeps family records private — parents see their own children, staff see the roster.",
    accent: "amber",
  },
];

const accentBg: Record<string, string> = {
  aurora: "bg-aurora-500/10 text-aurora-600",
  amber: "bg-amber-500/10 text-amber-500",
  grow: "bg-grow-500/10 text-grow-500",
  coral: "bg-coral-500/10 text-coral-700",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-10 pt-20 text-center sm:pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] bg-aurora-glow" />
        <GeometricPatternDense
          id="hero-lattice"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] w-full"
          opacity={0.05}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-black/5 px-4 py-1.5 text-xs font-medium text-twilight-200"
        >
          <span className="pointer-events-none absolute inset-0 -z-10 animate-pulse-glow rounded-full bg-amber-500/10 blur-md" />
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span className="gold-shimmer animate-shimmer font-semibold">Registration is now open for the fall term</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-3xl text-4xl font-semibold leading-tight text-twilight-50 sm:text-6xl"
        >
          One home for your child's{" "}
          <span className="bg-gradient-to-r from-aurora-600 via-amber-700 to-grow-600 bg-clip-text font-serif-display italic text-transparent">
            Sunday School journey
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-5 max-w-xl text-base text-twilight-200 sm:text-lg"
        >
          El Hedaya Islamic School gives families one portal to register, check the schedule,
          follow homework, and pay fees — and gives teachers one place to run every class.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link to="/signup" className="btn-primary">
            Register your family <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="btn-secondary">
            Staff &amp; teacher sign in
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.45 }}>
          <OrnateFlourish className="mt-14" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative mx-auto mt-8 max-w-4xl"
        >
          <JourneyPath />
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-aurora-600">Everything in one place</p>
          <h2 className="mt-3 text-3xl font-semibold text-twilight-50 sm:text-4xl">
            Built for families and teachers alike
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="group glass-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/25 hover:shadow-card-gold"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${accentBg[f.accent]}`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-twilight-50">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-twilight-200">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="glass-card-gold p-10 text-center sm:p-14">
          <GeometricPatternDense
            id="cta-lattice"
            className="pointer-events-none absolute inset-0 h-full w-full"
            opacity={0.06}
          />
          <div className="pointer-events-none absolute inset-0 bg-aurora-glow" />
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold text-twilight-50 sm:text-3xl">
              Ready to register for this term?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-twilight-200">
              Create your family account, add your children, and you're set for Sunday morning.
            </p>
            <Link to="/signup" className="btn-primary mt-6 inline-flex">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-500/10 bg-twilight-900/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="El Hedaya Islamic School" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-display text-lg font-semibold text-twilight-50">El Hedaya Islamic School</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link to="/signup" className="btn-primary !py-2">
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-amber-500/10 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-twilight-200 sm:flex-row">
        <p>© {new Date().getFullYear()} El Hedaya Islamic School</p>
        <p className="font-mono text-xs">Questions? Reach the office at elhedaya.cic@outlook.com</p>
      </div>
    </footer>
  );
}
