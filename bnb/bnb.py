from web3 import Web3
import json
import logging
from utils import utils
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class BNBTransfer:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(os.getenv('BNB_RPC')))
        self.utils = utils()

        # 加载合约 ABI 和地址
        with open('contracts/MultiTransfer.json', 'r') as f:
            contract_json = json.load(f)
        self.contract_abi = contract_json['abi']
        self.contract_address = os.getenv('MULTI_TRANSFER_CONTRACT')
        self.contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=self.contract_abi
        )
        
    def transfer(self):
        try:
            # 1. 获取源钱包和目标钱包
            source_wallets, target_wallets = self.utils.get_wallet_pks()
            
            # 2. 判断转账类型
        except Exception as e:
            logging.error(f"转账失败: {str(e)}")
            if len(source_wallets) == 1 and len(target_wallets) > 1:
                logging.info("执行一对多转账")
                self._one_to_many(source_wallets[0], target_wallets)
            elif len(source_wallets) > 1 and len(target_wallets) == 1:
                logging.info("执行多对一转账")
                self._many_to_one(source_wallets, target_wallets[0])
            else:
                raise ValueError("不支持的转账类型，必须是一对多或多对一")
                
    def _one_to_many(self, source_wallet, target_wallets):
        try:
            # 获取源钱包余额
            balance = self.w3.eth.get_balance(source_wallet)
            #amount_per_wallet = balance // (len(target_wallets) + 1)  # 预留一部分 gas
            amount_per_wallet = 0.001  # 预留一部分 gas
            # 测试 先每个转0.001bnb
            
            # 准备合约调用数据
            amounts = [amount_per_wallet] * len(target_wallets)
            total_amount = sum(amounts)
            
            # 构建交易
            transaction = self.contract.functions.multiTransfer(
                target_wallets,
                amounts
            ).build_transaction({
                'from': source_wallet,
                'value': total_amount,
                'gas': 21000 * len(target_wallets),  # 根据接收者数量估算 gas
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(source_wallet),
                'chainId': 56
            })
            
            # 签名并发送交易
            signed_txn = self.w3.eth.account.sign_transaction(transaction, source_wallet)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            logging.info(f"批量转账交易已发送: {tx_hash.hex()}")
            
            # 等待交易确认
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            logging.info(f"批量转账成功，gas使用量: {receipt['gasUsed']}")
            
        except Exception as e:
            logging.error(f"一对多转账失败: {str(e)}")
            
    def _many_to_one(self, source_wallets, target_wallet):
        try:
            for source in source_wallets:
                balance = self.w3.eth.get_balance(source)
                
                # 预留一些 gas 费
                gas_reserve = 21000 * self.w3.eth.gas_price
                transfer_amount = balance - gas_reserve
                
                if transfer_amount <= 0:
                    logging.warning(f"钱包 {source} 余额不足支付 gas")
                    continue
                
                transaction = {
                    'nonce': self.w3.eth.get_transaction_count(source),
                    'to': target_wallet,
                    'value': transfer_amount,
                    'gas': 21000,
                    'gasPrice': self.w3.eth.gas_price,
                    'chainId': 56  # BNB Chain ID
                }
                
                # 签名并发送交易
                signed_txn = self.w3.eth.account.sign_transaction(transaction, source)
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
                logging.info(f"转账交易已发送: {tx_hash.hex()}")
                
                # 等待交易确认
                self.w3.eth.wait_for_transaction_receipt(tx_hash)
                
        except Exception as e:
            logging.error(f"多对一转账失败: {str(e)}")

def main():
    try:
        bnb_transfer = BNBTransfer()
        bnb_transfer.transfer()
    except Exception as e:
        logging.error(f"BNB 转账程序执行失败: {str(e)}")

if __name__ == "__main__":
    main()
