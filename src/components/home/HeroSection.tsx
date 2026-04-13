'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="px-5 pt-24 pb-16 text-center max-w-2xl mx-auto">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-accent font-display tracking-widest uppercase text-sm mb-4"
      >
        Tailored to your drive
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        className="text-primary text-3xl md:text-5xl font-bold leading-tight mb-4 whitespace-pre-line"
      >
        {'당신에게 맞춘 렌트,\n렌테일러가 재단합니다'}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
        className="text-text-sub text-base mb-8"
      >
        15년 전문가의 맞춤 상담부터 AI 견적 비교까지
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
      >
        <Link
          href="/diagnosis"
          className="inline-block bg-accent text-primary font-bold rounded-xl px-8 py-4 text-lg transition-all hover:opacity-90 active:scale-[0.97]"
        >
          AI 맞춤 진단 시작 &rarr;
        </Link>
      </motion.div>
    </section>
  );
}
