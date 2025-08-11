import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main(){
    const assetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    await helpers.impersonateAccount(assetHolder);
    const impersonatedSigner = await ethers.getSigner(assetHolder);

    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const UNIROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const Usdc = await ethers.getContractAt("IERC20", USDCAddress);
    const usdcBal = await Usdc.balanceOf(assetHolder);

    console.log("User Initial Balance in Usdc", ethers.formatUnits(usdcBal.toString(), 6));

    const UsdcAmount = await ethers.parseUnits("1200",6);
    const ApproveUsdc = await Usdc.connect(impersonatedSigner).approve(UNIROUTER,UsdcAmount);
    const tx = await ApproveUsdc.wait();
    console.log("Approval done ", tx);
    const amountETHMin = await ethers.parseEther("0.1")
    const amountTokenMin = await ethers.parseUnits("1100",6);

    const Router = await ethers.getContractAt("IUniSwap", UNIROUTER);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;


    const provideEthLiquidity = await Router.connect(impersonatedSigner).addLiquidityETH(USDCAddress,UsdcAmount,amountTokenMin,amountETHMin,
        impersonatedSigner.address,deadline, {value: ethers.parseEther("0.3")});
    const tx2 = await provideEthLiquidity.wait();
    console.log("Provide Liquidity done ", tx2);

    console.log("User Final Balance in usdc",ethers.formatUnits(usdcBal.toString(),6));


    

    



}main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});