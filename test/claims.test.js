const ClaimsBook = artifacts.require('ClaimsBook');
const SimpleToken = artifacts.require('test/SimpleToken');
const { decodeLogs } = require('./decodeLogs');
const abi = require('ethereumjs-abi');
const BigNumber = require('bignumber.js');
const Utils = require('./utils');


let precision = new BigNumber("1000000000000000000");

contract('ClaimsBook', accounts => {

    let claimsBook;
    let owner = accounts[0];
    let changeAgent = accounts[1];

    beforeEach(async () => {
        claimsBook = await ClaimsBook.new(owner, {from: owner});
    });

    it('should check that owner is changeAgent', async() => {
        let ownerStatus = await claimsBook.isChangeAgent(owner);
        assert.equal(ownerStatus, true, "owner is not change agent");
    });

    it('should check that random address is not change agent', async () => {
        let randomAddressStatus = await claimsBook.isChangeAgent(accounts[8]);
        assert.equal(randomAddressStatus, false, "random address is change agent");
    });

    it('should update change agent', async () => {
        let userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");

        await claimsBook.updateChangeAgent(changeAgent, true)
            .then(Utils.receiptShouldSucceed);

        userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, true, "user is change agent");
    });

    it('should not update change agent cause agent == address(0)', async () => {
        let userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");

        await claimsBook.updateChangeAgent(0x0, true)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");
    });

    it('should not update change agent cause status == current status', async () => {
        let userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");

        await claimsBook.updateChangeAgent(changeAgent, false)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");
    });    

    it('should create claim', async () => {
        let userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");

        await claimsBook.updateChangeAgent(changeAgent, true)
            .then(Utils.receiptShouldSucceed);
    
        userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, true, "user is change agent");

        let claimId = 1;
        let claimType = 1;
        let metadata = [0x12, 0x34];

        await claimsBook.createClaim(claimId, claimType, metadata, {from: changeAgent})
            .then(Utils.receiptShouldSucceed);

        let claim = await claimsBook.claims.call(claimId);
        assert.equal(new BigNumber(claim[0]).valueOf(), new BigNumber(claimType).valueOf(), "claimType is not equal");
        assert.equal(claim[2], true, "claimPeriodStatus is not equal");

        let createClaimEvents = await claimsBook.CreateClaim({}, {fromBlock: '0', toBlock: 'latest'});

        createClaimEvents.get((err, logs) => {
            assert.equal(logs.length, 1, "more or less than 1 event");
            assert.equal(logs[0].event, "CreateClaim", "event type is not equal");
            assert.equal(logs[0].args.claimId, claimId, "claim id is not equal");
            assert.equal(logs[0].args.creator, changeAgent, "claim creator is not equal");

            logs.forEach(log => console.log(log.args));
        });
    }); 

    it('should not create claim cause claimId == 0', async () => {
        let userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");

        await claimsBook.updateChangeAgent(changeAgent, true)
            .then(Utils.receiptShouldSucceed);
    
        userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, true, "user is change agent");

        let claimId = 0;
        let claimType = 1;
        let metadata = [0x12, 0x34];

        await claimsBook.createClaim(claimId, claimType, metadata, {from: changeAgent})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should not create claim cause claimType == 0', async () => {
        let userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");

        await claimsBook.updateChangeAgent(changeAgent, true)
            .then(Utils.receiptShouldSucceed);
    
        userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, true, "user is change agent");

        let claimId = 1;
        let claimType = 0;
        let metadata = [0x12, 0x34];

        await claimsBook.createClaim(claimId, claimType, metadata, {from: changeAgent})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should not create claim cause claim already exists', async () => {
        let userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");

        await claimsBook.updateChangeAgent(changeAgent, true)
            .then(Utils.receiptShouldSucceed);
    
        userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, true, "user is change agent");

        let claimId = 1;
        let claimType = 1;
        let metadata = [0x12, 0x34];

        await claimsBook.createClaim(claimId, claimType, metadata, {from: changeAgent})
            .then(Utils.receiptShouldSucceed);

        let claim = await claimsBook.claims.call(claimId);
        assert.equal(new BigNumber(claim[0]).valueOf(), new BigNumber(claimType).valueOf(), "claimType is not equal");
        assert.equal(claim[2], true, "claimPeriodStatus is not equal");

        await claimsBook.isClaimExists(0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        let claimExist = await claimsBook.isClaimExists(claimId);
        assert.equal(claimExist, true, "claim is not exist");

        await claimsBook.createClaim(claimId, claimType, metadata, {from: changeAgent})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should retrieve claim', async () => {
        let userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");

        await claimsBook.updateChangeAgent(changeAgent, true)
            .then(Utils.receiptShouldSucceed);
    
        userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, true, "user is change agent");

        let claimId = 1;
        let claimType = 1;
        let metadata = [0x12, 0x34];

        await claimsBook.createClaim(claimId, claimType, metadata, {from: changeAgent})
            .then(Utils.receiptShouldSucceed);

        let claim = await claimsBook.claims.call(claimId);
        assert.equal(new BigNumber(claim[0]).valueOf(), new BigNumber(claimType).valueOf(), "claimType is not equal");
        assert.equal(claim[2], true, "claimPeriodStatus is not equal");

        let claimPeriodStatus = await claimsBook.getClaimPeriodStatus(claimId);
        assert.equal(claimPeriodStatus, true, "claimPeriodStatus is not equal");

        await claimsBook.retrieveClaim(claimId, metadata, {from: changeAgent})
            .then(Utils.receiptShouldSucceed);

        claimPeriodStatus = await claimsBook.getClaimPeriodStatus(claimId);
        assert.equal(claimPeriodStatus, false, "claimPeriodStatus is not equal");

        let retrieveClaimEvents = await claimsBook.RetrieveClaim({}, {fromBlock: '0', toBlock: 'latest'});

        retrieveClaimEvents.get((err, logs) => {
            assert.equal(logs.length, 1, "more or less than 1 event");
            assert.equal(logs[0].event, "RetrieveClaim", "event type is not equal");
            assert.equal(logs[0].args.claimId, claimId, "claim id is not equal");
            assert.equal(logs[0].args.retriever, changeAgent, "claim retriever is not equal");

            logs.forEach(log => console.log(log.args));
        });
    });

    it('should not retrieve claim cause msg.sender != changeAgent', async () => {
        let userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");

        await claimsBook.updateChangeAgent(changeAgent, true)
            .then(Utils.receiptShouldSucceed);
    
        userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, true, "user is change agent");

        let claimId = 1;
        let claimType = 1;
        let metadata = [0x12, 0x34];

        await claimsBook.createClaim(claimId, claimType, metadata, {from: changeAgent})
            .then(Utils.receiptShouldSucceed);

        let claim = await claimsBook.claims.call(claimId);
        assert.equal(new BigNumber(claim[0]).valueOf(), new BigNumber(claimType).valueOf(), "claimType is not equal");
        assert.equal(claim[2], true, "claimPeriodStatus is not equal");

        let claimPeriodStatus = await claimsBook.getClaimPeriodStatus(claimId);
        assert.equal(claimPeriodStatus, true, "claimPeriodStatus is not equal");

        await claimsBook.retrieveClaim(claimId, metadata, {from: accounts[3]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        claimPeriodStatus = await claimsBook.getClaimPeriodStatus(claimId);
        assert.equal(claimPeriodStatus, true, "claimPeriodStatus is not equal");
    });

    it('should not retrieve claim cause claimId == 0 && existingClaim[_claimId] == false', async () => {
        let userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, false, "user is change agent");

        await claimsBook.updateChangeAgent(changeAgent, true)
            .then(Utils.receiptShouldSucceed);
    
        userStatus = await claimsBook.isChangeAgent(changeAgent);
        assert.equal(userStatus, true, "user is change agent");

        let claimId = 1;
        let claimType = 1;
        let metadata = [0x12, 0x34];

        await claimsBook.createClaim(claimId, claimType, metadata, {from: changeAgent})
            .then(Utils.receiptShouldSucceed);

        let claim = await claimsBook.claims.call(claimId);
        assert.equal(new BigNumber(claim[0]).valueOf(), new BigNumber(claimType).valueOf(), "claimType is not equal");
        assert.equal(claim[2], true, "claimPeriodStatus is not equal");

        let claimPeriodStatus = await claimsBook.getClaimPeriodStatus(claimId);
        assert.equal(claimPeriodStatus, true, "claimPeriodStatus is not equal");

        await claimsBook.retrieveClaim(0, metadata, {from: changeAgent})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        claimPeriodStatus = await claimsBook.getClaimPeriodStatus(claimId);
        assert.equal(claimPeriodStatus, true, "claimPeriodStatus is not equal");
    });
});