import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { AppContext } from "../App";
import axios from "axios";
import NotifyAddressDialog from "../components/Dialogs/NotifyAddressDialog";
import {
  USE_BACKEND,
  createOpenBookMarket,
  sendAndConfirmSignedTransactions,
  getTipTransaction,
} from "../utils/solana";
import { ellipsisAddress, isValidAddress } from "../utils/methods";
import ImportWalletsDialog from "../components/Dialogs/ImportWalletsDialog";
import NewWalletDialog from "../components/Dialogs/NewWalletDialog";
import SniperIcon from "../components/Icons/SniperIcon"

export default function BotPage({ className }) {

  const {
    SERVER_URL,
    setLoadingPrompt,
    setOpenLoading,
    currentProject,
    setCurrentProject,
    walletBalanceData,
    teamWalletBalanceData,
    updateProject,
    notifyStatus,
    setNotifyStatus,
  } = useContext(AppContext);

  const [botWalletSolBalance, setBotWalletSolBalance] = useState([]);
  const [startVolumeBot, setStartVolumeBot] = useState(false);
  const [startHolderBot, setStartHolderBot] = useState(false);
  const [importWalletsDialog, setImportWalletsDialog] = useState(false);
  const [newWalletDialog, setNewWalletDialog] = useState(false);

  const handleHolderBot = async () => {
    setStartHolderBot(!startHolderBot);
  };

  const handleVolumeBot = async () => {
    setStartVolumeBot(!startVolumeBot);
  };

  const handleDisperse = async () => {

  };

  const handleGenerateWallet = async () => {

  };

  const handleCollet = async () => {

  };

  const handleImportedKey = async (importedPrivateKey) => {
    // if (!isValidSolPrivateKey(importedPrivateKey)) {
    //   return;
    // }
    setLoadingPrompt("Importing Deposite wallet...");
    setOpenLoading(true);
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/project/import-deposite-wallet`,
        {
          projectId: currentProject._id,
          prKey: importedPrivateKey,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token"),
          },
        }
      );
      const newCurrentProject = {
        ...currentProject,
        depositeWallets: data.project.deposteWallets,
      };
      updateProject(newCurrentProject);
      setCurrentProject(newCurrentProject);
      toast.success("Wallets has been saved successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed in dealing wallets!");
    }
    setImportWalletsDialog(false);
    setOpenLoading(false);
  };

  const handleOKNewWallets = async (walletCount, fresh) => {
    console.log("New wallets:", walletCount, fresh);
    let count = 0;
    try {
      count = parseInt(walletCount);
    } catch (err) {
      console.log(err);
    }

    if (isNaN(count) || count < 0) {
      toast.warn("Invalid wallet count");
      return;
    }

    setNewWalletDialog(false);
    setLoadingPrompt("Generating new wallets...");
    setOpenLoading(true);
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/project/generate-bot-wallets`,
        {
          projectId: currentProject._id,
          count: walletCount,
          fresh: fresh,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token"),
          },
        }
      );
      const newCurrentProject = {
        ...currentProject,
        botWallets: data.project.botWallets,
      };
      updateProject(newCurrentProject);
      setCurrentProject(newCurrentProject);
      toast.success("New wallets has been generated successfully");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to generate new wallets!");
    }
    setOpenLoading(false);
  };

  return (
    <div className={`${className} flex justify-center text-white px-5 py-5`}>
      <ImportWalletsDialog
        isOpen={importWalletsDialog}
        onOK={handleImportedKey}
        onCancel={() => setImportWalletsDialog(false)}
      />
      <NewWalletDialog
        isOpen={newWalletDialog}
        onOK={handleOKNewWallets}
        onCancel={() => setNewWalletDialog(false)}
        min={1}
        max={12}
      />
      <div className="flex flex-col pt-5 w-full xl:w-[60%] 2xl:w-[40%]">
        <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
          <div className="text-white text-[20px] font-medium font-poppins leading-normal">
            Bot Management
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
          <div className="flex justify-between gap-10">
            <div className="relative flex flex-1 h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-12 w-full px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={() => setImportWalletsDialog(true)}
              >
                <div className="text-base font-normal leading-normal text-center text-white font-poppins">
                  Import Deposit Wallet
                </div>
              </button>
            </div>
            <div className="relative flex flex-1 h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-12 w-full px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={() => setNewWalletDialog(true)}
              >
                <div className="text-base font-normal leading-normal text-center text-white font-poppins">
                  Generate wallets
                </div>
              </button>
            </div>
          </div>
          <div className="flex justify-between gap-10">
            <div className="relative flex flex-1 h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-12 w-full px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={handleDisperse}
              >
                <div className="text-base font-normal leading-normal text-center text-white font-poppins">
                  Disperse
                </div>
              </button>
            </div>
            <div className="relative flex flex-1 h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
              <button
                className="h-12 w-full px-[25px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                onClick={handleCollet}
              >
                <div className="text-base font-normal leading-normal text-center text-white font-poppins">
                  Collect
                </div>
              </button>
            </div>
          </div>

          <div>
            <table className="w-full text-left">
              <thead className="">
                <tr className="">
                  <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30 ">
                    <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                      No
                    </p>
                  </th>
                  <th className="p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                      Address
                    </p>
                  </th>
                  <th className="p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                      SOL
                    </p>
                  </th>
                </tr>
              </thead>
              <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                {
                  currentProject.botwallets &&
                  currentProject.botwallets.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {index + 1}
                          </p>
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <div className="flex items-center justify-center gap-1 font-sans antialiased font-normal leading-normal text-center text-teal-200">
                            <p className="text-white bg-transparent outline-none">
                              {ellipsisAddress(item.address)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {botWalletSolBalance[index]}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
          {
            (!currentProject.botwallets || currentProject.botwallets.length === 0) &&
            (
              <div className="my-3 text-base text-center text-gray-700">
                no wallet
              </div>
            )
          }

          <div>
            <div className="flex items-center h-auto justify-between gap-10 px-4">
              <div className="flex items-center text-white text-xl my-2 font-medium font-poppins leading-[24.93px]">
                <label> Volume Maker Bot</label>
                {startVolumeBot && <img src="assets/spinner-white.svg" style={{ width: "3rem" }}></img>}
              </div>
              <div className="relative flex items-center h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
                <button
                  className={`h-12 px-[30px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-baseColor disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300 ${startVolumeBot ? '' : 'bg-transparent'}`}
                  onClick={handleVolumeBot}
                  disabled={startHolderBot}
                >
                  <div className="text-base font-normal leading-normal text-center text-white font-poppins">
                    {startVolumeBot ? "Stop" : "Start"}
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center h-auto justify-between gap-10 px-4">
              <div className="flex items-center text-white text-xl my-2 font-medium font-poppins leading-[24.93px]">
                <label>Holder Maker Bot</label>
                {startHolderBot &&
                  <img src="assets/spinner-white.svg" style={{ width: "3rem" }}></img>
                }
              </div>
              <div className="relative flex items-center h-full my-2 text-white bg-transparent justify-evenly bg-clip-border">
                <button
                  className={`h-12 px-[30px] py-2.5 mr-0 bg-gradient-to-r rounded-full border border-baseColor disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300 ${startHolderBot ? '' : 'bg-transparent'}`}
                  onClick={handleHolderBot}
                  disabled={startVolumeBot}
                >
                  <div className="text-base font-normal leading-normal text-center text-white font-poppins">
                    {startHolderBot ? "Stop" : "Start"}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
