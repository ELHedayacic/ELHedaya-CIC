import {
  BadgeHelp,
  HeartHandshake,
  HandHeart,
  UsersRound,
  Phone,
  Landmark,
  ArrowUpRight,
} from "lucide-react";

const services = [
  {
    title: "Ask Imam",
    text: "Get guidance on religious matters.",
    icon: BadgeHelp,
  },
  {
    title: "Janazah & Cemetery",
    text: "Support and information when you need it most.",
    icon: Landmark,
  },
  {
    title: "Fundraising Request",
    text: "Submit your fundraising requests to CIC.",
    icon: HandHeart,
  },
  {
    title: "Volunteer Opportunities",
    text: "Join us in serving the community.",
    icon: UsersRound,
  },
  {
    title: "Contact Us",
    text: "We're here to help. Reach out anytime.",
    icon: Phone,
  },
  {
    title: "Community Support",
    text: "Resources and help for those in need.",
    icon: HeartHandshake,
  },
];

export default function CommunityServices() {
  return (
    <section className="sectionBlock" id="services">
      <div className="sectionTitle">
        <span />
        <h2>Community Services</h2>
        <span />
      </div>

      <div className="servicesGrid">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <article className="serviceCard" key={service.title}>
              <div className="serviceIcon">
                <Icon size={37} strokeWidth={1.55} />
              </div>

              <h3>{service.title}</h3>
              <p>{service.text}</p>

              <span className="serviceArrow" aria-hidden="true">
                <ArrowUpRight size={14} />
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
