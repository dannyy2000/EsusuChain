import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main(){
    const assetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    await helpers.impersonateAccount(assetHolder);
    const impersonatedSigner = await ethers.getSigner(assetHolder);

    const JAN_1ST_2030 = 1893456000;
    const ONE_GWEI: bigint = 1_000_000_000n;

    console.log("------------", ethers.formatEther(impersonatedSigner.address))

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.connect(impersonatedSigner).deploy(JAN_1ST_2030,{
        value: ONE_GWEI
    });
    console.log("deployed")

     await lock.waitForDeployment();
  console.log("Lock deployed to:", lock.target);

  const tx_time = await lock.unlockTime();
  const owner = await lock.owner();

  console.log("Unlock time:", tx_time);
  console.log("Owner:", owner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});