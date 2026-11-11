"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        {/* Logo / Brand */}
        <motion.h1
          className="text-6xl font-black tracking-tighter mb-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="bg-gradient-to-r from-bewachen-accent via-blue-400 to-bewachen-accent bg-clip-text text-transparent">
            BEWACHEN
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-bewachen-muted text-lg font-light max-w-md mx-auto mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          When you can&apos;t explain, let your information speak.
        </motion.p>

        {/* Status Indicator */}
        <motion.div
          className="flex items-center justify-center gap-2 text-sm text-bewachen-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <span className="w-2 h-2 rounded-full bg-bewachen-success animate-pulse" />
          <span>System initialized. Auth module loading...</span>
        </motion.div>
      </motion.div>
    </main>
  );
}
