import { useState } from "react";
import { toast } from "react-toastify";
import { FaRegCopy } from "react-icons/fa";
import Modal from "../Base/Modal";
import { ellipsisAddress } from "../../utils/methods";

export default function NewProjectDialog({
  isOpen,
  createProject,
  checkProject,
  onDone,
  onCancel,
  initialData,
}) {
  const steps = ["Create Project", "Activate Project", "Completed"];
  const [step, setStep] = useState(initialData.step);
  const [projectName, setProjectName] = useState(initialData.projectName);
  const [creating, setCreating] = useState(false);
  const [depositWallet, setDepositWallet] = useState("");
  const [expireTime, setExpireTime] = useState(-1);
  const [intervalId, setIntervalId] = useState(null);
  const [copied, setCopied] = useState(false);

  const expireTimeMin = Math.floor(expireTime / 60000);
  const expireTimeSec = Math.floor(expireTime / 1000) % 60;

  const copyToClipboard = async (key, text) => {
    if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
      setCopied({
        ...copied,
        [key]: true,
      });
      setTimeout(
        () =>
          setCopied({
            ...copied,
            [key]: false,
          }),
        2000
      );
    } else console.error("Clipboard not supported");
  };

  const reset = () => {
    setStep(0);
    setProjectName("");
    setCreating(false);
    setDepositWallet("");
    setExpireTime(-1);
  };

  const handleDone = () => {
    console.log("creating project is success!");
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    onDone();
    // reset();
  };

  const handleCancel = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    onCancel();
    reset();
  };

  //   const handleRetry = () => {
  //     if (intervalId) {
  //       clearInterval(intervalId);
  //       setIntervalId(null);
  //     }
  //     // reset();
  //   };

  const handleCheck = (projectId) => {
    const id = setInterval(async () => {
      console.log("Checking...", projectId);
      const data = await checkProject(projectId);
      if (data.activated) {
        clearInterval(id);
        setIntervalId(null);
        setStep(2);
      } else if (data.expired || data.error) {
        clearInterval(id);
        setIntervalId(null);
        setStep(3);
      } else setExpireTime(data.expireTime);
    }, 1000);
    setIntervalId(id);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const data = await createProject(projectName);
      if (!data.error) {
        setStep(1);
        setDepositWallet(data.depositWallet);
        setExpireTime(data.expireTime);
        handleCheck(data.projectId);
      } else {
        console.log(data.error);
        toast.warn("Failed to create new project");
      }
    } catch (err) {
      console.log(err);
    }
    setCreating(false);
  };

  return (
    <Modal isOpen={isOpen}>
      <div className="flex flex-col pt-5 w-[640px]">
        <div className="w-full h-auto bg-slate-title rounded-t-[8px] flex justify-start items-center px-5 py-3">
          <div className="text-white text-[24px] font-medium font-poppins leading-normal">
            New Project
          </div>
        </div>
        <div className="w-full h-auto px-5 py-5 md:py-0 bg-slate-900 bg-opacity-90  rounded-b-[8px] items-center">
          <ul className="relative flex flex-row mt-3 gap-x-2">
            {steps.map((item, index) => {
              return (
                <li
                  key={index}
                  className={`flex ${
                    index < 2 ? "flex-1" : ""
                  } items-center gap-x-2 shrink basis-0`}
                >
                  <span className="inline-flex items-center text-xs align-middle min-w-7 min-h-7">
                    <span
                      className={`flex items-center justify-center flex-shrink-0 font-medium rounded-full size-7 dark:bg-gray-700 dark:text-white ${
                        index <= step
                          ? step === 3 && index === 2
                            ? "text-white bg-red-600"
                            : "text-white bg-baseColor"
                          : "text-gray-800 bg-gray-100"
                      }`}
                    >
                      {step === 2 && index === 2 ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 mx-1"
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
                      ) : step === 3 && index === 2 ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="flex-shrink-0 size-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18"></path>
                          <path d="m6 6 12 12"></path>
                        </svg>
                      ) : (
                        <span className="">{index + 1}</span>
                      )}

                      <svg
                        className="flex-shrink-0 hidden size-3"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span
                      className={`text-sm font-medium ms-2 ${
                        index <= step ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {step === 3 && index === 2 ? "Failed" : item}
                    </span>
                  </span>
                  {index < 2 && (
                    <div
                      className={`"flex-1 w-full h-px ${
                        index + 1 <= step ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          <div className="my-3">
            {step === 0 && (
              <div className="h-40 p-2 ">
                <div className="h-[85px]  ">
                  <label className="block my-2 text-white">Project Name</label>
                  <input
                    type="text"
                    className="w-full h-[40px] rounded-[6px] bg-[rgba(255,255,255,0.1)] px-[15px] text-white outline-none focus:border border-gray-600 focus:border-baseColor"
                    placeholder="Enter Name"
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-baseColor disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none"
                    onClick={handleCreate}
                    disabled={creating || projectName === ""}
                  >
                    {creating ? (
                      <img
                        src="/assets/spinner-white.svg"
                        className="w-10 h-10"
                        alt="spinner"
                      />
                    ) : (
                      <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                        Create
                      </div>
                    )}
                  </button>
                  <button
                    className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-transparent border border-baseColor disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none"
                    onClick={handleCancel}
                    disabled={creating}
                  >
                    <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                      Cancel
                    </div>
                  </button>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="h-40 p-2 ">
                <div className="h-[85px] ">
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      <img
                        src="/assets/spinner-white.svg"
                        className="w-10 h-10"
                        alt="spinner"
                      />
                      <label className="block my-2 text-white">
                        Checking Payment...
                      </label>
                    </div>
                    {expireTime > 0 && (
                      <p style={{ color: "#888", marginLeft: "20px" }}>
                        {expireTimeMin}:{expireTimeSec}
                      </p>
                    )}
                  </div>
                  <div className="flex mt-2 justify-evenly">
                    <div className="flex flex-col items-center w-full gap-5 text-teal-200 md:flex-row md:gap-0 md:w-auto">
                      <div className="text-gray-500 text-lg font-normal font-poppins leading-[24.93px]">
                        Address:&nbsp;
                        <span className="text-baseColor">
                          {depositWallet !== ""
                            ? ellipsisAddress(depositWallet)
                            : "0x1234...5678"}
                        </span>
                      </div>
                      {copied["address"] ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 mx-1"
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
                          className="w-5 h-5 mx-1 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-baseColor"
                          onClick={() =>
                            copyToClipboard("address", depositWallet)
                          }
                        />
                      )}
                    </div>
                    <div className="flex flex-col items-center w-full gap-5 text-teal-200 md:flex-row md:gap-0 md:w-auto">
                      <div className="text-gray-500 text-lg font-normal font-poppins leading-[24.93px]">
                        Service Fee:&nbsp;
                        <span className="text-baseColor">2 SOL</span>
                      </div>
                      {copied["fee"] ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 mx-1"
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
                          className="w-5 h-5 mx-1 transition duration-100 ease-in-out transform cursor-pointer active:scale-95 text-baseColor"
                          onClick={() => copyToClipboard("fee", "20")}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-baseColor disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none"
                    onClick={handleCancel}
                  >
                    <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                      Cancel
                    </div>
                  </button>
                </div>
              </div>
            )}
            {(step === 2 || step === 3) && (
              <div className="h-40 p-2 ">
                <div className="h-[85px]  ">
                  {step === 2 ? (
                    <p className="block my-5 text-4xl text-center text-baseColor">
                      Success!
                    </p>
                  ) : (
                    <p className="block my-5 text-4xl text-center text-red-700">
                      Failed!
                    </p>
                  )}
                </div>
                {step === 2 ? (
                  <div className="flex justify-center mb-4">
                    <button
                      className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-baseColor disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none"
                      onClick={handleDone}
                    >
                      <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                        Done
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    {/* <button
                      className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-baseColor disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none"
                      onClick={handleRetry}
                    >
                      <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                        Retry
                      </div>
                    </button> */}
                    <button
                      className="w-[70px] sm:w-[120px] m-5 h-6 sm:h-10 px-2 sm:px-4 py-1 bg-gradient-to-r bg-baseColor disabled:bg-gray-600 disabled:from-gray-700 disabled:border-gray-600 rounded-[40px] justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform disabled:transform-none focus:outline-none"
                      onClick={handleCancel}
                    >
                      <div className="text-base font-semibold leading-normal text-center text-white sm:text-lg font-poppins">
                        Exit
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
