import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import Coaches from '../components/sections/Coaches';
import PrestigiousMembers from '../components/sections/PrestigiousMembers';
import Wrestlers from '../components/sections/Wrestlers';
import Gallery from '../components/sections/Gallery';
import Inquire from '../components/sections/Inquire';
import Location from '../components/sections/Location';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Coaches />
        <PrestigiousMembers />
        <Wrestlers />
        <Gallery />
        <Inquire />
        <Location />
      </main>
      <Footer />
    </div>
  );
}
