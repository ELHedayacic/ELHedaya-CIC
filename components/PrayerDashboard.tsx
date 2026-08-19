"use client";

import {
  Clock3,
  CloudSun,
  Moon,
  Sun,
  Sunset,
  Landmark,
} from "lucide-react";
import { useEffect, useState } from "react";

const prayers = [
  { name: "Fajr", time: "5:45", period: "AM", icon: CloudSun },
  { name: "Dhuhr", time: "1:40", period: "PM", icon: Sun },
  { name: "Asr", time: "5:23", period: "PM", icon: Sun, active: true },
  { name: "Maghrib", time: "8:14", period: "PM", icon: Sunset },
  { name: "Isha", time: "10:00", period: "PM", icon: Moon },
  { name: "Jummah 1", time: "1:30", period: "PM", icon: Landmark },
  { name: "Jummah 2", time: "2:30", period: "PM", icon: Landmark },
];

export default function PrayerDashboard() {
  const [secondsLeft, setSecondsLeft] = useState(52 * 60 + 41);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => (previous <= 0 ? 0 : previous - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    <section className="prayerSection" id="prayer-times">
      <div className="prayerHeading">
        <span />
        <h2>Today&apos;s Prayer Times</h2>
        <span />
      </div>

      <div className="prayerDashboard">
        <div className="nextPrayerCard">
          <div className="nextPrayerIcon">
            <Landmark size={24} />
          </div>

          <div className="nextPrayerLabel">Next Prayer</div>
          <div className="nextPrayerName">Asr</div>

          <div className="countdown" aria-label="Time until next prayer">
            <div>
              <strong>{pad(hours)}</strong>
              <span>HRS</span>
            </div>
            <b>:</b>
            <div>
              <strong>{pad(minutes)}</strong>
              <span>MINS</span>
            </div>
            <b>:</b>
            <div>
              <strong>{pad(seconds)}</strong>
              <span>SECS</span>
            </div>
          </div>

          <div className="nextPrayerTime">5:23 PM</div>
        </div>

        <div className="prayerTimesPanel">
          {prayers.map((prayer) => {
            const Icon = prayer.icon;

            return (
              <div
                key={prayer.name}
                className={`prayerCard ${
                  prayer.active ? "prayerCardActive" : ""
                }`}
              >
                <Icon className="prayerIcon" size={31} strokeWidth={1.55} />
                <div className="prayerName">{prayer.name}</div>
                <div className="prayerTime">{prayer.time}</div>
                <div className="prayerPeriod">{prayer.period}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="prayerLocation">
        <Clock3 size={14} />
        Timings are for Clemmons, NC
      </div>
    </section>
  );
}
