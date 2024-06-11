import { useContext, useEffect, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { generateAvatarURL } from "@cfx-kit/wallet-avatar";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";

import { AppContext } from "../App";
import ConnectWalletButton from "./ConnectWalletButton";
import AvatarDropDown from "../components/AvatarDropdown";
import { TelegramIcon } from "./Icons/TelegramIcon";
import { DiscordIcon } from "./Icons/DiscordIcon";
import LinkedinIcon from "./Icons/LinkedinIcon";

export default function NavBar({ className }) {
    const navigate = useNavigate();
    const { user, logout } = useContext(AppContext);
    const { publicKey } = useWallet();
    const [randomAvatar, setRandomAvatar] = useState(generateAvatarURL(new Date().getTime().toString()));

    const onViewProfile = () => {
        navigate("/dashboard");
    };

    useEffect(() => {
        setRandomAvatar(generateAvatarURL(publicKey?.toBase58() || new Date().getTime().toString()));
    }, [publicKey]);

    return (
        <div className={`${className ? className : ""} font-poppins  bg-gradient-to-r from-[#ffffff0d] to-[#ffffff05]  flex justify-between items-center px-5 z-[50]`}>
            <div className="hidden xl:flex  h-12 px-4 py-2 rounded-lg justify-start items-center font-extrabold gap-1 text-baseColor text-3xl uppercase">
                {user ? user.name : ""}
            </div>
            <div className="flex items-center justify-end  gap-5">
                <a href="https://web.telegram.org/a/#6530253909" rel="noreferrer" target="_blank">
                    <div className="flex items-center text-white hover:scale-110 transition-all">
                        <TelegramIcon />
                    </div>
                </a>
                <a href="https://discord.gg/xxxxx" rel="noreferrer" target="_blank">
                    <div className="flex items-center text-white hover:scale-110 transition-all">
                        <DiscordIcon />
                    </div>
                </a>
                <a href="https://www.linkedin.com/in/stefan-yaman-ab9731309" rel="noreferrer" target="_blank">
                    <div className="flex items-center text-white hover:scale-110 transition-all mb-1">
                        <LinkedinIcon />
                    </div>
                </a>
                <ConnectWalletButton />
                <AvatarDropDown imageUrl={randomAvatar} name={user ? user.name : ""} address={publicKey?.toBase58()} onLogout={logout} onViewProfile={onViewProfile} />
            </div>
        </div>
    );
}
