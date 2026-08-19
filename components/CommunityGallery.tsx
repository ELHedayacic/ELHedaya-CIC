import Image from "next/image";
import { ArrowRight } from "lucide-react";

const gallery = [
  { src: "/images/hero/cic-hero-hd.png", label: "Our Masjid" },
  { src: "/images/programs/quran-tajweed.png", label: "Quran" },
  { src: "/images/programs/seerah.png", label: "Seerah" },
  { src: "/images/school/school-kids.png", label: "EL Hedaya" },
  { src: "/images/programs/ask-imam.png", label: "Ask Imam" },
  { src: "/images/programs/kids-quran.png", label: "Kids Quran" },
];

export default function CommunityGallery() {
  return (
    <section className="sectionBlock gallerySection">
      <div className="sectionTitle">
        <span />
        <h2>Our Community</h2>
        <span />
      </div>

      <div className="galleryGrid">
        {gallery.map((item, index) => (
          <article
            className={`galleryItem ${index === 0 ? "galleryItemWide" : ""}`}
            key={`${item.label}-${index}`}
          >
            <Image
              src={item.src}
              alt={item.label}
              fill
              className="coverImage"
              sizes="(max-width: 800px) 50vw, 20vw"
            />
            <div className="galleryShade" />
            <span>{item.label}</span>
          </article>
        ))}
      </div>

      <a
        href="https://clemmonsislamiccenter.org/picture-gallery/"
        target="_blank"
        className="galleryButton"
      >
        Explore Gallery
        <ArrowRight size={16} />
      </a>
    </section>
  );
}
