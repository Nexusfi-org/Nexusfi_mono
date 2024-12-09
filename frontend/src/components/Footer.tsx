"use client";

import { motion } from "framer-motion";
import { Twitter, Github, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  product: [
    { name: "Overview", href: "/overview" },
    { name: "Features", href: "/features" },
    { name: "Solutions", href: "/solutions" },
    { name: "Tutorials", href: "/tutorials" },
    { name: "Pricing", href: "/pricing" },
  ],
  developers: [
    { name: "Documentation", href: "/docs" },
    { name: "API Reference", href: "/api" },
    { name: "Status", href: "/status" },
    { name: "Github", href: "https://github.com" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
  ],
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function Footer() {
  return (
    <footer className="bg-[#fbfbe4] border-t border-[#151515]/10">
      <div className="container mx-auto px-6 pt-16 pb-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-12 gap-8 pb-12 border-b border-[#151515]/10"
        >
          <motion.div
            variants={itemVariants}
            className="col-span-2 md:col-span-4"
          >
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/logo_black.png"
                alt="NexusFi"
                width={40}
                height={32}
              />
              NexusFi
            </Link>
            <p className="text-[#151515]/70 mb-6">
              Revolutionizing cross-chain DeFi with seamless index investing and
              portfolio management.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://twitter.com"
                target="_blank"
                className="p-2 rounded-full border border-[#151515]/10 hover:bg-[#151515]/5 transition-colors"
              >
                <Twitter className="w-5 h-5 text-[#151515]" />
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                className="p-2 rounded-full border border-[#151515]/10 hover:bg-[#151515]/5 transition-colors"
              >
                <Github className="w-5 h-5 text-[#151515]" />
              </Link>
            </div>
          </motion.div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <motion.div
              key={category}
              variants={itemVariants}
              className="col-span-1 md:col-span-2"
            >
              <h3 className="text-[#151515] font-medium mb-4 tracking-tight">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-[#151515]/70 hover:text-[#151515] transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      {link.href.startsWith("http") && (
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#151515]/70"
        >
          <p>© 2024 NexusFi. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <button className="hover:text-[#151515] transition-colors">
              Cookie Settings
            </button>
            <Link
              href="/accessibility"
              className="hover:text-[#151515] transition-colors"
            >
              Accessibility
            </Link>
            <Link
              href="/sitemap"
              className="hover:text-[#151515] transition-colors"
            >
              Sitemap
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
