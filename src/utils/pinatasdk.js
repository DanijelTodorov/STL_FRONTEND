import axios from "axios";
import { NFTStorage } from "nft.storage";

const NFT_STORAGE_TOKEN = process.env.REACT_APP_NFT_STORAGE_TOKEN;

const PINATA_JWT = "Bearer <PINATA_JWT>";

export const UPLOADING_FILE_TYPES = {
  OTHERS: 0,
  JSON: 1,
};

/* Pinata */

export const pinFileToPinata = async (fileImg) => {
    const formData = new FormData();
  
    if (fileImg) {
        formData.append('file', fileImg)

        const pinataMetadata = JSON.stringify({
            name: 'File name',
        });
        formData.append('pinataMetadata', pinataMetadata);
        
        const pinataOptions = JSON.stringify({
            cidVersion: 0,
        })
        formData.append('pinataOptions', pinataOptions);

        try {
          const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
            },
            body: formData,
          });
          const resData = await res.json();
            console.log(resData, " ====== upload data hash : ", resData.IpfsHash);
            return resData.IpfsHash;

        } catch (error) {
            console.log("File to IPFS: ")
            console.log(error)
        }
    }
};

export const pinMultiFilesToPinata = async (
  filelist,
  type = UPLOADING_FILE_TYPES.IMAGE
) => {
  let ipfsCid = "";
  try {
    if (filelist?.length <= 0) return null;
    const formData = new FormData();

    Array.from(filelist).forEach((file) => {
      formData.append("file", file);
    });

    const metadata = JSON.stringify({
      name: `${type}_${Date.now()}`,
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxBodyLength: "Infinity",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            Authorization: PINATA_JWT,
          },
        }
      );
      ipfsCid = res.data.IpfsHash;
    } catch (error) {
      ipfsCid = null;
    }
  } catch (error) {
    ipfsCid = null;
  }

  return ipfsCid;
};

export const pinJsonToPinata = async (jsonObj) => {
  let ipfsCid = "";
  try {
    let res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      { ...jsonObj },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        },
      }
    );
    ipfsCid = res.data.IpfsHash;
  } catch (error) {
    ipfsCid = null;
  }
  return ipfsCid;
};

export const pinUpdatedJsonDirectoryToPinata = async (
  namelist,
  jsonlist,
  type = UPLOADING_FILE_TYPES.IMAGE
) => {
  let ipfsCid = "";
  try {
    if (jsonlist?.length <= 0) return null;
    let formData = new FormData();
    for (let idx = 0; idx < jsonlist.length; idx++) {
      formData.append(
        "file",
        new Blob([jsonlist[idx]], { type: "application/json" }),
        `json/${namelist[idx].name}`
      );
    }

    const metadata = JSON.stringify({
      name: `${type}_${Date.now()}`,
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);
    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxBodyLength: "Infinity",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            Authorization: PINATA_JWT,
          },
        }
      );
      ipfsCid = res.data.IpfsHash;
    } catch (error) {
      ipfsCid = null;
    }
  } catch (error) {
    ipfsCid = null;
  }

  return ipfsCid;
};

/* NFT Storage */

export const pinFileToNFTStorage = async (fileImg) => {
    const formData = new FormData();
    if (fileImg) {
        formData.append('file', fileImg)

        const pinataMetadata = JSON.stringify({
            name: 'File name',
        });
        formData.append('pinataMetadata', pinataMetadata);
        
        const pinataOptions = JSON.stringify({
            cidVersion: 0,
        })
        formData.append('pinataOptions', pinataOptions);

        try {
            const resFile = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers: {
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_SEC_KEY,
                    "Content-Type": "multipart/form-data"
                },
            });
            console.log(" ====== upload data hash : ", resFile.data.IpfsHash);
            return resFile.data.IpfsHash;

        } catch (error) {
            console.log("File to IPFS: ")
            console.log(error)
        }
    }
};

export const pinMultiFilesToNFTStorage = async (files) => {
  const storage = new NFTStorage({ token: NFT_STORAGE_TOKEN });
  const cid = await storage.storeDirectory(files);
  return cid;
};

export const pinJsonToNFTStorage = async (jsonObj) => {
  let res = await axios.post(
    "https://api.nft.storage/upload",
    { ...jsonObj },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NFT_STORAGE_TOKEN}`,
      },
    }
  );
  return `https://nftstorage.link/ipfs/${res.data.value.cid}`;
};

export const pinUpdatedJsonDirectoryToNFTStorage = async (
  namelist,
  jsonlist,
  type = UPLOADING_FILE_TYPES.IMAGE
) => {
  let ipfsCid = "";
  try {
    if (jsonlist?.length <= 0) return null;
    let formData = new FormData();
    for (let idx = 0; idx < jsonlist.length; idx++) {
      const blob = new Blob([JSON.stringify(jsonlist[idx])], { type: "application/json" });
      formData.append(
        "file",
        blob,
        `${namelist[idx].name}`
      );
    }

    const metadata = JSON.stringify({
      name: `${type}_${Date.now()}`,
    });
    formData.append("nftStorageMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("nftStorageOptions", options);
    try {
      const res = await axios.post("https://api.nft.storage/upload", formData, {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          Authorization: `Bearer ${NFT_STORAGE_TOKEN}`,
        },
      });
      ipfsCid = res.data.value.cid;
    } catch (error) {
      console.log(error)
      ipfsCid = null;
    }
  } catch (error) {
    console.log(error)
    ipfsCid = null;
  }

  return ipfsCid;
};
