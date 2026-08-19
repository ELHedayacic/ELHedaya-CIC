import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="siteFooter">
      <div className="footerPattern" aria-hidden="true" />

      <div className="footerInner">
        <div className="footerBrandColumn">
          <div className="footerBrand">
            <Image
              src="/images/logo/cic-logo.png"
              alt="Clemmons Islamic Center"
              width={68}
              height={68}
            />
            <div>
              <strong>Clemmons</strong>
              <strong>Islamic Center</strong>
            </div>
          </div>

          <div className="footerContact">
            <span>
              <MapPin size={16} />
              1435 Lake Cottage Rd, Clemmons, NC 27012
            </span>
            <span>
              <Phone size={16} />
              336.766.0824
            </span>
            <span>
              <Mail size={16} />
              cicenter1435@gmail.com
            </span>
          </div>
        </div>

        <div className="footerColumn">
          <h3>Quick Links</h3>
          <Link href="/">Home</Link>
          <Link href="#prayer-times">Prayer Times</Link>
          <Link href="#programs">Programs</Link>
          <Link href="#services">Services</Link>
        </div>

        <div className="footerColumn">
          <h3>About CIC</h3>
          <Link href="#about">About Us</Link>
          <Link href="#school">EL Hedaya School</Link>
          <a
            href="https://clemmonsislamiccenter.org/picture-gallery/"
            target="_blank"
            rel="noreferrer"
          >
            Gallery
          </a>
          <a href="mailto:cicenter1435@gmail.com">Contact Us</a>
        </div>

        <div className="footerColumn">
          <h3>Resources</h3>
          <Link href="#programs">Announcements</Link>
          <Link href="#programs">Events</Link>
          <Link href="#prayer-times">Prayer Times</Link>
          <Link href="#donate">Donate</Link>
        </div>

        <div className="footerSocial">
          <h3>Stay Connected</h3>
          <p>Follow CIC for community updates, programs and announcements.</p>

          <div className="socialIcons" aria-label="Social media">
            <span className="socialTextIcon" title="Facebook" aria-label="Facebook">
              f
            </span>
            <span className="socialTextIcon" title="Instagram" aria-label="Instagram">
              IG
            </span>
            <span className="socialTextIcon" title="YouTube" aria-label="YouTube">
              ▶
            </span>
          </div>
        </div>
      </div>

      <div className="footerBottom">
        <span>© 2026 Clemmons Islamic Center (CiC). All rights reserved.</span>
        <span>Serving our community with faith and care.</span>
      </div>
    </footer>
  );
}
