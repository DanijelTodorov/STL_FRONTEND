import { useState } from "react";
import { toast } from "react-toastify";
import { FaRegCopy } from "react-icons/fa";
import Modal from "../Base/Modal";
import { ellipsisAddress } from "../../utils/methods";

export default function NotifyAddressDialog({ isOpen, title, address, onClose }) {
    const [copied, setCopied] = useState(false);

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

    return (
        <Modal isOpen={isOpen}>
            <div className="flex flex-col pt-5 w-[340px]">
                <div className="w-full h-auto bg-slate-title rounded-t-[8px] flex justify-start items-center px-5 py-3">
                    <div className="text-white text-[24px] font-medium font-poppins leading-normal">
                        {title}
                    </div>
                </div>
                <div className="w-full h-auto px-5 py-5 md:py-0 bg-slate-900 bg-opacity-90  rounded-b-[8px] items-center">
                    <div className="flex items-center justify-center mt-3 text-xl text-teal-200">
                        <div className="font-normal text-green-500 font-poppins">
                            {address ? ellipsisAddress(address) : ""}
                        </div>
                        {
                            (copied ? 
                            (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>) :
                            (<FaRegCopy className="w-5 h-5 mx-1 transition duration-100 ease-in-out transform cursor-pointer active:scale-95" onClick={() => copyToClipboard(address)} />))
                        }
                    </div>
                    <div className="flex justify-center mt-5">
                        <button className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-baseColor rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
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
