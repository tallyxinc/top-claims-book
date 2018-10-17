# Claims Book
## Overview

Claims book is needed to control obligatory status inside Tallyx system, basically, there is a registry and all TOKI (obligatory) creation/changing is taken to stock inside this smart contract.

## Internal process

The entry point to basic functionality is 'createClaimBookRecord' function, which adds the new claim to a registry. Claim Id is a primary key to claim, it’s defined like string variable and ever claim has claim type, parent claim id, claimant id, claim verifier id, and claim status. Once the maturity date expires the back-end will trigger 'updateClaimStatus' function inside this smart contract and claim status will be changed.

## Functions

1.  **setPermission( address _address, uint256 _permission)**
Allow/Disallow(depends on _permission value) function call permissions for selected address _address - receiver of permissions
**Return value:** void

2. **claimBookRecordById(string _claimId)**
Returns main claim data by id.
 _claimId - unique identifier of claim
**Return value:** (string, string, string, string, string)
**Sample return value:** ("sftg1235", "FinanceLien","Active", "uyj678", "hgf563")

3.  **claimBookRecordProofById( string _claimId)**
Returns claim proof data by id.
_claimId - unique identifier of claim
**Return value:**  (string, string, string)
**Sample return value**: ("hger456", "ldfe776", "FinanceRef-tr34r,SupplierID-fhg234,BuyerID-hg677,Amount-kkhgh234,Ccy-h74")

4.  **createClaimBookRecord( string _claimId, string _parentClaimId, string _claimType, string _claimStatus, uint256 _claimantId, uint256 _claimVerifierId)**
Adds new claim to registry, also pushing claim metadata to it (parentClaimId, claimType, claimantId, claimVerifierId, claimStatus). 
_claimId - unique identifier of claim
**Return value:** bool
**Sample return value:** false

5. **createClaimBookRecordProofData( string _claimId, string _proofVaultProviderId, string _proofId, string _proofDataKeys)**
Adds claim proof data (_proofVaultProviderId, _proofId, _proofDataKeys) to existing claim (_claimId) _claimId - unique identifier of claim
**Return value:** bool
**Sample return value:** false

6. **updateClaimStatus( uint256 _claimId, string _claimStatus)**
Updates claim status in registry by id.
_claimId - unique identifier of claim
**Return value:** bool
**Sample return value:** false

7. **updateClaimVerifier(uint256 _claimId, string _claimVerifierId)**
Updates claim verifier in registry by id.
_claimId - unique identifier of claim
**Return value:** bool
**Sample return value:** true
