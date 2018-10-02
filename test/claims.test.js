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
    let eventReporter = accounts[1];

    beforeEach(async () => {
        claimsBook = await ClaimsBook.new(eventReporter, {from: owner});
    });

    it('should check that event reporter is really event reporters and owner is not event reporter', async () => {
        let ownerStatus = await claimsBook.isEventReporter(owner);
        assert.equal(ownerStatus, false, "owner is event reporter");
        let eventReporterStatus = await claimsBook.isEventReporter(eventReporter);
        assert.equal(eventReporterStatus, true, "eventReporter is not event reporter");
    });

    it('should check that random address is not event reporter', async () => {
        let randomUser = accounts[2];
        let randomUserStatus = await claimsBook.isEventReporter(randomUser);
        assert.equal(randomUserStatus, false, "randomUser is event reporter");
    });

    it('should not update event reporter cause msg.sender != owner', async () => {
        let newEventReporter = accounts[2];
        await claimsBook.updateEventReporter(newEventReporter, true, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        let newEventReporterStatus = await claimsBook.isEventReporter(newEventReporter);
        assert.equal(newEventReporterStatus, false, "newEventReporter is event reporter");
    });

    it('should not update event reporter cause eventReporter == address(0)', async () => {
        let newEventReporter = 0x0;
        await claimsBook.updateEventReporter(newEventReporter, true, {from: owner})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        let newEventReporterStatus = await claimsBook.isEventReporter(newEventReporter);
        assert.equal(newEventReporterStatus, false, "newEventReporter is event reporter");
    });

    it('should update event reporter', async () => {
        let newEventReporter = accounts[2];
        await claimsBook.updateEventReporter(newEventReporter, true, {from: owner})
            .then(Utils.receiptShouldSucceed);

        let newEventReporterStatus = await claimsBook.isEventReporter(newEventReporter);
        assert.equal(newEventReporterStatus, true, "newEventReporter is not event reporter");
    });

    it('should not emit fungible transfer event cause msg.sender != eventReporter', async () => {
        let from = accounts[2];
        let to = accounts[3];
        let fungibleToken = await SimpleToken.new();
        let nftBase = await SimpleToken.new();
        let amount = new BigNumber('10').mul(precision);

        await claimsBook.emitFungibleTransfer(
            from,
            to,
            fungibleToken.address,
            nftBase.address,
            amount,
            {from: accounts[5]}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);  
    });

    it('should not emit fungible transfer event cause from == address(0)', async () => {
        let from = 0x0;
        let to = accounts[3];
        let fungibleToken = await SimpleToken.new();
        let nftBase = await SimpleToken.new();
        let amount = new BigNumber('10').mul(precision);

        await claimsBook.emitFungibleTransfer(
            from,
            to,
            fungibleToken.address,
            nftBase.address,
            amount,
            {from: eventReporter}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);  
    });

    it('should not emit fungible transfer event cause to == address(0)', async () => {
        let from = accounts[2];
        let to = 0x0;
        let fungibleToken = await SimpleToken.new();
        let nftBase = await SimpleToken.new();
        let amount = new BigNumber('10').mul(precision);

        await claimsBook.emitFungibleTransfer(
            from,
            to,
            fungibleToken.address,
            nftBase.address,
            amount,
            {from: eventReporter}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);  
    });

    it('should not emit fungible transfer event cause fungibleToken == address(0)', async () => {
        let from = accounts[2];
        let to = accounts[3];
        let fungibleToken = 0x0;
        let nftBase = await SimpleToken.new();
        let amount = new BigNumber('10').mul(precision);

        await claimsBook.emitFungibleTransfer(
            from,
            to,
            fungibleToken,
            nftBase.address,
            amount,
            {from: eventReporter}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);  
    });

    it('should not emit fungible transfer event cause nftBase == address(0)', async () => {
        let from = accounts[2];
        let to = accounts[3];
        let fungibleToken = await SimpleToken.new();
        let nftBase = 0x0;
        let amount = new BigNumber('10').mul(precision);

        await claimsBook.emitFungibleTransfer(
            from,
            to,
            fungibleToken.address,
            nftBase,
            amount,
            {from: eventReporter}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);  
    });

    it('should not emit fungible transfer event cause amount == 0', async () => {
        let from = accounts[2];
        let to = accounts[3];
        let fungibleToken = await SimpleToken.new();
        let nftBase = await SimpleToken.new();
        let amount = new BigNumber('0').mul(precision);

        await claimsBook.emitFungibleTransfer(
            from,
            to,
            fungibleToken.address,
            nftBase.address,
            amount,
            {from: eventReporter}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);  
    });

    it('should emit fungible transfer event', async () => {
        let from = accounts[2];
        let to = accounts[3];
        let fungibleToken = await SimpleToken.new();
        let nftBase = await SimpleToken.new();
        let amount = new BigNumber('10').mul(precision);

        await claimsBook.emitFungibleTransfer(
            from,
            to,
            fungibleToken.address,
            nftBase.address,
            amount,
            {from: eventReporter}
        )
            .then(Utils.receiptShouldSucceed);

        let emitFungibleTransferEvents = claimsBook.FungibleTransfer({}, {fromBlock: 0, toBlock: 'latest'});
        
        emitFungibleTransferEvents.get((error, logs) => {

            assert.equal(logs.length, 1, "were emitted more than 1 event");
            assert.equal(logs[0].event, 'FungibleTransfer', "event type is not equal");
            assert.equal(logs[0].args._from, accounts[2], "_from is not equal");
            assert.equal(logs[0].args._to, accounts[3], "_to is not equal");
            assert.equal(logs[0].args._fungibleToken, fungibleToken.address, "_fungibleToken is not equal");
            assert.equal(logs[0].args._nftBase, nftBase.address, "_nftBase is not equal");
            assert.equal(new BigNumber(logs[0].args._amount).valueOf(), amount.valueOf(), "amount is not equal");
            
            console.log('FungibleTransfer Event:');                    
            logs.forEach(log => console.log(log.args));
        });
    });

    it('should emit non fungible split event', async () => {
        let tokenOwner = accounts[2];
        let nftBase = await SimpleToken.new();
        let obligatureId = new BigNumber(1);
        let marketplaceId = new BigNumber(1);

        await claimsBook.emitNonFungibleSplit(
            tokenOwner,
            nftBase.address,
            obligatureId,
            marketplaceId,
            {from: eventReporter}
        )
            .then(Utils.receiptShouldSucceed);

        let emitNonFungibleSplitEvents = claimsBook.ObligatureSplit({}, {fromBlock: 0, toBlock: 'latest'})

        emitNonFungibleSplitEvents.get((error, logs) => {

            assert.equal(logs.length, 1, "were emitted more than 1 event");
            assert.equal(logs[0].event, 'ObligatureSplit', "event type is not equal");
            assert.equal(logs[0].args._tokenOwner, accounts[2], "_tokenOwner is not equal");
            assert.equal(logs[0].args._nftBase, nftBase.address, "_nftBase is not equal");
            assert.equal(new BigNumber(logs[0].args._obligatureId).valueOf(), obligatureId.valueOf(), "_obligatureId is not equal");
            assert.equal(new BigNumber(logs[0].args._marketplaceId).valueOf(), marketplaceId.valueOf(), "_marketplaceId is not equal");
            
            console.log('ObligatureSplit Event:');
            logs.forEach(log => console.log(log.args));
        });
    });

    it('should not emit non fungible split event cause msg.sender != event reporter', async () => {
        let tokenOwner = accounts[2];
        let nftBase = await SimpleToken.new();
        let obligatureId = new BigNumber(1);
        let marketplaceId = new BigNumber(1);

        await claimsBook.emitNonFungibleSplit(
            tokenOwner,
            nftBase.address,
            obligatureId,
            marketplaceId,
            {from: accounts[5]}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should not emit non fungible split event cause tokenOwner == address(0)', async () => {
        let tokenOwner = 0x0;
        let nftBase = await SimpleToken.new();
        let obligatureId = new BigNumber(1);
        let marketplaceId = new BigNumber(1);

        await claimsBook.emitNonFungibleSplit(
            tokenOwner,
            nftBase.address,
            obligatureId,
            marketplaceId,
            {from: eventReporter}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should not emit non fungible split event cause nftBase == address(0)', async () => {
        let tokenOwner = accounts[4];
        let nftBase = 0x0;
        let obligatureId = new BigNumber(1);
        let marketplaceId = new BigNumber(1);

        await claimsBook.emitNonFungibleSplit(
            tokenOwner,
            nftBase,
            obligatureId,
            marketplaceId,
            {from: eventReporter}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });
});