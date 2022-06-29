const TenderToken = artifacts.require('TenderToken');
const MyGovernor = artifacts.require('MyGovernor');
const Tender = artifacts.require('Tender');

module.exports = async (callback) => {
    const [executor, proposer, villager1, villager2, bidder] = await web3.eth.getAccounts();

    const toEther = ether => web3.utils.fromWei(ether, 'ether');

    const tenderToken = await TenderToken.deployed();
    await tenderToken.delegate(proposer, { from: proposer });
    await tenderToken.delegate(villager1, { from: villager1 });
    await tenderToken.delegate(villager2, { from: villager2 });

    const tender = await Tender.deployed();
    const tenderPassedBefore = (await tender.getAllDetails())[0];
    console.log(`Tenderpassed address before voting: ${tenderPassedBefore}`);

    await tender.placeBid("1", "1", { from: bidder });

    const myGovernor = await MyGovernor.deployed();
    const encodeFunction = await tender.contract.methods.allocateTender(0, proposer).encodeABI();

    const tx = await myGovernor.propose([tender.address], [0], [encodeFunction], "First", { from: proposer });
    const { proposalId } = tx.logs[0].args;

    const proposalStateBefore = (await myGovernor.state(proposalId)).toNumber();
    console.log(`Proposal state before voting: ${proposalStateBefore}`);

    // Voting started
    await myGovernor.castVote(proposalId, 1, { from: proposer });
    await myGovernor.castVote(proposalId, 1, { from: villager1 });
    await myGovernor.castVote(proposalId, 1, { from: villager2 });

    tenderToken.transfer(proposer, "1000", { from: executor });

    const proposalStateAfter = (await myGovernor.state(proposalId)).toNumber();
    console.log(`Proposal state after voting: ${proposalStateAfter}`);

    const { againstVotes, forVotes, abstainVotes } = await myGovernor.proposalVotes(proposalId);
    console.log(
        `Against votes: ${toEther(againstVotes)} |`,
        `For votes: ${toEther(forVotes)} |`,
        `Abstain votes: ${toEther(abstainVotes)}`
    );

    await myGovernor.queue([tender.address], [0], [encodeFunction], web3.utils.sha3("First"), { from: proposer });

    await myGovernor.execute([tender.address], [0], [encodeFunction], web3.utils.sha3("First"), { from: executor });

    const tenderPassedAfter = (await tender.getAllDetails())[0];
    console.log(`Tenderpassed address after voting: ${tenderPassedAfter}`);

    callback();
}