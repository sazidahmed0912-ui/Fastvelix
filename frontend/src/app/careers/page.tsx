import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Briefcase, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers at FastVelix | Join Our Team',
  description: 'Join the FastVelix team in culinary arts, fashion merchandising, engineering, and operations.',
};

export default function CareersPage() {
  const openings = [
    { title: 'Master Pastry Chef & Recipe Innovator', dept: 'Culinary Arts', location: 'Bengaluru, India', type: 'Full Time' },
    { title: 'Senior Full Stack Engineer (Next.js / Node.js)', dept: 'Engineering', location: 'Remote / Bengaluru', type: 'Full Time' },
    { title: 'Fashion Merchandiser & Buyer', dept: 'Fashion Division', location: 'Mumbai / Bengaluru', type: 'Full Time' },
    { title: 'Supply Chain & Logistics Operations Manager', dept: 'Operations', location: 'Bengaluru, India', type: 'Full Time' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <Sparkles size={14} /> Join FastVelix
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
            Build the Future of Fresh Food & Fashion E-Commerce
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-3 leading-relaxed">
            We are passionate makers, designers, engineers, and bakers dedicated to delivering unforgettable moments across India.
          </p>
        </div>

        {/* Current Openings */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-4">Current Openings</h2>
          {openings.map((job, idx) => (
            <div
              key={idx}
              className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 uppercase tracking-wide">
                  {job.dept}
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-1">{job.title}</h3>
                <div className="flex items-center gap-4 text-xs text-neutral-400 mt-1">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                  <span>•</span>
                  <span>{job.type}</span>
                </div>
              </div>

              <a
                href="mailto:careers@fastvelix.com"
                className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors inline-flex items-center justify-center gap-1.5 self-start sm:self-auto"
              >
                Apply Now <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
