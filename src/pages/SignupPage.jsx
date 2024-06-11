import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

import { AppContext } from "../App";
import RegisteredDialog from "../components/Dialogs/RegisteredDialog";

export default function SignupPage() {
    const { SERVER_URL, setLoadingPrompt, setOpenLoading } = useContext(AppContext);
    const navigate = useNavigate();
    const [openRegistered, setOpenRegistered] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const name = e.target[0].value;
        const password = e.target[1].value;
        if (name === "") {
            toast.warn("Please input user name");
            return;
        }

        if (password.length < 8) {
            toast.warn("Password should be longer than 8 characters");
            return;
        }

        setLoadingPrompt("");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/user/register`,
                {
                    name,
                    password,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (data.success) {
                setOpenLoading(false);
                setOpenRegistered(true);
            }
            else
                toast.warn("Failed to register");
        }
        catch (err) {
            console.log(err);
            setOpenLoading(false);
            toast.warn("Failed to register");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-center bg-cover  bg-gradient-to-r from-[#ffffff0d] to-[#ffffff05]">
            <RegisteredDialog isOpen={openRegistered} onOK={() => { navigate("/login"); }} />
            <div className="relative  bg-gradient-to-r from-[#ffffff0d] to-[#ffffff05] backdrop-blur-lg rounded-3xl px-[50px] py-[30px] shadow max-sm:w-[360px] m-6 max-w-[480px] w-full">
                <h2 className="mb-3 text-3xl font-bold text-baseColor w-full text-center border-[0px] border-b-[1px] border-b-baseColor pb-4 mb-8">REGISTER</h2>
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block my-1 text-baseColor font-bold">Username</label>
                        <input type="text" className="w-full h-[40px] rounded-[6px] bg-[rgba(255,255,255,0.1)] px-[15px] text-white outline-none focus:border focus:border-baseColor" placeholder="Enter username here" />
                    </div>
                    <div>
                        <label className="block my-1 text-baseColor font-bold">Password</label>
                        <input type="password" className="w-full h-[40px] rounded-[6px] bg-[rgba(255,255,255,0.1)] px-[15px] text-white outline-none focus:border focus:border-baseColor" placeholder="Enter password here" />
                    </div>
                    <div className="flex justify-center w-full gap-2">
                        <button type="submit" className="w-[120px] sm:w-[180px] mt-2 h-10 sm:h-10 px-5 sm:px-10 py-2.5 bg-base rounded-full justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-100 ease-in-out transform focus:outline-none">
                            <div className="text-base font-semibold leading-normal text-center text-white sm:text-xl font-poppins">
                                Register
                            </div>
                        </button>
                    </div>
                </form>
                <p className="mt-5 text-center text-[rgba(255,255,255,0.7)]">
                    Already have an account?&nbsp;
                    <Link to="/login" className="font-bold text-baseColor text-[1.2rem] italic hover:underline ltr:ml-1 rtl:mr-1">
                        Login
                    </Link>
                </p>
                {/* <p className="mt-2 text-center text-[rgba(255,255,255,0.7)]">
                    Go to landing page?&nbsp;
                    <Link to="/" className="font-bold text-[rgb(67,97,238)] hover:underline ltr:ml-1 rtl:mr-1">
                        Home
                    </Link>
                </p> */}
            </div>
        </div>
    );
}
