const { Connection, Keypair, Transaction, SystemProgram, PublicKey } = require("@solana/web3.js");
const dotenv = require("dotenv");
const bs58 = require("bs58");

// 加载 .env 文件
dotenv.config();

// 解密密钥函数
function decryptKey(ciphertext) {
    return ciphertext.replace("_2025", ""); // 提取明文部分
}

// 批量转账函数
async function batchTransfer() {
  // 配置
  const connection = new Connection(process.env.RPC_ENDPOINT, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000
  });
  const ciphertext = process.env.WALLET_PRIVATE_KEY;
  const plaintext = decryptKey(ciphertext);
  const payer = Keypair.fromSecretKey(bs58.decode(plaintext));

  // 收款地址和金额列表 - 使用 PublicKey 构造函数
  const recipients = [
    { address: new PublicKey("CWokSWf2hcWwouhqWVGyB8CnpqJSEXQDUbrLpHSz9aVw"), amount: 0.001 },
    { address: new PublicKey("HugwZDPzbswHDWwNNMd69SQHvSQRZcLQXQBLnC3ZMWaL"), amount: 0.001 },
  ];

  try {
    // 获取最新区块哈希
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    // 构建转账指令
    const instructions = recipients.map((recipient) =>
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: recipient.address,
        lamports: recipient.amount * 1e9,
      })
    );

    // 创建交易并设置区块哈希
    const tx = new Transaction({
      feePayer: payer.publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(...instructions);

    // 发送交易
    const txHash = await connection.sendTransaction(tx, [payer]);
    console.log("交易哈希:", txHash);

    // 等待交易确认
    const confirmation = await connection.confirmTransaction({
      signature: txHash,
      blockhash,
      lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error("交易确认失败");
    }
    console.log("交易已确认成功！");
  } catch (error) {
    console.error("交易失败:", error.message);
    throw error;
  }
}

// 执行批量转账
batchTransfer();
