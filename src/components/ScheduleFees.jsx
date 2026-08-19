import { Clock3, BookOpen, WalletCards, MapPinned } from "lucide-react";

export default function ScheduleFees() {
  return (
    <section className="section schedule-section" id="schedule">
      <div className="container">
        <div className="section-heading centered-heading">
          <span className="kicker">Plan your Sunday</span>
          <h2>Simple schedule. Clear tuition. No guessing.</h2>
          <p>Everything families need to know before the school day begins.</p>
        </div>

        <div className="schedule-board">
          <div className="schedule-column">
            <div className="schedule-icon"><Clock3 size={23} /></div>
            <span className="card-label">Sunday Schedule</span>
            <div className="time-row">
              <strong>9:00–9:30 AM</strong>
              <span>Quran Tajweed & Recitation</span>
            </div>
            <div className="time-row">
              <strong>10:25 AM</strong>
              <span>Regular School begins</span>
            </div>
          </div>

          <div className="schedule-column featured">
            <div className="schedule-icon"><WalletCards size={23} /></div>
            <span className="card-label">Semester Cost</span>
            <div className="price">
              <strong>$150</strong>
              <span>per student</span>
            </div>
            <div className="fee-breakdown">
              <span><b>$150</b> semester fee</span>
              <span>per student</span>
            </div>
            <small>Fees are due at the beginning of the term.</small>
          </div>

          <div className="schedule-column">
            <div className="schedule-icon"><MapPinned size={23} /></div>
            <span className="card-label">Arrival</span>
            <strong className="arrival-title">First driveway behind the Masjid</strong>
            <p>Use the designated Sunday School drop-off and pickup route.</p>
            <div className="schedule-note"><BookOpen size={17} /> Please arrive on time and ready to learn.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
