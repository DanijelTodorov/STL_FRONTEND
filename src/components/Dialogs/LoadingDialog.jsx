import Modal from "../Base/Modal";
import SniperIcon from "../Icons/SniperIcon";

export default function LoadingDialog({ isOpen, prompt }) {
    return (
        <Modal isOpen={isOpen} className="!z-[2000]">
            <div className="w-full h-auto pr-3 py-2 bg-transparent flex rounded-[8px] items-center">
                {/* <img src="/assets/spinner.svg" className="w-16 h-16" alt="spinner" /> */}
                <SniperIcon />
                <div className="text-white text-center text-base font-medium font-poppins leading-[24.93px]">
                    {prompt}
                </div>
            </div>
        </Modal>
    );
}
