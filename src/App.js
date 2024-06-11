import { createContext, useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  getMint,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import BigNumber from "bignumber.js";
import axios from "axios";
import io from "socket.io-client";

import "./App.css";
import SideBar from "./components/SideBar";
import NavBar from "./components/NavBar";
import DashboardPage from "./pages/DashboardPage";
import CreateTokenPage from "./pages/CreateTokenPage";
import SetAuthorityPage from "./pages/SetAuthorityPage";
import OpenBookMarketPage from "./pages/OpenBookMarketPage";
import ManageLpPage from "./pages/ManageLpPage";
import TokenAccountPage from "./pages/TokenAccountPage";
import BuyPage from "./pages/BuyPage";
import SellPage from "./pages/SellPage";
import TransferPage from "./pages/TransferPage";
import SignupPage from "./pages/SignupPage";
import SigninPage from "./pages/SigninPage";

import LoadingDialog from "./components/Dialogs/LoadingDialog";
import NotifyAddressDialog from "./components/Dialogs/NotifyAddressDialog";
import { getTokenListByOwner } from "./utils/solana";
import { isValidAddress } from "./utils/methods";
import BotPage from "./pages/BotPage";

const SERVER_URL = `${process.env.REACT_APP_SERVER_URL}/sol_launchpad_api`;
const WEBSOCKET_HOST = process.env.REACT_APP_SERVER_URL;

console.log("SERVER_URL >>> ", SERVER_URL);
console.log("WEBSOCKET_HOST >>> ", WEBSOCKET_HOST);

export const AppContext = createContext(null);

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();

  const [loadingPrompt, setLoadingPrompt] = useState("");
  const [openLoading, setOpenLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState({});
  const [assets, setAssets] = useState([]);
  const [webSocket, setWebSocket] = useState(null);
  const [notifyStatus, setNotifyStatus] = useState({
    success: true,
    tag: "NONE",
  });
  const [extraWallets, setExtraWallets] = useState([]);
  const [emails, setEmails] = useState([]);
  const [jitoSigners, setJitoSigners] = useState([]);
  const [walletBalanceData, setWalletBalanceData] = useState([]);
  const [teamWalletBalanceData, setTeamWalletBalanceData] = useState([]);
  const [breadCrumb, setBreadCrumb] = useState("");

  const [notifyAddressDialog, setNotifyAddressDialog] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyAddress, setNotifyAddress] = useState("");

  const openWebSocket = (userId) => {
    console.log("Starting websocket...");
    const ws = new io(WEBSOCKET_HOST);
    ws.on("connect", () => {
      console.log("WebSocket connection established");
      ws.emit("NEW_USER", userId);
    });

    ws.on("BUY_PENDING", async (value) => {
      setNotifyStatus({ success: true, tag: "BUY_PENDING" });
    });

    ws.on("SIMULATE_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({
          success: true,
          tag: "SIMULATE_COMPLETED",
          data: m.data,
        });
      else
        setNotifyStatus({
          success: false,
          tag: "SIMULATE_COMPLETED",
          error: m.error,
        });
    });

    ws.on("DISPERSE_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "DISPERSE_COMPLETED" });
      else setNotifyStatus({ success: false, tag: "DISPERSE_COMPLETED" });
    });

    ws.on("BUY_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({
          success: true,
          tag: "BUY_COMPLETED",
          project: m.project,
        });
      else setNotifyStatus({ success: false, tag: "BUY_COMPLETED" });
    });

    ws.on("BUY_SMALL_TOKEN", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({
          success: true,
          tag: "BUY_SMALL_TOKEN",
          project: m.project,
        });
      else setNotifyStatus({ success: false, tag: "BUY_SMALL_TOKEN" });
    });

    ws.on("SELL_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      setNotifyStatus({
        success: m.message === "OK",
        tag: "SELL_COMPLETED",
        project: m.project,
      });
    });

    ws.on("TRANSFER_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      setNotifyStatus({
        success: m.message === "OK",
        tag: "TRANSFER_COMPLETED",
        project: m.project,
      });
    });

    ws.on("COLLECT_ALL_SOL", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "COLLECT_ALL_SOL" });
      else setNotifyStatus({ success: false, tag: "COLLECT_ALL_SOL" });
    });

    ws.on("COLLECT_ALL_FEE", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "COLLECT_ALL_FEE" });
      else setNotifyStatus({ success: false, tag: "COLLECT_ALL_FEE" });
    });

    ws.on("LOG", (value) => {
      console.log("SERVER:", value);
    });

    ws.on("disconnect", () => {
      console.log("WebSocket connection closed");
      // setConnected(false);
    });

    ws.on("CREATE_TOKEN", async (value) => {
      const m = JSON.parse(value);
      setOpenLoading(false);
      if (m.message === "OK") {
        setNotifyStatus({ success: true, tag: "CREATE_TOKEN" });
        setNotifyAddressDialog(true);
      } else setNotifyStatus({ success: false, tag: "CREATE_TOKEN" });
    });

    ws.on("CREATE_OPENBOOKMARKET", async (value) => {
      setOpenLoading(false);
      const m = JSON.parse(value);
      if (m.message === "OK") {
        setNotifyStatus({ success: true, tag: "CREATE_OPENBOOKMARKET" });
        setNotifyAddressDialog(true);
      } else setNotifyStatus({ success: false, tag: "CREATE_OPENBOOKMARKET" });
    });

    ws.on("REVOKE_MINT", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "REVOKE_MINT" });
      else setNotifyStatus({ success: false, tag: "REVOKE_MINT" });
    });

    ws.on("SET_MINT", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "SET_MINT" });
      else setNotifyStatus({ success: false, tag: "SET_MINT" });
    });

    ws.on("FREEZE_MINT", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "FREEZE_MINT" });
      else setNotifyStatus({ success: false, tag: "FREEZE_MINT" });
    });

    ws.on("REVOKE_FREEZE_MINT", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "REVOKE_FREEZE_MINT" });
      else setNotifyStatus({ success: false, tag: "REVOKE_FREEZE_MINT" });
    });

    ws.on("REMOVE_LP", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "REMOVE_LP" });
      else setNotifyStatus({ success: false, tag: "REMOVE_LP" });
    });

    ws.on("BURN_LP", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "BURN_LP" });
      else setNotifyStatus({ success: false, tag: "BURN_LP" });
    });

    ws.on("BURN_TOKEN", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "BURN_TOKEN" });
      else setNotifyStatus({ success: false, tag: "BURN_TOKEN" });
    });

    ws.on("CLOSE_TOKEN", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "CLOSE_TOKEN" });
      else setNotifyStatus({ success: false, tag: "CLOSE_TOKEN" });
    });

    setWebSocket(ws);
  };

  const closeWebSocket = () => {
    if (webSocket) webSocket.close();
    setWebSocket(null);
  };

  const updateAllBalances = async (token, wallets, userWallets) => {
    try {
      console.log("Updating all balances...", token, wallets, userWallets);

      const mint = new PublicKey(token);
      const mintInfo = await getMint(connection, mint);

      const balances = await Promise.all(
        wallets.map(async (item) => {
          if (isValidAddress(item)) {
            console.log(
              `reading balance of wallet ${item} for SPL token ${mint}`
            );
            try {
              const owner = new PublicKey(item);
              const tokenATA = await getAssociatedTokenAddress(mint, owner);
              const tokenAccountInfo = await getAccount(connection, tokenATA);
              return Number(
                new BigNumber(
                  tokenAccountInfo.amount.toString() +
                    "e-" +
                    mintInfo.decimals.toString()
                ).toString()
              ).toFixed(4);
            } catch (err) {
              console.log(err);
            }
          }
          return 0;
        })
      );
      setWalletBalanceData(balances);

      if (userWallets) {
        const teamBalances = await Promise.all(
          userWallets.map(async (item) => {
            if (isValidAddress(item)) {
              try {
                const owner = new PublicKey(item);
                const tokenATA = await getAssociatedTokenAddress(mint, owner);
                const tokenAccountInfo = await getAccount(connection, tokenATA);
                return Number(
                  new BigNumber(
                    tokenAccountInfo.amount.toString() +
                      "e-" +
                      mintInfo.decimals.toString()
                  ).toString()
                ).toFixed(4);
              } catch (err) {
                console.log(err);
              }
            }
            return 0;
          })
        );
        setTeamWalletBalanceData(teamBalances);
      }

      console.log("Updated all balances");
    } catch (err) {
      console.log(err);
      setWalletBalanceData(wallets.map(() => "0"));
      setTeamWalletBalanceData(userWallets ? userWallets.map(() => "0") : []);
    }
  };

  const loadAllProjects = async () => {
    let newProjects = [];
    setLoadingPrompt("Loading all projects...");
    setOpenLoading(true);
    try {
      console.log("Loading all projects...");
      const { data } = await axios.get(
        `${SERVER_URL}/api/v1/project/load-all`,
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token"),
          },
        }
      );
      if (data.projects) newProjects = data.projects;
    } catch (err) {
      console.log(err);
      toast.warn("Failed to load projects");
    }

    setOpenLoading(false);
    setProjects(newProjects);

    console.log("=============== load All project : ", newProjects);

    setCurrentProject({});
    // setWalletBalanceData([]);
  };

  const loadAllUsers = async () => {
    let newUsers = [];
    setLoadingPrompt("Loading all users...");
    setOpenLoading(true);
    try {
      console.log("Loading all users...");
      const { data } = await axios.get(`${SERVER_URL}/api/v1/user/load-all`, {
        headers: {
          "Content-Type": "application/json",
          "MW-USER-ID": localStorage.getItem("access-token"),
        },
      });
      if (data.users) newUsers = data.users;
    } catch (err) {
      console.log(err);
      toast.warn("Failed to load users");
    }

    setOpenLoading(false);
    setUsers(newUsers);
  };

  const loadAllEmails = async () => {
    let newEmails = [];
    setLoadingPrompt("Loading all emails...");
    setOpenLoading(true);
    try {
      console.log("Loading all emails...");
      const { data } = await axios.get(
        `${SERVER_URL}/api/v1/misc/load-emails`,
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token"),
          },
        }
      );
      if (data.emails) newEmails = data.emails;
    } catch (err) {
      console.log(err);
      toast.warn("Failed to load users");
    }

    setOpenLoading(false);
    setEmails(newEmails);
  };

  const loadAllJitoSigners = async () => {
    let newJitoSigners = [];
    setLoadingPrompt("Loading all jito-signers...");
    setOpenLoading(true);
    try {
      console.log("Loading all jito-signers...");
      const { data } = await axios.get(
        `${SERVER_URL}/api/v1/misc/load-jito-signers`,
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token"),
          },
        }
      );
      if (data.signers) newJitoSigners = data.signers;
    } catch (err) {
      console.log(err);
      toast.warn("Failed to load users");
    }

    setOpenLoading(false);
    setJitoSigners(newJitoSigners);
  };

  const updateProject = (project) => {
    const newProjects = [...projects];
    for (let i = 0; i < newProjects.length; i++) {
      if (project._id === newProjects[i]._id) {
        newProjects[i] = project;
        break;
      }
    }
    console.log("========== update project : ", newProjects);
    setProjects(newProjects);
  };

  const initAllData = async (accessToken, user) => {
    let newUsers = [];
    let newProjects = [];
    let newEmails = [];
    let newJitoSigners = [];
    let newExtraWallets = [];

    setLoadingPrompt("Initializing...");
    setOpenLoading(true);

    if (user.role === "admin") {
      try {
        console.log("Loading all users...");
        const { data } = await axios.get(`${SERVER_URL}/api/v1/user/load-all`, {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": accessToken,
          },
        });
        if (data.users) newUsers = data.users;
      } catch (err) {
        console.log(err);
        toast.warn("Failed to load users");
      }
    }

    try {
      console.log("Loading all projects...");
      const { data } = await axios.get(
        `${SERVER_URL}/api/v1/project/load-all`,
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": accessToken,
          },
        }
      );
      if (data.projects) newProjects = data.projects;

      console.log("========= init load project:", data.projects);
    } catch (err) {
      console.log(err);
      toast.warn("Failed to load projects");
    }

    if (user.role === "admin") {
      try {
        console.log("Loading all emails...");
        const { data } = await axios.get(
          `${SERVER_URL}/api/v1/misc/load-emails`,
          {
            headers: {
              "Content-Type": "application/json",
              "MW-USER-ID": accessToken,
            },
          }
        );
        if (data.emails) newEmails = data.emails;
      } catch (err) {
        console.log(err);
        toast.warn("Failed to load emails");
      }
    }

    if (user.role === "admin") {
      try {
        console.log("Loading all jito-signers...");
        const { data } = await axios.get(
          `${SERVER_URL}/api/v1/misc/load-jito-signers`,
          {
            headers: {
              "Content-Type": "application/json",
              "MW-USER-ID": accessToken,
            },
          }
        );
        if (data.signers) newJitoSigners = data.signers;
      } catch (err) {
        console.log(err);
        toast.warn("Failed to load jito-signers");
      }
    }

    if (user.role === "admin") {
      try {
        console.log("Loading all extra-wallets...");
        const { data } = await axios.get(
          `${SERVER_URL}/api/v1/misc/load-extra-wallets`,
          {
            headers: {
              "Content-Type": "application/json",
              "MW-USER-ID": accessToken,
            },
          }
        );
        newExtraWallets = data.contacts;
      } catch (err) {
        console.log(err);
        toast.warn("Failed to load extra-wallets");
      }
    }

    setOpenLoading(false);

    setProjects(newProjects);
    setCurrentProject({});
    // setWalletBalanceData([]);
    if (user.role === "admin") {
      setUsers(newUsers);
      setEmails(newEmails);
      setJitoSigners(newJitoSigners);
      setExtraWallets(newExtraWallets);
    }
  };

  const logout = async () => {
    console.log("Logging out...");

    setLoadingPrompt("Logging out...");
    setOpenLoading(true);
    try {
      await axios.get(`${SERVER_URL}/api/v1/user/logout`, {
        headers: {
          "MW-USER-ID": localStorage.getItem("access-token"),
        },
      });
      localStorage.removeItem("access-token");

      setUsers([]);
      setProjects([]);
      setCurrentProject({});
      // setWalletBalanceData([]);
      setUser(null);
      closeWebSocket();
    } catch (error) {
      console.log(error);
      toast.warn("Failed to logout");
    }
    setOpenLoading(false);
  };

  useEffect(() => {
    if (
      currentProject.token ||
      (currentProject.wallets && currentProject.wallets.length > 0) ||
      (currentProject.userWallets && currentProject.userWallets.length > 0)
    ) {
      const wallets = currentProject.wallets.map((item) => item.address);
      const userWallets = currentProject.userWallets
        ? currentProject.userWallets.map((item) => item.address)
        : [];
      updateAllBalances(currentProject.token.address, wallets, userWallets);
    } else setWalletBalanceData([]);
  }, [
    currentProject.token,
    currentProject.wallets,
    currentProject.userWallets,
  ]);

  // useEffect(() => {
  //     const loadUser = async (accessToken) => {
  //         try {
  //             const { data } = await axios.get(`${SERVER_URL}/api/v1/user/me`,
  //                 {
  //                     headers: {
  //                         "Content-Type": "application/json",
  //                         "MW-USER-ID": accessToken,
  //                     },
  //                 }
  //             );
  //             if (data.success) {
  //                 setUser(data.user);
  //             }
  //         }
  //         catch (err) {
  //             console.log(err);
  //             setUser(null);
  //         }
  //     };

  //     loadUser(localStorage.getItem("access-token"));
  // }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      if (
        location.pathname !== "/" &&
        location.pathname !== "/login" &&
        location.pathname !== "/register"
      ) {
        navigate("/login");
      }
    } else {
      if (
        location.pathname !== "/dashboard" &&
        location.pathname !== "/create-token" &&
        location.pathname !== "/set-authority" &&
        location.pathname !== "/openbook" &&
        location.pathname !== "/manage-lp" &&
        location.pathname !== "/token-account" &&
        location.pathname !== "/buy" &&
        location.pathname !== "/sell" &&
        location.pathname !== "/transfer" &&
        location.pathname !== "/bot"
      ) {
        navigate("/dashboard");
      }
    }
  }, [location, navigate, user]);

  useEffect(() => {
    if (location.pathname === "/dashboard") setBreadCrumb("Dashboard");
    else if (location.pathname === "/buy") setBreadCrumb("Project > Buy");
    else if (location.pathname === "/sell") setBreadCrumb("Project > Sell");
    else if (location.pathname === "/transfer")
      setBreadCrumb("Project > Transfer");
    else if (location.pathname === "/create-token")
      setBreadCrumb("Tools > Create SPL Token");
    else if (location.pathname === "/set-authority")
      setBreadCrumb("Tools > Set Authority");
    else if (location.pathname === "/openbook")
      setBreadCrumb("Tools > Create OpenBook Market");
    else if (location.pathname === "/manage-lp")
      setBreadCrumb("Tools > Manage LP");
    else if (location.pathname === "/token-account")
      setBreadCrumb("Tools > Token Account");
    else if (location.pathname === "/bot")
      setBreadCrumb("Bot");
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      console.log("Succeed to login");
      toast.success("Succeed to login");

      // if (webSocket)
      //     webSocket.close();

      openWebSocket(user._id);

      const accessToken = localStorage.getItem("access-token");
      initAllData(accessToken, user);
    } else console.log("Logged out");
  }, [user]);

  useEffect(() => {
    if (notifyStatus.tag === "COLLECT_ALL_SOL") {
      if (notifyStatus.success) toast.success("Succeed to collect all SOL!");
      else toast.warn("Failed to collect all SOL!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "COLLECT_ALL_FEE") {
      if (notifyStatus.success) toast.success("Succeed to collect fee!");
      else toast.warn("Failed to collect fee!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "CREATE_TOKEN") {
      if (notifyStatus.success) toast.success("Succeed to create spl token!");
      else toast.warn("Failed to create spl token!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "CREATE_OPENBOOKMARKET") {
      if (notifyStatus.success)
        toast.success("Succeed to create OpenBookMarket!");
      else toast.warn("Failed to create OpenBookMarket!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "REVOKE_MINT") {
      if (notifyStatus.success) toast.success("Revoke mint success!");
      else toast.warn("Failed to revoke mint!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "SET_MINT") {
      if (notifyStatus.success) toast.success("Succeed to set mint authority!");
      else toast.warn("Failed to set mint authority!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "FREEZE_MINT") {
      if (notifyStatus.success) toast.success("Succeed to freeze authority!");
      else toast.warn("Failed to freeze authority!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "REVOKE_FREEZE_MINT") {
      if (notifyStatus.success) toast.success("Succeed to revoke freeze mint!");
      else toast.warn("Failed to revoke freeze mint!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "REMOVE_LP") {
      if (notifyStatus.success) toast.success("Succeed to remove LP!");
      else toast.warn("Failed to remove LP!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "BURN_LP") {
      if (notifyStatus.success) toast.success("Succeed to burn LP!");
      else toast.warn("Failed to burn LP!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "BURN_TOKEN") {
      if (notifyStatus.success) toast.success("Succeed to burn token!");
      else toast.warn("Failed to burn token!");
      setOpenLoading(false);
    }
    if (notifyStatus.tag === "CLOSE_TOKEN") {
      if (notifyStatus.success) toast.success("Succeed to close spl token!");
      else toast.warn("Failed to close spl token!");
      setOpenLoading(false);
    }
  }, [notifyStatus]);

  useEffect(() => {
    if (connected) {
      // console.log("Making metaplex...");
      // const newMetaplex = Metaplex.make(connection)
      //     .use(irysStorage())
      //     .use(walletAdapterIdentity({
      //         publicKey,
      //         signMessage,
      //         signTransaction,
      //         signAllTransactions
      //     }));
      // setMetaplex(newMetaplex);

      console.log("Getting token accounts...");
      getTokenListByOwner(connection, publicKey, true).then((response) => {
        setAssets(response);
        console.log("Success");
      });
    } else setAssets([]);
  }, [connected, connection, publicKey]);

  return (
    <AppContext.Provider
      value={{
        SERVER_URL,
        setLoadingPrompt,
        setOpenLoading,
        logout,
        user,
        setUser,
        users,
        setUsers,
        projects,
        setProjects,
        currentProject,
        setCurrentProject,
        assets,
        setAssets,
        webSocket,
        setWebSocket,
        openWebSocket,
        closeWebSocket,
        extraWallets,
        setExtraWallets,
        emails,
        setEmails,
        jitoSigners,
        setJitoSigners,
        loadAllProjects,
        loadAllUsers,
        loadAllEmails,
        loadAllJitoSigners,
        updateProject,
        walletBalanceData,
        setWalletBalanceData,
        teamWalletBalanceData,
        setTeamWalletBalanceData,
        updateAllBalances,
        notifyStatus,
        setNotifyStatus,
        setNotifyTitle,
        setNotifyAddress,
        setNotifyAddressDialog,
      }}
    >
      <LoadingDialog isOpen={openLoading} prompt={loadingPrompt} />
      <NotifyAddressDialog
        isOpen={notifyAddressDialog}
        title={notifyTitle}
        address={notifyAddress}
        onClose={() => setNotifyAddressDialog(false)}
      />
      {user ? (
        <div className="flex flex-col min-h-[100vh] overflow-x-hidden backdrop-blur-md">
          <div className="relative flex items-start justify-between w-full h-max">
            <SideBar className="2xl:block  w-[70px] 2xl:w-[300px] h-[100vh] shadow-md" />
            <div className="flex flex-col w-full 2xl:w-[calc(100%-300px)] h-screen">
              <div className="px-1 relative">
                <NavBar className="flex w-full h-[100px]" />
                <div className="flex items-center justify-between w-full h-10 px-5 py-3 bg-baseColor bg-opacity-50">
                  <div className="text-base font-medium leading-normal text-white font-poppins">
                    {breadCrumb}
                  </div>
                </div>
                <div className="w-full h-[calc(100vh-200px)] overflow-y-auto">
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/create-token" element={<CreateTokenPage />} />
                    <Route
                      path="/set-authority"
                      element={<SetAuthorityPage />}
                    />
                    <Route path="/openbook" element={<OpenBookMarketPage />} />
                    <Route path="/manage-lp" element={<ManageLpPage />} />
                    <Route
                      path="/token-account"
                      element={<TokenAccountPage />}
                    />
                    <Route path="/buy" element={<BuyPage />} />
                    <Route path="/sell" element={<SellPage />} />
                    <Route path="/transfer" element={<TransferPage />} />
                    <Route path="/bot" element={<BotPage />} />
                  </Routes>
                </div>
              </div>
              <div className="flex flex-1 bg-gradient-to-r from-[#ffffff0d] to-[#ffffff05] text-white justify-center items-center ">
                <label>Copyright © 2024. All rights reserved.</label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/register" element={<SignupPage />} />
          <Route path="/login" element={<SigninPage />} />
          <Route path="/" element={<SigninPage />} />
        </Routes>
      )}
    </AppContext.Provider>
  );
}

export default App;
