"use client";

import NearLogo from "@/assets/logo-near.png";
import EthereumLogo from "@/assets/logo-ethereum.png";
import OptimismLogo from "@/assets/logo-optimism.png";
import ArbitrumLogo from "@/assets/logo-arbitrum.png";
import Image from "next/image";
import { motion } from "framer-motion";

export function LogoTicker() {
  return (
    <>
      <section className={"py-10 text-[#151515]"}>
        <div className={"container"}>
          <div className={"flex items-center gap-5"}>
            <div className={"flex-1 md:flex-none"}>
              <h2 className={"font-bold"}>Integrated With Leading Chains</h2>
            </div>
            <div
              className={
                "flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]"
              }
            >
              <motion.div
                initial={{ translateX: "-50%" }}
                animate={{ translateX: "0" }}
                transition={{
                  repeat: Infinity,
                  duration: 30,
                  ease: "linear",
                }}
                className={"flex flex-none gap-14 pr-14 -translate-x-1/2"}
              >
                {[
                  NearLogo,
                  EthereumLogo,
                  OptimismLogo,
                  ArbitrumLogo,
                  NearLogo,
                  EthereumLogo,
                  OptimismLogo,
                  ArbitrumLogo,
                ].map((logo, index) => (
                  <Image
                    src={logo}
                    alt={`${logo}`}
                    key={index}
                    className={"h-6 w-auto"}
                  />
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
