import { lazy, Suspense } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import Coaches from '../components/sections/Coaches';
import PrestigiousMembers from '../components/sections/PrestigiousMembers';

const Wrestlers = lazy(() => import('../components/sections/Wrestlers'));
const Achievements = lazy(() => import('../components/sections/Achievements'));
const Gallery = lazy(() => import('../components/sections/Gallery'));
const Inquire = lazy(() => import('../components/sections/Inquire'));
const Location = lazy(() => import('../components/sections/Location'));

function SectionFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-hidden>
      <div className="mx-auto h-8 w-48 animate-pulse rounded bg-[#E8E0D4]" />
      <div className="mx-auto mt-4 h-4 w-72 max-w-full animate-pulse rounded bg-[#EDE6DA]" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-[#E8E0D4]" />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#F7F3EC]">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Coaches />
        <PrestigiousMembers />
        <Suspense fallback={<SectionFallback />}>
          <Wrestlers />
          <Achievements />
          <Gallery />
          <Inquire />
          <Location />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
