import { useState } from "react";
import Modal from "../Base/Modal";

export default function AddEmailDialog({ isOpen, onOK, onClose }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const handleOK = () => {
        if (name !== "" && email !== "")
            onOK(name, email);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col pt-5 w-[512px]">
                <div className="w-full h-auto bg-slate-title rounded-t-[8px] flex justify-start items-center px-5 py-3">
                    <div className="text-white text-[24px] font-medium font-poppins leading-normal">
                        Add Email
                    </div>
                </div>
                <div className="w-full h-auto px-5 py-5 md:py-0 bg-slate-900 bg-opacity-90  rounded-b-[8px] items-center">
                    <div className="mt-3">
                        <label className="block my-1 text-white">
                            Name
                        </label>
                        <input type="text"
                            className="w-full h-[40px] rounded-[6px] bg-[rgba(255,255,255,0.1)] px-[15px] text-white outline-none focus:border focus:border-baseColor" placeholder="Enter Name"
                            onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="mt-3">
                        <label className="block my-1 text-white">
                            Email
                        </label>
                        <input type="text"
                            className="w-full h-[40px] rounded-[6px] bg-[rgba(255,255,255,0.1)] px-[15px] text-white outline-none focus:border focus:border-baseColor" placeholder="Enter E-mail"
                            onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="flex justify-center">
                        <button className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-baseColor rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                            onClick={handleOK}>
                            <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                                OK
                            </div>
                        </button>
                        <button className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-transparent border border-baseColor rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                            onClick={onClose}>
                            <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                                Cancel
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
