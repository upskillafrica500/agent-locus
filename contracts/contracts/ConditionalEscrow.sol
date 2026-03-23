// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentLocus Conditional Escrow
 * @notice Trustless escrow for AI Agents paying in ERC20 (like cUSD) on Celo.
 */
contract ConditionalEscrow is Ownable {
    
    struct Escrow {
        address agentA;   // Buyer/Funder
        address agentB;   // Seller/Service Provider
        address token;    // Token address (e.g. cUSD)
        uint256 amount;   // Amount locked
        bool isReleased;  // If funds were released to Agent B
        bool isRefunded;  // If funds were refunded to Agent A
    }

    uint256 public nextEscrowId;
    mapping(uint256 => Escrow) public escrows;

    event EscrowCreated(uint256 indexed escrowId, address indexed agentA, address indexed agentB, address token, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId);
    event EscrowRefunded(uint256 indexed escrowId);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Agent A deposits funds to lock for Agent B
     */
    function deposit(address _agentB, address _token, uint256 _amount) external returns (uint256 escrowId) {
        require(_amount > 0, "Amount must be > 0");
        require(_agentB != address(0), "Invalid Agent B address");
        
        escrowId = nextEscrowId++;
        escrows[escrowId] = Escrow({
            agentA: msg.sender,
            agentB: _agentB,
            token: _token,
            amount: _amount,
            isReleased: false,
            isRefunded: false
        });

        // Transfer funds from Agent A to this contract
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        emit EscrowCreated(escrowId, msg.sender, _agentB, _token, _amount);
    }

    /**
     * @notice Agent A or Owner can release the funds to Agent B once conditions are met
     */
    function release(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(!escrow.isReleased && !escrow.isRefunded, "Escrow closed");
        require(msg.sender == escrow.agentA || msg.sender == owner(), "Only Agent A or Owner can release");

        escrow.isReleased = true;
        require(IERC20(escrow.token).transfer(escrow.agentB, escrow.amount), "Transfer failed");

        emit EscrowReleased(_escrowId);
    }

    /**
     * @notice Agent B or Owner configures refund back to Agent A
     */
    function refund(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(!escrow.isReleased && !escrow.isRefunded, "Escrow closed");
        require(msg.sender == escrow.agentB || msg.sender == owner(), "Only Agent B or Owner can refund");

        escrow.isRefunded = true;
        require(IERC20(escrow.token).transfer(escrow.agentA, escrow.amount), "Transfer failed");

        emit EscrowRefunded(_escrowId);
    }
}
