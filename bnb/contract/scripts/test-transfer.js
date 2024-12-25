const { ethers } = require("hardhat");

async function main() {
  // 1. 获取部署的合约
  const contractAddress = "0xCBb4268894477951f4537d5A705f1Eb7aeca5263";
  const MultiTransfer = await ethers.getContractFactory("MultiTransfer");
  const multiTransfer = MultiTransfer.attach(contractAddress);

  // 2. 准备转账数据
  const recipients = [
    "0x0B024DD5E004582219A6E56778142f280fe5C5e0",
    "0x7f113a52c23d6965EdF2307238eEbd81969282f2",
    "0x667efd3bfbc760d5c614446bf1b3591cc5cd5f78"  
  ];

  // 转账金额：0.01 BNB, 0.02 BNB, 0.005 BNB
  const amounts = [
    ethers.parseEther("0.001"),
    ethers.parseEther("0.002"),
    ethers.parseEther("0.005"),
  ];

  // 3. 计算总金额
  const totalAmount = amounts.reduce((a, b) => a + b, BigInt(0));
  console.log("Total amount to transfer:", ethers.formatEther(totalAmount), "BNB");

  // 4. 发送交易
  try {
    const tx = await multiTransfer.multiTransfer(recipients, amounts, {
      value: totalAmount
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