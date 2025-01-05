"use client";
import { Index } from "@/types";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import { getAnnualChange, getIndexChange } from "@/lib/getStats";

interface CardProps {
  index: Index;
}

export const Card: React.FC<CardProps> = ({ index }) => {
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [annualChange, setAnnualChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const getStats = async () => {
    try {
      const [changeValue, aprValue] = await Promise.all([
        getIndexChange(index.symbols),
        getAnnualChange(index.symbols),
      ]);
      setPriceChange(changeValue);
      setAnnualChange(aprValue);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStats();
    const interval = setInterval(getStats, 30000);
    return () => clearInterval(interval);
  }, [index.symbols]);

  const renderPriceChange = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      );
    }

    if (priceChange === null) {
      return <span className="text-gray-500">Error loading price</span>;
    }

    const isPositive = priceChange >= 0;
    const absoluteChange = Math.abs(priceChange);

    return (
      <div
        className={`flex items-center gap-1 font-medium ${
          isPositive ? "text-green-500" : "text-red-500"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : (
          <ArrowDownRight className="h-4 w-4" />
        )}
        <span>{absoluteChange.toFixed(2)}%</span>
      </div>
    );
  };

  const renderAPR = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      );
    }

    if (annualChange === null) {
      return <span className="text-gray-500">-</span>;
    }

    const isPositive = annualChange >= 0;
    const absoluteAPR = Math.abs(annualChange);

    return (
      <div
        className={`flex items-center gap-1 font-medium ${
          isPositive ? "text-green-500" : "text-red-500"
        }`}
      >
        <span>{absoluteAPR.toFixed(2)}%</span>
      </div>
    );
  };

  return (
    <div className="p-5 bg-white/50 border border-[#151515] rounded-lg w-full hover:bg-white/60 transition-colors">
      <div className="flex flex-row w-full justify-between items-center">
        <h2 className="text-lg font-bold">
          {index.symbols.map((symbol) => symbol.symbol).join("-")}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-50">Annual Change:</span>
          {renderAPR()}
        </div>
      </div>
      <div className="flex flex-row mt-10 justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-sm opacity-50">Underlying Assets</span>
          <div className="flex flex-row gap-2">
            {index.symbols.map((symbol, symbolKey) => (
              <img
                key={symbolKey}
                src={symbol.icon}
                alt={symbol.symbol}
                className="h-8 w-8"
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 justify-between items-end">
          <span className="text-sm opacity-50">24hr Change</span>
          {renderPriceChange()}
        </div>
      </div>
    </div>
  );
};
