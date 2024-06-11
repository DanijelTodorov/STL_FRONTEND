import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { FaRegCopy, FaRegCheckCircle } from "react-icons/fa";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { IoClose, IoRefresh, IoRefreshCircle, IoTrashBin } from "react-icons/io5";
// import { GoLinkExternal } from "react-icons/go";
import { RiExternalLinkLine } from "react-icons/ri";
// import { IoMdEye } from "react-icons/io";
// import { TbTrashX } from "react-icons/tb";
// import { TiDeleteOutline } from "react-icons/ti";
import axios from "axios";

import { AppContext } from "../App";
import AddExtraWalletDialog from "../components/Dialogs/AddExtraWalletDialog";
import AddEmailDialog from "../components/Dialogs/AddEmailDialog";
import AddJitoSignerDialog from "../components/Dialogs/AddJitoSignerDialog";
import NewProjectDialog from "../components/Dialogs/NewProjectDialog";
import ConfirmDialog from "../components/Dialogs/ConfirmDialog";

import { getTokenListByOwner } from "../utils/solana";
import { ellipsisAddress, isValidAddress } from "../utils/methods";
import RefreshIcon from "../components/Icons/RefreshButton";

export default function DashboardPage({ className }) {
  const {
    SERVER_URL,
    setLoadingPrompt,
    setOpenLoading,
    user,
    users,
    setUsers,
    projects,
    setProjects,
    setCurrentProject,
    assets,
    setAssets,
    extraWallets,
    setExtraWallets,
    emails,
    setEmails,
    jitoSigners,
    setJitoSigners,
    loadAllProjects,
    loadAllUsers,
    loadAllEmails,
    loadAllJitoSigners
  } = useContext(AppContext);
  const navigate = useNavigate();
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();

  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState("");
  const [confirmDialogMessage, setConfirmDialogMessage] = useState("");
  const [confirmDialogAction, setConfirmDialogAction] = useState("");

  const [addExtraWalletDialog, setAddExtraWalletDialog] = useState(false);
  const [addEmailDialog, setAddEmailDialog] = useState(false);
  const [addJitoSignerDialog, setAddJitoSignerDialog] = useState(false);
  const [newProjectDialog, setNewProjectDialog] = useState(false);

  const [targetWallet, setTargetWallet] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedJitoSigner, setSelectedJitoSigner] = useState(null);
  const [selectedExtraWallet, setSelectedExtraWallet] = useState(null);
  const [copied, setCopied] = useState({});

  const copyToClipboard = async (key, text) => {
    if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
      setCopied({
        ...copied,
        [key]: true
      });
      setTimeout(
        () =>
          setCopied({
            ...copied,
            [key]: false
          }),
        2000
      );
    } else console.error("Clipboard not supported");
  };

  const handleConfirmDialogOK = async () => {
    setSelectedProject(null);
    setConfirmDialog(false);

    const accessToken = localStorage.getItem("access-token");
    if (confirmDialogAction === "delete-user") {
      setLoadingPrompt("Deleting user...");
      setOpenLoading(true);
      try {
        const { data } = await axios.post(
          `${SERVER_URL}/api/v1/user/delete`,
          {
            userId: selectedUser._id
          },
          {
            headers: {
              "Content-Type": "application/json",
              "MW-USER-ID": accessToken
            }
          }
        );
        if (data.users) setUsers(data.users);
        toast.success("User has been deleted successfully");
      } catch (err) {
        console.log(err);
        toast.warn("Failed to delete user");
      }
      setOpenLoading(false);
    } else if (confirmDialogAction === "activate-project") {
      setLoadingPrompt("Activating project...");
      setOpenLoading(true);
      try {
        const { data } = await axios.post(
          `${SERVER_URL}/api/v1/project/activate`,
          {
            projectId: selectedProject._id
          },
          {
            headers: {
              "Content-Type": "application/json",
              "MW-USER-ID": accessToken
            }
          }
        );
        if (data.projects) setProjects(data.projects);
        toast.success("Project has been activated successfully");
      } catch (err) {
        console.log(err);
        toast.warn("Failed to activate project");
      }
      setOpenLoading(false);
    } else if (confirmDialogAction === "delete-project") {
      setLoadingPrompt("Deleting project...");
      setOpenLoading(true);
      try {
        const { data } = await axios.post(
          `${SERVER_URL}/api/v1/project/delete`,
          {
            projectId: selectedProject._id
          },
          {
            headers: {
              "Content-Type": "application/json",
              "MW-USER-ID": accessToken
            }
          }
        );
        if (data.projects) {
          console.log("===== data projects:", data.projects);
          setProjects(data.projects);
        }
        toast.success("Project has been deleted successfully");
      } catch (err) {
        console.log(err);
        toast.warn("Failed to delete project");
      }
      setOpenLoading(false);
    } else if (confirmDialogAction === "delete-email") {
      setLoadingPrompt("Deleting email...");
      setOpenLoading(true);
      try {
        const { data } = await axios.post(
          `${SERVER_URL}/api/v1/misc/delete-email`,
          {
            emailId: selectedEmail._id
          },
          {
            headers: {
              "Content-Type": "application/json",
              "MW-USER-ID": accessToken
            }
          }
        );
        if (data.emails) setEmails(data.emails);
        toast.success("Email has been deleted successfully");
      } catch (err) {
        console.log(err);
        toast.warn("Failed to delete email");
      }
      setOpenLoading(false);
    } else if (confirmDialogAction === "delete-jito-signer") {
      setLoadingPrompt("Deleting jito-signer...");
      setOpenLoading(true);
      try {
        const { data } = await axios.post(
          `${SERVER_URL}/api/v1/misc/delete-jito-signer`,
          {
            address: selectedJitoSigner
          },
          {
            headers: {
              "Content-Type": "application/json",
              "MW-USER-ID": accessToken
            }
          }
        );
        if (data.signers) setJitoSigners(data.signers);
        toast.success("Jito-signer has been deleted successfully");
      } catch (err) {
        console.log(err);
        toast.warn("Failed to delete jito-signer");
      }
      setOpenLoading(false);
    } else if (confirmDialogAction === "delete-extra-wallet") {
      setLoadingPrompt("Deleting extra-wallet...");
      setOpenLoading(true);
      try {
        const { data } = await axios.post(
          `${SERVER_URL}/api/v1/misc/delete-extra-wallet`,
          {
            contactId: selectedExtraWallet._id
          },
          {
            headers: {
              "Content-Type": "application/json",
              "MW-USER-ID": accessToken
            }
          }
        );
        if (data.contacts) setExtraWallets(data.contacts);
        toast.success("Extra-wallet has been deleted successfully");
      } catch (err) {
        console.log(err);
        toast.warn("Failed to delete extra-wallet");
      }
      setOpenLoading(false);
    }
  };

  const [isProjectRefreshing, setIsProjectRefreshing] = useState(false);
  const [isAssetRefreshing, setIsAssetRefreshing] = useState(false);

  const handleCollectFee = async () => {
    if (!isValidAddress(targetWallet)) {
      toast.warn("Target wallet is invalid");
      return;
    }

    setLoadingPrompt("Collecting fee...");
    setOpenLoading(true);
    try {
      await axios.post(
        `${SERVER_URL}/api/v1/project/collect-fee`,
        {
          targetWallet
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token")
          }
        }
      );
    } catch (err) {
      console.log(err);
      toast.warn("Failed to collect fee!");
      setOpenLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setConfirmDialogTitle("Delete User");
    setConfirmDialogMessage(
      `Are you sure that you want to delete "${user.name}"?`
    );
    setConfirmDialogAction("delete-user");
    setConfirmDialog(true);
  };

  const handleActivateProject = (project) => {
    setSelectedProject(project);
    setConfirmDialogTitle("Activate Project");
    setConfirmDialogMessage(
      `Are you sure that you want to activate "${project.name}"?`
    );
    setConfirmDialogAction("activate-project");
    setConfirmDialog(true);
  };

  const handleDeleteProject = (project) => {
    setSelectedProject(project);
    setConfirmDialogTitle("Delete Project");
    setConfirmDialogMessage(
      `Are you sure that you want to delete "${project.name}"?`
    );
    setConfirmDialogAction("delete-project");
    setConfirmDialog(true);
  };

  const handleViewProject = (project) => {
    setCurrentProject(project);
    if (project.status === "OPEN") navigate("/buy");
    else navigate("/sell");
  };

  const handleDeleteEmail = (email) => {
    setSelectedEmail(email);
    setConfirmDialogTitle("Delete Email");
    setConfirmDialogMessage(
      `Are you sure that you want to delete "${email.email}"?`
    );
    setConfirmDialogAction("delete-email");
    setConfirmDialog(true);
  };

  const handleDeleteJitoSigner = (jitoSigner) => {
    setSelectedJitoSigner(jitoSigner);
    setConfirmDialogTitle("Delete Jito-Signer");
    setConfirmDialogMessage(
      `Are you sure that you want to delete "${ellipsisAddress(jitoSigner)}"?`
    );
    setConfirmDialogAction("delete-jito-signer");
    setConfirmDialog(true);
  };

  const handleSaveExtraWallet = async (name, privateKey) => {
    console.log("Saving extra-wallet...", name);
    setAddExtraWalletDialog(false);

    setLoadingPrompt("Saving extra-wallet...");
    setOpenLoading(true);
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/misc/add-extra-wallet`,
        {
          name: name,
          privateKey: privateKey
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token")
          }
        }
      );
      setExtraWallets(data.contacts);
      toast.success("Extra-wallet has been added successfully");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to add extra-wallet");
    }
    setOpenLoading(false);
  };

  const handleDeleteExtraWallet = (extraWallet) => {
    setSelectedExtraWallet(extraWallet);
    setConfirmDialogTitle("Delete Extra-Wallet");
    setConfirmDialogMessage(
      `Are you sure that you want to delete "${extraWallet.name}"?`
    );
    setConfirmDialogAction("delete-extra-wallet");
    setConfirmDialog(true);
  };

  const handleSaveEmail = async (name, email) => {
    console.log("Saving email...", name, email);
    setAddEmailDialog(false);

    setLoadingPrompt("Adding email...");
    setOpenLoading(true);
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/misc/add-email`,
        {
          name: name,
          email: email
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token")
          }
        }
      );
      setEmails(data.emails);
      toast.success("Email has been added successfully");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to add email");
    }
    setOpenLoading(false);
  };

  const handleSaveJitoSigner = async (privateKey) => {
    console.log("Saving jito-signer...");
    setAddJitoSignerDialog(false);

    setLoadingPrompt("Adding jito-signer...");
    setOpenLoading(true);
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/misc/add-jito-signer`,
        {
          privateKey
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token")
          }
        }
      );
      setJitoSigners(data.signers);
      toast.success("Jito-signer has been added successfully");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to add jito-signer");
    }
    setOpenLoading(false);
  };

  const handleCreateNewProject = async (name) => {
    console.log("Creating new project...", name);
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/project/create`,
        {
          name: name
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token")
          }
        }
      );
      console.log("=========== create project:", data);

      return {
        projectId: data.project._id,
        depositWallet: data.project.depositWallet.address,
        expireTime: data.expireTime
      };
    } catch (err) {
      return { error: err };
    }
  };

  const handleCheckNewProject = async (projectId) => {
    console.log("Checking new project...", projectId);
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/project/check-status`,
        {
          projectId
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": localStorage.getItem("access-token")
          }
        }
      );
      if (data.success) {
        return {
          activated: true
        };
      } else {
        return {
          expired: data.expired,
          expireTime: data.expireTime
        };
      }
    } catch (err) {
      return { error: err };
    }
  };

  const handleDoneCreatingNewProject = () => {
    console.log("================= handle done:");
    setNewProjectDialog(false);
    loadAllProjects();
  };

  const handleRefreshAssets = async () => {
    if (!connected) {
      setAssets([]);
      return;
    }

    setLoadingPrompt("Refreshing assets...");
    setOpenLoading(true);
    setIsAssetRefreshing(true);
    setTimeout(() => {
      setIsAssetRefreshing(false);
    }, 1000);
    try {
      const newTokenList = await getTokenListByOwner(
        connection,
        publicKey,
        true
      );
      setAssets(newTokenList);
    } catch (err) {
      console.log(err);
    }
    setOpenLoading(false);
  };

  return (
    <div className={`${className} flex flex-col text-white px-5`}>
      <ConfirmDialog
        isOpen={confirmDialog}
        title={confirmDialogTitle}
        message={confirmDialogMessage}
        onOK={handleConfirmDialogOK}
        onCancel={() => setConfirmDialog(false)}
      />
      <AddExtraWalletDialog
        isOpen={addExtraWalletDialog}
        onOK={handleSaveExtraWallet}
        onClose={() => setAddExtraWalletDialog(false)}
      />
      <AddEmailDialog
        isOpen={addEmailDialog}
        onOK={handleSaveEmail}
        onClose={() => setAddEmailDialog(false)}
      />
      <AddJitoSignerDialog
        isOpen={addJitoSignerDialog}
        onOK={handleSaveJitoSigner}
        onClose={() => setAddJitoSignerDialog(false)}
      />
      <NewProjectDialog
        isOpen={newProjectDialog}
        createProject={handleCreateNewProject}
        checkProject={handleCheckNewProject}
        onDone={handleDoneCreatingNewProject}
        onCancel={() => setNewProjectDialog(false)}
        initialData={{ step: 0, projectName: "" }}
      />
      {user && user.role === "admin" && (
        <div className="flex flex-col justify-between gap-5 2xl:flex-row">
          <div className="flex flex-col w-full pt-5">
            <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
              <div className="text-white text-[25px] font-medium font-poppins leading-normal">
                Service Fee
              </div>
              <div className="h-12 py-2.5" />
            </div>
            <div className="w-full py-5 h-auto bg-slate-900 bg-opacity-90  rounded-b-[10px] flex flex-col md:flex-row justify-between items-center px-5 gap-5">
              <div className="text-white text-base font-medium font-poppins leading-[24.93px] whitespace-nowrap">
                Target Wallet
              </div>
              <div className="flex flex-col items-center w-[50%] gap-5 md:flex-row md:gap-0">
                <input
                  className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] border border-blue-600 focus:border-blue-600 text-center"
                  placeholder="Enter the target wallet"
                  onChange={(e) => setTargetWallet(e.target.value)}
                />
                <button
                  className="ml-2 w-[140px] px-[35px] py-2.5 bg-gradient-to-r from-[#89d4fe] to-[#6fffff]  rounded-[10px] border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
                  onClick={handleCollectFee}
                >
                  <div className="text-xl font-normal leading-normal text-center text-[#181a20] font-poppins">
                    Collect
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {user && user.role === "admin" && (
        <div className="flex flex-col pt-5 ">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[25px] font-medium font-poppins leading-normal">
              All Users
            </div>
            <button
              className="h-12 px-[25px] py-2.5 border border-white justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
              onClick={() => loadAllUsers()}
            >
              <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                Refresh
              </div>
            </button>
          </div>
          <div className="w-full bg-slate-900 bg-opacity-90  rounded-b-[10px] flex justify-between items-center px-5">
            <div className="relative flex flex-col w-full h-full my-5 overflow-x-hidden text-white bg-transparent bg-clip-border">
              <table className="w-full text-left">
                <thead className="">
                  <tr className="">
                    <th className="w-10 p-4 border-b border-none bg-red-400">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        No
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Name
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Role
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Code
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Referral
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Action
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                  {users.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {index + 1}
                          </p>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {item.name}
                          </p>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {item.role}
                          </p>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {item.code}
                          </p>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {item.referral}
                          </p>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <div className="flex justify-center gap-2">
                            <button
                              className="w-[39px] h-[25px] relative flex items-center justify-center cursor-pointer active:scale-95 transition duration-100 ease-in-out transform bg-pink-800 rounded-[41px]"
                              onClick={() => handleDeleteUser(item)}
                            >
                              <IoTrashBin className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="my-3 text-3xl text-center text-gray-700">
                  No User
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col border-[1px] border-none rounded-t-[10px] mt-4">
        <div className="w-full h-auto px-5 py-2 bg-slate-title rounded-t-[10px] flex justify-between items-center">
          <div className="text-[20px] text-white font-medium font-poppins leading-normal">
            {user && user.role === "admin" ? "All Projects" : "My Projects"}
          </div>
          {user && user.role !== "admin" ? (
            <div>
              <button
                className="h-12 px-[25px] py-2 justify-center items-center gap-2.5 inline-flex border-[1px] border-white  rounded-full hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
                onClick={() => setNewProjectDialog(true)}
              >
                <div className="font-normal leading-normal text-center text-white font-poppins bg-transparent">
                  New Project
                </div>
              </button>

              <button
                className="h-12 px-[18px] py-2.5 rounded-full justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300 ml-2"
                onClick={() => {
                  loadAllProjects();
                  setIsProjectRefreshing(true);
                  setTimeout(() => {
                    setIsProjectRefreshing(false);
                  }, 1000);
                }}
              >
                {/* <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                  Refresh
                </div> */}
                <RefreshIcon className={`
                  size-4 relative ${isProjectRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          ) : (
            <button
              className="h-12 px-[25px] py-2.5 bg-gradient-to-r rounded-full border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
              onClick={() => {
                loadAllProjects();
                setIsAssetRefreshing(true);
                setTimeout(() => {
                  setIsAssetRefreshing(false);
                }, 2000);
              }}
            >
              {/* <div className="text-xl font-normal leading-normal text-center text-[#181a20] font-poppins">
                Refresh
              </div> */}
              <RefreshIcon className={`
                  size-4 relative ${isProjectRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
        <div className="w-full min-h-28 bg-slate-900 bg-opacity-90   flex justify-between items-center px-5">
          <div className="relative flex flex-col w-full h-full my-5 overflow-x-hidden text-white bg-transparent bg-clip-border">
            <table className="w-full text-left">
              <thead className="">
                <tr className="">
                  <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                      No
                    </p>
                  </th>
                  {user && user.role === "admin" && (
                    <th className="p-4 border-b border-none bg-slate-title bg-opacity-30">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        User Name
                      </p>
                    </th>
                  )}
                  <th className="p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                      {user && user.role === "admin" ? "Project Name" : "Name"}
                    </p>
                  </th>
                  <th className="p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                      Status
                    </p>
                  </th>
                  <th className="p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                      Action
                    </p>
                  </th>
                </tr>
              </thead>
              <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                {projects.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td className="p-4 border-b border-white border-opacity-30">
                        <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                          {index + 1}
                        </p>
                      </td>
                      {user && user.role === "admin" && (
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {item.userName}
                          </p>
                        </td>
                      )}
                      <td className="p-4 border-b border-white border-opacity-30">
                        <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                          {item.name}
                        </p>
                      </td>
                      <td className="p-4 border-b border-white border-opacity-30">
                        <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                          {item.status}
                        </p>
                      </td>
                      <td className="p-4 border-b border-white border-opacity-30">
                        <div className="flex justify-center gap-2">
                          {item.status === "INIT" ||
                            item.status === "EXPIRED" ? (
                            <button
                              className="w-[39px] h-[25px] relative flex items-center justify-center cursor-pointer active:scale-95 transition duration-100 ease-in-out transform bg-slate-500 rounded-[41px]"
                              onClick={() => handleActivateProject(item)}
                            >
                              <FaRegCheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              className="w-[39px] h-[25px] relative flex items-center justify-center cursor-pointer active:scale-95 transition duration-100 ease-in-out transform bg-transparent rounded-[41px]"
                              onClick={() => handleViewProject(item)}
                            >
                              <MdOutlineRemoveRedEye className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            className="w-[39px] h-[25px] relative flex items-center justify-center cursor-pointer active:scale-95 transition duration-100 ease-in-out transform bg-transparent rounded-[41px]"
                            onClick={() => handleDeleteProject(item)}
                          >
                            <IoTrashBin className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {projects.length === 0 && (
              <div className="my-3 text-3xl text-center text-gray-700">
                No Project
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col mt-10 border-[1px] border-none rounded-t-[15px]">
        <div className="w-full h-auto px-5 py-2 bg-slate-title rounded-t-[15px] flex justify-between items-center">
          <div className="text-[20px] text-white font-medium font-poppins leading-normal">
            My Assets
          </div>
          <button
            className="h-12 px-[18px] py-2.5 rounded-full justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
            onClick={handleRefreshAssets}
          >
            {/* <div className="text-xl font-normal leading-normal text-center text-[#181a20] font-poppins">
              Refresh
            </div> */}
            <RefreshIcon className={`
                  size-4 relative ${isAssetRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="w-full min-h-28 bg-slate-900 bg-opacity-90   flex justify-between items-center px-5">
          <div className="relative flex flex-col w-full h-full my-5 overflow-x-hidden text-white bg-transparent bg-clip-border">
            <table className="w-full text-left">
              <thead className="">
                <tr className="">
                  <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                      No
                    </p>
                  </th>
                  <th className="p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-white 2xl:ml-10">
                      Token
                    </p>
                  </th>
                  <th className="2xl:w-[23%] p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-white 2xl:ml-4">
                      Account
                    </p>
                  </th>
                  <th className="2xl:w-[23%] p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-white 2xl:ml-4">
                      Balance
                    </p>
                  </th>
                  <th className="2xl:w-[23%] p-4 border-b border-none bg-slate-title bg-opacity-30">
                    <p className="block font-sans antialiased font-normal leading-none text-white 2xl:ml-4">
                      Market ID
                    </p>
                  </th>
                </tr>
              </thead>
              <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                {assets.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td className="p-4 border-b border-white border-opacity-30">
                        <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                          {index + 1}
                        </p>
                      </td>
                      <td className="p-4 border-b border-white border-opacity-30">
                        <div className="flex items-center gap-1 font-sans antialiased font-normal leading-normal text-teal-200 2xl:ml-10 min-w-8">
                          <p className="w-auto text-white bg-transparent border-none outline-none">
                            {item.name !== "" && item.symbol !== ""
                              ? `${item.name} (${item.symbol})`
                              : item.name !== ""
                                ? item.name
                                : ellipsisAddress(item.mint)}
                          </p>
                          {copied["token_" + index] ? (
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
                                copyToClipboard("token_" + index, item.mint)
                              }
                            />
                          )}
                          <a
                            href={`https://solscan.io/token/${item.mint}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <RiExternalLinkLine className="w-6 h-6 transition duration-100 ease-in-out transform cursor-pointer active:scale-95" />
                          </a>
                        </div>
                      </td>
                      <td className="p-4 border-b border-white border-opacity-30">
                        <div className="flex items-center gap-1 font-sans antialiased font-normal leading-normal text-teal-200 2xl:ml-4 min-w-8">
                          <p className="w-auto text-white bg-transparent border-none outline-none">
                            {ellipsisAddress(item.account)}
                          </p>
                          {copied["account_" + index] ? (
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
                                  "account_" + index,
                                  item.account
                                )
                              }
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-b border-white border-opacity-30">
                        <p className="block font-sans antialiased font-normal leading-normal text-white 2xl:ml-4">
                          {item.balance}
                        </p>
                      </td>
                      <td className="p-4 border-b border-white border-opacity-30">
                        <div className="flex items-center gap-1 font-sans antialiased font-normal leading-normal text-teal-200 2xl:ml-4 min-w-8">
                          {item.marketId ? (
                            <>
                              <p className="w-auto text-white bg-transparent border-none outline-none">
                                {ellipsisAddress(item.marketId)}
                              </p>
                              {copied["market_" + index] ? (
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
                                      "market_" + index,
                                      item.marketId
                                    )
                                  }
                                />
                              )}
                            </>
                          ) : (
                            <p className="w-auto text-gray-600 bg-transparent border-none outline-none">
                              Not created
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {projects.length === 0 && (
              <div className="my-3 text-3xl text-center text-gray-700">
                No Project
              </div>
            )}
          </div>
        </div>
      </div>
      {user && user.role === "admin" && (
        <div className="flex flex-col pt-5">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[25px] font-medium font-poppins leading-normal">
              All Extra-Wallets
            </div>
            <button
              className="h-12 px-[25px] py-2.5 bg-gradient-to-r from-[#89d4fe] to-[#6fffff]  rounded-[40px] border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
              onClick={() => setAddExtraWalletDialog(true)}
            >
              <div className="text-xl font-normal leading-normal text-center text-[#181a20] font-poppins">
                Add New Wallet
              </div>
            </button>
          </div>
          <div className="w-full bg-slate-900 bg-opacity-90  rounded-b-[10px] flex justify-between items-center px-5">
            <div className="relative flex flex-col w-full h-full my-5 overflow-x-hidden text-white bg-transparent bg-clip-border">
              <table className="w-full text-left">
                <thead className="">
                  <tr className="">
                    <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        No
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Name
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Address
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Action
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                  {extraWallets.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {index + 1}
                          </p>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {item.name}
                          </p>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <div className="flex items-center justify-center gap-1 m-auto font-sans antialiased font-normal leading-normal text-teal-200 min-w-8">
                            <p className="w-auto text-white bg-transparent border-none outline-none">
                              {ellipsisAddress(item.address)}
                            </p>
                            {copied["extraWallets_" + index] ? (
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
                                    "extraWallets_" + index,
                                    item.address
                                  )
                                }
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <div className="flex justify-center gap-2">
                            <button
                              className="w-[39px] h-[25px] relative flex items-center justify-center cursor-pointer active:scale-95 transition duration-100 ease-in-out transform bg-pink-800 rounded-[41px]"
                              onClick={() => handleDeleteExtraWallet(item)}
                            >
                              <IoClose className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {extraWallets.length === 0 && (
                <div className="my-3 text-3xl text-center text-gray-700">
                  No Extra-Wallet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {user && user.role === "admin" && (
        <div className="flex flex-col pt-5">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[25px] font-medium font-poppins leading-normal">
              All Emails
            </div>
            <div>
              <button
                className="h-12 px-[25px] py-2.5 bg-gradient-to-r from-[#89d4fe] to-[#6fffff]  rounded-[40px] border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
                onClick={() => setAddEmailDialog(true)}
              >
                <div className="text-xl font-normal leading-normal text-center text-[#181a20] font-poppins">
                  Add New Email
                </div>
              </button>
              <button
                className="h-12 px-[25px] py-2.5 bg-gradient-to-r from-[#89d4fe] to-[#6fffff]  rounded-[40px] border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300 ml-2"
                onClick={() => loadAllEmails()}
              >
                <div className="text-xl font-normal leading-normal text-center text-[#181a20] font-poppins">
                  Refresh
                </div>
              </button>
            </div>
          </div>
          <div className="w-full bg-slate-900 bg-opacity-90  rounded-b-[10px] flex justify-between items-center px-5">
            <div className="relative flex flex-col w-full h-full my-5 overflow-x-hidden text-white bg-transparent bg-clip-border">
              <table className="w-full text-left">
                <thead className="">
                  <tr className="">
                    <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        No
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Name
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Email
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Action
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                  {emails.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {index + 1}
                          </p>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {item.name}
                          </p>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <div className="flex items-center justify-center gap-1 m-auto font-sans antialiased font-normal leading-normal text-teal-200 min-w-8">
                            <p className="w-auto text-white bg-transparent border-none outline-none">
                              {item.email}
                            </p>
                            {copied["email_" + index] ? (
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
                                  copyToClipboard("email_" + index, item.email)
                                }
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <div className="flex justify-center gap-2">
                            <button
                              className="w-[39px] h-[25px] relative flex items-center justify-center cursor-pointer active:scale-95 transition duration-100 ease-in-out transform bg-pink-800 rounded-[41px]"
                              onClick={() => handleDeleteEmail(item)}
                            >
                              <IoClose className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {emails.length === 0 && (
                <div className="my-3 text-3xl text-center text-gray-700">
                  No Email
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {user && user.role === "admin" && (
        <div className="flex flex-col pt-5">
          <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
            <div className="text-white text-[25px] font-medium font-poppins leading-normal">
              All Jito-Signers
            </div>
            <div>
              <button
                className="h-12 px-[25px] py-2.5 bg-gradient-to-r from-[#89d4fe] to-[#6fffff]  rounded-[40px] border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
                onClick={() => setAddJitoSignerDialog(true)}
              >
                <div className="text-xl font-normal leading-normal text-center text-[#181a20] font-poppins">
                  Add New Jito-Signer
                </div>
              </button>
              <button
                className="h-12 px-[25px] py-2.5 bg-gradient-to-r from-[#89d4fe] to-[#6fffff]  rounded-[40px] border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300 ml-2"
                onClick={() => loadAllJitoSigners()}
              >
                <div className="text-xl font-normal leading-normal text-center text-[#181a20] font-poppins">
                  Refresh
                </div>
              </button>
            </div>
          </div>
          <div className="w-full bg-slate-900 bg-opacity-90  rounded-b-[10px] flex justify-between items-center px-5">
            <div className="relative flex flex-col w-full h-full my-5 overflow-x-hidden text-white bg-transparent bg-clip-border">
              <table className="w-full text-left">
                <thead className="">
                  <tr className="">
                    <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        No
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Address
                      </p>
                    </th>
                    <th className="p-4 border-b border-none bg-slate-title">
                      <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                        Action
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                  {jitoSigners.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                            {index + 1}
                          </p>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <div className="flex items-center justify-center gap-1 m-auto font-sans antialiased font-normal leading-normal text-teal-200 min-w-8">
                            <p className="w-auto text-white bg-transparent border-none outline-none">
                              {ellipsisAddress(item)}
                            </p>
                            {copied["jito_signer_" + index] ? (
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
                                  copyToClipboard("jito_signer_" + index, item)
                                }
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-4 border-b border-white border-opacity-30">
                          <div className="flex justify-center gap-2">
                            <button
                              className="w-[39px] h-[25px] relative flex items-center justify-center cursor-pointer active:scale-95 transition duration-100 ease-in-out transform bg-pink-800 rounded-[41px]"
                              onClick={() => handleDeleteJitoSigner(item)}
                            >
                              <IoClose className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {emails.length === 0 && (
                <div className="my-3 text-3xl text-center text-gray-700">
                  No Email
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
