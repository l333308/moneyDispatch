const { ethers } = require("hardhat");

async function main() {
  // 1. 获取部署的合约
  const contractAddress = "0x4f5E7df5084693386940e4eCbFf419EBBAB5729C";
  const MultiTransfer = await ethers.getContractFactory("MultiTransfer");
  const multiTransfer = MultiTransfer.attach(contractAddress);

  // 2. 准备转账数据
  // 241226 向比特51-60转bnb 刷xter
  const recipients = [
    "0x6547b20862a56059b1e5c04216935e1ecb11d33b",
    "0x56df42b961a2883cf90478bb7700b3d1e6de3df1",
    "0x24eca7f68d4d60eb15a2acdbadc234cb5e5f0096",
    "0x9451639706d42802b081189da2afdbad68301c31",
    "0xa7e7323220dd803a2918dbcdab370ae76ade3695",
    "0xe4079c9ac84946c3f7f3f36b1d2636c0e59ee4e0",
    "0xcb8300bf9ff668f18b4a508e2ae8f56dc01298d8",
    "0xde96660653feb04d1d5d1715755d792e71bc5709",
    "0xfb15f3ca87e44afb8fa2b5bbe1aa2fb84a85642e",
    "0xd618488c675e7852e4f852d09d849547c968437f",
  ];

  // 转账金额：0.01 BNB, 0.02 BNB, 0.005 BNB
  const amounts = [
    // 约1u
    ethers.parseEther("0.0017"),
    ethers.parseEther("0.0017"),
    ethers.parseEther("0.0017"),
    ethers.parseEther("0.0017"),
    ethers.parseEther("0.0017"),
    ethers.parseEther("0.0017"),
    ethers.parseEther("0.0017"),
    ethers.parseEther("0.0017"),
    ethers.parseEther("0.0017"),
    ethers.parseEther("0.0017"),
  ];

  // 3. 计算总金额
  const totalAmount = amounts.reduce((a, b) => a + b, BigInt(0));
  console.log("Total amount to transfer:", ethers.formatEther(totalAmount), "BNB");

  // 4. 发送交易
  try {
    const tx = await multiTransfer.multiTransfer(recipients, amounts, {
      value: totalAmount,
      gasPrice: ethers.parseUnits("1", "gwei"),  // 设置 gas 价格为 1 Gwei
      gasLimit: 500000  // 设置 gas 限制
    });

    // 5. 等待交易确认
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // 6. 打印转账事件
    console.log("\nTransfer details:");
    const logs = receipt.logs;
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      try {
        const decodedLog = multiTransfer.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (decodedLog.name === "Transfer") {
          console.log(`Transfer ${i + 1}:`);
          console.log("From:", decodedLog.args[0]);  // from
          console.log("To:", decodedLog.args[1]);    // to
          console.log("Amount:", ethers.formatEther(decodedLog.args[2]), "BNB"); // amount
          console.log("------------------------");
        }
      } catch (e) {
        // 跳过无法解析的日志
        continue;
      }
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 