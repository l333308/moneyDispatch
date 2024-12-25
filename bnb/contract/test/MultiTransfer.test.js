const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiTransfer", function () {
  let multiTransfer;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const MultiTransfer = await ethers.getContractFactory("MultiTransfer");
    multiTransfer = await MultiTransfer.deploy();
    await multiTransfer.waitForDeployment();
  });

  it("Should transfer to multiple addresses", async function () {
    const recipients = [addr1.address, addr2.address];
    const amounts = [100, 200];
    
    await multiTransfer.multiTransfer(recipients, amounts, {
      value: 300
    });

    // 添加你的测试断言
  });
}); 