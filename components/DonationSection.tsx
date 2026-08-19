"use client";

import { useState } from "react";
import {
  Heart,
  Landmark,
  BookOpen,
  HandHeart,
  MoonStar,
  ArrowRight,
} from "lucide-react";

const amounts = ["$25", "$50", "$100", "$250"];

const funds = [
  { name: "Mosque Operations", icon: Landmark },
  { name: "Sunday School", icon: BookOpen },
  { name: "Sadaqah / Zakat", icon: HandHeart },
  { name: "Cemetery Fund", icon: MoonStar },
];

export default function DonationSection() {
  const [amount, setAmount] = useState("$100");
  const [fund, setFund] = useState("Mosque Operations");

  return (
    <section className="donationSection" id="donate">
      <div className="donationIntro">
        <span className="donationEyebrow">Support Your Masjid</span>
        <h2>Your Masjid. Your Legacy. Your Reward.</h2>
        <p>
          Your generosity helps CIC continue its mission, programs and services
          for the community.
        </p>
      </div>

      <div className="donationControls">
        <div className="donationAmounts" aria-label="Choose donation amount">
          {amounts.map((item) => (
            <button
              type="button"
              key={item}
              className={amount === item ? "selected" : ""}
              onClick={() => setAmount(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="fundChoices" aria-label="Choose fund">
          {funds.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.name}
                className={fund === item.name ? "selected" : ""}
                onClick={() => setFund(item.name)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        <a
          href="/donate"
          className="donateNowButton"
        >
          <Heart size={18} />
          Donate Now
          <ArrowRight size={17} />
        </a>
      </div>
    </section>
  );
}
