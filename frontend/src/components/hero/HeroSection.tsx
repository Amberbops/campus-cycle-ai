import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Camera, Search, Package, ChevronDown, Crosshair, ScanLine } from 'lucide-react';
import { Button } from '../ui/Button';
import { ImpactTicker } from './ImpactTicker';
import Hyperspeed from '../Hyperspeed/Hyperspeed';
import type { HyperspeedEffectOptions } from '../Hyperspeed/Hyperspeed';

const HYPERSPEED_OPTIONS: HyperspeedEffectOptions = {
  distortion: 'LongRaceDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 5,
  lanesPerRoad: 2,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  totalSideLightSticks: 50,
  lightPairsPerRoadWay: 70,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [20, 60],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.2, 0.2],
  carFloorSeparation: [0.05, 1],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0x131318,
    brokenLines: 0x131318,
    leftCars: [0xff5f73, 0xe74d60, 0xff102a],
    rightCars: [0xa4e3e6, 0x80d1d4, 0x53c2c6],
    sticks: 0xa4e3e6,
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FADE_UP: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' },
  }),
};

export function HeroSection() {
  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-16"
      aria-label="Hero: CampusCycle AI"
    >
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <Hyperspeed effectOptions={HYPERSPEED_OPTIONS} />
        <div className="pointer-events-none absolute inset-0 bg-slate-950/35" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="pointer-events-none relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
        {/* Eyebrow */}
        <motion.div
          custom={0}
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          className="pointer-events-auto mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-400"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" aria-hidden="true" />
          Powered by Google Gemini Vision AI · Bedrock Backup Standby
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          className="mb-6 text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Turn discarded items into{' '}
          <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
            the starting point
          </span>{' '}
          for reuse
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          custom={2}
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          className="mb-10 mx-auto max-w-2xl text-base text-slate-400 sm:text-lg"
        >
          Snap a photo, let AI triage the item, and instantly match it with
          students who need it — keeping waste out of landfills and resources
          circulating within campus.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-3"
        >
          {/* Primary CTA — pulses */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(20, 184, 166, 0.4)',
                '0 0 0 12px rgba(20, 184, 166, 0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            className="rounded-xl"
          >
            <Link to="/scan">
              <Button size="lg" variant="primary" className="gap-2">
                <Camera className="h-5 w-5" aria-hidden="true" />
                Scan an Item
              </Button>
            </Link>
          </motion.div>

          <Link to="/demand">
            <Button size="lg" variant="secondary" className="gap-2">
              <Search className="h-5 w-5" aria-hidden="true" />
              I Need Something
            </Button>
          </Link>

          <Link to="/items">
            <Button size="lg" variant="ghost" className="gap-2 text-slate-300 hover:text-white">
              <Package className="h-5 w-5 text-teal-400" aria-hidden="true" />
              My Items
            </Button>
          </Link>
        </motion.div>

        {/* Camera HUD merged with the moving road */}
        <motion.div
          custom={4}
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          className="mt-14 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-[min(88vw,420px)]"
            aria-hidden="true"
          >
            <div className="relative h-[190px] overflow-hidden rounded-[26px] border border-teal-200/30 bg-slate-950/35 p-2 shadow-[0_0_55px_rgba(45,212,191,0.16)] backdrop-blur-[2px]">
              <div className="relative h-full overflow-hidden rounded-[19px] border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/55" />
                <div className="absolute left-4 top-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.9)]" />
                  Camera ready
                </div>
                <div className="absolute right-4 top-4 flex items-center gap-1.5 text-[10px] text-slate-300">
                  <Crosshair className="h-3.5 w-3.5 text-teal-300" />
                  Hold to accelerate
                </div>

                {/* Transparent scan reticle lets the Hyperspeed road remain the subject. */}
                <div className="absolute inset-x-14 inset-y-9 border border-dashed border-teal-200/30">
                  <span className="absolute -left-px -top-px h-7 w-7 border-l-2 border-t-2 border-teal-200" />
                  <span className="absolute -right-px -top-px h-7 w-7 border-r-2 border-t-2 border-teal-200" />
                  <span className="absolute -bottom-px -left-px h-7 w-7 border-b-2 border-l-2 border-teal-200" />
                  <span className="absolute -bottom-px -right-px h-7 w-7 border-b-2 border-r-2 border-teal-200" />
                  <ScanLine className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-teal-100/70" strokeWidth={0.8} />
                </div>
                <motion.div
                  className="absolute left-14 right-14 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent shadow-[0_0_14px_rgba(45,212,191,0.9)]"
                  animate={{ top: ['28%', '72%', '28%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px]">
                  <span className="text-slate-300">Point at an item to begin</span>
                  <span className="flex items-center gap-1.5 text-teal-200"><Camera className="h-3.5 w-3.5" /> AI scan</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          custom={5}
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          className="mt-8 flex justify-center"
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-1 text-slate-600"
          >
            <span className="text-[10px] uppercase tracking-widest">Scroll to explore</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </div>

      {/* Impact ticker at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <ImpactTicker />
      </div>
    </section>
  );
}
