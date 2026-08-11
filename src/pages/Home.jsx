import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import Programs from '../components/sections/Programs';
import TrainingSchedule from '../components/sections/TrainingSchedule';
import Features from '../components/sections/Features';
import Facilities from '../components/sections/Facilities';
import Coaches from '../components/sections/Coaches';
import Achievements from '../components/sections/Achievements';
import Gallery from '../components/sections/Gallery';
import Videos from '../components/sections/Videos';
import Membership from '../components/sections/Membership';
import GoverningBody from '../components/sections/GoverningBody';
import Testimonials from '../components/sections/Testimonials';
import Contact from '../components/sections/Contact';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F7F2]">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Programs />
        <TrainingSchedule />
        <Features />
        <Facilities />
        <Coaches />
        <Achievements />
        <Gallery />
        <Videos />
        <Membership />
        <GoverningBody />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
