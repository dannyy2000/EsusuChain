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

    const usdcBal = await Usdc.balanceOf(assetHolder);
    const daiBal = await Dai.balanceOf(assetHolder);


    console.log("User Initial Balance in Usdc",ethers.formatUnits(usdcBal.toString(),6))

    console.log("User Initial Balance",ethers.formatUnits(daiBal.toString(),18));


    const Router = await ethers.getContractAt("IUniSwap",UNIROUTER);

    const USDCAmount = await ethers.parseUnits("471000",18);
    const DAIAmount = await ethers.parseUnits("47000",18);

    const ApproveUsdc = await Usdc.connect(impersonatedSigner).approve(UNIROUTER,USDCAmount);
     const tx = await ApproveUsdc.wait();
    console.log("USDC approval receipt:", tx);
    const AllowanceUsdc = await Usdc.allowance(assetHolder,UNIROUTER);
      const tx2 = await ApproveUsdc.wait();
    console.log("USDC allowance receipt:", tx2);

    const ApproveDAI = await Dai.connect(impersonatedSigner).approve(UNIROUTER,DAIAmount);
    const tx3 =  await ApproveUsdc.wait();
    console.log("DAI approval receipt:", tx3?.fee);


    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    const provideLiquidity = await Router.connect(impersonatedSigner).addLiquidity(USDCAddress,DAIAddress,USDCAmount,DAIAmount,1,1,assetHolder,deadline);
    const tx4 =  await ApproveUsdc.wait();
    console.log("Liquidity receipt:", tx4);

  


    const usdcBalanceAfter = await Usdc.balanceOf(assetHolder);
    const daiBalanceAfter = await Dai.balanceOf(assetHolder);

    console.log("User Balance in Usdc after adding liquidity",ethers.formatUnits(usdcBalanceAfter.toString(),6));
    console.log("User Balance in DAI after adding liquidity",ethers.formatUnits(daiBalanceAfter.toString(),18));



   





}main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});