// import { useState } from "react";
import Modal from "../Base/Modal";

export default function ConfirmDialg({ isOpen, title, message, onOK, onCancel }) {
    return (
        <Modal isOpen={isOpen} onClose={onCancel}>
            <div className="flex flex-col pt-5 w-[440px]">
                <div className="w-full h-auto bg-slate-title rounded-t-[8px] flex justify-start items-center px-5 py-3">
                    <div className="text-white text-[24px] font-medium font-poppins leading-normal">
                        {title}
                    </div>
                </div>
                <div className="w-full h-auto px-5 py-5 md:py-0 bg-slate-900 bg-opacity-90  rounded-b-[8px] items-center">
                    <div className="mt-3">
                        <label className="block my-1 text-white">
                            {message}
                        </label>
                    </div>
                    <div className="flex justify-center">
                        <button className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-baseColor rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                            onClick={onOK}>
                            <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                                Yes
                            </div>
                        </button>
                        <button className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-transparent border border-baseColor rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                            onClick={onCancel}>
                            <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                                No
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
