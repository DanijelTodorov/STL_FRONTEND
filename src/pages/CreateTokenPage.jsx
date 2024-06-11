import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { MdOutlineFileUpload } from "react-icons/md";

import { AppContext } from "../App";
import NotifyAddressDialog from "../components/Dialogs/NotifyAddressDialog";
import {
  pinFileToNFTStorage,
  pinJsonToNFTStorage,
  pinFileToPinata,
  pinJsonToPinata,
} from "../utils/pinatasdk";
import {
  USE_BACKEND,
  createToken,
  sendAndConfirmSignedTransactions,
  getTipTransaction,
} from "../utils/solana";

export default function CreateTokenPage({ className }) {
  const {
    SERVER_URL,
    setLoadingPrompt,
    setOpenLoading,
    user,
    notifyStatus,
    setNotifyStatus,
    notifyAddressDialog,
    setNotifyAddressDialog,
    notifyTitle,
    setNotifyTitle,
    notifyAddress,
    setNotifyAddress,
  } = useContext(AppContext);
  const { connected, publicKey, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [logo, setLogo] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [description, setDescription] = useState("");

  // useEffect(() => {
  //   if (notifyStatus.tag === "CREATE_TOKEN") {
  //     if (notifyStatus.success) {
  //       toast.success("Succeed to create SPL token!");
  //     } else {
  //       toast.warn(
  //         `Failed to create SPL token! ${
  //           notifyStatus.error ? notifyStatus.error : ""
  //         }`
  //       );
  //     }
  //     setOpenLoading(false);
  //     setNotifyStatus({ success: true, tag: "NONE" });
  //   }
  // }, [notifyStatus]);

  const handleUploadLogo = async (file) => {
    setLoadingPrompt("Uploading logo...");
    setOpenLoading(true);
    try {
      console.log(file);
      let uri = await pinFileToPinata(file);
      uri = `https://ipfs.io/ipfs/${uri}`;
      console.log(uri);
      setLogo(uri);
      toast.success("Succeed to upload logo!");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to upload logo!");
    }
    setOpenLoading(false);
  };

  const handleCreate = async () => {
    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (name === "") {
      toast.warn("Please input name!");
      return;
    }

    if (symbol === "") {
      toast.warn("Please input symbol!");
      return;
    }

    if (decimals === "" || isNaN(Number(decimals))) {
      toast.warn("Please input decimals!");
      return;
    }

    if (totalSupply === "" || isNaN(Number(totalSupply))) {
      toast.warn("Please input total supply!");
      return;
    }

    setLoadingPrompt("Uploading metadata...");
    setOpenLoading(true);
    try {
      let metadata = {
        name: name,
        symbol: symbol,
      };
      if (logo) metadata.image = logo;
      if (description) metadata.description = description;
      if (website || twitter || telegram || discord) {
        metadata.extensions = {};
        if (website) metadata.extensions.website = website;
        if (twitter) metadata.extensions.twitter = twitter;
        if (telegram) metadata.extensions.telegram = telegram;
        if (discord) metadata.extensions.discord = discord;
      }
      let uri = await pinJsonToPinata(metadata);
      uri = `https://ipfs.io/ipfs/${uri}`;
      console.log(uri);

      setLoadingPrompt("Creating tokens...");
      try {
        const balance = await connection.getBalance(publicKey);
        if (balance < Number("38000000")) {
          console.log("Balance is insufficient.");
          setOpenLoading(false);
          toast.warn("Wallet balace insufficient.(at least 0.038 SOL)");
          return;
        }
        const { mint, transaction } = await createToken(
          connection,
          publicKey,
          name,
          symbol,
          uri,
          Number(decimals),
          Number(totalSupply)
        );
        if (transaction) {
          let txns = [transaction];
          if (USE_BACKEND) {
            const tipTxn = await getTipTransaction(connection, publicKey, 0.01);
            txns.push(tipTxn);
          }

          const tx_type = 1;
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
          } else {
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
              console.log("Mint Address:", mint.toBase58());
              setNotifyTitle("Token Address");
              setNotifyAddress(mint.toBase58());
            }
          }
        }
      } catch (err) {
        console.log(err);
        toast.warn(err);
      }
    } catch (err) {
      console.log(err);
      toast.warn("Failed to upload metadata!");
    }
    // setOpenLoading(false);
  };

  return (
    <div className={`${className} flex justify-center text-white px-5`}>
      <div className="flex flex-col pt-5 w-full xl:w-[60%] 2xl:w-[40%]">
        <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
          <div className="text-white text-[20px] font-medium font-poppins leading-normal">
            Create SPL Token
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full px-5 py-5 bg-slate-900 bg-opacity-90  rounded-b-[10px]">
          <div className="flex justify-between gap-4">
            <div className="w-[50%] items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Name
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter token name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="w-[50%] items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Symbol
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-between gap-4">
            <div className="w-[50%] items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Decimals
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter decimals"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
              />
            </div>
            <div className="w-[50%] items-center h-auto">
              <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
                Total Supply
              </div>
              <input
                className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter total supply"
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
              />
            </div>
          </div>
          <div className="items-center h-auto">
            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
              Logo
            </div>
            <div className="flex gap-2">
              <input
                className="w-[calc(100%-60px)] px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
                placeholder="Enter logo url (Optional)"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
              />
              <label className="w-[60px] h-12 py-2.5 bg-gradient-to-r bg-slate-title rounded-[10px] hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-green-300 items-center cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleUploadLogo(e.target.files[0])}
                />
                <MdOutlineFileUpload className="w-6 h-6 m-auto" />
              </label>
            </div>
          </div>
          <div className="items-center h-auto">
            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
              Website URL
            </div>
            <input
              className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
              placeholder="Enter website url (Optional)"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div className="items-center h-auto">
            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
              Twitter URL
            </div>
            <input
              className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
              placeholder="Enter twitter url (Optional)"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
            />
          </div>
          <div className="items-center h-auto">
            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
              Telegram URL
            </div>
            <input
              className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
              placeholder="Enter telegram url (Optional)"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
            />
          </div>
          <div className="items-center h-auto">
            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
              Discord URL
            </div>
            <input
              className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
              placeholder="Enter discord url (Optional)"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
            />
          </div>
          <div className="items-center h-auto">
            <div className="text-white text-base my-2 font-medium font-poppins leading-[24.93px]">
              Description
            </div>
            <textarea
              className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600"
              placeholder="Enter description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
