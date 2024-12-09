"use client";

import { motion } from "framer-motion";
import { Github, Ellipsis } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <div className="flex flex-row w-full justify-between">
      <motion.div
        className="relative flex flex-col w-1/2 items-start gap-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-6xl mt-32">
          <motion.span
            className="whitespace-nowrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            One Platform
          </motion.span>
          <br />
          <motion.span
            className="whitespace-nowrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            To Rule Them All.
          </motion.span>
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-lg text-gray-700"
        >
          Experience seamless cross-chain investing with our innovative DeFi
          index platform. Diversify across networks, maximize yields, and manage
          your entire crypto portfolio through a single, unified interface.
        </motion.p>
        <motion.div
          className="flex flex-row items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Link
            href="/earn"
            className="px-8 py-4 bg-[#151515] text-[#fbfbe4] rounded-full hover:bg-gray-800 transition-colors"
          >
            Launch App
          </Link>
          <Link
            href="/docs"
            className="bg-[#fbfbe4] text-[#151515] border-[#151515] border px-4 py-4 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Github />
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="font-bold">For More Info,</span>{" "}
          <Link href="/docs" className="underline hover:text-gray-700">
            Visit Our Docs!
          </Link>
        </motion.p>
        <Image
          src="/images/vector_2.png"
          alt="vector"
          width="120"
          height="10"
          className="absolute top-20 right-10"
        />
        <Image
          src="/images/vector_3.png"
          alt="line"
          width="80"
          height="10"
          className="absolute top-40 right-0"
        />
      </motion.div>

      <div className="flex flex-col">
        <div className="flex flex-row gap-4">
          {[1, 2, 3].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.2, duration: 0.6 }}
              className="flex flex-col p-5 border-[#151515] border rounded-xl hover:shadow-lg transition-shadow"
            >
              <Ellipsis />
              <div className="inline-flex gap-2 items-end">
                <span className="text-3xl">$500</span>
                <span>reward</span>
              </div>
              <Link
                href="/docs"
                className="text-sm underline hover:text-gray-700"
              >
                Learn More
              </Link>
            </motion.div>
          ))}
        </div>
        <Image
          src="/images/vector_1.png"
          alt="vector"
          width="600"
          height="600"
        />
      </div>
    </div>
  );
}
