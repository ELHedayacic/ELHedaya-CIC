import { ArrowRight, LockKeyhole, UserRoundPlus, UsersRound } from "lucide-react";
import { PORTAL_URL } from "../data/content";

export default function PortalCTA() {
  return (
    <section className="portal-section">
      <div className="container">
        <div className="portal-card">
          <div className="portal-pattern" aria-hidden="true" />
          <div className="portal-copy">
            <span className="portal-kicker"><LockKeyhole size={15} /> Secure School Hub</span>
            <h2>Registration and family accounts live in one place.</h2>
            <p>
              New families can begin registration, while returning parents can sign in to the
              EL Hedaya Sunday School Hub using the official CiC school domain.
            </p>

            <div className="portal-actions">
              <a className="button button-gold" href={PORTAL_URL}>
                <UserRoundPlus size={18} /> Register Online
              </a>
              <a className="button button-dark-quiet" href={PORTAL_URL}>
                <UsersRound size={18} /> Parent Login <ArrowRight size={17} />
              </a>
            </div>

            <small className="portal-domain">elhedaya.clemmonsislamiccenter.org</small>
          </div>

          <div className="portal-preview" aria-hidden="true">
            <div className="browser-bar">
              <span /><span /><span />
              <div>elhedaya.clemmonsislamiccenter.org</div>
            </div>
            <div className="preview-body">
              <div className="preview-brand">EL</div>
              <strong>Welcome back</strong>
              <span>EL Hedaya Sunday School Hub</span>
              <div className="preview-input" />
              <div className="preview-input" />
              <div className="preview-button">Continue</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
