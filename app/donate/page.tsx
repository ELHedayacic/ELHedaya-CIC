import Link from "next/link";
import { ArrowLeft, ExternalLink, Heart } from "lucide-react";

export const metadata = {
  title: "Donate | Clemmons Islamic Center",
  description: "Support Clemmons Islamic Center through the CIC Donation Portal.",
};

export default function DonatePage() {
  return (
    <main className="embeddedDonationPage">
      <div className="embeddedDonationTopbar">
        <Link href="/" className="donationBackButton">
          <ArrowLeft size={18} />
          <span>Back to CIC</span>
        </Link>

        <div className="embeddedDonationTitle">
          <Heart size={18} />
          <div>
            <strong>CIC Donation Portal</strong>
            <span>Secure online giving</span>
          </div>
        </div>

        <a
          href="https://donation-kiosk-repo.vercel.app/donate"
          target="_blank"
          rel="noreferrer"
          className="donationExternalButton"
        >
          <span>Open Full Portal</span>
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="embeddedDonationFrameWrap">
        <iframe
          src="https://donation-kiosk-repo.vercel.app/donate"
          title="Clemmons Islamic Center Donation Portal"
          className="embeddedDonationFrame"
          allow="payment *; clipboard-write; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      <noscript>
        <div className="donationNoScript">
          JavaScript is required to use the CIC Donation Portal.
        </div>
      </noscript>
    </main>
  );
}
