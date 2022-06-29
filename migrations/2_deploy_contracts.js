const TenderToken = artifacts.require('TenderToken');
const TenderTimelock = artifacts.require('TenderTimelock');
const MyGovernor = artifacts.require('MyGovernor');
const Tender = artifacts.require('Tender');

module.exports = async (deployer) => {
    const [executor, proposer, villager1, villager2] = await web3.eth.getAccounts();

    const etherToWei = ether => web3.utils.toWei(ether, 'ether');

    await deployer.deploy(TenderToken, etherToWei('100'));
    const tenderToken = await TenderToken.deployed();

    await tenderToken.transfer(proposer, etherToWei('5'));
    await tenderToken.transfer(villager1, etherToWei('1'));
    await tenderToken.transfer(villager2, etherToWei('1'));

    await deployer.deploy(TenderTimelock, 0 , [proposer], [executor]);
    const tenderTimelock = await TenderTimelock.deployed();

    await deployer.deploy(MyGovernor, tenderToken.address, tenderTimelock.address, 6, 0, 3);
    const myGovernor = await MyGovernor.deployed();

    await deployer.deploy(Tender, "3600", "First");
    const tender = await Tender.deployed();

    await tender.transferOwnership(tenderTimelock.address, { from: executor });

    const proposerRole = await tenderTimelock.PROPOSER_ROLE();
    const executorRole = await tenderTimelock.EXECUTOR_ROLE();

    await tenderTimelock.grantRole(proposerRole, myGovernor.address, { from: executor });
    await tenderTimelock.grantRole(executorRole, myGovernor.address, { from: executor });
}