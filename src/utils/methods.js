import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

export const numberWithCommas = (x, digits = 3) => {
  return parseFloat(x).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
};

export const ellipsisAddress = (address) => {
  return (
    address?.toString()?.slice(0, 9) + "..." + address?.toString()?.slice(-9)
  );
};

export const isValidAddress = (addr) => {
  try {
    const decodedAddr = bs58.decode(addr);
    if (decodedAddr.length !== 32) return false;
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

// export const isValidSolPrivateKey = (privateKey) => {
//   // Check if the privateKey is a string of length 64 and only contains hexadecimal characters.
//   return (
//     typeof privateKey === "string" &&
//     privateKey.length === 64 &&
//     /^[0-9a-fA-F]+$/.test(privateKey)
//   );
// };

export const isValidSolPrivateKey = (privateKey) => {
  try {
    // Attempt to create a Keypair from the provided private key
    const keypair = Keypair.fromSecretKey(new Uint8Array(privateKey));

    // If a Keypair is successfully created, the private key is valid
    console.log(
      `Valid private key. Corresponding public key: ${keypair.publicKey.toBase58()}`
    );
    return true;
  } catch (error) {
    // If an error occurs, the private key is invalid
    console.error("Invalid private key:", error.message);
    return false;
  }
};

export const formatNumber = (number) => {
  let suffix = "";
  let formattedNumber = number;

  if (number >= 1e6) {
    suffix = "M";
    formattedNumber = number / 1e6;
  } else if (number >= 1e3) {
    suffix = "k";
    formattedNumber = number / 1e3;
  }
  return formattedNumber && formattedNumber > 0
    ? `${parseFloat(formattedNumber)?.toFixed(2)}${suffix}`
    : 0;
};
