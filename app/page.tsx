import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PrayerDashboard from "@/components/PrayerDashboard";
import AnnouncementBar from "@/components/AnnouncementBar";
import UpcomingPrograms from "@/components/UpcomingPrograms";
import CommunityServices from "@/components/CommunityServices";
import SchoolFeature from "@/components/SchoolFeature";
import DonationSection from "@/components/DonationSection";
import CommunityGallery from "@/components/CommunityGallery";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />

      <main>
        <Hero />

        <div className="homeContent">
          <PrayerDashboard />
          <AnnouncementBar />
          <UpcomingPrograms />
          <CommunityServices />
          <SchoolFeature />
          <DonationSection />
          <CommunityGallery />
        </div>
      </main>

      <Footer />
    </>
  );
}
