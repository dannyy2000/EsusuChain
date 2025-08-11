import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main(){
    const assetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    await helpers.impersonateAccount(assetHolder);
    const impersonatedSigner = await ethers.getSigner(assetHolder);

    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const UNIROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const Usdc = await ethers.getContractAt("IERC20",USDCAddress);
    const Dai = await ethers.getContractAt("IERC20",DAIAddress);

    const UsdcBalance = await Usdc.balanceOf(assetHolder);
    const DaiBalance = await Dai.balanceOf(assetHolder);
    
    console.log("User Initial Balance in Usdc", ethers.formatUnits(UsdcBalance.toString(), 6));
    console.log("User Initial Balance in DAI", ethers.formatUnits(DaiBalance.toString(), 18));
    

    const DaiAmount = await ethers.parseUnits("470", 18);
    const UsdcAmount = await ethers.parseUnits("474", 6);

    const UsdcApproval = await Usdc.connect(impersonatedSigner).approve(UNIROUTER, UsdcAmount);
    const txUsdc = await UsdcApproval.wait();
    console.log("USDC approval receipt:", txUsdc);
 
 

    const Router = await ethers.getContractAt("IUniSwap", UNIROUTER);

    const SWapTokens = await Router.connect(impersonatedSigner).swapTokensForExactTokens(
        DaiAmount,
        UsdcAmount,
        [USDCAddress, DAIAddress],
        assetHolder,
        Math.floor(Date.now() / 1000) + 60 * 10 
    );

    const txSwap = await SWapTokens.wait();
    console.log("Swap receipt:",txSwap);

    const usdcBalanceAfter = await Usdc.balanceOf(assetHolder);
    const daiBalanceAfter = await Dai.balanceOf(assetHolder);

    console.log("User Balance in Usdc after swap", ethers.formatUnits(usdcBalanceAfter.toString(), 6));
    console.log("User Balance in DAI after swap", ethers.formatUnits(daiBalanceAfter.toString(), 18));


}main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});