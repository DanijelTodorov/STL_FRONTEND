import { useState } from "react";
import Modal from "../Base/Modal";

export default function ImportWalletsDialog({ isOpen, onOK, onCancel }) {
  const [importingKey, setImportingKey] = useState("");

  const handleOK = () => {
    if (importingKey !== "") {
      onOK(importingKey);
    }
  };

  const handleCancel = () => {
    setImportingKey("");
    onCancel();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="flex flex-col pt-5 w-[440px]">
        <div className="w-full h-auto bg-slate-title rounded-t-[8px] flex justify-start items-center px-5 py-3">
          <div className="text-white text-[24px] font-medium font-poppins leading-normal">
            Set private key
          </div>
        </div>
        <div className="w-full h-auto px-5 py-5 md:py-0 bg-slate-900 bg-opacity-90  rounded-b-[8px] items-center">
          <div className="mt-3">
            <label className="block my-1 text-white">private key</label>
            <input
              type="password"
              className="w-full h-[40px] rounded-[6px] bg-[rgba(255,255,255,0.1)] px-[15px] text-white outline-none focus:border focus:border-baseColor"
              placeholder="Enter private key"
              value={importingKey}
              onChange={(e) => setImportingKey(e.target.value)}
            />
          </div>
          <div className="flex justify-center">
            <button
              className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r border-teal-600 rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
              onClick={handleOK}
            >
              <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                OK
              </div>
            </button>
            <button
              className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r border bg-transparent border-baseColor rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
              onClick={handleCancel}
            >
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
