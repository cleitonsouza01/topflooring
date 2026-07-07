import { Header } from '@/components/marketing/Header';
import { Hero } from '@/components/marketing/Hero';
import { TrustBar } from '@/components/marketing/TrustBar';
import { Services } from '@/components/marketing/Services';
import { WhyUs } from '@/components/marketing/WhyUs';
import { Process } from '@/components/marketing/Process';
import { Gallery } from '@/components/marketing/Gallery';
import { Testimonials } from '@/components/marketing/Testimonials';
import { Estimate } from '@/components/marketing/Estimate';
import { ServiceArea } from '@/components/marketing/ServiceArea';
import { Footer } from '@/components/marketing/Footer';
import { MobileActionBar } from '@/components/marketing/MobileActionBar';
import { RevealObserver } from '@/components/marketing/RevealObserver';

export default function HomePage() {
  return (
    <>
      <a
        href="#estimate"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-navy focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to estimate form
      </a>

      <Header />

      <main id="top">
        <Hero />
        <TrustBar />
        <Services />
        <WhyUs />
        <Process />
        <Gallery />
        <Testimonials />
        <Estimate />
        <ServiceArea />
      </main>

      <Footer />
      <MobileActionBar />
      <RevealObserver />
    </>
  );
}
