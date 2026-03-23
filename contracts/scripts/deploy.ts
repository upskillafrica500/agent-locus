import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Deploying ConditionalEscrow...");
  const ConditionalEscrow = await ethers.getContractFactory("ConditionalEscrow");
  const escrow = await ConditionalEscrow.deploy();

  await escrow.waitForDeployment();

  console.log("ConditionalEscrow deployed to:", await escrow.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
