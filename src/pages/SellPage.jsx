
import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaRegCopy } from "react-icons/fa";
import axios from "axios";

import { AppContext } from "../App";
import { ellipsisAddress, isValidAddress } from "../utils/methods";

export default function SellPage({ className }) {
    const {
        SERVER_URL,
        setLoadingPrompt,
        setOpenLoading,
        currentProject,
        setCurrentProject,
        walletBalanceData,
        teamWalletBalanceData,
        notifyStatus,
        setNotifyStatus,
    } = useContext(AppContext);

    const [copied, setCopied] = useState({});
    const [targetWallet, setTargetWallet] = useState("");
    const [walletAllChecked, setWalletAllChecked] = useState(false);
    const [walletChecked, setWalletChecked] = useState([]);
    const [walletTokenBalance, setWalletTokenBalance] = useState([]);
    const [walletSellPercent, setWalletSellPercent] = useState([]);
    const [walletTransferOnSale, setWalletTransferOnSale] = useState([]);
    const [teamWalletAllChecked, setTeamWalletAllChecked] = useState(false);
    const [teamWalletChecked, setTeamWalletChecked] = useState([]);
    const [teamWalletTokenBalance, setTeamWalletTokenBalance] = useState([]);
    const [teamWalletSellPercent, setTeamWalletSellPercent] = useState([]);
    const [teamWalletTransferOnSale, setTeamWalletTransferOnSale] = useState([]);

    useEffect(() => {
        if (currentProject.wallets) {
            if (currentProject.wallets.length !== walletChecked.length) {
                const newWalletChecked = currentProject.wallets.map(() => false);
                setWalletChecked(newWalletChecked);
                setWalletAllChecked(false);

                setWalletSellPercent(currentProject.wallets.map(() => ""));
                setWalletTransferOnSale(currentProject.wallets.map(() => false));
            }

            setWalletTokenBalance(currentProject.wallets.map(() => ""));
        }
        else {
            setWalletAllChecked(false);
            setWalletChecked([]);
            setWalletTokenBalance([]);
            setWalletSellPercent([]);
            setWalletTransferOnSale([]);
        }
    }, [currentProject.wallets, walletChecked.length]);

    useEffect(() => {
        if (currentProject.userWallets) {
            if (currentProject.userWallets.length !== teamWalletChecked.length) {
                const newTeamWalletChecked = currentProject.userWallets.map(() => false);
                setTeamWalletChecked(newTeamWalletChecked);
                setTeamWalletAllChecked(false);

                setTeamWalletSellPercent(currentProject.userWallets.map(() => ""));
                setTeamWalletTransferOnSale(currentProject.userWallets.map(() => false));
            }

            setTeamWalletTokenBalance(currentProject.userWallets.map(() => ""));
        }
        else {
            setTeamWalletAllChecked(false);
            setTeamWalletChecked([]);
            setTeamWalletTokenBalance([]);
            setTeamWalletSellPercent([]);
            setTeamWalletTransferOnSale([]);
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
        if (notifyStatus.tag === "SELL_COMPLETED") {
            if (notifyStatus.success)
                toast.success("Succeed to sell tokens!");
            else
                toast.warn("Failed to sell tokens!");
            if (notifyStatus.project)
                setCurrentProject(notifyStatus.project);

            setOpenLoading(false);
            setNotifyStatus({ success: true, tag: "NONE" });
        }
    }, [notifyStatus]);

    const copyToClipboard = async (key, text) => {
        if ('clipboard' in navigator) {
            await navigator.clipboard.writeText(text);
            toast.success("Copied");
            setCopied({
                ...copied,
                [key]: true,
            });
            setTimeout(() => setCopied({
                ...copied,
                [key]: false,
            }), 2000);
        }
        else
            console.error('Clipboard not supported');
    };

    const handleDownloadWallets = async () => {
        if (!currentProject.token) {
            toast.warn("Select the project");
            return;
        }

        setLoadingPrompt("Downloading wallets...");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/download-wallets`,
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
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute(
                    'download',
                    fileName,
                );
            
                // Append to html link element page
                document.body.appendChild(link);
            
                // Start download
                link.click();
            
                // Clean up and remove the link
                link.parentNode.removeChild(link);
            };
    
            downloadFile(data, `wallets_${currentProject.name}.csv`);
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to download wallets!");
        }
        setOpenLoading(false);
    };

    const handleCollectAllSol = async () => {
        if (!currentProject.token)
            return;

        if (!isValidAddress(targetWallet)) {
            toast.warn("Please input wallet to send SOL!");
            return;
        }

        const validWalletChecked = walletChecked.filter(item => item === true);
        const validTeamWalletChecked = teamWalletChecked.filter(item => item === true);
        if (validWalletChecked.length === 0 && validTeamWalletChecked.length === 0) {
            toast.warn("Please check wallets to collect SOL from!");
            return;
        }

        setLoadingPrompt("Collecting all SOL...");
        setOpenLoading(true);
        try {
            let wallets = [];
            let userWallets = [];
            for (let i = 0; i < currentProject.wallets.length; i++) {
                if (walletChecked[i]) {
                    wallets = [
                        ...wallets,
                        currentProject.wallets[i].address,
                    ];
                }
            }

            if (currentProject.userWallets) {
                for (let i = 0; i < currentProject.userWallets.length; i++) {
                    if (teamWalletChecked[i]) {
                        userWallets = [
                            ...userWallets,
                            currentProject.userWallets[i].address,
                        ];
                    }
                }
            }

            await axios.post(`${SERVER_URL}/api/v1/project/collect-all-sol`,
                {
                    projectId: currentProject._id,
                    targetWallet,
                    wallets,
                    userWallets,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "MW-USER-ID": localStorage.getItem("access-token"),
                    },
                }
            );
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to collect all SOL!");
            setOpenLoading(false);
        }
    };

    const handleWalletAllChecked = (e) => {
        console.log("Wallet all checked:", e.target.value, walletAllChecked);
        const newWalletAllChecked = !walletAllChecked;
        setWalletAllChecked(newWalletAllChecked);
        setWalletChecked(walletChecked.map(() => newWalletAllChecked));
    };

    const handleWalletChanged = (index, key, value) => {
        console.log("Wallet changed:", index, key, value);
        if (key === "checked") {
            let newWalletChecked = [ ...walletChecked ];
            newWalletChecked[index] = !newWalletChecked[index];
            setWalletChecked(newWalletChecked);

            let newWalletAllChecked = true;
            for (let i = 0; i < newWalletChecked.length; i++)
                newWalletAllChecked &&= newWalletChecked[i];
            setWalletAllChecked(newWalletAllChecked);
        }
        else if (key === "sell_percent") {
            let newWalletSellPercent = [ ...walletSellPercent ];
            newWalletSellPercent[index] = value;
            setWalletSellPercent(newWalletSellPercent);
        }
        else if (key === "transfer_on_sale") {
            let newWalletTransferOnSale = [ ...walletTransferOnSale ];
            newWalletTransferOnSale[index] = !newWalletTransferOnSale[index];
            setWalletTransferOnSale(newWalletTransferOnSale);
        }
    };

    const handleTeamWalletAllChecked = (e) => {
        console.log("Team wallet all checked:", e.target.value, teamWalletAllChecked);
        const newTeamWalletAllChecked = !teamWalletAllChecked;
        setTeamWalletAllChecked(newTeamWalletAllChecked);
        setTeamWalletChecked(teamWalletChecked.map(() => newTeamWalletAllChecked));
    };

    const handleTeamWalletChanged = (index, key, value) => {
        console.log("Team wallet changed:", index, key, value);
        if (key === "checked") {
            let newTeamWalletChecked = [ ...teamWalletChecked ];
            newTeamWalletChecked[index] = !newTeamWalletChecked[index];
            setTeamWalletChecked(newTeamWalletChecked);
            
            let newTeamWalletAllChecked = true;
            for (let i = 0; i < newTeamWalletChecked.length; i++)
                newTeamWalletAllChecked &&= newTeamWalletChecked[i];
            setTeamWalletAllChecked(newTeamWalletAllChecked);
        }
        else if (key === "sell_percent") {
            let newTeamWalletSellPercent = [ ...teamWalletSellPercent ];
            newTeamWalletSellPercent[index] = value;
            setTeamWalletSellPercent(newTeamWalletSellPercent);
        }
        else if (key === "transfer_on_sale") {
            let newTeamWalletTransferOnSale = [ ...teamWalletTransferOnSale ];
            newTeamWalletTransferOnSale[index] = !newTeamWalletTransferOnSale[index];
            setTeamWalletTransferOnSale(newTeamWalletTransferOnSale);
        }
    };

    const handleSellTokens = async () => {
        if (!currentProject.token)
            return;

        if (!isValidAddress(currentProject.token.address)) {
            toast.warn("Invalid token address!");
            return;
        }

        const validWalletChecked = walletChecked.filter(item => item === true);
        const validTeamWalletChecked = currentProject.userWallets ? teamWalletChecked.filter(item => item === true) : [];
        if (validWalletChecked.length === 0 && validTeamWalletChecked.length === 0) {
            toast.warn("Please check wallets to sell tokens");
            return;
        }

        let wallets = [];
        for (let i = 0; i < currentProject.wallets.length; i++) {
            if (!walletChecked[i])
                continue;

            const percentage = Number(walletSellPercent[i].replaceAll(",", ""));
            if (isNaN(percentage) || percentage <= 0) {
                toast.warn(`Wallet #${i + 1}: Invalid percentage`);
                return;
            }

            // if (walletTransferOnSale[i] && !isValidAddress(targetWallet)) {
            //     toast.warn(`Please set target wallet to send SOL`);
            //     return;
            // }

            wallets = [
                ...wallets,
                {
                    address: currentProject.wallets[i].address,
                    percentage: percentage,
                    transferOnSale: walletTransferOnSale[i],
                }
            ];
        }

        let userWallets = [];
        if (currentProject.userWallets) {
            for (let i = 0; i < currentProject.userWallets.length; i++) {
                if (!teamWalletChecked[i])
                    continue;
    
                const percentage = Number(teamWalletSellPercent[i].replaceAll(",", ""));
                if (isNaN(percentage) || percentage <= 0) {
                    toast.warn(`Team Wallet #${i + 1}: Invalid percentage`);
                    return;
                }
    
                // if (teamWalletTransferOnSale[i] && !isValidAddress(targetWallet)) {
                //     toast.warn(`Please set target wallet to send SOL`);
                //     return;
                // }
    
                userWallets = [
                    ...userWallets,
                    {
                        address: currentProject.userWallets[i].address,
                        percentage: percentage,
                        transferOnSale: teamWalletTransferOnSale[i],
                    }
                ];
            }
        }

        setLoadingPrompt("Selling tokens...");
        setOpenLoading(true);

        console.log("Pool Info:", currentProject.poolInfo);
        try {
            await axios.post(`${SERVER_URL}/api/v1/project/sell`,
                {
                    projectId: currentProject._id,
                    token: currentProject.token.address,
                    poolInfo: currentProject.poolInfo,
                    // target: targetWallet,
                    wallets: wallets,
                    userWallets: userWallets,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "MW-USER-ID": localStorage.getItem("access-token"),
                    },
                }
            );
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to sell tokens!");
            setOpenLoading(false);
        }
    }

    return (
        <div className={`${className} flex flex-col text-white px-5`}>
            <div className="flex flex-col pt-5">
                <div className="w-full h-auto px-5 py-3 bg-slate-title rounded-t-[10px] flex justify-between items-center">
                    <div className="text-white text-[20px] font-medium font-poppins leading-normal">
                        Sell Token {currentProject.name && `(${currentProject.name})`}
                    </div>
                    <div className="h-12 flex items-center py-2.5 gap-1 leading-normal text-teal-200">
                        <p className="text-white">
                            {
                                currentProject.token && currentProject.token.address ?
                                ellipsisAddress(currentProject.token.address) : 
                                "Not Set"
                            }
                        </p>
                        {
                            currentProject.token && currentProject.token.address &&
                            (copied["token_address"] ? 
                            (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>) :
                            (<FaRegCopy className="w-5 h-5 mx-1 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-baseColor" onClick={() => copyToClipboard("token_address", currentProject.token.address)} />))
                        }
                    </div>
                </div>
                <div className="w-full min-h-28 bg-slate-900 bg-opacity-90  rounded-b-[10px] items-center px-5">
                    <div className="relative flex flex-col items-center justify-between h-full gap-5 my-5 text-white bg-transparent xl:flex-row bg-clip-border">
                        <div className="w-full 2xl:w-[60%] flex items-center">
                            <div className="text-white text-base mr-2 font-medium font-poppins leading-[24.93px] whitespace-nowrap">
                                Target Wallet:
                            </div>
                            <div className="flex w-full xl:w-[70%]">
                                <div className="flex flex-col items-center w-full gap-5 mr-2 md:flex-row md:gap-0">
                                    <input
                                        className="w-full px-3 py-3 bg-teal-600 bg-opacity-5 rounded-[10px] border border-gray-800 hover:border-baseColor focus:border-baseColor text-center"
                                        placeholder="Enter target wallet address"
                                        value={targetWallet}
                                        onChange={(e) => setTargetWallet(e.target.value)} />
                                </div>
                                <button
                                    className="h-12 px-[25px] py-2.5 mr-2 bg-gradient-to-r bg-slate-title  rounded-full border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300 whitespace-nowrap"
                                    onClick={handleCollectAllSol}>
                                    <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                                        Collect All SOL
                                    </div>
                                </button>
                            </div>
                        </div>
                        <button
                            className="h-12 px-[25px] py-2.5 bg-gradient-to-r bg-slate-title  rounded-full border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300 whitespace-nowrap"
                            onClick={handleDownloadWallets}>
                            <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                                Download Wallets
                            </div>
                        </button>
                    </div>
                    <div className="relative flex flex-col w-full h-full my-5 overflow-x-hidden text-white bg-transparent bg-clip-border">
                        {
                            currentProject.userWallets && currentProject.wallets &&
                            <div className="py-4 text-lg text-center text-white bg-slate-tableHeader">User Wallets</div>
                        }
                        <table className="w-full text-left">
                            <thead className="">
                                <tr className="">
                                    <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30 rounded-l-md">
                                        <input type="checkbox"
                                            className="w-5 h-5 text-baseColor border-gray-200 rounded shrink-0 focus:ring-baseColor disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-baseColor dark:checked:border-baseColor dark:focus:ring-offset-gray-800"
                                            checked={walletAllChecked}
                                            onChange={handleWalletAllChecked} />
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
                                    <th className="p-4 border-b border-none bg-slate-title bg-opacity-30">
                                        <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                                            % to sell
                                        </p>
                                    </th>
                                    <th className="p-4 border-b border-none bg-slate-title bg-opacity-30 rounded-r-md">
                                        <p className="block font-sans antialiased font-normal leading-none text-center text-white">
                                            Collect to Target
                                        </p>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                                {
                                    currentProject.wallets &&
                                    currentProject.wallets.map((item, index) => {
                                        return (
                                            <tr key={index}>
                                                <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                    <input type="checkbox"
                                                        className="w-5 h-5 text-baseColor border-gray-200 rounded shrink-0 focus:ring-baseColor disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-baseColor dark:checked:border-baseColor dark:focus:ring-offset-gray-800"
                                                        checked={walletChecked[index]}
                                                        onChange={(e) => handleWalletChanged(index, "checked", e.target.value)} />
                                                </td>
                                                <td className="p-4 border-b border-white border-opacity-30">
                                                    <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                                                        {index + 1}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                    <div className="flex items-center justify-center gap-1 font-sans antialiased font-normal leading-normal text-center text-teal-200">
                                                        <p className="text-white bg-transparent border-none outline-none">
                                                            {ellipsisAddress(item.address)}
                                                        </p>
                                                        {
                                                            copied["wallet_" + index] ?
                                                            (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>) :
                                                            (<FaRegCopy className="w-5 h-5 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-baseColor" onClick={() => copyToClipboard("wallet_" + index, item.address)} />)
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                    <p className="block font-sans antialiased font-normal leading-normal text-center text-white">
                                                        { walletTokenBalance[index] }
                                                    </p>
                                                </td>
                                                <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                    <input
                                                        className="w-full px-3 py-3 bg-[rgba(0,0,0,0.3)] rounded-[10px] border border-gray-800 focus:border-baseColor outline-none text-center"
                                                        value={walletSellPercent[index]}
                                                        onChange={(e) => handleWalletChanged(index, "sell_percent", e.target.value)} />
                                                </td>
                                                <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                    <div className="flex justify-center">
                                                        <input type="checkbox"
                                                            className="w-5 h-5 text-baseColor border-gray-200 rounded shrink-0 focus:ring-baseColor disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-baseColor dark:checked:border-baseColor dark:focus:ring-offset-gray-800"
                                                            disabled
                                                            checked={walletTransferOnSale[index]}
                                                            onChange={(e) => handleWalletChanged(index, "transfer_on_sale", e.target.value)} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                        </table>
                        {
                            (!currentProject.wallets || currentProject.wallets.length === 0) &&
                            (
                                <div className="my-3 text-3xl text-center text-gray-700">
                                    no wallet
                                </div>
                            )
                        }
                        {
                            currentProject.userWallets &&
                            <div className="py-4 mt-4 text-lg text-center text-yellow-200 bg-slate-tableHeader">Team Wallets</div>
                        }
                        {
                            currentProject.userWallets &&
                            (
                                <table className="w-full text-left">
                                    <thead className="">
                                        <tr className="">
                                            <th className="w-10 p-4 border-b border-none bg-slate-title bg-opacity-30">
                                                <input type="checkbox"
                                                    className="w-5 h-5 text-baseColor border-gray-200 rounded shrink-0 focus:ring-baseColor disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-baseColor dark:checked:border-baseColor dark:focus:ring-offset-gray-800"
                                                    checked={teamWalletAllChecked}
                                                    onChange={handleTeamWalletAllChecked} />
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
                                                    % to sell
                                                </p>
                                            </th>
                                            <th className="p-4 border-b border-none bg-slate-title">
                                                <p className="block font-sans antialiased font-normal leading-none text-center text-yellow-200">
                                                    Transfer to Target
                                                </p>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white text-base font-normal font-poppins leading-[24.93px]">
                                        {
                                            currentProject.userWallets &&
                                            currentProject.userWallets.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                            <input type="checkbox"
                                                                className="w-5 h-5 text-baseColor border-gray-200 rounded shrink-0 focus:ring-baseColor disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-baseColor dark:checked:border-baseColor dark:focus:ring-offset-gray-800"
                                                                checked={teamWalletChecked[index]}
                                                                onChange={(e) => handleTeamWalletChanged(index, "checked", e.target.value)} />
                                                        </td>
                                                        <td className="p-4 border-b border-white border-opacity-30">
                                                            <p className="block font-sans antialiased font-normal leading-normal text-center text-yellow-200">
                                                                {index + 1}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                            <div className="flex items-center justify-center gap-1 font-sans antialiased font-normal leading-normal text-center text-team-200">
                                                                <p className="text-yellow-200 bg-transparent border-none outline-none">
                                                                    {ellipsisAddress(item.address)}
                                                                </p>
                                                                {
                                                                    copied["team_wallet_" + index] ?
                                                                    (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>) :
                                                                    (<FaRegCopy className="w-5 h-5 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-baseColor" onClick={() => copyToClipboard("team_wallet_" + index, item.address)} />)
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                            <p className="block font-sans antialiased font-normal leading-normal text-center text-yellow-200">
                                                                { teamWalletTokenBalance[index] }
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                            <input
                                                                className="w-full px-3 py-3 bg-[rgba(0,0,0,0.3)] rounded-[10px] border border-gray-800 focus:border-baseColor outline-none text-center text-yellow-200"
                                                                value={teamWalletSellPercent[index]}
                                                                onChange={(e) => handleTeamWalletChanged(index, "sell_percent", e.target.value)} />
                                                        </td>
                                                        <td className="px-4 py-2 border-b border-white border-opacity-30">
                                                            <div className="flex justify-center">
                                                                <input type="checkbox"
                                                                    className="w-5 h-5 text-baseColor border-gray-200 rounded shrink-0 focus:ring-baseColor disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-baseColor dark:checked:border-baseColor dark:focus:ring-offset-gray-800"
                                                                    checked={teamWalletTransferOnSale[index]}
                                                                    onChange={(e) => handleTeamWalletChanged(index, "transfer_on_sale", e.target.value)} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        }
                                    </tbody>
                                </table>
                            )
                        }
                    </div>
                    <div className="relative flex h-full my-5 text-white bg-transparent justify-end bg-clip-border">
                        <button
                            className="h-14 px-[25px] py-2.5 mr-0 bg-gradient-to-r bg-slate-title rounded-full border border-teal-600 justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
                            onClick={handleSellTokens}>
                            <div className="text-xl font-normal leading-normal text-center text-white font-poppins">
                                Sell
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
