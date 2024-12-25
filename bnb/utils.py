import base64
import logging
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class utils:
    def __init__(self) -> None:
        self.salt = os.getenv("wallet_salt")

    # 获取接码后的钱包私钥
    def get_wallet_pks(self):
        try:
            sources = os.getenv('source_wallets')
            targets = os.getenv('target_wallets')

            # 定义处理单个地址的函数
            def process_address(encoded_str):
                if not encoded_str:
                    return ""
                # 添加 padding 处理
                padding = 4 - (len(encoded_str) % 4)
                if padding != 4:
                    encoded_str += '=' * padding
                # base64 解码
                decoded = base64.b64decode(encoded_str).decode('utf-8').strip()
                # 移除salt后缀
                if decoded.endswith(self.salt):
                    decoded = decoded[:-len(self.salt)]
                return decoded

            # 处理每个地址字符串：先分割，再进行 base64 解码和去除盐值
            source_array = [process_address(addr.strip()) for addr in sources.split(',')] if sources else []
            target_array = [process_address(addr.strip()) for addr in targets.split(',')] if targets else []
 
            # 将资金转入、转出钱包 均处理为数组返回
            return source_array, target_array
        except Exception as e:
            logging.warning(f"Warning in decoding addresses: {str(e)}")
            return [], []
