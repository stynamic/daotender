// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TenderPassed.sol";

contract Tender is Ownable {
    struct Proposal {
        address bidderAddress;
        uint amount;
        uint totalStages;
    }

    address private tenderPassed;
    uint private biddingEndTime;
    string private name;
    Proposal[] public proposals;

    constructor(uint _biddingOpenFor, string memory _name) {
        biddingEndTime = block.timestamp + _biddingOpenFor;
        name = _name;
    }

    function placeBid(uint _amount, uint _totalStages) external {
        require(block.timestamp <= biddingEndTime, "Bidding ended.");
        require(_amount > 0, "Invalid bid.");

        newProposal(_amount, _totalStages);
    }

    function getAllDetails() external view returns(address, uint, string memory) {
        return (tenderPassed, biddingEndTime, name);
    }

    function allocateTender(uint index, address proposer) public onlyOwner {
        require(proposals.length > 0, "No proposals found.");
        require(tenderPassed == address(0), "Tender already allocated");

        passTheTender(index, proposer);        
    }

    function getAllProposals() public view returns(Proposal[] memory) {
        return proposals;
    }

    function newProposal(uint _amount, uint _totalStages) private {
        Proposal memory proposal = Proposal({
            bidderAddress: payable(msg.sender),
            amount: _amount,
            totalStages: _totalStages
        });

        proposals.push(proposal);
    } 

    function passTheTender(uint index, address proposer) private {
        TenderPassed _tenderPassed = new TenderPassed(
            proposer,
            payable(proposals[index].bidderAddress),
            proposals[index].amount,
            proposals[index].totalStages
        );

        tenderPassed = address(_tenderPassed);
    }
}