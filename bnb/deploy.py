import bnb.utils
from web3 import Web3
import json
import os
from dotenv import load_dotenv
import logging
from bnb.utils import utils

logging.basicConfig(level=logging.INFO)

# 加载环境变量
load_dotenv()


def deploy_contract():
    try:
        # 连接到 BNB Chain
        w3 = Web3(Web3.HTTPProvider(os.getenv('BNB_RPC')))
        
        # 获取部署账户
        # 合约部署钱包为源钱包
        source_wallets, target_wallets  = utils.get_wallet_pks()
        if len(source_wallets) == 1:
            deployer_private_key = source_wallets[0]
        else:
            logging.error(f"部署合约失败: 部署钱包获取失败")
            return
        deployer_account = w3.eth.account.from_key(deployer_private_key)
        
        # 读取合约文件
        contract_path = os.path.join(os.path.dirname(__file__), 'contracts/MultiTransfer.json')
        with open(contract_path, 'r') as f:
            contract_json = json.load(f)
            
        # 准备合约部署
        contract = w3.eth.contract(
            abi=contract_json['abi'],
            bytecode=contract_json['bytecode']
        )
        
        # 构建部署交易
        transaction = contract.constructor().build_transaction({
            'from': deployer_account.address,
            'nonce': w3.eth.get_transaction_count(deployer_account.address),
            'gas': 350000,
            'gasPrice': w3.eth.gas_price,
            'chainId': 56
        })
        
        # 签名并发送交易
        signed_txn = w3.eth.account.sign_transaction(transaction, deployer_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        logging.info(f"部署交易已发送: {tx_hash.hex()}")
        
        # 等待交易确认
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        contract_address = tx_receipt['contractAddress']
        
        logging.info(f"合约已部署到地址: {contract_address}")
        logging.info(f"部署花费的 gas: {tx_receipt['gasUsed']}")
        
        # 将合约地址保存到 .env 文件
        with open('.env', 'a') as f:
            f.write(f"\nMULTI_TRANSFER_CONTRACT={contract_address}")
            
        return contract_address
        
    except Exception as e:
        logging.error(f"部署合约失败: {str(e)}")
        return None

if __name__ == "__main__":
    deploy_contract() 