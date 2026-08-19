import Link from "next/link";
import { Clock3, Heart, MapPin } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero" id="about">
      <div className="heroPattern" aria-hidden="true" />

      <div className="heroInner">
        <div className="heroContent">
          <div className="heroLocation">
            <MapPin size={15} />
            Clemmons, North Carolina
          </div>

          <h1>
            Clemmons
            <br />
            Islamic Center <span>(CiC)</span>
          </h1>

          <div className="heroTagline">
            Come to Prayer ... Come to Success
          </div>

          <p className="heroDescription">
            A welcoming community masjid serving Clemmons,
            Winston-Salem and surrounding areas in North Carolina.
          </p>

          <div className="heroActions">
            <Link href="#prayer-times" className="primaryButton">
              <Clock3 size={19} />
              Prayer Times
            </Link>

            <Link href="/donate" className="secondaryButton">
              <Heart size={19} />
              Donate
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
