import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaRegCopy } from "react-icons/fa";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import BigNumber from "bignumber.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  getMint,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import bs58 from "bs58";
import axios from "axios";

import { AppContext } from "../App";
import ZombieDialog from "../components/Dialogs/ZombieDialog";
import NewWalletDialog from "../components/Dialogs/NewWalletDialog";
import TokenAmountDialog from "../components/Dialogs/TokenAmountDialog";
import ImportWalletsDialog from "../components/Dialogs/ImportWalletsDialog";
import SimulationDialog from "../components/Dialogs/SimulationDialog";
import { createPool } from "../utils/solana";
import { ellipsisAddress, isValidAddress } from "../utils/methods";

export default function BuyPage({ className }) {
  const {
    SERVER_URL,
    setLoadingPrompt,
    setOpenLoading,
    user,
    currentProject,
    setCurrentProject,
    updateProject,
    walletBalanceData,
    teamWalletBalanceData,
    notifyStatus,
    setNotifyStatus,
  } = useContext(AppContext);
  const { connected, publicKey, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const [copied, setCopied] = useState({});
  const [zombieDialog, setZombieDialog] = useState(false);
  const [newWalletDialog, setNewWalletDialog] = useState(false);
  const [tokenAmountDialog, setTokenAmountDialog] = useState(false);
  const [importWalletsDialog, setImportWalletsDialog] = useState(false);
  const [simulateData, setSimulateData] = useState({});
  const [simulateZombie, setSimulateZombie] = useState({
    address: "",
    value: "",
  });
  const [simulationDialog, setSimulationDialog] = useState(false);

  const [token, setToken] = useState("");
  const [zombieWallet, setZombieWallet] = useState({
    address: "",
    privateKey: null,
  });
  const [tokenAmount, setTokenAmount] = useState("");
  const [importingKey, setImportingKey] = useState("");
  const [solAmount, setSolAmount] = useState("");

  const [walletAllChecked, setWalletAllChecked] = useState(false);
  const [walletChecked, setWalletChecked] = useState([]);
  const [walletTokenBalance, setWalletTokenBalance] = useState([]);
  const [walletTokenAmount, setWalletTokenAmount] = useState([]);
  const [walletSolAmount, setWalletSolAmount] = useState([]);
  const [teamWalletAllChecked, setTeamWalletAllChecked] = useState(false);
  const [teamWalletChecked, setTeamWalletChecked] = useState([]);
  const [teamWalletTokenBalance, setTeamWalletTokenBalance] = useState([]);
  const [teamWalletTokenAmount, setTeamWalletTokenAmount] = useState([]);

  const disabled =
    !currentProject.token ||
    currentProject.status !== "OPEN" ||
    !user; /*|| user.role === "admin"*/

  useEffect(() => {
    if (currentProject.token || currentProject.zombie) {
      setToken(currentProject.token.address);
      setZombieWallet({
        address: currentProject.zombie,
        privateKey: null,
      });
      console.log("========= set Token:", token);
    } else {
      setToken("");
      setZombieWallet({ address: "", privateKey: null });
      setWalletAllChecked(false);
      setWalletChecked([]);
      console.log("========= Token is NULL");
    }
  }, [currentProject.token, currentProject.zombie]);

  useEffect(() => {
    const updateBalance = async (connection, tokenAddress, owner) => {
      console.log("Updating balance...", tokenAddress, owner.toBase58());
      try {
        const mint = new PublicKey(tokenAddress);
        const mintInfo = await getMint(connection, mint);
        const tokenATA = await getAssociatedTokenAddress(mint, owner);
        const tokenAccountInfo = await getAccount(connection, tokenATA);
        const balance = Number(
          new BigNumber(
            tokenAccountInfo.amount.toString() +
              "e-" +
              mintInfo.decimals.toString()
          ).toString()
        ).toFixed(4);
        return balance;
      } catch (err) {
        console.log(err);
        return "0";
      }
    };

    if (connected && isValidAddress(token)) {
      updateBalance(connection, token, publicKey).then((response) => {
        setTokenAmount(response);
      });
    } else setTokenAmount("");
  }, [connected, connection, token, publicKey]);

  useEffect(() => {
    if (currentProject.wallets) {
      if (currentProject.wallets.length !== walletChecked.length) {
        const newWalletChecked = currentProject.wallets.map(() => false);
        setWalletChecked(newWalletChecked);
        setWalletAllChecked(false);
      }

      setWalletTokenBalance(currentProject.wallets.map(() => ""));
      setWalletTokenAmount(
        currentProject.wallets.map((item) => item.initialTokenAmount)
      );
      setWalletSolAmount(
        currentProject.wallets.map((item) => item.initialSolAmount)
      );
    } else {
      setWalletTokenBalance([]);
      setWalletTokenAmount([]);
      setWalletSolAmount([]);
    }
  }, [currentProject.wallets, walletChecked.length]);

  useEffect(() => {
    if (currentProject.userWallets) {
      if (currentProject.userWallets.length !== teamWalletChecked.length) {
        const newTeamWalletChecked = currentProject.userWallets.map(
          () => false
        );
        setTeamWalletChecked(newTeamWalletChecked);
        setTeamWalletAllChecked(false);
      }

      setTeamWalletTokenBalance(currentProject.userWallets.map((item) => ""));
      setTeamWalletTokenAmount(
        currentProject.userWallets.map((item) => item.initialTokenAmount)
      );
    } else {
      setTeamWalletTokenBalance([]);
      setTeamWalletTokenAmount([]);
    }
  }, [currentProject.userWallets, teamWalletChecked.length]);

  useEffect(() => {
    if (walletBalanceData.length === walletTokenBalance.length) {
      // console.log("Updated balance data");
      setWalletTokenBalance(walletBalanceData);
    }
  }, [walletBalanceData, walletTokenBalance.length]);

  useEffect(() => {
    if (teamWalletBalanceData.length === teamWalletTokenBalance.length) {
      // console.log("Updated balance data");
      setTeamWalletTokenBalance(teamWalletBalanceData);
    }
  }, [teamWalletBalanceData, teamWalletTokenBalance.length]);

  useEffect(() => {
    if (notifyStatus.tag === "SIMULATE_COMPLETED") {
      if (notifyStatus.success) {
        toast.success("Succeed to simulate!");
        if (notifyStatus.data) {
          setSimulateZombie(notifyStatus.data.zombie);
          setSimulationDialog(true);
          setSimulateData(notifyStatus.data);
        }
      } else {
        toast.warn(
          `Failed to simulate! ${notifyStatus.error ? notifyStatus.error : ""}`
        );
        setSimulateData({});
      }
      setOpenLoading(false);
      setNotifyStatus({ success: true, tag: "NONE" });
    } else if (notifyStatus.tag === "DISPERSE_COMPLETED") {
      if (notifyStatus.success) toast.success("Succeed to disperse!");
      else toast.warn("Failed to disperse SOL!");
      setOpenLoading(false);
      setNotifyStatus({ success: true, tag: "NONE" });
    } else if (notifyStatus.tag === "BUY_COMPLETED") {
      if (notifyStatus.success) {
        toast.success("Succeed to enable and buy!");
        if (notifyStatus.project) {
          updateProject(notifyStatus.project);
          setCurrentProject(notifyStatus.project);
        }
      } else toast.warn("Failed to enable and buy!");

      setSimulateData({});
      setOpenLoading(false);
      setNotifyStatus({ success: true, tag: "NONE" });
    } else if (notifyStatus.tag === "BUY_SMALL_TOKEN") {
      toast.warn("Token amount is insufficient! Please set smaller SOL.");
      setSimulateData({});
      setOpenLoading(false);
      setNotifyStatus({ success: true, tag: "NONE" });
    }
  }, [notifyStatus]);

  const copyToClipboard = async (key, text) => {
    if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
      setCopied({
        ...copied,
        [key]: true,
      });
      setTimeout(
        () =>
          setCopied({
            ...copied,
            [key]: false,
          }),
        2000
      );
    } else console.error("Clipboard not supported");
  };

  const handleSaveProject = async () => {
    setLoadingPrompt("Saving project...");
    setOpenLoading(true);
    try {
      const wallets = currentProject.wallets.map((item, index) => {
        return {
          address: item.address,
          initialTokenAmount: walletTokenAmount[index],
          initialSolAmount: walletSolAmount[index],
        };
      });
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/project/save`,
        {
          projectId: currentProject._id,
          token: token,
          zombie: zombieWallet,
          wallets: wallets,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token"),
          },
        }
      );

      updateProject(data.project);
      setCurrentProject(data.project);
      toast.success("Project has been saved successfully");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to save project!");
    }
    setOpenLoading(false);
  };

  const handleOKZombiePrivateKey = (key) => {
    try {
      const keypair = Keypair.fromSecretKey(bs58.decode(key));
      setZombieWallet({
        address: keypair.publicKey.toBase58(),
        privateKey: key,
      });
    } catch (err) {
      console.log(err);
      toast.warn("Invalid private key!");
    }

    setZombieDialog(false);
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
        `${SERVER_URL}/api/v1/project/generate-wallets`,
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
        wallets: data.project.wallets,
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

  const handleImportedKey = async (importedPrivateKey) => {
    // if (!isValidSolPrivateKey(importedPrivateKey)) {
    //   return;
    // }
    setLoadingPrompt("Importing wallet...");
    setOpenLoading(true);
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/project/import-wallet`,
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
        wallets: data.project.wallets,
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
  const handleDownloadWallets = async () => {
    if (!currentProject.token) {
      toast.warn("Select the project");
      return;
    }

    setLoadingPrompt("Downloading wallets...");
    setOpenLoading(true);
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/project/download-wallets`,
        {
          projectId: currentProject._id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token"),
          },
        }
      );

      const downloadFile = (data, fileName) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);

        // Append to html link element page
        document.body.appendChild(link);

        // Start download
        link.click();

        // Clean up and remove the link
        link.parentNode.removeChild(link);
      };

      downloadFile(data, `wallets_${currentProject.name}.csv`);
    } catch (err) {
      console.log(err);
      toast.warn("Failed to download wallets!");
    }
    setOpenLoading(false);
  };

  const handleOKMinMaxTokenAmounts = (minAmount, maxAmount) => {
    function getRandomNumber(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    let minX = -1;
    try {
      minX = Number(minAmount);
    } catch (err) {
      console.log(err);
    }

    if (isNaN(minX) || minX <= 0) {
      toast.warn("Invalid minimum amount");
      return;
    }

    let maxX = -1;
    try {
      maxX = Number(maxAmount);
    } catch (err) {
      console.log(err);
    }

    if (isNaN(maxX) || maxX <= 0) {
      toast.warn("Invalid maximum amount");
      return;
    }

    if (minX > maxX) {
      const t = minX;
      minX = maxX;
      maxX = t;
    }

    let newWalletTokenAmount = [...walletTokenAmount];
    for (let i = 0; i < newWalletTokenAmount.length; i++) {
      if (walletChecked[i])
        newWalletTokenAmount[i] = getRandomNumber(minX, maxX);
    }
    setWalletTokenAmount(newWalletTokenAmount);
    setTokenAmountDialog(false);
  };

  const handleSetTokenAmounts = () => {
    const selectedWallets = walletChecked.filter((item) => item === true);
    if (selectedWallets.length === 0) {
      toast.warn("Please select wallets to set token amount");
      return;
    }
    setTokenAmountDialog(true);
  };

  // const handleOKSolAmount = (solAmount) => {
  //   let amount = -1;
  //   try {
  //     amount = Number(solAmount);
  //   } catch (err) {
  //     console.log(err);
  //   }

  //   if (isNaN(amount) || amount < 0) {
  //     toast.warn("Invalid SOL amount");
  //     return;
  //   }

  //   let newWalletSolAmount = [...walletSolAmount];
  //   for (let i = 0; i < newWalletSolAmount.length; i++) {
  //     if (walletChecked[i]) newWalletSolAmount[i] = amount;
  //   }
  //   setWalletSolAmount(newWalletSolAmount);
  //   setSolAmountDialog(false);
  // };

  // const handleSetSOLAmounts = () => {
  //   const selectedWallets = walletChecked.filter((item) => item === true);
  //   if (selectedWallets.length === 0) {
  //     toast.warn("Please select wallets to set additional SOL amount");
  //     return;
  //   }
  //   setSolAmountDialog(true);
  // };

  const handleWalletAllChecked = (e) => {
    console.log("Wallet all checked:", e.target.value, walletAllChecked);
    const newWalletAllChecked = !walletAllChecked;
    setWalletAllChecked(newWalletAllChecked);
    setWalletChecked(walletChecked.map(() => newWalletAllChecked));
  };

  const handleWalletChanged = (index, key, value) => {
    console.log("Wallet changed:", index, key, value);
    if (key === "checked") {
      let newWalletChecked = [...walletChecked];
      newWalletChecked[index] = !newWalletChecked[index];
      setWalletChecked(newWalletChecked);

      let newWalletAllChecked = true;
      for (let i = 0; i < newWalletChecked.length; i++)
        newWalletAllChecked &&= newWalletChecked[i];
      setWalletAllChecked(newWalletAllChecked);
    } else if (key === "token_amount") {
      let newWalletTokenAmount = [...walletTokenAmount];
      newWalletTokenAmount[index] = value;
      setWalletTokenAmount(newWalletTokenAmount);
    } else if (key === "sol_amount") {
      let newWalletSOLAmount = [...walletSolAmount];
      newWalletSOLAmount[index] = value;
      setWalletSolAmount(newWalletSOLAmount);
    }
  };

  const handleTeamWalletAllChecked = (e) => {
    console.log(
      "Team wallet all checked:",
      e.target.value,
      teamWalletAllChecked
    );
    const newTeamWalletAllChecked = !teamWalletAllChecked;
    setTeamWalletAllChecked(newTeamWalletAllChecked);
    setTeamWalletChecked(teamWalletChecked.map(() => newTeamWalletAllChecked));
  };

  const handleTeamWalletChanged = (index, key, value) => {
    console.log("Team wallet changed:", index, key, value);
    if (key === "checked") {
      let newTeamWalletChecked = [...teamWalletChecked];
      newTeamWalletChecked[index] = !newTeamWalletChecked[index];
      setTeamWalletChecked(newTeamWalletChecked);

      let newTeamWalletAllChecked = true;
      for (let i = 0; i < newTeamWalletChecked.length; i++)
        newTeamWalletAllChecked &&= newTeamWalletChecked[i];
      setTeamWalletAllChecked(newTeamWalletAllChecked);
    }
  };

  const handleDoneSimulate = () => {
    setSimulationDialog(false);
    if (simulateData.projectId === currentProject._id) {
      let newCurrentProject = { ...currentProject };
      newCurrentProject.token = simulateData.token;
      newCurrentProject.zombie = simulateData.zombie.address;
      for (let i = 0; i < simulateData.wallets.length; i++) {
        for (let j = 0; j < newCurrentProject.wallets.length; j++) {
          if (
            simulateData.wallets[i].address ===
            newCurrentProject.wallets[j].address
          ) {
            newCurrentProject.wallets[j].initialTokenAmount =
              simulateData.wallets[i].initialTokenAmount;
            newCurrentProject.wallets[j].initialSolAmount =
              simulateData.wallets[i].initialSolAmount;
            newCurrentProject.wallets[j].sim = simulateData.wallets[i].sim;
            break;
          }
        }
      }
      updateProject(newCurrentProject);
      setCurrentProject(newCurrentProject);
    }
  };

  const handleSimulate = async () => {
    console.log("========== current project:", currentProject);

    if (!token) return;

    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(token)) {
      toast.warn("Invalid token address!");
      return;
    }

    if (!isValidAddress(zombieWallet.address)) {
      toast.warn("Invalid zombie wallet!");
      return;
    }

    if (tokenAmount === "" || Number(tokenAmount.replaceAll(",", "")) <= 0) {
      toast.warn("Invalid token amount!");
      return;
    }

    if (solAmount === "" || Number(solAmount) <= 0) {
      toast.warn("Invalid SOL amount!");
      return;
    }

    const validWalletChecked = walletChecked.filter((item) => item === true);
    if (validWalletChecked.length === 0) {
      toast.warn("Please check wallets to buy tokens");
      return;
    }

    let wallets = [];
    for (let i = 0; i < currentProject.wallets.length; i++) {
      if (!walletChecked[i]) continue;

      const initialTokenAmount = Number(
        walletTokenAmount[i].toString().replaceAll(",", "")
      );
      if (isNaN(initialTokenAmount) || initialTokenAmount <= 0) {
        toast.warn(`Wallet #${i + 1}: Invalid token amount`);
        return;
      }

      const initialSolAmount = Number(
        walletSolAmount[i].toString().replaceAll(",", "")
      );
      if (isNaN(initialSolAmount) || initialSolAmount < 0) {
        toast.warn(`Wallet #${i + 1}: Invalid additional SOL amount`);
        return;
      }

      wallets = [
        ...wallets,
        {
          address: currentProject.wallets[i].address,
          initialTokenAmount: initialTokenAmount,
          initialSolAmount: initialSolAmount,
        },
      ];
    }

    try {
      setLoadingPrompt("Simulating...");
      setOpenLoading(true);
      await axios.post(
        `${SERVER_URL}/api/v1/project/simulate`,
        {
          projectId: currentProject._id,
          token,
          tokenAmount,
          solAmount,
          zombie: zombieWallet,
          wallets,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token"),
          },
        }
      );
    } catch (err) {
      console.log(err);
      toast.warn("Failed to simulate!");
      setOpenLoading(false);
    }
  };

  const handleDisperse = async () => {
    if (!currentProject.token) return;

    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(token)) {
      toast.warn("Invalid token address!");
      return;
    }

    if (!isValidAddress(zombieWallet.address)) {
      toast.warn("Invalid zombie wallet!");
      return;
    }

    if (tokenAmount === "" || Number(tokenAmount.replaceAll(",", "")) <= 0) {
      toast.warn("Invalid token amount!");
      return;
    }

    if (solAmount === "" || Number(solAmount) <= 0) {
      toast.warn("Invalid SOL amount!");
      return;
    }

    const validWalletChecked = walletChecked.filter((item) => item === true);
    if (validWalletChecked.length === 0) {
      toast.warn("Please check wallets to buy tokens");
      return;
    }

    let wallets = [];
    for (let i = 0; i < currentProject.wallets.length; i++) {
      if (!walletChecked[i]) continue;

      const initialTokenAmount = Number(
        walletTokenAmount[i].toString().replaceAll(",", "")
      );
      if (isNaN(initialTokenAmount) || initialTokenAmount <= 0) {
        toast.warn(`Wallet #${i + 1}: Invalid token amount`);
        return;
      }

      const initialSolAmount = Number(
        walletSolAmount[i].toString().replaceAll(",", "")
      );
      if (isNaN(initialSolAmount) || initialSolAmount < 0) {
        toast.warn(`Wallet #${i + 1}: Invalid additional SOL amount`);
        return;
      }

      wallets = [
        ...wallets,
        {
          address: currentProject.wallets[i].address,
          initialTokenAmount: initialTokenAmount,
          initialSolAmount: initialSolAmount,
        },
      ];
    }

    let simulated = true;
    if (simulateData.projectId !== currentProject._id) {
      simulated = false;
      console.log("Project id mismatch!");
    }

    if (
      simulated &&
      (!simulateData.token ||
        simulateData.token.address.toUpperCase() !== token.toUpperCase())
    ) {
      simulated = false;
      console.log("Token address mismatch!");
    }

    if (
      simulated &&
      (!simulateData.zombie ||
        simulateData.zombie.address.toUpperCase() !==
          zombieWallet.address.toUpperCase())
    ) {
      simulated = false;
      console.log("SOL Disperse Wallet mismatch!");
    }

    if (simulated && simulateData.wallets) {
      for (let i = 0; i < simulateData.wallets.length; i++) {
        let matched = false;
        const solAmount0 =
          simulateData.wallets[i].initialSolAmount.toString() === ""
            ? "0"
            : simulateData.wallets[i].initialSolAmount.toString();
        for (let j = 0; j < walletTokenAmount.length; j++) {
          if (
            simulateData.wallets[i].address.toUpperCase() ===
            currentProject.wallets[j].address.toUpperCase()
          ) {
            matched = true;
            const solAmount1 =
              walletSolAmount[j].toString() === ""
                ? "0"
                : walletSolAmount[j].toString();
            if (
              !walletChecked[j] ||
              simulateData.wallets[i].initialTokenAmount.toString() !==
                walletTokenAmount[j].toString() ||
              solAmount0 !== solAmount1
            ) {
              simulated = false;
              console.log(
                "Token amount or SOL amount mismatch!",
                simulateData.wallets.length,
                walletSolAmount.length,
                simulateData.wallets[i].initialSolAmount,
                walletSolAmount[j],
                simulateData.wallets[i].initialTokenAmount,
                walletTokenAmount[j]
              );
            }
            break;
          }
        }
        if (!matched) {
          simulated = false;
          console.log("No matched!");
        }
        if (!simulated) break;
      }
    } else simulated = false;

    if (!simulated) {
      toast.warn("Please simulate first");
      return;
    }

    try {
      setLoadingPrompt("Dispersing SOL...");
      setOpenLoading(true);

      await axios.post(
        `${SERVER_URL}/api/v1/project/disperse`,
        {
          simulateData,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token"),
          },
        }
      );
    } catch (err) {
      console.log(err);
      toast.warn("Failed to simulate!");
      setOpenLoading(false);
    }
  };

  const handleBuyTokens = async () => {
    if (!currentProject.token) return;

    if (!connected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(token)) {
      toast.warn("Invalid token address!");
      return;
    }

    if (!isValidAddress(zombieWallet.address)) {
      toast.warn("Invalid zombie wallet!");
      return;
    }

    const validWalletChecked = walletChecked.filter((item) => item === true);
    if (validWalletChecked.length === 0) {
      toast.warn("Please check wallets to buy tokens");
      return;
    }

    console.log("SimulateData:", simulateData);

    let simulated = true;
    if (simulateData.projectId !== currentProject._id) {
      simulated = false;
      console.log("Project id mismatch!");
    }

    if (
      simulated &&
      (!simulateData.token ||
        simulateData.token.address.toUpperCase() !== token.toUpperCase())
    ) {
      simulated = false;
      console.log("Token address mismatch!");
    }

    if (
      simulated &&
      (!simulateData.zombie ||
        simulateData.zombie.address.toUpperCase() !==
          zombieWallet.address.toUpperCase())
    ) {
      simulated = false;
      console.log("SOL Disperse Wallet mismatch!");
    }

    if (simulated && simulateData.wallets) {
      for (let i = 0; i < simulateData.wallets.length; i++) {
        let matched = false;
        const solAmount0 =
          simulateData.wallets[i].initialSolAmount.toString() === ""
            ? "0"
            : simulateData.wallets[i].initialSolAmount.toString();
        for (let j = 0; j < walletTokenAmount.length; j++) {
          if (
            simulateData.wallets[i].address.toUpperCase() ===
            currentProject.wallets[j].address.toUpperCase()
          ) {
            matched = true;
            const solAmount1 =
              walletSolAmount[j].toString() === ""
                ? "0"
                : walletSolAmount[j].toString();
            if (
              !walletChecked[j] ||
              simulateData.wallets[i].initialTokenAmount.toString() !==
                walletTokenAmount[j].toString() ||
              solAmount0 !== solAmount1
            ) {
              simulated = false;
              console.log("Token amount or SOL amount mismatch!");
            }
            break;
          }
        }
        if (!matched) {
          simulated = false;
          console.log("No matched!");
        }
        if (!simulated) break;
      }
    } else simulated = false;

    if (!simulated) {
      toast.warn("Please simulate first");
      return;
    }

    try {
      setLoadingPrompt("Signing with owner...");
      setOpenLoading(true);

      // const transactions = await createPool(
      //   connection,
      //   token,
      //   tokenAmount.replaceAll(",", ""),
      //   "So11111111111111111111111111111111111111112",
      //   solAmount.toString(),
      //   simulateData.poolInfo.marketId,
      //   publicKey
      // );
      // const signedTxns = await signAllTransactions(transactions);
      // const txnsBase64 = signedTxns.map((item) =>
      //   Buffer.from(item.serialize()).toString("base64")
      // );

      setLoadingPrompt("Enabling and Buying Tokens...");
      await axios.post(
        `${SERVER_URL}/api/v1/project/buy`,
        {
          projectId: currentProject._id,
          // signedTransactions: txnsBase64,
          simulateData,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token"),
          },
        }
      );
    } catch (err) {
      console.log(err);
      toast.warn("Failed to enable and buy!");
      setOpenLoading(false);
    }
  };

  return (
    <div className={`${className} flex flex-col text-white px-5`}>
      <ZombieDialog
        isOpen={zombieDialog}
        onOK={handleOKZombiePrivateKey}
        onCancel={() => setZombieDialog(false)}
      />
      <NewWalletDialog
        isOpen={newWalletDialog}
        onOK={handleOKNewWallets}
        onCancel={() => setNewWalletDialog(false)}
        min={6}
        max={50}
      />
      <TokenAmountDialog
        isOpen={tokenAmountDialog}
        onOK={handleOKMinMaxTokenAmounts}
        onCancel={() => setTokenAmountDialog(false)}
      />
      <ImportWalletsDialog
        isOpen={importWalletsDialog}
        onOK={handleImportedKey}
        onCancel={() => setImportWalletsDialog(false)}
      />
      <SimulationDialog
        isOpen={simulationDialog}
        zombie={simulateZombie}
        onClose={handleDoneSimulate}
      />
      <div className="flex flex-col pt-5">
        <div className="w-full h-auto px-5 py-2 bg-slate-title rounded-t-[10px] flex justify-between items-center">
          <div className="text-white text-[20px] font-medium font-poppins leading-normal">
            Buy Token {currentProject.name && `(${currentProject.name})`}
          </div>
          <div className="flex">
            <button
              className="h-12 px-[25px] rounded-full bg-transparent disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300 border border-[1px] border-white "
              disabled={disabled}
              onClick={handleSaveProject}
            >
              <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                Save
              </div>
            </button>
          </div>
        </div>
        <div className="w-full px-5 pt-5 pb-7 bg-slate-900 bg-opacity-90  border-b border-[rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-3 sm:flex-row  justify-between mb-5">
            <div className="w-full 2xl:w-[60%] ">
              <div className="flex flex-col items-center justify-between h-auto gap-5 mt-2 md:flex-row md:gap-0">
                <div className="text-white text-base font-medium font-poppins leading-[24.93px]">
                  Token Address:
                </div>
                <div className="flex flex-col items-center gap-5 md:flex-row md:gap-0 w-[70%]">
                  <input
                    className="px-3 py-3 w-full bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600 disabled:text-gray-400"
                    placeholder="Enter token address"
                    disabled={disabled}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center justify-between h-auto gap-5 mt-2 md:flex-row md:gap-0">
                <div className="text-white text-base font-medium font-poppins leading-[24.93px]">
                  SOL Disperse Wallet:
                </div>
                <div className="flex items-center text-teal-200">
                  <div className="text-white text-base font-normal font-poppins leading-[24.93px]">
                    {zombieWallet.address
                      ? ellipsisAddress(zombieWallet.address)
                      : "Not Set"}
                  </div>
                  {zombieWallet.address &&
                    (copied["zombie_wallet_0"] ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 mx-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <FaRegCopy
                        className="w-5 h-5 mx-1 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-baseColor"
                        onClick={() =>
                          copyToClipboard(
                            "zombie_wallet_0",
                            zombieWallet.address
                          )
                        }
                      />
                    ))}
                  <button
                    className="w-[60px] h-12 py-2.5 relative ml-5 rounded-[10px]"
                    disabled={disabled}
                    onClick={() => setZombieDialog(true)}
                  >
                    {disabled ? (
                      <div className="w-[60px] h-12 left-0 top-0 absolute rounded-[10px] transform-none focus:outline-none focus:ring-green-300" />
                    ) : (
                      <div className="w-[60px] h-12 left-0 top-0 absolute rounded-[10px] hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-green-300" />
                    )}
                    <div className="w-[26px] h-1.5 left-[17px] top-[27px] absolute">
                      <div className="w-1.5 h-1.5 left-0 top-0 absolute bg-white rounded-full" />
                      <div className="w-1.5 h-1.5 left-[10px] top-0 absolute bg-white rounded-full" />
                      <div className="w-1.5 h-1.5 left-[20px] top-0 absolute bg-white rounded-full" />
                    </div>
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center justify-between h-auto gap-5 mt-2 md:flex-row md:gap-0">
                <div className="text-white text-base font-medium font-poppins leading-[24.93px]">
                  Token Amount to LP:
                </div>
                <div className="flex flex-col items-center gap-5 md:flex-row md:gap-0 w-[70%]">
                  <input
                    className="px-3 py-3 w-full bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600 disabled:text-gray-400"
                    placeholder="Enter initial token amount"
                    disabled={disabled}
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center justify-between h-auto gap-5 mt-2 md:flex-row md:gap-0">
                <div className="text-white text-base font-medium font-poppins leading-[24.93px]">
                  SOL Amount to LP:
                </div>
                <div className="flex flex-col items-center gap-5 md:flex-row md:gap-0 w-[70%]">
                  <input
                    className="px-3 py-3 w-full bg-teal-600 bg-opacity-5 rounded-[10px] outline-none border border-gray-800 focus:border-baseColor disabled:border-gray-600 disabled:text-gray-400"
                    placeholder="Enter initial SOL amount"
                    disabled={disabled}
                    value={solAmount}
                    onChange={(e) => setSolAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="w-full 2xl:block 2xl:w-[35%] bg-[rgba(0,0,0,0.3)] rounded-md bg-opacity-90">
              <div className="flex flex-col items-center justify-between h-auto gap-5 my-5 md:flex-row md:gap-0 mx-7">
                <div className="text-white text-base font-medium font-poppins leading-[24.93px]">
                  Address:
                </div>
                <div className="flex flex-col items-center w-full gap-5 text-teal-200 md:flex-row md:gap-0 md:w-auto">
                  <p className="text-white">
                    {currentProject.token && currentProject.token.address
                      ? ellipsisAddress(currentProject.token.address)
                      : "Not Set"}
                  </p>
                  {currentProject.token &&
                    currentProject.token.address &&
                    (copied["token_address"] ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 mx-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <FaRegCopy
                        className="w-5 h-5 mx-1 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-baseColor"
                        onClick={() =>
                          copyToClipboard(
                            "token_address",
                            currentProject.token.address
                          )
                        }
                      />
                    ))}
                </div>
              </div>
              <div className="flex flex-col items-center justify-between h-auto gap-5 my-5 md:flex-row md:gap-0 mx-7">
                <div className="text-white text-base font-medium font-poppins leading-[24.93px]">
                  Name:
                </div>
                <div className="flex flex-col items-center w-full gap-5 md:flex-row md:gap-0 md:w-auto">
                  {currentProject.token ? currentProject.token.name : ""}
                </div>
              </div>
              <div className="flex flex-col items-center justify-between h-auto gap-5 my-5 md:flex-row md:gap-0 mx-7">
                <div className="text-white text-base font-medium font-poppins leading-[24.93px]">
                  Symbol:
                </div>
                <div className="flex flex-col items-center w-full gap-5 md:flex-row md:gap-0 md:w-auto">
                  {currentProject.token ? currentProject.token.symbol : ""}
                </div>
              </div>
              <div className="flex flex-col items-center justify-between h-auto gap-5 my-5 md:flex-row md:gap-0 mx-7">
                <div className="text-white text-base font-medium font-poppins leading-[24.93px]">
                  Decimals:
                </div>
                <div className="flex flex-col items-center w-full gap-5 md:flex-row md:gap-0 md:w-auto">
                  {currentProject.token ? currentProject.token.decimals : ""}
                </div>
              </div>
              <div className="flex flex-col items-center justify-between h-auto gap-5 my-5 md:flex-row md:gap-0 mx-7">
                <div className="text-white text-base font-medium font-poppins leading-[24.93px]">
                  Total Supply:
                </div>
                <div className="flex flex-col items-center w-full gap-5 md:flex-row md:gap-0 md:w-auto">
                  {currentProject.token ? currentProject.token.totalSupply : ""}
                </div>
              </div>
            </div>
          </div>
          <div className="items-center h-auto px-5 py-1 mt-2 text-gray-500 bg-[rgba(0,0,0,0.3)] rounded-md">
            <div className="text-xl">Note:</div>
            <div className="text-base">
              SOL Disperse Wallet is one for sending SOL to all wallets.
            </div>
          </div>
        </div>
        <div className="w-full min-h-28 bg-slate-900 bg-opacity-90  rounded-b-[10px] items-center px-5">
          <div className="relative flex h-full my-5 text-white bg-transparent bg-clip-border justify-between">
            <button
              className="h-12 px-[25px] py-2.5 mr-2  rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
              disabled={disabled}
              onClick={() => setNewWalletDialog(true)}
            >
              <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                Generate Wallets
              </div>
            </button>
            <button
              className="h-12 px-[25px] py-2.5 mr-2  rounded-full border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
              onClick={() => setImportWalletsDialog(true)}
            >
              <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                Import Wallets
              </div>
            </button>
            <button
              className="h-12 px-[25px] py-2.5 mr-2  rounded-full border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
              onClick={handleDownloadWallets}
            >
              <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                Download Wallets
              </div>
            </button>
            <button
              className="h-12 px-[25px] py-2.5 mr-2 rounded-full border border-teal-600 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
              disabled={disabled}
              onClick={handleSetTokenAmounts}
            >
              <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                Set Token Amount
              </div>
            </button>
            {/* <button
                            className="h-12 px-[25px] py-2.5 mr-2 disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
                            disabled={disabled}
                            onClick={handleSetSOLAmounts}>
                            <div className="text-xl font-normal leading-normal text-center text-[#181a20] font-poppins">
                                Set SOL Amount
                            </div>
                        </button> */}
          </div>
          <div className="relative flex flex-col w-full h-full my-5 overflow-x-hidden text-white bg-transparent bg-clip-border">
            {currentProject.userWallets && currentProject.wallets && (
              <div className="py-4 text-lg text-center text-white bg-slate-tableHeader">
                User Wallets
              </div>
            )}
            <table className="w-full text-left rounded-md">
              <thead className="rounded-md">
                <tr className="">
                  <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30 rounded-l-md">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-baseColor border-gray-200 rounded shrink-0 focus:ring-baseColor disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-baseColor dark:checked:border-baseColor dark:focus:ring-offset-gray-800"
                      checked={walletAllChecked}
                      onChange={handleWalletAllChecked}
                    />
                  </th>
                  <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30">
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
                      Token Balance
                    </p>
                  </th>
                  <th className="p-4 border-b border-none bg-slate-title bg-opacity-30 rounded-r-md">
                    <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                      Tokens to buy
                    </p>
                  </th>
                  {/* <th className="p-4 border-b border-none bg-slate-title">
                                        <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                                            Additional SOL
                                        </p>
                                    </th> */}
                </tr>
              </thead>
              <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                {currentProject.wallets &&
                  currentProject.wallets.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-baseColor border-gray-200 rounded shrink-0 focus:ring-baseColor disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-baseColor dark:checked:border-baseColor dark:focus:ring-offset-gray-800"
                            checked={walletChecked[index]}
                            onChange={(e) =>
                              handleWalletChanged(
                                index,
                                "checked",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {index + 1}
                          </p>
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <div className="flex items-center justify-center gap-1 font-sans antialiased font-normal leading-normal text-teal-200">
                            <p className="text-white bg-transparent border-none outline-none">
                              {ellipsisAddress(item.address)}
                            </p>
                            {copied["wallet_" + index] ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <FaRegCopy
                                className="w-5 h-5 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-baseColor"
                                onClick={() =>
                                  copyToClipboard(
                                    "wallet_" + index,
                                    item.address
                                  )
                                }
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {walletTokenBalance[index]}
                          </p>
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <input
                            className="w-full px-3 py-3 bg-[rgba(0,0,0,0.3)] rounded-[10px] border border-gray-800 focus:border-baseColor outline-none text-center"
                            disabled={disabled}
                            value={walletTokenAmount[index]}
                            onChange={(e) =>
                              handleWalletChanged(
                                index,
                                "token_amount",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        {/* <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                    <input
                                                        className="w-full px-3 py-3 bg-[rgba(0,0,0,0.3)] rounded-[10px] border border-gray-800 focus:border-baseColor outline-none text-center"
                                                        disabled={disabled}
                                                        value={walletSolAmount[index]}
                                                        onChange={(e) => handleWalletChanged(index, "sol_amount", e.target.value)} />
                                                </td> */}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {(!currentProject.wallets ||
              currentProject.wallets.length === 0) && (
              <div className="my-3 text-3xl text-center text-gray-700">
                no wallet
              </div>
            )}
            {currentProject.userWallets && (
              <div className="py-4 mt-4 text-lg text-center text-yellow-200 bg-slate-tableHeader">
                Team Wallets
              </div>
            )}
            {currentProject.userWallets && (
              <table className="w-full text-left">
                <thead className="">
                  <tr className="">
                    <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-baseColor border-gray-200 rounded shrink-0 focus:ring-baseColor disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-slate-title dark:checked:border-baseColor dark:focus:ring-offset-gray-800"
                        checked={teamWalletAllChecked}
                        onChange={handleTeamWalletAllChecked}
                      />
                    </th>
                    <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-yellow-200">
                        No
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-yellow-200">
                        Address
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-yellow-200">
                        Token Balance
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-yellow-200">
                        Tokens to buy
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-yellow-200">
                        Additional SOL
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                  {currentProject.userWallets.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-baseColor border-gray-200 rounded shrink-0 focus:ring-baseColor disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-baseColor dark:checked:border-baseColor dark:focus:ring-offset-gray-800"
                            checked={teamWalletChecked[index]}
                            onChange={(e) =>
                              handleTeamWalletChanged(
                                index,
                                "checked",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <p className="block my-2 font-sans antialiased font-normal leading-normal text-center text-yellow-200">
                            {index + 1}
                          </p>
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <div className="flex items-center justify-center gap-1 font-sans antialiased font-normal leading-normal text-teal-200">
                            <p className="text-yellow-200 bg-transparent border-none outline-none">
                              {ellipsisAddress(item.address)}
                            </p>
                            {copied["team_wallet_" + index] ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <FaRegCopy
                                className="w-5 h-5 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-baseColor"
                                onClick={() =>
                                  copyToClipboard(
                                    "team_wallet_" + index,
                                    item.address
                                  )
                                }
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-yellow-200">
                            {teamWalletTokenBalance[index]}
                          </p>
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-yellow-200">
                            {teamWalletTokenAmount[index]}
                          </p>
                        </td>
                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-yellow-200" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="relative flex h-full my-5 text-white bg-transparent justify-evenly bg-clip-border">
            <button
              className="h-14 px-[25px] py-2.5 mr-4 rounded-full disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
              disabled={disabled}
              onClick={handleSimulate}
            >
              <div className="text-xl font-normal leading-normal text-center font-poppins">
                Simulate
              </div>
            </button>
            <button
              className="h-14 px-[25px] py-2.5 mr-4 rounded-full disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
              disabled={disabled}
              onClick={handleDisperse}
            >
              <div className="text-xl font-normal leading-normal text-center font-poppins">
                Disperse SOL
              </div>
            </button>
            <button
              className="h-14 px-[25px] py-2.5 mr-0 rounded-full disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none focus:ring-teal-300"
              disabled={disabled}
              onClick={handleBuyTokens}
            >
              <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                Execute Buy
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
