import Image from "next/image";
import { ArrowRight, CalendarDays } from "lucide-react";

const programs = [
  {
    title: "Quran Tajweed & Recitation Class",
    detail: "Everyday 30 mins. before Salat al Isha",
    image: "/images/programs/quran-tajweed.png",
  },
  {
    title: "Seerah Life of the Prophet (PBUH)",
    detail: "Weekly community Seerah program",
    image: "/images/programs/seerah.png",
  },
  {
    title: "Ask Our Imam",
    detail: "Get guidance on Islam and everyday questions.",
    image: "/images/programs/ask-imam.png",
  },
  {
    title: "Kids Quran Class",
    detail: "Quran learning and memorization for children.",
    image: "/images/programs/kids-quran.png",
  },
];

export default function UpcomingPrograms() {
  return (
    <section className="sectionBlock" id="programs">
      <div className="sectionTitle">
        <span />
        <h2>Upcoming at CIC</h2>
        <span />
      </div>

      <div className="programGrid">
        {programs.map((program) => (
          <article className="programCard" key={program.title}>
            <div className="programThumb">
              <Image
                src={program.image}
                alt=""
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                className="programImage"
              />
            </div>

            <div className="programCardBody">
              <div>
                <h3>{program.title}</h3>
                <p>{program.detail}</p>
              </div>

              <div className="programCardFooter">
                <span>
                  <CalendarDays size={15} />
                  CIC Program
                </span>
                <button type="button" aria-label={`View ${program.title}`}>
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
