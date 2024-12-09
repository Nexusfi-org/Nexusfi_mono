"use client";
import { Card } from "@/components/Card";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { CreateIndexModal } from "@/components/CreateIndexModal";
import { Index } from "@/types";
import { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NearContext } from "@/wallets/near";
import { useGetFetchAssets } from "@/hooks/useFetchAssets";

const indices: Index[] = [
  {
    symbols: [
      {
        symbol: "ETH",
        icon: "/icons/ethereum.png",
        percentange: 50.0,
      },
      {
        symbol: "AURORA",
        icon: "/icons/aurora.png",
        percentange: 50.0,
      },
    ],
  },
  {
    symbols: [
      {
        symbol: "BTC",
        icon: "/icons/bitcoin.png",
        percentange: 50.0,
      },
      {
        symbol: "ETH",
        icon: "/icons/ethereum.png",
        percentange: 40.0,
      },
      {
        symbol: "USDC",
        icon: "/icons/usdc.png",
        percentange: 10.0,
      },
    ],
  },
  {
    symbols: [
      {
        symbol: "ARB",
        icon: "/icons/arbitrum.png",
        percentange: 60.0,
      },
      {
        symbol: "OP",
        icon: "/icons/optimism.png",
        percentange: 40.0,
      },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
      type: "spring",
      stiffness: 100,
    },
  },
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: { scale: 0.95 },
};

export default function Earn() {
  const [modalVisible, setModalVisible] = useState(false);
  const [createIndexModalVisible, setCreateIndexModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<Index | null>(null);
  const { wallet } = useContext(NearContext);

  const handleSelectIndex = (index: Index) => {
    setSelectedIndex(index);
    handleModal();
  };

  const handleModal = () => {
    setModalVisible(true);
  };

  const handleCreateIndexModal = () => {
    setCreateIndexModalVisible(true);
  };

  const { assets, isLoading, error, fetchAssets } = useGetFetchAssets(wallet);

  useEffect(() => {
    if (wallet) {
      fetchAssets();
    }
  }, [wallet, fetchAssets]);

  useEffect(() => {
    console.log("fetching funds:", assets);
  });
  return (
    <motion.div
      className="min-h-screen pt-28 px-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-row justify-between">
        <motion.h1
          className="text-2xl"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Earn
        </motion.h1>
        <motion.button
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          onClick={handleCreateIndexModal}
          className="border border-[#151515] px-8 py-2 rounded-full"
        >
          Create Index
        </motion.button>
      </div>
      <motion.div
        className="flex flex-row justify-between mt-10 gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {indices.map((index, indexKey) => (
          <motion.div
            key={indexKey}
            variants={itemVariants}
            onClick={() => handleSelectIndex(index)}
            className="cursor-pointer w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card key={indexKey} index={index} />
          </motion.div>
        ))}
      </motion.div>
      {selectedIndex && (
        <ConfirmationModal
          symbols={selectedIndex.symbols}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      )}
      <CreateIndexModal
        open={createIndexModalVisible}
        onOpenChange={setCreateIndexModalVisible}
        onCreateIndex={() => {}}
      />
    </motion.div>
  );
}
