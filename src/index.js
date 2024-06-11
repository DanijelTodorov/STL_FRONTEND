import React from "react";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@material-tailwind/react";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import WalletProvider from "./components/WalletProvider";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import "./index.css";

window.Buffer = window.Buffer || require("buffer").Buffer;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <ThemeProvider>
        <WalletProvider>
            <BrowserRouter>
                <App />
                <ToastContainer />
            </BrowserRouter>
        </WalletProvider>
    </ThemeProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
