"use client";

import { motion } from "framer-motion";
import { Network, LineChart, Lock } from "lucide-react";

const roadmapItems = [
  {
    quarter: "Q3 2024",
    title: "Platform Launch & Initial Features",
    description:
      "Launch of core platform with basic cross-chain capabilities and initial index funds",
    milestones: [
      "Cross-chain infrastructure setup",
      "Basic index fund creation",
      "Wallet integration",
    ],
    Icon: Network,
    status: "current",
  },
  {
    quarter: "Q4 2024",
    title: "Advanced Portfolio Features",
    description:
      "Introduction of sophisticated portfolio management tools and expanded chain support",
    milestones: [
      "Automated rebalancing",
      "Yield optimization",
      "Additional chain integration",
    ],
    Icon: LineChart,
    status: "upcoming",
  },
  {
    quarter: "Q1 2025",
    title: "Enhanced Security & Governance",
    description:
      "Implementation of advanced security features and community governance",
    milestones: [
      "Multi-sig wallet integration",
      "DAO governance launch",
      "Security audits completion",
    ],
    Icon: Lock,
    status: "upcoming",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function RoadmapSection() {
  return (
    <section className="py-20 md:py-24 bg-[#fbfbe4]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[#151515] text-5xl md:text-6xl font-medium tracking-tighter mb-4">
            Our Roadmap for the Future
          </h2>
          <p className="text-[#151515]/70 text-lg md:text-xl max-w-2xl mx-auto tracking-tight">
            Building the next generation of cross-chain DeFi
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#151515]/50 to-transparent" />

          {roadmapItems.map((item, index) => (
            <motion.div
              key={item.quarter}
              variants={itemVariants}
              className={`relative flex flex-col md:flex-row gap-8 md:gap-16 items-start mb-20 ${
                index % 2 === 0 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div
                className={`absolute left-8 md:left-1/2 w-8 h-8 -translate-x-1/2 rounded-full border-2 
                                ${
                                  item.status === "current"
                                    ? "border-[#151515] bg-[#151515]/10"
                                    : "border-[#151515]/30 bg-[#fbfbe4]"
                                }`}
              >
                <item.Icon
                  className={`w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                    ${
                                      item.status === "current"
                                        ? "text-[#151515]"
                                        : "text-[#151515]/50"
                                    }`}
                />
              </div>

              <div
                className={`w-full md:w-[calc(50%-3rem)] pl-20 md:pl-0 ${
                  index % 2 === 0 ? "md:text-right" : ""
                }`}
              >
                <motion.div
                  className={`p-6 md:p-8 rounded-xl border-2 bg-white/50 backdrop-blur-sm
                                        ${
                                          item.status === "current"
                                            ? "border-[#151515] hover:bg-white/80"
                                            : "border-[#151515]/20 hover:border-[#151515]/40"
                                        } 
                                        transition-all group`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium
                                            ${
                                              item.status === "current"
                                                ? "bg-[#151515] text-[#fbfbe4]"
                                                : "bg-[#151515]/10 text-[#151515]"
                                            }`}
                    >
                      {item.quarter}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3 text-[#151515]">
                    {item.title}
                  </h3>
                  <p className="text-[#151515]/70 tracking-tight mb-4">
                    {item.description}
                  </p>
                  <ul
                    className={`space-y-2 text-sm ${
                      index % 2 === 0 ? "md:text-right" : ""
                    }`}
                  >
                    {item.milestones.map((milestone, idx) => (
                      <li
                        key={idx}
                        className="text-[#151515]/70 flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#151515]/50" />
                        {milestone}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
