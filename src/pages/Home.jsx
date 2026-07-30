import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import Coaches from '../components/sections/Coaches';
import Programs from '../components/sections/Programs';
import Videos from '../components/sections/Videos';
import Gallery from '../components/sections/Gallery';
import Facilities from '../components/sections/Facilities';
import Features from '../components/sections/Features';
import About from '../components/sections/About';
import Achievements from '../components/sections/Achievements';
import Testimonials from '../components/sections/Testimonials';
import Contact from '../components/sections/Contact';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Coaches />
        <Programs />
        <Videos />
        <Gallery />
        <Facilities />
        <Features />
        <About />
        <Achievements />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
