import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from "lucide-react";

export default function SchoolFeature() {
  return (
    <section className="schoolFeature" id="school">
      <div className="schoolCopy">
        <div className="schoolBadge">
          <GraduationCap size={29} />
          <span>EL HEDAYA</span>
        </div>

        <p className="schoolEyebrow">Faith • Knowledge • Character</p>
        <h2>EL Hedaya Islamic School</h2>

        <p className="schoolDescription">
          Building a strong foundation of Islamic values and knowledge in a
          nurturing environment for our future leaders.
        </p>

        <div className="schoolHighlights">
          <span>
            <BookOpen size={17} />
            Quran & Islamic Studies
          </span>
          <span>
            <Sparkles size={17} />
            Nurturing Environment
          </span>
        </div>

        <Link
          href="https://clemmonsislamiccenter.org/sunday-school/"
          target="_blank"
          className="schoolButton"
        >
          Explore School
          <ArrowRight size={17} />
        </Link>
      </div>

      <div className="schoolVisual">
        <div className="schoolPhoto schoolPhotoBuilding">
          <Image
            src="/images/hero/cic-hero-hd.png"
            alt="Clemmons Islamic Center"
            fill
            className="coverImage"
            sizes="(max-width: 800px) 100vw, 45vw"
          />
        </div>

        <div className="schoolPhoto schoolPhotoKids">
          <Image
            src="/images/school/school-kids.png"
            alt="EL Hedaya Islamic School student illustration"
            fill
            className="schoolKidsImage"
            sizes="240px"
          />
        </div>
      </div>
    </section>
  );
}
