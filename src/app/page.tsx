import Hero from "@/components/Hero";
import About from "@/components/About";
import Stats from "@/components/Stats";
import Process from "@/components/Process";
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div>
      <Hero />
      <About />
      <Stats />
      <Process />

      {/* Ready to Get Started Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-gradient-to-r from-[#2C8E5D] to-[#144CBB] p-12 rounded-xl shadow-lg">
            <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-white mb-6">
              Join thousands of Burundians who have already digitized their license process
            </p>
            <Link
              href="/apply"
              className="mt-4 inline-flex items-center bg-white text-[#2C8E5D] font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-gray-100 transition-colors duration-300"
            >
              <span>Start Application</span>
              <ArrowRight className="w-5 h-5 ml-2 text-[#2C8E5D]" />
            </Link>

          </div>
        </div>
      </section>

    </div>
  );
}