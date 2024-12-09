"use client";

import { motion } from "framer-motion";
import { ChartBar, Shield, Coins } from "lucide-react";

const features = [
  {
    title: "Smart Portfolio Management",
    description:
      "Automated rebalancing and yield optimization across multiple chains",
    icon: ChartBar,
    stats: {
      value: "45%",
      label: "Average APY",
    },
  },
  {
    title: "Enhanced Security",
    description: "Multi-signature wallets and automated security audits",
    icon: Shield,
    stats: {
      value: "$500M+",
      label: "Assets Protected",
    },
  },
  {
    title: "Cross-Chain Liquidity",
    description: "Access deep liquidity pools across multiple networks",
    icon: Coins,
    stats: {
      value: "5+",
      label: "Chains Supported",
    },
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

export function FeaturesSection() {
  return (
    <section className="py-20 bg-[#fbfbe4] text-[#151515]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">A Complete DeFi Ecosystem</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage and grow your crypto portfolio
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-6 bg-white/50 border-2 border-[#151515] rounded-2xl hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-[#151515] rounded-xl flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-[#fbfbe4]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <div className="pt-6 border-t border-gray-200">
                  <div className="text-2xl font-bold">
                    {feature.stats.value}
                  </div>
                  <div className="text-gray-600">{feature.stats.label}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
