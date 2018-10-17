const ClaimsBook = artifacts.require('ClaimsBook');
const SimpleToken = artifacts.require('test/SimpleToken');
const { decodeLogs } = require('./decodeLogs');
const abi = require('ethereumjs-abi');
const BigNumber = require('bignumber.js');
const Utils = require('./utils');


let precision = new BigNumber("1000000000000000000");
let ALLOWED_CREATOR = 1;
let ALLOWED_STATUS_MODIFIER = 3;
let ALLOWED_VERIFIER_MODIFIER = 4;


async function stringToBytes(str) {
    var result = [];
    for (var i = 0; i < str.length; i++) {
        result.push(str.charCodeAt(i));
    }
    return result;
}

async function bytesToString(array) {
    return String.fromCharCode.apply(String, array);
}

contract('ClaimsBook', accounts => {

    let claimsBook;
    let owner = accounts[0];
    let allowedAddress = accounts[1];

    beforeEach(async () => {
        claimsBook = await ClaimsBook.new({from: owner});
    });

    it('should check that owner has permission to create claim record, modify period status and modify verifier', async() => {
        let permissionSet = await claimsBook.permissions.call(owner);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('27').valueOf(), "permissions are not equal");
    });

    it('should check that random address has not permission to create claim record, modify period status and modify verifier', async () => {
        let permissionSet = await claimsBook.permissions.call(allowedAddress);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('0').valueOf(), "permissions are not equal");
    });

    it('should update permission for claim record creating', async () => {
        await claimsBook.setPermission(allowedAddress, 2, {from: owner})
            .then(Utils.receiptShouldSucceed);

        let permissionSet = await claimsBook.permissions.call(allowedAddress);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('2').valueOf(), "permissions are not equal");
    });

    it('should not update permission for claim record creating cause _address == address(0)', async () => {
        await claimsBook.setPermission(0x0, 2, {from: owner})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        let permissionSet = await claimsBook.permissions.call(allowedAddress);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('0').valueOf(), "permissions are not equal");
    });

    it('should not update permission for claim record creating cause msg.sender != owner', async () => {
        await claimsBook.setPermission(allowedAddress, 2, {from: accounts[2]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        let permissionSet = await claimsBook.permissions.call(allowedAddress);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('0').valueOf(), "permissions are not equal");
    });

    it('should update permission for claim period status modifying', async () => {
        await claimsBook.setPermission(allowedAddress, 8, {from: owner})
            .then(Utils.receiptShouldSucceed);

        let permissionSet = await claimsBook.permissions.call(allowedAddress);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('8').valueOf(), "permissions are not equal");
    });

    it('should not update permission for claim period status modifying cause _address == address(0)', async () => {
         await claimsBook.setPermission(0x0, 8, {from: owner})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        let permissionSet = await claimsBook.permissions.call(allowedAddress);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('0').valueOf(), "permissions are not equal");
    });

    it('should not update permission for claim period status modifying cause msg.sender != owner', async () => {
        await claimsBook.setPermission(allowedAddress, 8, {from: accounts[2]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        let permissionSet = await claimsBook.permissions.call(allowedAddress);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('0').valueOf(), "permissions are not equal");
    });

    it('should update permission for claim verifier modifying', async () => {
        await claimsBook.setPermission(allowedAddress, 16, {from: owner})
            .then(Utils.receiptShouldSucceed);

        let permissionSet = await claimsBook.permissions.call(allowedAddress);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('16').valueOf(), "permissions are not equal");
    });

    it('should not update allowed claim verifier modifier cause _address == address(0)', async () => {
        await claimsBook.setPermission(0x0, 16, {from: owner})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        let permissionSet = await claimsBook.permissions.call(allowedAddress);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('0').valueOf(), "permissions are not equal");
    });

    it('should not update allowed claim verifier modifier cause msg.sender != owner', async () => {
        await claimsBook.setPermission(allowedAddress, 16, {from: accounts[2]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        let permissionSet = await claimsBook.permissions.call(allowedAddress);
        assert.equal(new BigNumber(permissionSet).valueOf(), new BigNumber('0').valueOf(), "permissions are not equal");
    });

    it('should create claim book record', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let events = await claimsBook.ClaimCreated({}, {fromBlock: '0', toBlock: 'latest'});

        events.get((err, logs) => {
            assert.equal(logs.length, 1, "were emitted less or more than 1 event");
            assert.equal(logs[0].event, "ClaimCreated", "event type is not equal");
            assert.equal(logs[0].args._claimId, claimId, "claimId is not equal");
            assert.equal(logs[0].args._creator, owner, "creator is not equal");

            logs.forEach(log => console.log(log.args));
        });
    });

    it('should not create claim book record cause msg.sender != allowed record creator', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: accounts[2]}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should not create claim book record cause claim with such claimId already exists', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should create claim book record proof data', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let proofVaultProviderId = 'hger456';
        let proofId = 'ldfe776';
        let proofDataKeys = 'FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74';

        await claimsBook.createClaimBookRecordProofData(
            claimId,
            proofVaultProviderId,
            proofId,
            proofDataKeys,
            {from: owner}
        )   
            .then(Utils.receiptShouldSucceed);

        let events = await claimsBook.ClaimProofDataCreated({}, {fromBlock: '0', toBlock: 'latest'});

        events.get((err, logs) => {
            assert.equal(logs.length, 1, "were emitted less or more than 1 event");
            assert.equal(logs[0].event, "ClaimProofDataCreated", "event type is not equal");
            assert.equal(logs[0].args._claimId, claimId, "claimId is not equal");
            assert.equal(logs[0].args._creator, owner, "creator is not equal");

            logs.forEach(log => console.log(log.args));
        });
    });

    it('should not create claim book record proof data cause msg.sender != allowed record creator', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let proofVaultProviderId = 'hger456';
        let proofId = 'ldfe776';
        let proofDataKeys = 'FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74';

        await claimsBook.createClaimBookRecordProofData(
            claimId,
            proofVaultProviderId,
            proofId,
            proofDataKeys,
            {from: accounts[2]}
        )   
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should not create claim book record proof data cause such claim do not exist', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        claimId = 'gasg665';
        let proofVaultProviderId = 'hger456';
        let proofId = 'ldfe776';
        let proofDataKeys = 'FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74';

        await claimsBook.createClaimBookRecordProofData(
            claimId,
            proofVaultProviderId,
            proofId,
            proofDataKeys,
            {from: owner}
        )   
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should update claim status', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let proofVaultProviderId = 'hger456';
        let proofId = 'ldfe776';
        let proofDataKeys = 'FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74';

        await claimsBook.createClaimBookRecordProofData(
            claimId,
            proofVaultProviderId,
            proofId,
            proofDataKeys,
            {from: owner}
        )   
            .then(Utils.receiptShouldSucceed);

        let newStatus = 'Inactive';

        await claimsBook.updateClaimStatus(claimId, newStatus, {from: owner})
            .then(Utils.receiptShouldSucceed);

        let events = await claimsBook.ClaimStatusUpdated({}, {fromBlock: '0', toBlock: 'latest'});

        events.get((err, logs) => {
            assert.equal(logs.length, 1, "were emitted less or more than 1 event");
            assert.equal(logs[0].event, "ClaimStatusUpdated", "event type is not equal");
            assert.equal(logs[0].args._claimId, claimId, "claimId is not equal");
            assert.equal(logs[0].args._modifier, owner, "creator is not equal");
            assert.equal(logs[0].args._claimStatus, newStatus, "claim status is not equal");

            logs.forEach(log => console.log(log.args));
        });
    });

    it('should not update claim status cause msg.sender != allowed status modifier', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let proofVaultProviderId = 'hger456';
        let proofId = 'ldfe776';
        let proofDataKeys = 'FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74';

        await claimsBook.createClaimBookRecordProofData(
            claimId,
            proofVaultProviderId,
            proofId,
            proofDataKeys,
            {from: owner}
        )   
            .then(Utils.receiptShouldSucceed);

        let newStatus = 'Inactive';

        await claimsBook.updateClaimStatus(claimId, newStatus, {from: accounts[2]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should not update claim status cause such claim do not exist', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let proofVaultProviderId = 'hger456';
        let proofId = 'ldfe776';
        let proofDataKeys = 'FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74';

        await claimsBook.createClaimBookRecordProofData(
            claimId,
            proofVaultProviderId,
            proofId,
            proofDataKeys,
            {from: owner}
        )   
            .then(Utils.receiptShouldSucceed);

        claimId = 'gasg665';
        let newStatus = 'Inactive';

        await claimsBook.updateClaimStatus(claimId, newStatus, {from: owner})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should update claim verifier', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let proofVaultProviderId = 'hger456';
        let proofId = 'ldfe776';
        let proofDataKeys = 'FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74';

        await claimsBook.createClaimBookRecordProofData(
            claimId,
            proofVaultProviderId,
            proofId,
            proofDataKeys,
            {from: owner}
        )   
            .then(Utils.receiptShouldSucceed);

        let newVerifier = 'hgf563';

        await claimsBook.updateClaimVerifier(claimId, newVerifier, {from: owner})
            .then(Utils.receiptShouldSucceed);

        let events = await claimsBook.ClaimVerifierUpdated({}, {fromBlock: '0', toBlock: 'latest'});

        events.get((err, logs) => {
            assert.equal(logs.length, 1, "were emitted less or more than 1 event");
            assert.equal(logs[0].event, "ClaimVerifierUpdated", "event type is not equal");
            assert.equal(logs[0].args._claimId, claimId, "claimId is not equal");
            assert.equal(logs[0].args._modifier, owner, "creator is not equal");
            assert.equal(logs[0].args._claimVerifierId, newVerifier, "claim status is not equal");

            logs.forEach(log => console.log(log.args));
        });
    });

    it('should update claim verifier cause msg.sender != allowed verifier modifier', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let proofVaultProviderId = 'hger456';
        let proofId = 'ldfe776';
        let proofDataKeys = 'FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74';

        await claimsBook.createClaimBookRecordProofData(
            claimId,
            proofVaultProviderId,
            proofId,
            proofDataKeys,
            {from: owner}
        )   
            .then(Utils.receiptShouldSucceed);

        let newVerifier = 'hgf563';

        await claimsBook.updateClaimVerifier(claimId, newVerifier, {from: accounts[2]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should update claim verifier cause such claim do not exist', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let proofVaultProviderId = 'hger456';
        let proofId = 'ldfe776';
        let proofDataKeys = 'FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74';

        await claimsBook.createClaimBookRecordProofData(
            claimId,
            proofVaultProviderId,
            proofId,
            proofDataKeys,
            {from: owner}
        )   
            .then(Utils.receiptShouldSucceed);

        claimId = 'gasg665';
        let newVerifier = 'hgf563';

        await claimsBook.updateClaimVerifier(claimId, newVerifier, {from: owner})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should return claim data by claim id', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let claimData = await claimsBook.claimBookRecordById(claimId);
        assert.equal(claimData[0], parentClaimId, "parentClaimId is not equal");
        assert.equal(claimData[1], claimType, "claimType is not equal");
        assert.equal(claimData[2], claimStatus, "claimStatus is not equal");
        assert.equal(claimData[3], claimantId, "claimantId is not equal");
        assert.equal(claimData[4], claimVerifierId, "claimVerifierId is not equal");
    });

    it('should not return claim data by claim id cause such claim do not exist', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        
        await claimsBook.claimBookRecordById(claimId)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should return claim proof data by claim id', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);

        let proofVaultProviderId = 'hger456';
        let proofId = 'ldfe776';
        let proofDataKeys = 'FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74';

        await claimsBook.createClaimBookRecordProofData(
            claimId,
            proofVaultProviderId,
            proofId,
            proofDataKeys,
            {from: owner}
        )   
            .then(Utils.receiptShouldSucceed);

        let claimProofData = await claimsBook.claimBookRecordProofById(claimId);
        assert.equal(claimProofData[0], proofVaultProviderId, "parentClaimId is not equal");
        assert.equal(claimProofData[1], proofId, "claimType is not equal");
        assert.equal(claimProofData[2], proofDataKeys, "claimStatus is not equal");
    });

    it('should not return claim proof data by claim id cause such claim do not exist', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        
        await claimsBook.claimBookRecordProofById(claimId)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });

    it('should not return claim proof data by claim id cause such claim proof for this claim was not created', async () => {
        let claimId = '0b9f6aa3-c4c7-4f64-bf2d-092c0496e955';
        let parentClaimId = '0asdaaa3-c4c7-4f64-bf2d-092c0496e123';
        let claimType = 'FinanceLien';
        let claimStatus = 'Active';
        let claimantId = 'dfsafwad13-c4c7-4f64-bf2d-1231231231';
        let claimVerifierId = 'dfsafwad13-c4c7-4f64-bf2d-6843634634';

        await claimsBook.createClaimBookRecord(
            claimId,
            parentClaimId,
            claimType,
            claimStatus,
            claimantId,
            claimVerifierId,
            {from: owner}
        )
            .then(Utils.receiptShouldSucceed);
        
        await claimsBook.claimBookRecordProofById(claimId)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
    });
});