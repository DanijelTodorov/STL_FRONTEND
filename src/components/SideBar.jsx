import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdDashboard, MdOutlineSell, MdAndroid } from "react-icons/md";
import { RiProjectorFill, RiExchangeDollarLine } from "react-icons/ri";
import { FaTools, FaRegCopyright } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { BiSolidPurchaseTag, BiTransferAlt } from "react-icons/bi";
import { GrDeploy } from "react-icons/gr";
import { PiSwimmingPool } from "react-icons/pi";
import { MdOutlineToken } from "react-icons/md";

export default function SideBarComponent({ className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openToolsMenu, setOpenToolsMenu] = useState(false);
  const [openProjectMenu, setOpenProjectMenu] = useState(false);

  useEffect(() => {
    if (
      location.pathname === "/create-token" ||
      location.pathname === "/set-authority" ||
      location.pathname === "/openbook" ||
      location.pathname === "/manage-lp" ||
      location.pathname === "/token-account"
    ) {
      setOpenToolsMenu(true);
      setOpenProjectMenu(false);
    } else if (
      location.pathname === "/buy" ||
      location.pathname === "/sell" ||
      location.pathname === "/transfer"
    ) {
      setOpenProjectMenu(true);
      setOpenToolsMenu(false);
    }
  }, [location.pathname]);

  const handleCollapse = (e, menuName) => {
    e.stopPropagation();
    if (menuName === "tools") {
      const newOpenToolsMenu = !openToolsMenu;
      setOpenToolsMenu(newOpenToolsMenu);
      if (newOpenToolsMenu) setOpenProjectMenu(false);
    } else if (menuName === "project") {
      const newOpenProjectMenu = !openProjectMenu;
      setOpenProjectMenu(newOpenProjectMenu);
      if (newOpenProjectMenu) setOpenToolsMenu(false);
    }
  };

  return (
    <div
      className={`${className} relative font-sans  bg-gradient-to-r from-[#ffffff0d] to-[#ffffff05] flex-col gap-2 text-white items-center 2xl:px-5`}
    >
      {/* <img src={`/logo.svg`} className="hidden 2xl:block min-w-[251px] min-h-[20px] mt-[36px] cursor-pointer" alt="" onClick={() => navigate("/")} /> */}
      <div className="h-[20px] block 2xl:hidden mt-[36px]"></div>
      <div
        className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-16 cursor-pointer ${
          location.pathname === "/dashboard" ? "bg-secondColor text-white" : ""
        } `}
        onClick={() => navigate("/dashboard")}
      >
        <MdDashboard className="w-[18px] h-[18px] relative" />
        <div className="hidden text-[1.2rem] font-medium leading-tight  2xl:block">
          Dashboard
        </div>
      </div>
      <div
        className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2 cursor-pointer ${
          location.pathname === "/buy" ||
          location.pathname === "/sell" ||
          location.pathname === "/transfer"
            ? "bg-[rgba(255,255,255,0.1)]"
            : ""
        } text-white text-xl`}
        onClick={(e) => handleCollapse(e, "project")}
      >
        <RiProjectorFill className="w-[18px] h-[18px] relative" />
        <div className="hidden 2xl:flex justify-between w-[calc(100%-40px)] items-center">
          <div className="w-full font-medium leading-tight text-left">
            Project
          </div>
          <IoIosArrowDown
            className={`w-4 h-full ${
              openProjectMenu ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </div>
      {openProjectMenu && (
        <div className="2xl:ml-2">
          <div
            className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2 cursor-pointer ${
              location.pathname === "/buy" ? "bg-secondColor text-white" : ""
            }`}
            onClick={() => navigate("/buy")}
          >
            <BiSolidPurchaseTag />
            <div className="hidden text-base font-medium leading-tight  2xl:flex">
              Buy
            </div>
          </div>
          <div
            className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2  cursor-pointer ${
              location.pathname === "/sell" ? "bg-secondColor text-white" : ""
            }  `}
            onClick={() => navigate("/sell")}
          >
            <MdOutlineSell />
            <div className="hidden text-base font-medium leading-tight  2xl:flex">
              Sell
            </div>
          </div>
          <div
            className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2 cursor-pointer ${
              location.pathname === "/transfer"
                ? "bg-secondColor text-white"
                : ""
            } `}
            onClick={() => navigate("/transfer")}
          >
            <BiTransferAlt />
            <div className="hidden text-base font-medium leading-tight  2xl:flex">
              Transfer
            </div>
          </div>
        </div>
      )}
      <div
        className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2 cursor-pointer ${
          location.pathname === "/create-token" ||
          location.pathname === "/set-authority" ||
          location.pathname === "/openbook" ||
          location.pathname === "/manage-lp" ||
          location.pathname === "/token-account"
            ? "bg-[rgba(255,255,255,0.1)]"
            : ""
        } text-white text-xl`}
        onClick={(e) => handleCollapse(e, "tools")}
      >
        <FaTools className="w-[18px] h-[18px] relative" />
        <div className="hidden 2xl:flex justify-between w-[calc(100%-40px)] items-center">
          <div className="w-full font-medium leading-tight text-left">
            Tools
          </div>
          <IoIosArrowDown
            className={`w-4 h-full ${
              openToolsMenu ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </div>
      {openToolsMenu && (
        <div className="2xl:ml-2">
          <div
            className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2 cursor-pointer ${
              location.pathname === "/create-token"
                ? "bg-secondColor text-white"
                : ""
            }`}
            onClick={() => navigate("/create-token")}
          >
            <GrDeploy />
            <div className="hidden text-base font-medium leading-tight  2xl:flex">
              Create SPL Token
            </div>
          </div>
        </div>
      )}
      {openToolsMenu && (
        <div className="2xl:ml-2">
          <div
            className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2 cursor-pointer ${
              location.pathname === "/set-authority"
                ? "bg-secondColor text-white"
                : ""
            }`}
            onClick={() => navigate("/set-authority")}
          >
            <FaRegCopyright />
            <div className="hidden text-base font-medium leading-tight  2xl:flex">
              Set Authority
            </div>
          </div>
        </div>
      )}
      {openToolsMenu && (
        <div className="2xl:ml-2">
          <div
            className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2 cursor-pointer ${
              location.pathname === "/openbook"
                ? "bg-secondColor text-white"
                : ""
            }`}
            onClick={() => navigate("/openbook")}
          >
            <RiExchangeDollarLine />
            <div className="hidden text-base font-medium leading-tight  2xl:flex">
              OpenBook Market
            </div>
          </div>
        </div>
      )}
      {openToolsMenu && (
        <div className="2xl:ml-2">
          <div
            className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2 cursor-pointer ${
              location.pathname === "/manage-lp"
                ? "bg-secondColor text-white"
                : ""
            }`}
            onClick={() => navigate("/manage-lp")}
          >
            <PiSwimmingPool />
            <div className="hidden text-base font-medium leading-tight  2xl:flex">
              Manage LP
            </div>
          </div>
        </div>
      )}
      {openToolsMenu && (
        <div className="2xl:ml-2">
          <div
            className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2 cursor-pointer ${
              location.pathname === "/token-account"
                ? "bg-secondColor text-white"
                : ""
            }`}
            onClick={() => navigate("/token-account")}
          >
            <MdOutlineToken />
            <div className="hidden text-base font-medium leading-tight  2xl:flex">
              Token Account
            </div>
          </div>
        </div>
      )}
      <div
        className={`w-[50px] 2xl:w-full h-10 rounded-lg hover:bg-firstColor flex justify-center 2xl:justify-start mx-auto 2xl:px-3 gap-4 items-center mt-2 cursor-pointer ${
          location.pathname === "/bot"
            ? "bg-[rgba(255,255,255,0.1)]"
            : ""
        } text-white text-xl`}
        onClick={() => navigate("/bot")}
      >
        <MdAndroid className="w-[18px] h-[18px] relative" />
        <div className="hidden 2xl:flex justify-between w-[calc(100%-40px)] items-center">
          <div className="w-full font-medium leading-tight text-left">
            Bot
          </div>
        </div>
      </div>
      <div className="w-0 2xl:w-full absolute bottom-20 pl-3 flex justify-left ">
        <img
          className="pulsate"
          src="/assets/only_robot.png"
          style={{ height: "30vh" }}
        ></img>
      </div>
    </div>
  );
}
