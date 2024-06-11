import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { AppContext } from "../App";
import NotifyAddressDialog from "../components/Dialogs/NotifyAddressDialog";
import {
  USE_BACKEND,
  createOpenBookMarket,
  sendAndConfirmSignedTransactions,
  getTipTransaction,
} from "../utils/solana";
import { isValidAddress } from "../utils/methods";

export default function OpenBookMarketPage({ className }) {
  const {
    SERVER_URL,
    setLoadingPrompt,
    setOpenLoading,
    user,
    notifyStatus,
    setNotifyStatus,
    setNotifyTitle,
    setNotifyAddress,
  } = useContext(AppContext);
  const { connected, publicKey, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const [baseTokenAddress, setBaseTokenAddress] = useState("");
  const [quoteTokenAddress, setQuoteTokenAddress] = useState(
    "So11111111111111111111111111111111111111112"
  );
  const [minOrderSize, setMinOrderSize] = useState("");
  const [minPriceTickSize, setMinPriceTickSize] = useState("");

  useEffect(() => {
    if (notifyStatus.tag === "CREATE_OPENBOOK") {
      if (notifyStatus.success) {
        toast.success("Succeed to create OpenBookMarketID!");
      } else {
        toast.warn(
          `Failed to create OpenBookMarketID! ${
            notifyStatus.error ? notifyStatus.error : ""
          }`
        );
      }
      setOpenLoading(false);
      setNotifyStatus({ success: true, tag: "NONE" });
    }
  }, [notifyStatus]);

  const handleCreate = async () => {
    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(baseTokenAddress)) {
      toast.warn("Invalid base token address!");
      return;
    }

    if (!isValidAddress(quoteTokenAddress)) {
      toast.warn("Invalid quote token address!");
      return;
    }

    const orderSize = parseFloat(minOrderSize);
    if (isNaN(orderSize) || orderSize <= 0) {
      toast.warn("Invalid minimum order size!");
      return;
    }

    const tickSize = parseFloat(minPriceTickSize);
    if (isNaN(tickSize) || tickSize <= 0) {
      toast.warn("Invalid minimum price tick size!");
      return;
    }

    setLoadingPrompt("Creating OpenBook market...");
    setOpenLoading(true);
    try {
      const balance = await connection.getBalance(publicKey);
      if (balance < Number("500000000")) {
        console.log("Balance is insufficient.");
        setOpenLoading(false);
        toast.warn("Wallet balace insufficient.(at least 0.5 SOL)");
        return;
      }

      const { marketId, transactions } = await createOpenBookMarket(
        connection,
        baseTokenAddress,
        quoteTokenAddress,
        orderSize,
        tickSize,
        publicKey
      );
      if (!transactions) {
        setNotifyTitle("Market ID");
        setNotifyAddress(marketId.toBase58());
        toast.success("Already created OpenBook market!");
        setOpenLoading(false);
        return;
      }

      let txns = [...transactions];
      if (USE_BACKEND) {
        const tipTxn = await getTipTransaction(connection, publicKey, 0.01);
        txns.push(tipTxn);
      }
      const tx_type = 2;
      let signedTxns = undefined;
      try {
        signedTxns = await signAllTransactions(txns);
      } catch (err) {
        console.log(err);
      }

      if (signedTxns === undefined) {
        console.log("Not signed");
        setOpenLoading(false);
        toast.warn("Signing is failed.");
        return;
      }

      const res = await sendAndConfirmSignedTransactions(
        USE_BACKEND,
        connection,
        signedTxns,
        SERVER_URL,
        localStorage.getItem("access-token"),
        user._id,
        tx_type
      );
      if (res) {
        setNotifyTitle("Market ID");
        setNotifyAddress(marketId.toBase58());
      }
    } catch (err) {
      console.log(err);
      toast.warn("Unknown Error!");
    }
    // setOpenLoading(false);
  };

  return (
    <div className={`${className} flex justify-center text-white px-5 py-5`}>
      <div className="flex flex-col pt-5 w-full xl:w-[60%] 2xl:w-[40%]">
        <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
          <div className="text-white text-[20px] font-medium font-poppins leading-normal">
            Create OpenBook Market
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
          <div className="items-center h-auto">
            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
              Base Token Address
            </div>
            <input
              className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
              placeholder="Enter base token address"
              value={baseTokenAddress}
              onChange={(e) => setBaseTokenAddress(e.target.value)}
            />
          </div>
          <div className="items-center h-auto">
            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
              Quote Token Address
            </div>
            <input
              className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
              placeholder="Enter quote token address"
              value={quoteTokenAddress}
              onChange={(e) => setQuoteTokenAddress(e.target.value)}
            />
          </div>
          <div className="items-center h-auto">
            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
              Minimum Order Size
            </div>
            <input
              className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
              placeholder="Enter minimum order size"
              value={minOrderSize}
              onChange={(e) => setMinOrderSize(e.target.value)}
            />
          </div>
          <div className="items-center h-auto">
            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
              Minimum Price Tick Size
            </div>
            <input
              className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
              placeholder="Enter minimum price tick size"
              value={minPriceTickSize}
              onChange={(e) => setMinPriceTickSize(e.target.value)}
            />
          </div>
          <div className="relative flex h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
            <button
              className="h-14 px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
              onClick={handleCreate}
            >
              <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                Create
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
