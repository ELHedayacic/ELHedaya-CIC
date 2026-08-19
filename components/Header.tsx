"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <header className="siteHeader">
      <div className="headerInner">
        <Link href="/" className="brand" aria-label="Clemmons Islamic Center home">
          <Image
            src="/images/logo/cic-logo.png"
            alt="Clemmons Islamic Center logo"
            width={66}
            height={66}
            className="brandLogo"
            priority
          />

          <div className="brandText">
            <span>Clemmons</span>
            <span>Islamic Center</span>
          </div>
        </Link>

        <nav
          className={`mainNav ${menuOpen ? "navOpen" : ""}`}
          aria-label="Main navigation"
        >
          <Link href="/" className="active" onClick={close}>
            Home
          </Link>
          <Link href="#prayer-times" onClick={close}>
            Prayer Times
          </Link>
          <Link href="#programs" onClick={close}>
            Programs
          </Link>
          <Link href="#services" onClick={close}>
            Services
          </Link>
          <Link href="#school" onClick={close}>
            EL Hedaya School
          </Link>
          <Link href="#about" onClick={close}>
            About
          </Link>
        </nav>

        <Link href="/donate" className="headerDonate">
          <Heart size={18} strokeWidth={1.8} />
          Donate
        </Link>

        <button
          type="button"
          className="mobileMenuButton"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>
    </header>
  );
}
