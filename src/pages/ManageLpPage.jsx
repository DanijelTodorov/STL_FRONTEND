import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { AppContext } from "../App";
import {
  USE_BACKEND,
  getLPBalance,
  removeLiquidityByPercent,
  burnLPByPercent,
  sendAndConfirmSignedTransactions,
  getTipTransaction,
} from "../utils/solana";
import { isValidAddress } from "../utils/methods";

export default function ManageLpPage({ className }) {
  const { SERVER_URL, setLoadingPrompt, setOpenLoading, user } =
    useContext(AppContext);
  const { connected, publicKey, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const [removeBaseTokenAddress, setRemoveBaseTokenAddress] = useState("");
  const [removeQuoteTokenAddress, setRemoveQuoteTokenAddress] = useState(
    "So11111111111111111111111111111111111111112"
  );
  const [removeLpBalance, setRemoveLpBalance] = useState("0");
  const [removeLpPercent, setRemoveLpPercent] = useState("");
  const [burnBaseTokenAddress, setBurnBaseTokenAddress] = useState("");
  const [burnQuoteTokenAddress, setBurnQuoteTokenAddress] = useState(
    "So11111111111111111111111111111111111111112"
  );
  const [burnLpBalance, setBurnLpBalance] = useState("0");
  const [burnLpPercent, setBurnLpPercent] = useState("");

  useEffect(() => {
    if (
      connected &&
      isValidAddress(removeBaseTokenAddress) &&
      isValidAddress(removeQuoteTokenAddress)
    ) {
      getLPBalance(
        connection,
        removeBaseTokenAddress,
        removeQuoteTokenAddress,
        publicKey
      ).then((resposne) => {
        setRemoveLpBalance(resposne);
      });
    } else setRemoveLpBalance("0");
  }, [
    connected,
    connection,
    publicKey,
    removeBaseTokenAddress,
    removeQuoteTokenAddress,
  ]);

  useEffect(() => {
    if (
      connected &&
      isValidAddress(burnBaseTokenAddress) &&
      isValidAddress(burnQuoteTokenAddress)
    ) {
      getLPBalance(
        connection,
        burnBaseTokenAddress,
        burnQuoteTokenAddress,
        publicKey
      ).then((resposne) => {
        setBurnLpBalance(resposne);
      });
    } else setBurnLpBalance("0");
  }, [
    connected,
    connection,
    publicKey,
    burnBaseTokenAddress,
    burnQuoteTokenAddress,
  ]);

  const handleRemoveLiquidity = async () => {
    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(removeBaseTokenAddress)) {
      toast.warn("Invalid base token address!");
      return;
    }

    if (!isValidAddress(removeQuoteTokenAddress)) {
      toast.warn("Invalid quote token address!");
      return;
    }

    const percent = parseFloat(removeLpPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      toast.warn("Invalid percent value!");
      return;
    }

    setLoadingPrompt("Removing liquidity...");
    setOpenLoading(true);
    try {
      const transactions = await removeLiquidityByPercent(
        connection,
        removeBaseTokenAddress,
        removeQuoteTokenAddress,
        percent,
        publicKey
      );
      if (transactions) {
        let txns = [...transactions];
        if (USE_BACKEND) {
          const tipTxn = await getTipTransaction(connection, publicKey, 0.01);
          txns.push(tipTxn);
        }
        const tx_type = 3;

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
          const balance = await getLPBalance(
            connection,
            removeBaseTokenAddress,
            removeQuoteTokenAddress,
            publicKey
          );
          setRemoveLpBalance(balance);
          // toast.success("Succeed to remove liquidity!");
        }
        // else toast.warn("Failed to remove liquidity!");
      } else toast.warn("Failed to remove liquidity!");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to remove liquidity!");
    }
    // setOpenLoading(false);
  };

  const handleBurnLP = async () => {
    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(burnBaseTokenAddress)) {
      toast.warn("Invalid base token address!");
      return;
    }

    if (!isValidAddress(burnQuoteTokenAddress)) {
      toast.warn("Invalid quote token address!");
      return;
    }

    const percent = parseFloat(burnLpPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      toast.warn("Invalid percent value!");
      return;
    }

    setLoadingPrompt("Burning LP...");
    setOpenLoading(true);
    try {
      const transaction = await burnLPByPercent(
        connection,
        burnBaseTokenAddress,
        burnQuoteTokenAddress,
        percent,
        publicKey
      );
      if (transaction) {
        let txns = [transaction];
        if (USE_BACKEND) {
          const tipTxn = await getTipTransaction(connection, publicKey, 0.01);
          txns.push(tipTxn);
        }
        const tx_type = 4;
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
          const balance = await getLPBalance(
            connection,
            removeBaseTokenAddress,
            removeQuoteTokenAddress,
            publicKey
          );
          setRemoveLpBalance(balance);
          // toast.success("Succeed to burn LP!");
        }
        // else toast.warn("Failed to burn LP!");
      } else toast.warn("Failed to burn LP!");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to burn LP!");
    }
    // setOpenLoading(false);
  };

  return (
    <div className={`${className} flex flex-col text-white px-5 gap-4`}>
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:justify-evenly">
        <div className="flex flex-col pt-5 w-full xl:w-[60%] 2xl:w-[40%]">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[25px] font-medium font-poppins leading-normal">
              Remove Liquidity
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Base Token Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600 text-right"
                placeholder="Enter base token address"
                value={removeBaseTokenAddress}
                onChange={(e) => setRemoveBaseTokenAddress(e.target.value)}
              />
            </div>
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Quote Token Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600 text-right"
                placeholder="Enter quote token address"
                value={removeQuoteTokenAddress}
                onChange={(e) => setRemoveQuoteTokenAddress(e.target.value)}
              />
            </div>
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                % to remove liquidity
              </div>
              <div className="w-full h-auto border border-gray-800 hover:border-baseColor bg-teal-600 bg-opacity-5 rounded-[10px] py-2 px-3">
                <p className="text-xs text-[#9CA0A7] text-right">
                  Balance: {removeLpBalance}
                </p>
                <input
                  className="w-full px-0 py-2 text-right bg-transparent outline-none"
                  placeholder="Enter % amount to remove liquidity"
                  value={removeLpPercent}
                  onChange={(e) => setRemoveLpPercent(e.target.value)}
                />
                <div className="flex text-white text-[14px] gap-2 justify-end">
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setRemoveLpPercent("25")}
                  >
                    25%
                  </button>
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setRemoveLpPercent("50")}
                  >
                    50%
                  </button>
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setRemoveLpPercent("75")}
                  >
                    75%
                  </button>
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setRemoveLpPercent("100")}
                  >
                    100%
                  </button>
                </div>
              </div>
            </div>
            <div className="relative flex h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-14 px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={handleRemoveLiquidity}
              >
                <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                  Remove Liquidity
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col pt-5 w-full xl:w-[60%] 2xl:w-[40%]">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[25px] font-medium font-poppins leading-normal">
              Burn LP
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Base Token Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600 text-right"
                placeholder="Enter base token address"
                value={burnBaseTokenAddress}
                onChange={(e) => setBurnBaseTokenAddress(e.target.value)}
              />
            </div>
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Quote Token Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600 text-right"
                placeholder="Enter quote token address"
                value={burnQuoteTokenAddress}
                onChange={(e) => setBurnQuoteTokenAddress(e.target.value)}
              />
            </div>
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                % to burn LP
              </div>
              <div className="w-full h-auto border border-gray-800 hover:border-baseColor bg-teal-600 bg-opacity-5 rounded-[10px] py-2 px-3">
                <p className="text-xs text-[#9CA0A7] text-right">
                  Balance: {burnLpBalance}
                </p>
                <input
                  className="w-full px-0 py-2 text-right bg-transparent outline-none"
                  placeholder="Enter % amount to burn LP"
                  value={burnLpPercent}
                  onChange={(e) => setBurnLpPercent(e.target.value)}
                />
                <div className="flex text-white text-[14px] gap-2 justify-end">
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setBurnLpPercent("25")}
                  >
                    25%
                  </button>
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setBurnLpPercent("50")}
                  >
                    50%
                  </button>
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setBurnLpPercent("75")}
                  >
                    75%
                  </button>
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setBurnLpPercent("100")}
                  >
                    100%
                  </button>
                </div>
              </div>
            </div>
            <div className="relative flex h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-14 px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={handleBurnLP}
              >
                <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                  Burn LP
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
