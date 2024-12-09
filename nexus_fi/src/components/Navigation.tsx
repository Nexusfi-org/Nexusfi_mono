import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useContext } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NearContext } from "@/wallets/near";
import { Github, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/debounce";
import { Ethereum } from "@/lib/ethereum";

const Sepolia = 11155111;
const Eth = new Ethereum("https://rpc2.sepolia.org", Sepolia);

export const Navigation = () => {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [action, setAction] = useState<() => void>(() => {});
  const [label, setLabel] = useState("Loading...");
  const pathName = usePathname();

  const [ethAddress, setEthAddress] = useState<string>("");
  const [derivation, setDerivation] = useState("ethereum-1");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDerivation = sessionStorage.getItem("derivation");
      if (storedDerivation) {
        setDerivation(storedDerivation);
      }
    }
  }, []);

  const derivationPath = useDebounce(derivation, 1200);

  useEffect(() => {
    if (!wallet) return;

    if (signedAccountId) {
      setAction(() => wallet.signOut);
      setLabel(`${signedAccountId}`);
    } else {
      setAction(() => wallet.signIn);
      setLabel("Connect Wallet");
    }
  }, [signedAccountId, wallet]);

  useEffect(() => {
    const fetchEthAddress = async () => {
      if (!signedAccountId) return;

      try {
        const { address } = await Eth.deriveAddress(
          signedAccountId,
          derivationPath
        );
        setEthAddress(address);
      } catch (error) {
        console.error("Error fetching ETH address:", error);
      }
    };

    fetchEthAddress();
  }, [signedAccountId, derivationPath]);

  const renderWalletButton = () => {
    if (!signedAccountId) {
      return (
        <button
          className="px-8 py-2 border-[#151515] border rounded-full"
          onClick={wallet?.signIn}
        >
          Connect Wallet
        </button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="px-8 py-2 border-[#151515] border rounded-full inline-flex items-center gap-2">
          {label}
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[400px] bg-[#fbfbe4] border border-[#151515] rounded-xl"
        >
          <DropdownMenuLabel>Wallet Details</DropdownMenuLabel>
          <DropdownMenuSeparator className="border-b border-[#151515]" />
          <DropdownMenuItem className="flex flex-col items-start">
            <span className="text-sm font-medium">NEAR Address</span>
            <span className="text-sm text-gray-600 break-all">
              {signedAccountId}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start">
            <span className="text-sm font-medium">ETH Address</span>
            <span className="text-sm text-gray-600 break-all">
              {ethAddress || "Loading..."}
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="border-b border-[#151515]" />
          <DropdownMenuItem onClick={wallet?.signOut} className="text-red-600">
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <nav className="w-full">
      <div className="fixed w-full flex flex-row gap-20 p-6 items-center bg-[#fbfbe4] z-40">
        <Link href="/" className="inline-flex gap-4 items-center">
          <Image
            priority
            src="/logo_black.png"
            alt="Logo"
            width="30"
            height="24"
            className="object-contain"
          />
          <span className="text-lg font-bold">NexusFi</span>
        </Link>
        <div className="flex flex-row gap-10">
          <Link href="/" className="opacity-50">
            Home
          </Link>
          <Link href="https://github.com/Nexusfi-org" className="opacity-50">
            Docs
          </Link>
          <Link href="/about" className="opacity-50">
            About
          </Link>
        </div>
        {pathName === "/" ? (
          <Link
            href="/earn"
            className="px-8 py-2 border-[#151515] border rounded-full ml-auto"
          >
            Launch App
          </Link>
        ) : (
          <div className="ml-auto inline-flex gap-2">
            {renderWalletButton()}
            <Link
              href="https://github.com/thedudeontitan/nexusfi"
              className="flex bg-[#151515] text-[#fbfbe4] rounded-full p-2 items-center"
            >
              <Github />
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
