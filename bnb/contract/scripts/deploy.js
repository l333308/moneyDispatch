const hre = require("hardhat");

async function main() {
  const MultiTransfer = await ethers.getContractFactory("MultiTransfer");
  const multiTransfer = await MultiTransfer.deploy();

  await multiTransfer.waitForDeployment();

  const address = await multiTransfer.getAddress();

  console.log("MultiTransfer deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});