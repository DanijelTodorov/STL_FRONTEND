import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { BN } from "bn.js";
import { PublicKey } from "@solana/web3.js";
import {
  getMint,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import { AppContext } from "../App";
import {
  USE_BACKEND,
  burnTokenByPercent,
  closeTokenAccount,
  sendAndConfirmSignedTransactions,
  getTipTransaction,
} from "../utils/solana";
import { isValidAddress } from "../utils/methods";

export default function TokenAccountPage({ className }) {
  const { SERVER_URL, setLoadingPrompt, setOpenLoading, user } =
    useContext(AppContext);
  const { connected, publicKey, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const [burnTokenAddress, setBurnTokenAddress] = useState("");
  const [burnTokenBalance, setBurnTokenBalance] = useState("0");
  const [burnTokenPercent, setBurnTokenPercent] = useState("");
  const [closeTokenAddress, setCloseTokenAddress] = useState("");

  const updateBalance = async (connection, tokenAddress, owner) => {
    console.log("Updating balance...", tokenAddress, owner.toBase58());
    try {
      const mint = new PublicKey(tokenAddress);
      const mintInfo = await getMint(connection, mint);
      const tokenATA = await getAssociatedTokenAddress(mint, owner);
      const accountInfo = await getAccount(connection, tokenATA);
      const balance = new BN(accountInfo.amount)
        .div(new BN(Math.pow(10, mintInfo.decimals)))
        .toString();
      return balance;
    } catch (err) {
      console.log(err);
      return "0";
    }
  };

  useEffect(() => {
    if (connected && isValidAddress(burnTokenAddress)) {
      updateBalance(connection, burnTokenAddress, publicKey).then(
        (response) => {
          setBurnTokenBalance(response);
        }
      );
    } else setBurnTokenBalance("0");
  }, [connected, connection, publicKey, burnTokenAddress]);

  const handleBurnToken = async () => {
    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(burnTokenAddress)) {
      toast.warn("Invalid token address!");
      return;
    }

    const percent = parseFloat(burnTokenPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      toast.warn("Invalid percent value!");
      return;
    }

    setLoadingPrompt("Burning token...");
    setOpenLoading(true);
    try {
      const transaction = await burnTokenByPercent(
        connection,
        burnTokenAddress,
        percent,
        publicKey
      );
      let txns = [transaction];
      if (USE_BACKEND) {
        const tipTxn = await getTipTransaction(connection, publicKey, 0.01);
        txns.push(tipTxn);
      }
      const tx_type = 9;
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
        const balance = await updateBalance(
          connection,
          burnTokenAddress,
          publicKey
        );
        setBurnTokenBalance(balance);
        toast.success("Succeed to burn token!");
      } else toast.warn("Failed to burn token!");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to burn token!");
    }
    setOpenLoading(false);
  };

  const handleCloseTokenAccount = async () => {
    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(closeTokenAddress)) {
      toast.warn("Invalid token address!");
      return;
    }

    setLoadingPrompt("Closing token account...");
    setOpenLoading(true);
    try {
      const balance = await updateBalance(
        connection,
        closeTokenAddress,
        publicKey
      );
      if (balance !== "0") {
        toast.warn("Balance of token must be 0!");
        setOpenLoading(false);
        return;
      }

      const transaction = await closeTokenAccount(
        connection,
        closeTokenAddress,
        publicKey
      );
      let txns = [transaction];
      if (USE_BACKEND) {
        const tipTxn = await getTipTransaction(connection, publicKey, 0.01);
        txns.push(tipTxn);
      }
      const tx_type = 10;
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
      if (res) toast.success("Succeed to close token address!");
      else toast.warn("Failed to close token address!");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to close token address!");
    }
    setOpenLoading(false);
  };

  return (
    <div className={`${className} flex flex-col text-white px-5 gap-4`}>
      <div className="flex justify-center">
        <div className="flex flex-col pt-5 w-full xl:w-[60%] 2xl:w-[40%]">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[20px] font-medium font-poppins leading-normal">
              Burn Token
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Token Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600 text-right"
                placeholder="Enter token address"
                value={burnTokenAddress}
                onChange={(e) => setBurnTokenAddress(e.target.value)}
              />
            </div>
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                % to burn token
              </div>
              <div className="w-full h-auto border border-gray-800 hover:border-baseColor bg-teal-600 bg-opacity-5 rounded-[10px] py-2 px-3">
                <p className="text-xs text-[#9CA0A7] text-right">
                  Balance: {burnTokenBalance}
                </p>
                <input
                  className="w-full px-0 py-2 text-right bg-transparent outline-none"
                  placeholder="Enter % amount to burn token"
                  value={burnTokenPercent}
                  onChange={(e) => setBurnTokenPercent(e.target.value)}
                />
                <div className="flex text-white text-[14px] gap-2 justify-end">
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setBurnTokenPercent("25")}
                  >
                    25%
                  </button>
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setBurnTokenPercent("50")}
                  >
                    50%
                  </button>
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setBurnTokenPercent("75")}
                  >
                    75%
                  </button>
                  <button
                    className="bg-slate-titleborder border-teal-600 rounded-[3px] font-thin !px-1 !py-0 bg-gradient-to-r bg-baseColor  active:scale-95 hover:bg-gradient-to-br transition duration-100 ease-in-out transform focus:ring-teal-300"
                    onClick={() => setBurnTokenPercent("100")}
                  >
                    100%
                  </button>
                </div>
              </div>
            </div>
            <div className="relative flex h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-14 px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={handleBurnToken}
              >
                <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                  Burn Token
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="flex justify-center">
                <div className="flex flex-col pt-5 w-full xl:w-[60%] 2xl:w-[40%]">
                    <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
                        <div className="text-white text-[25px] font-medium font-poppins leading-normal">
                            Close Token Account
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
                        <div className="items-center h-auto">
                            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                                Token Address
                            </div>
                            <input
                                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                                placeholder="Enter token address (mint)"
                                value={closeTokenAddress}
                                onChange={(e) => setCloseTokenAddress(e.target.value)} />
                        </div>
                        <div className="relative flex h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
                            <button
                                className="h-14 px-[25px] py-2.5 mr-0 bg-gradient-to-r from-[#89d4fe] to-[#6fffff]  rounded-[10px] border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                                onClick={handleCloseTokenAccount}>
                                <div className="text-xl font-normal leading-normal text-center text-[#181a20] font-poppins">
                                    Close Token Address
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div> */}
    </div>
  );
}
