import { useContext } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

import { AppContext } from "../App";

export default function SigninPage() {
  const { SERVER_URL, setLoadingPrompt, setOpenLoading, setUser } =
    useContext(AppContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = e.target[0].value;
    const password = e.target[1].value;
    if (name === "") {
      toast.warn("Please input user name");
      return;
    }

    if (password === "") {
      toast.warn("Please input password");
      return;
    }

    setLoadingPrompt("");
    setOpenLoading(true);
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/user/login`,
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
        localStorage.setItem("access-token", data.accessToken);
        setUser(data.user);
        // navigate("/dashboard");
      } else toast.warn("Failed to register");
    } catch (err) {
      console.log(err);
      setOpenLoading(false);
      toast.warn("Failed to login");
    }
  };

  return (
    <div
      className={`flex items-center justify-center min-h-screen bg-center bg-cover  bg-gradient-to-r from-[#ffffff0d] to-[#ffffff05]`}
    >
      {/* <div className="absolute -z-1">
                <img alt="graphs" src="/assets/graphs.svg" className="w-[100vw]" />
            </div> */}
      <div className="relative  bg-gradient-to-r from-[#ffffff0d] to-[#ffffff05] backdrop-blur-lg rounded-3xl px-[50px] py-[30px] max-sm:w-[360px] m-6 max-w-[480px] w-full shadow-2xl shadow-black">
        <h2 className="mb-3 text-3xl font-bold text-baseColor w-full text-center border-[0px] border-b-[1px] border-b-baseColor pb-4 mb-8">
          LOG IN
        </h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block my-1 text-baseColor font-bold" htmlFor="name">
              Username
            </label>
            <input
              id="name"
              type="text"
              className="w-full h-[40px] rounded-[6px] bg-[rgba(255,255,255,0.1)] px-[15px] text-white outline-none focus:border focus:border-baseColor"
              placeholder="Enter username here"
            />
          </div>
          <div>
            <label className="block my-1 text-baseColor font-bold" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full h-[40px] rounded-[6px] bg-[rgba(255,255,255,0.1)] px-[15px] text-white outline-none focus:border focus:border-baseColor"
              placeholder="Enter password here"
            />
          </div>
          <div className="flex justify-center w-full gap-2">
            <button className="w-[120px] sm:w-[180px] mt-2 h-10 sm:h-10 px-5 sm:px-10 py-2.5 rounded-full justify-center items-center gap-2.5 inline-flex hover:bg-gradient-to-br active:scale-95 transition duration-300 ease-in-out transform focus:outline-none">
              <div className="text-base font-semibold leading-normal text-center text-white sm:text-xl font-poppins">
                Log in
              </div>
            </button>
          </div>
        </form>
        <p className="mt-5 text-center text-[rgba(255,255,255,0.7)]">
          Don't have an account?&nbsp;
          <Link
            to="/register"
            className="font-bold text-baseColor hover:underline italic text-[1.2rem] ltr:ml-1 rtl:mr-1"
          >
            Register
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
