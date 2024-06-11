import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useWalletMultiButton } from "@solana/wallet-adapter-base-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { FaRegCopy } from "react-icons/fa";

import Modal from "../Base/Modal";

const imageURL = {
    "Phantom": "/assets/wallets/phantom.svg",
    "Trust": "/assets/wallets/trust.svg",
    "MathWallet": "/assets/wallets/mathwallet.svg",
    "TokenPocket": "/assets/wallets/tokenpocket.svg",
    "Coinbase Wallet": "/assets/wallets/coinbase.svg",
    "Coin98": "/assets/wallets/coin98.svg",
    "SafePal": "/assets/wallets/safepal.svg",
    "Bitpie": "/assets/wallets/bitpie.svg",
    "Clover": "/assets/wallets/clover.svg",
    "Coinhub": "/assets/wallets/coinhub.svg",
    "WalletConnect": "/assets/wallets/walletconnect.svg",
}

export default function ConnectWalletButton() {
    const [copied, setCopied] = useState(false);
    const [disconnectModal, setDisconnectModal] = useState(false);
    const [walletModalConfig, setWalletModalConfig] = useState(null);
    const { buttonState, onConnect, onDisconnect, onSelectWallet } = useWalletMultiButton({ onSelectWallet: setWalletModalConfig });
    const { publicKey, connected, wallet } = useWallet();

    const getEllipsisAddress = (address) => {
        return address.slice(0, 5) + "..." + address.slice(-5);
    };

    let label = "";
    switch (buttonState) {
        case "connected":
            if (connected)
                label = getEllipsisAddress(publicKey.toBase58());
            else
                label = "Disconnect";
            break;
        case "connecting":
            label = "Connecting";
            break;
        case "disconnecting":
            label = "Disconnecting";
            break;
        case "has-wallet":
            label = "Connect";
            break;
        case "no-wallet":
            label = "Select Wallet";
            break;
        default:
            break;
    }

    const copyToClipboard = async (text) => {
        if ('clipboard' in navigator) {
            await navigator.clipboard.writeText(text);
            toast.success("Copied");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        else
            console.error('Clipboard not supported');
    };

    const handleClick = useCallback(() => {
        console.log("Connect button clicked:", buttonState);
        switch (buttonState) {
            case 'connected':
                // onDisconnect();
                setDisconnectModal(true);
                break;
            case 'connecting':
            case 'disconnecting':
                break;
            case 'has-wallet':
                onConnect();
                break;
            case 'no-wallet':
                onSelectWallet();
                break;
            default:
                break;
        }
    }, [buttonState, onConnect, onSelectWallet]);

    return (
        <>
            <button className="w-[220px] h-12 px-6 py-2.5 rounded-[10px] rounded-full justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
                disabled={buttonState === "connecting" || buttonState === "disconnecting"}
                onClick={handleClick}>
                <div className="flex items-center gap-2 text-xl font-medium leading-normal text-center text-white font-poppins">
                    { connected && wallet && <img src={imageURL[wallet.adapter.name]} className="w-6 h-6" alt="none" />}
                    <p>{label}</p>
                </div>
            </button>
            {
                walletModalConfig &&
                (
                    <Modal isOpen={walletModalConfig !== null} onClose={() => setWalletModalConfig(null)}>
                        <div className="flex flex-col p-6 w-[480px] bg-slate-title rounded-[8px] gap-4">
                            <div className="text-3xl font-medium leading-normal text-white font-poppins">
                                Connect your wallet
                            </div>
                            <ul className="w-full overflow-auto text-xl text-white outline-none bg-slate-900 bg-opacity-90  bg-opacity-70 text-start">
                            {
                                walletModalConfig.wallets.map((item, index) => {
                                    return (
                                        <li key={index} className="relative px-4 py-2 cursor-pointer hover:bg-slate-tableHeader">
                                            <div className="flex items-center gap-2"
                                                onClick={() => {
                                                    walletModalConfig.onSelectWallet(item.adapter.name);
                                                    setWalletModalConfig(null);
                                                }}>
                                                <img src={imageURL[item.adapter.name]} alt="none" className="w-6 h-6" />
                                                <p className="block font-normal truncate">
                                                    {item.adapter.name}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })
                            }
                            </ul>
                        </div>
                    </Modal>
                )
            }
            {
                connected && publicKey &&
                (
                    <Modal isOpen={disconnectModal} onClose={() => setDisconnectModal(false)}>
                        <div className="flex flex-col p-6 w-auto bg-slate-title rounded-[8px] gap-4">
                            <div className="flex items-center justify-center gap-2 text-xl font-medium leading-normal text-white font-poppins">
                                <p className="text-white">
                                    {getEllipsisAddress(publicKey.toBase58())}
                                </p>
                                {
                                    copied ? 
                                    (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>) :
                                    (<FaRegCopy className="w-5 h-5 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 " onClick={() => copyToClipboard(publicKey.toBase58())} />)
                                }
                            </div>
                            <div className="flex justify-center gap-2">
                                <button className="h-12 px-6 py-2.5 rounded-[10px] justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
                                    disabled={buttonState === "connecting" || buttonState === "disconnecting"}
                                    onClick={() => {
                                        setDisconnectModal(false);
                                        onSelectWallet();
                                    }}>
                                    <div className="flex items-center gap-2 text-xl font-medium leading-normal text-center font-poppins">
                                        Select Wallet
                                    </div>
                                </button>
                                <button className="h-12 px-6 py-2.5 rounded-[10px] justify-center items-center gap-2.5 inline-flex border-none hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none focus:ring-teal-300"
                                    disabled={buttonState === "connecting" || buttonState === "disconnecting"}
                                    onClick={() => {
                                        setDisconnectModal(false);
                                        onDisconnect();
                                    }}>
                                    <div className="flex items-center gap-2 text-xl font-medium leading-normal text-center font-poppins">
                                        Disconnect
                                    </div>
                                </button>
                            </div>
                        </div>
                    </Modal>
                )
            }
        </>
    );
}
