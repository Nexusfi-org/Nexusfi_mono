"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useContext, ChangeEvent, useMemo } from "react";
import { NearContext } from "@/wallets/near";
import { IndexFundContract } from "@/config";

const CONTRACT = IndexFundContract;

export enum Symbols {
  BTC = "PYTH:BTCUSD",
  ETH = "0x2e5221B0f855Be4ea5Cefffb8311EED0563B6e87",
  AURORA = "0xf08a50178dfcde18524640ea6618a1f965821715",
  USDC = "0xf08a50178dfcde18524640ea6618a1f965821715",
  ARB = "PYTH:ARBUSD",
  OP = "PYTH:OPUSD",
}

interface Symbol {
  symbol: string;
  icon: string;
  percentange: number;
}

interface CreateIndexModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateIndex: (index: { symbols: Symbol[] }) => void;
}

interface FundMetadata {
  prefix: string;
  name: string;
  symbol: string;
  description: string;
}

const ICON_MAP: Record<string, string> = {
  BTC: "/icons/bitcoin.png",
  ETH: "/icons/ethereum.png",
  AURORA: "/icons/aurora.png",
  USDC: "/icons/usdc.png",
  ARB: "/icons/arbitrum.png",
  OP: "/icons/optimism.png",
};

export const CreateIndexModal: React.FC<CreateIndexModalProps> = ({
  open,
  onOpenChange,
  onCreateIndex,
}) => {
  const [tokens, setTokens] = useState<Symbol[]>([
    { symbol: "ETH", icon: ICON_MAP["ETH"], percentange: 50 },
  ]);
  const [metadata, setMetadata] = useState<FundMetadata>({
    prefix: "",
    name: "",
    symbol: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signedAccountId, wallet } = useContext(NearContext);

  const availableTokens = useMemo(() => {
    return Object.keys(Symbols).filter(
      (symbol) => !tokens.find((t) => t.symbol === symbol)
    );
  }, [tokens]);

  const totalPercentage = useMemo(() => {
    return tokens.reduce((sum, token) => sum + token.percentange, 0);
  }, [tokens]);

  const handleMetadataChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddToken = () => {
    if (availableTokens.length === 0) return;
    const newToken = {
      symbol: availableTokens[0],
      icon: ICON_MAP[availableTokens[0]],
      percentange: 0,
    };
    setTokens([...tokens, newToken]);
  };

  const handleRemoveToken = (index: number) => {
    if (tokens.length === 1) {
      setError("Index must have at least one token");
      return;
    }
    const newTokens = tokens.filter((_, i) => i !== index);
    setTokens(newTokens);
    setError(null);
  };

  const handleTokenChange = (index: number, symbol: string) => {
    const newTokens = [...tokens];
    newTokens[index] = {
      ...newTokens[index],
      symbol,
      icon: ICON_MAP[symbol],
    };
    setTokens(newTokens);
  };

  const handlePercentageChange = (index: number, value: number[]) => {
    const newValue = value[0];

    if (newValue > 100) {
      const newTokens = [...tokens];
      newTokens[index] = {
        ...newTokens[index],
        percentange: 100,
      };
      setTokens(newTokens);
      setError("Individual token percentage cannot exceed 100%");
      setTimeout(() => setError(null), 2000);
      return;
    }

    const otherTokensTotal = tokens.reduce(
      (sum, token, i) => (i !== index ? sum + token.percentange : sum),
      0
    );

    if (otherTokensTotal + newValue > 100) {
      setError("Total percentage cannot exceed 100%");
      setTimeout(() => setError(null), 2000);
      return;
    }

    const newTokens = [...tokens];
    newTokens[index] = {
      ...newTokens[index],
      percentange: newValue,
    };
    setTokens(newTokens);
    setError(null);
  };

  const validateInputs = () => {
    if (!metadata.prefix.trim()) {
      setError("Please enter a prefix");
      return false;
    }
    if (!metadata.name.trim()) {
      setError("Please enter a fund name");
      return false;
    }
    if (!metadata.symbol.trim()) {
      setError("Please enter a fund symbol");
      return false;
    }
    if (totalPercentage !== 100) {
      setError("Total percentage must equal 100%");
      return false;
    }
    if (tokens.length === 0) {
      setError("Index must have at least one token");
      return false;
    }
    return true;
  };

  const createFund = async () => {
    if (!wallet) {
      setError("Wallet not connected");
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fundMetadata = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description || null,
        assets: tokens.map((token) => ({
          name: token.symbol,
          contract_address: Symbols[token.symbol as keyof typeof Symbols],
          weight: token.percentange,
        })),
      };

      // Call the contract method
      await wallet.callMethod({
        contractId: CONTRACT,
        method: "create_fund",
        args: {
          prefix: metadata.prefix,
          metadata: fundMetadata,
          public_key: null,
        },
        gas: "300000000000000", // 300 TGas
        deposit: "1000000000000000000000000", // 1 NEAR
      });

      onCreateIndex({ symbols: tokens });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create fund:", error);
      setError("Failed to create fund. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-8 bg-[#fdfdf2] border-2 border-[#151515]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            Create New Index
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix</Label>
                <Input
                  id="prefix"
                  name="prefix"
                  placeholder="e.g., defi-index"
                  value={metadata.prefix}
                  onChange={handleMetadataChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  name="symbol"
                  placeholder="e.g., DEFI"
                  value={metadata.symbol}
                  onChange={handleMetadataChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Fund Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., DeFi Index Fund"
                value={metadata.name}
                onChange={handleMetadataChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your index fund..."
                value={metadata.description}
                onChange={handleMetadataChange}
                className="h-20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Asset Allocation</Label>
            <div
              className={`${
                tokens.length > 3 ? "grid grid-cols-2 gap-4" : "space-y-2"
              }`}
            >
              {tokens.map((token, index) => (
                <div
                  key={index}
                  className="p-4 border border-[#151515] rounded-lg space-y-4 h-full"
                >
                  <div className="flex items-center justify-between">
                    <Select
                      value={token.symbol}
                      onValueChange={(value) => handleTokenChange(index, value)}
                    >
                      <SelectTrigger className="w-[180px] border border-[#151515]">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <img
                              src={token.icon}
                              alt={token.symbol}
                              className="h-6 w-6"
                            />
                            {token.symbol}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={token.symbol}>
                          <div className="flex items-center gap-2">
                            <img
                              src={token.icon}
                              alt={token.symbol}
                              className="h-6 w-6"
                            />
                            {token.symbol}
                          </div>
                        </SelectItem>
                        {availableTokens.map((symbol) => (
                          <SelectItem key={symbol} value={symbol}>
                            <div className="flex items-center gap-2">
                              <img
                                src={ICON_MAP[symbol]}
                                alt={symbol}
                                className="h-6 w-6"
                              />
                              {symbol}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveToken(index)}
                      disabled={tokens.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Weight</span>
                      <span className="flex items-center gap-1">
                        <span>{token.percentange}%</span>
                      </span>
                    </div>
                    <Slider
                      value={[token.percentange]}
                      onValueChange={(value) =>
                        handlePercentageChange(index, value)
                      }
                      max={100}
                      min={0}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleAddToken}
              disabled={availableTokens.length === 0}
              className="bg-[#fdfdf2] border-[#151515]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Token
            </Button>
            <span
              className={`font-medium ${
                totalPercentage === 100
                  ? "text-green-500"
                  : totalPercentage > 100
                  ? "text-red-500"
                  : "text-yellow-500"
              }`}
            >
              Total: {totalPercentage}%
            </span>
          </div>

          <Button
            className="w-full bg-black hover:bg-black/90"
            onClick={createFund}
            disabled={totalPercentage !== 100 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Index...
              </>
            ) : (
              "Create Index"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
