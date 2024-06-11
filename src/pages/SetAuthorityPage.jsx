import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { AppContext } from "../App";
import {
  USE_BACKEND,
  setMintAuthority,
  setFreezeAuthority,
  sendAndConfirmSignedTransactions,
  getTipTransaction,
} from "../utils/solana";
import { isValidAddress } from "../utils/methods";
import { getMint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export default function SetAuthorityPage({ className }) {
  const { SERVER_URL, setLoadingPrompt, setOpenLoading, user } =
    useContext(AppContext);
  const { connected, publicKey, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const [revokeMintTokenAddress, setRevokeMintTokenAddress] = useState("");
  const [revokeFreezeTokenAddress, setRevokeFreezeTokenAddress] = useState("");
  const [mintTokenAddress, setMintTokenAddress] = useState("");
  const [mintOwnerAddress, setMintOwnerAddress] = useState("");
  const [freezeTokenAddress, setFreezeTokenAddress] = useState("");
  const [freezeOwnerAddress, setFreezeOwnerAddress] = useState("");

  const handleRevokeMintAuthority = async () => {
    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(revokeMintTokenAddress)) {
      toast.warn("Invalid token address to revoke mint authority!");
      return;
    }

    setLoadingPrompt("Revoking mint authority...");
    setOpenLoading(true);
    try {
      // const mintInfo = await getMint(
      //   connection,
      //   new PublicKey(revokeFreezeTokenAddress)
      // );

      // mintInfo.mintAuthority;
      const transaction = await setMintAuthority(
        connection,
        revokeMintTokenAddress,
        publicKey,
        null
      );
      if (transaction) {
        let txns = [transaction];
        if (USE_BACKEND) {
          const tipTxn = await getTipTransaction(connection, publicKey, 0.01);
          txns.push(tipTxn);
        }
        const tx_type = 5;
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
        // if (res) {
        //   toast.success("Succeed to revoke mint authority!");
        // } else toast.warn("Failed to revoke mint authority!");
      }
    } catch (err) {
      console.log(err);
      toast.warn("Unknown Error");
    }
    // setOpenLoading(false);
  };

  const handleRevokeFreezeAuthority = async () => {
    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(revokeFreezeTokenAddress)) {
      toast.warn("Invalid token address to revoke freeze authority!");
      return;
    }

    setLoadingPrompt("Revoking freeze authority...");
    setOpenLoading(true);
    try {
      const mintInfo = await getMint(
        connection,
        new PublicKey(revokeFreezeTokenAddress)
      );

      if (!mintInfo.freezeAuthority) {
        setOpenLoading(false);
        toast.success("Freeze authority has already revoked!");
        return;
      }

      const transaction = await setFreezeAuthority(
        connection,
        revokeFreezeTokenAddress,
        publicKey,
        null
      );
      if (transaction) {
        let txns = [transaction];
        if (USE_BACKEND) {
          const tipTxn = await getTipTransaction(connection, publicKey, 0.01);
          txns.push(tipTxn);
        }

        const tx_type = 6;
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
        // if (res) {
        //   toast.success("Succeed to revoke freeze authority!");
        // } else toast.warn("Failed to revoke freeze authority!");
      }
    } catch (err) {
      console.log(err);
      toast.warn("Failed to revoke freeze authority");
    }
    // setOpenLoading(false);
  };

  const handleSetMintAuthority = async () => {
    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(mintTokenAddress)) {
      toast.warn("Invalid token address to set mint authority!");
      return;
    }

    if (!isValidAddress(mintOwnerAddress)) {
      toast.warn("Invalid new mint owner address!");
      return;
    }

    setLoadingPrompt("Setting mint authority...");
    setOpenLoading(true);
    try {
      const transaction = await setMintAuthority(
        connection,
        mintTokenAddress,
        publicKey,
        mintOwnerAddress
      );
      if (transaction) {
        let txns = [transaction];
        if (USE_BACKEND) {
          const tipTxn = await getTipTransaction(connection, publicKey, 0.01);
          txns.push(tipTxn);
        }

        console.log(" ===== userID: ", user._id);

        const tx_type = 7;
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
        // if (res) toast.success("Succeed to set mint authority!");
        // else toast.warn("Failed to set mint authority!");
      }
    } catch (err) {
      console.log(err);
      toast.warn("Failed to set mint authority");
    }
    // setOpenLoading(false);
  };

  const handleSetFreezeAuthority = async () => {
    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(freezeTokenAddress)) {
      toast.warn("Invalid token address to set freeze authority!");
      return;
    }

    if (!isValidAddress(freezeOwnerAddress)) {
      toast.warn("Invalid new freeze owner address!");
      return;
    }

    setLoadingPrompt("Setting freeze authority...");
    setOpenLoading(true);
    try {
      const mintInfo = await getMint(
        connection,
        new PublicKey(revokeFreezeTokenAddress)
      );

      if (!mintInfo.freezeAuthority) {
        setOpenLoading(false);
        toast.warn("Freeze authority has already revoked!");
        return;
      }

      const transaction = await setFreezeAuthority(
        connection,
        freezeTokenAddress,
        publicKey,
        freezeOwnerAddress
      );
      if (transaction) {
        let txns = [transaction];
        if (USE_BACKEND) {
          const tipTxn = await getTipTransaction(connection, publicKey, 0.01);
          txns.push(tipTxn);
        }

        const tx_type = 8;
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
        // if (res) {
        //   toast.success("Succeed to set freeze authority!");
        // } else toast.warn("Failed to set freeze authority!");
      }
    } catch (err) {
      console.log(err);
      toast.warn("Failed to set freeze authority");
    }
    // setOpenLoading(false);
  };

  return (
    <div
      className={`${className} flex flex-col justify-center text-white px-5 gap-4`}
    >
      <div className="flex flex-col w-full gap-4 2xl:flex-row 2xl:justify-evenly">
        <div className="flex flex-col pt-5 w-full 2xl:w-[40%]">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[20px] font-medium font-poppins leading-normal">
              Revoke Mint Authority
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Token Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter token address"
                value={revokeMintTokenAddress}
                onChange={(e) => setRevokeMintTokenAddress(e.target.value)}
              />
            </div>
            <div className="relative flex h-full mt-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-14 px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={handleRevokeMintAuthority}
              >
                <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                  Revoke
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col pt-5 w-full 2xl:w-[40%]">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[20px] font-medium font-poppins leading-normal">
              Revoke Freeze Authority
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Token Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter token address"
                value={revokeFreezeTokenAddress}
                onChange={(e) => setRevokeFreezeTokenAddress(e.target.value)}
              />
            </div>
            <div className="relative flex h-full mt-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-14 px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={handleRevokeFreezeAuthority}
              >
                <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                  Revoke
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full gap-4 2xl:flex-row 2xl:justify-evenly">
        <div className="flex flex-col pt-5 w-full 2xl:w-[40%]">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[20px] font-medium font-poppins leading-normal">
              Set Mint Authority
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Token Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter token address"
                value={mintTokenAddress}
                onChange={(e) => setMintTokenAddress(e.target.value)}
              />
            </div>
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                New Owner Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter new owner address"
                value={mintOwnerAddress}
                onChange={(e) => setMintOwnerAddress(e.target.value)}
              />
            </div>
            <div className="relative flex h-full mt-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-14 px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={handleSetMintAuthority}
              >
                <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                  Set Authority
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col pt-5 w-full 2xl:w-[40%]">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[20px] font-medium font-poppins leading-normal">
              Set Freeze Authority
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Token Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter token address"
                value={freezeTokenAddress}
                onChange={(e) => setFreezeTokenAddress(e.target.value)}
              />
            </div>
            <div className="items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                New Owner Address
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter new owner address"
                value={freezeOwnerAddress}
                onChange={(e) => setFreezeOwnerAddress(e.target.value)}
              />
            </div>
            <div className="relative flex h-full mt-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-14 px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={handleSetFreezeAuthority}
              >
                <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                  Set Authority
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
