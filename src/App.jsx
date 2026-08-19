import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Programs from "./components/Programs";
import GalleryPreview from "./components/GalleryPreview";
import Gallery from "./components/Gallery";
import GalleryAdminPage from "./components/GalleryAdminPage";
import ScheduleFees from "./components/ScheduleFees";
import Policies from "./components/Policies";
import PortalCTA from "./components/PortalCTA";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

const ADMIN_PATH = "/school-gallery-admin";
const GALLERY_PATH = "/gallery";

function normalizedPath() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

export default function App() {
  const path = normalizedPath();

  if (path === ADMIN_PATH) {
    return <GalleryAdminPage />;
  }

  if (path === GALLERY_PATH) {
    return (
      <>
        <Header />
        <main>
          <Gallery />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Programs />
        <GalleryPreview />
        <ScheduleFees />
        <Policies />
        <PortalCTA />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
