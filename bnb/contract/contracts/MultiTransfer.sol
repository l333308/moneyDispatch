// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiTransfer {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    receive() external payable {}
    
    function multiTransfer(address[] calldata recipients, uint256[] calldata amounts) external payable {
        require(recipients.length == amounts.length, "Recipients and amounts length mismatch");
        
        uint256 total = 0;
        for(uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        require(msg.value >= total, "Insufficient BNB sent");
        
        for(uint256 i = 0; i < recipients.length; i++) {
            payable(recipients[i]).transfer(amounts[i]);
        }
        
        uint256 remaining = msg.value - total;
        if (remaining > 0) {
            payable(msg.sender).transfer(remaining);
        }
    }
    
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
} 