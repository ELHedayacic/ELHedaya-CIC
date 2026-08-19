import { Megaphone, ChevronRight } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <section className="announcementBar">
      <div className="announcementIcon">
        <Megaphone size={25} />
      </div>

      <div className="announcementContent">
        <strong>ANNOUNCEMENT</strong>
        <span>
          Quran Tajweed &amp; Recitation Class is held 30 minutes before Salat
          al Isha.
        </span>
      </div>

      <a href="#programs" className="announcementButton">
        View All Updates
        <ChevronRight size={17} />
      </a>
    </section>
  );
}
