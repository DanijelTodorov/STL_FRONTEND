import { useState } from "react";
import { toast } from "react-toastify";
import { FaRegCopy } from "react-icons/fa";
import BigNumber from "bignumber.js";
import Modal from "../Base/Modal";
import { ellipsisAddress } from "../../utils/methods";

export default function SimulationDialog({ isOpen, zombie, onClose }) {
    const [copied, setCopied] = useState(false);
    const zombieAmount = zombie.value ? Number(new BigNumber(zombie.value.toString() + "e-9").toString()).toFixed(3) : "0";

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

    return (
        <Modal isOpen={isOpen}>
            <div className="flex flex-col pt-5 w-[640px]">
                <div className="w-full h-auto bg-slate-title rounded-t-[8px] flex justify-start items-center px-5 py-3">
                    <div className="text-white text-[24px] font-medium font-poppins leading-normal">
                        Simulation Result
                    </div>
                </div>
                <div className="w-full h-auto px-5 py-5 md:py-0 bg-slate-900 bg-opacity-90  rounded-b-[8px] items-center">
                    <div className="flex items-center justify-center mt-3">
                        <label className="block my-1 text-lg text-indigo-300">
                            DEPOSIT at least the following amount of SOL into the Zombie wallets
                        </label>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <label className="block my-1 text-white">
                            Zombie Wallet
                        </label>
                    </div>
                    <hr className="bg-gray-600 border-gray-600" />
                    <div className="flex mt-3 justify-evenly">
                        <div className="flex flex-col items-center w-full gap-5 text-teal-200 md:flex-row md:gap-0 md:w-auto">
                            <div className="text-gray-500 text-lg font-normal font-poppins leading-[24.93px]">
                                Address:&nbsp;
                                <span className="text-red-500">
                                {
                                    zombie.address ?
                                    ellipsisAddress(zombie.address) :
                                    "Not set"
                                }
                                </span>
                            </div>
                            {
                                (copied["zombie_address"] ? 
                                (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>) :
                                (<FaRegCopy className="w-5 h-5 mx-1 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-white" onClick={() => copyToClipboard("zombie_address", zombie.address)} />))
                            }
                        </div>
                        <div className="flex flex-col items-center w-full gap-5 text-teal-200 md:flex-row md:gap-0 md:w-auto">
                            <div className="text-gray-500 text-lg font-normal font-poppins leading-[24.93px]">
                                Amount:&nbsp;
                                <span className="text-red-500">{zombieAmount} SOL</span>
                            </div>
                            {
                                (copied["zombie_amount"] ? 
                                (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>) :
                                (<FaRegCopy className="w-5 h-5 mx-1 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-white" onClick={() => copyToClipboard("zombie_amount", zombieAmount)} />))
                            }
                        </div>
                    </div>
                    <div className="flex justify-center mt-5">
                        <button className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-baseColor rounded-full justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                            onClick={onClose}>
                            <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                                OK
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
