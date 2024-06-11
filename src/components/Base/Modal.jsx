import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";

const appear = keyframes`
    0% {
        transform: transform(0.5);
        opacity: 0;
    }
    100% {
        transform: transform(1);
        opacity: 1;
    }
`;

const hide = keyframes`
    0% {
        transform: transform(1);
        opacity: 1;
    }
    100% {
        transform: transform(0.5);
        opacity: 0;
    }
`;

const AnimType = {
    APPEAR: "appear",
    HIDE: "hide",
};

const AnimatedDiv = styled.div`
    animation: ${(props) => props.type === AnimType.APPEAR ? appear : props.type === AnimType.HIDE ? hide : ""}
    0.5s ease-in-out forwards;
`;

// interface ModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

export default function Modal(props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCloseStarted, setIsCloseStarted] = useState(false);

    useEffect(() => {
        if (props.isOpen) {
            setIsCloseStarted(false);
            setIsOpen(true);
        }
        else {
            onClose();
        }
    }, [props.isOpen]);

    const onClose = () => {
        setIsCloseStarted(true);
        const timer = setTimeout(() => {
            setIsOpen(false);
        }, 500);
        return () => clearTimeout(timer);
    };

    return (
        <div className={`${isOpen ? "flex" : "hidden"} fixed top-0 left-0 w-screen h-screen bg-transparent flex flex-row items-center justify-center z-[999] ${props.className ? props.className : ""}`}>
            <div className="fixed top-0 left-0 w-screen h-screen bg-[#00000080]" onClick={() => { if (props.onClose) props.onClose(); }} />
            <div className="fixed">
                <AnimatedDiv className="w-fit h-fit" type={isCloseStarted ? AnimType.HIDE : AnimType.APPEAR}>
                    {props.children}
                </AnimatedDiv>
            </div>
        </div>
    );
}
