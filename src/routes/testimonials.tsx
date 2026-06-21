import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Farmer Testimonials — Agro Advisor" },
      { name: "description", content: "Real success stories from farmers across India using Agro Advisor AI." },
    ],
  }),
  component: TestimonialsPage,
});

type Testimonial = {
  id: string;
  name: string;
  village: string;
  state: string;
  crop: string;
  rating: number;
  story: string;
  result: string;
  avatar: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Rajesh Reddy",
    village: "Kothapally",
    state: "Telangana",
    crop: "Cotton, 4 acres",
    rating: 5,
    story: "The AI told me to delay sowing by 9 days because of a weak monsoon onset. Neighbours who sowed early had to resow. My crop came up perfectly and I saved one full seed bag.",
    result: "+22% yield vs last year",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Rajesh&backgroundColor=b6e3f4",
  },
  {
    id: "t2",
    name: "Lakshmi Devi",
    village: "Kallakurichi",
    state: "Tamil Nadu",
    crop: "Tomato, 1.5 acres",
    rating: 5,
    story: "I uploaded a leaf photo at midnight. It diagnosed early blight and suggested copper oxychloride. I sprayed next morning. The outbreak stopped in 4 days.",
    result: "Saved entire crop worth ₹1.8L",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Lakshmi&backgroundColor=ffd5dc",
  },
  {
    id: "t3",
    name: "Arjun Patil",
    village: "Sangli",
    state: "Maharashtra",
    crop: "Sugarcane, 6 acres",
    rating: 4,
    story: "Asked the voice assistant in Marathi when to apply urea. It told me the exact stage and split-dose method. My cane is thicker than last year.",
    result: "+15% cane weight",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Arjun&backgroundColor=c0aede",
  },
  {
    id: "t4",
    name: "Sunita Kumari",
    village: "Begusarai",
    state: "Bihar",
    crop: "Wheat, 2 acres",
    rating: 5,
    story: "I don't read English well. The Hindi voice mode explained the PM-Kisan eligibility step by step. I applied and started getting ₹2,000 every 4 months.",
    result: "Enrolled in PM-KISAN",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sunita&backgroundColor=ffdfbf",
  },
  {
    id: "t5",
    name: "Mahesh Gowda",
    village: "Mandya",
    state: "Karnataka",
    crop: "Rice, 3 acres",
    rating: 5,
    story: "The 10-day forecast warned me of a cold wave during panicle initiation. I irrigated overnight and protected the crop. Whole village was talking about my prediction.",
    result: "Avoided cold injury loss",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mahesh&backgroundColor=d1d4f9",
  },
];

function TestimonialsPage() {
  const [idx, setIdx] = useState(0);
  const total = TESTIMONIALS.length;

  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);

  useEffect(() => {
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next]);

  const current = TESTIMONIALS[idx];
  const avgRating = (TESTIMONIALS.reduce((s, t) => s + t.rating, 0) / total).toFixed(1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
          <Star className="h-3 w-3 fill-current text-sun" /> {avgRating} / 5 from {total} farmers
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">Stories from the field</h1>
        <p className="mt-3 text-base text-muted-foreground">Real farmers. Real harvests. Real impact.</p>
      </div>

      {/* Carousel */}
      <div className="relative mt-10 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card to-secondary/30 p-6 sm:p-10">
        <Quote className="absolute right-6 top-6 h-20 w-20 text-primary/10 sm:h-32 sm:w-32" />
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="relative grid gap-6 sm:grid-cols-[160px_1fr] sm:gap-10"
          >
            <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
              <img
                src={current.avatar}
                alt={current.name}
                className="h-28 w-28 rounded-3xl border-4 border-background bg-secondary object-cover shadow-md"
                loading="lazy"
              />
              <div>
                <p className="font-display text-xl">{current.name}</p>
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {current.village}, {current.state}
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">{current.crop}</p>
                <div className="mt-2 flex justify-center gap-0.5 sm:justify-start">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < current.rating ? "fill-sun text-sun" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-display text-2xl leading-relaxed sm:text-3xl">"{current.story}"</p>
              <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                ↑ {current.result}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex gap-1.5">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setIdx(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-2 bg-border"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prev} aria-label="Previous" className="rounded-full">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={next} aria-label="Next" className="rounded-full">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <h2 className="mt-14 font-display text-2xl tracking-tight">More farmer stories</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.article
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex h-full flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5"
          >
            <div className="flex items-center gap-3">
              <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-2xl bg-secondary" loading="lazy" />
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.village}, {t.state}</p>
              </div>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? "fill-sun text-sun" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">"{t.story}"</p>
            <div className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              ↑ {t.result}
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
