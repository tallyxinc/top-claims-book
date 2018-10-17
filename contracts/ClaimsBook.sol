pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol"; 
import "./Permissions.sol";


contract ClaimsBook is Ownable, Permissions {

    // Struct that introduce Claim entity of Tallyx system
    struct ClaimRecord {
        string claimId;
        string parentClaimId;
        string claimType;
        string claimStatus;
        string claimantId;
        string claimVerifierId;
        ClaimRecordProof proofData;
        bool created;
    }

    // Struct that introduce Claim entity proof data of Tallyx system
    struct ClaimRecordProof {
        string proofVaultProviderId;
        string proofId;
        string proofDataKeys;   
        bool created;
    }

    // Mapping from hashed claim id to Claim data
    mapping (bytes32 => ClaimRecord) public claims;

    /**
     * @dev Emits when claim is created
     */
    event ClaimCreated(
        string _claimId,
        address _creator
    );

    /**
     * @dev Emits when claim proof data is created
     */
    event ClaimProofDataCreated(
        string _claimId,
        address _creator
    );

    /**
     * @dev Emits when claim status is updated
     */
    event ClaimStatusUpdated(
        string _claimId,
        address _modifier,
        string _claimStatus
    );

    /**
     * @dev Emits when claim verifier is updated
     */
    event ClaimVerifierUpdated(
        string _claimId,
        address _modifier,
        string _claimVerifierId
    );

    /**
     * @dev Constructor for ClaimsBook contract for Tallyx system
     * @notice msg.sender means address from which contract was deployed
     */
    constructor() 
        public
        Permissions() 
    {
        permissions[msg.sender] = PERMISSION_SET_PERMISSION | 
            PERMISSION_TO_CREATE | PERMISSION_TO_MODIFY_STATUS | 
            PERMISSION_TO_MODIFY_VERIFIER;
    }

    /**
     * @dev Returns main claim data by id
     * @param _claimId - Unique identifier of claim
     */
    function claimBookRecordById(string _claimId)
        public
        view
        returns(
            string,
            string,
            string,
            string,
            string
        )
    {
        bytes32 hashedClaimId = keccak256(bytes(_claimId));
        require(claims[hashedClaimId].created == true);
        return (
            claims[hashedClaimId].parentClaimId,
            claims[hashedClaimId].claimType,
            claims[hashedClaimId].claimStatus,
            claims[hashedClaimId].claimantId,
            claims[hashedClaimId].claimVerifierId
        );
    }

    /** 
     * @dev Returns claim proof data by id
     * @param _claimId - Unique identifier of claim
     */
    function claimBookRecordProofById(string _claimId)
        public
        view
        returns (
            string,
            string,
            string
        )
    {
        bytes32 hashedClaimId = keccak256(bytes(_claimId));
        require(
            claims[hashedClaimId].created == true &&
            claims[hashedClaimId].proofData.created == true
        );
        return (
            claims[hashedClaimId].proofData.proofVaultProviderId,
            claims[hashedClaimId].proofData.proofId,
            claims[hashedClaimId].proofData.proofDataKeys
        );
    }

    /** 
     * @dev Adds new claim to registry, also pushing claim metadata 
     * to it (parentClaimId, claimType, claimantId, claimVerifierId, claimStatus)
     * @param _claimId - Unique identifier of claim
     */
    function createClaimBookRecord(
        string _claimId,
        string _parentClaimId, 
        string _claimType,
        string _claimStatus,
        string _claimantId,
        string _claimVerifierId
    )
        public
        hasPermission(msg.sender, PERMISSION_TO_CREATE)
        returns (bool)
    {
        bytes32 hashedClaimId = keccak256(bytes(_claimId));
        require(
            claims[hashedClaimId].created == false &&
            claims[hashedClaimId].proofData.created == false
        );

        claims[hashedClaimId].claimId = _claimId;
        claims[hashedClaimId].parentClaimId = _parentClaimId;
        claims[hashedClaimId].claimType = _claimType;
        claims[hashedClaimId].claimStatus = _claimStatus;
        claims[hashedClaimId].claimantId = _claimantId;
        claims[hashedClaimId].claimVerifierId = _claimVerifierId;
        claims[hashedClaimId].created = true;

        emit ClaimCreated(
            _claimId,
            msg.sender
        );

        return true;
    }

    /**
     * @dev Adds claim proof data (_proofVaultProviderId, _proofId, _proofDataKeys) 
     * to existing claim (_claimId)
     * @param _claimId - Unique identifier of claim
     */
    function createClaimBookRecordProofData(
        string _claimId,
        string _proofVaultProviderId,
        string _proofId,
        string _proofDataKeys
    )
        public
        hasPermission(msg.sender, PERMISSION_TO_CREATE)
        returns (bool)
    {
        bytes32 hashedClaimId = keccak256(bytes(_claimId));
        require(
            claims[hashedClaimId].created == true &&
            claims[hashedClaimId].proofData.created == false
        );

        claims[hashedClaimId].proofData.proofVaultProviderId = 
            _proofVaultProviderId;
        claims[hashedClaimId].proofData.proofId = _proofId;
        claims[hashedClaimId].proofData.proofDataKeys = _proofDataKeys;
        claims[hashedClaimId].proofData.created = true;

        emit ClaimProofDataCreated(
            _claimId,
            msg.sender
        );

        return true;
    }

    /**
     * @dev Updates claim status in registry by id
     * @param _claimId - Unique identifier of claim
     */
    function updateClaimStatus(
        string _claimId,
        string _claimStatus
    )
        public
        hasPermission(msg.sender, PERMISSION_TO_MODIFY_STATUS)
        returns (bool)
    {
        bytes32 hashedClaimId = keccak256(bytes(_claimId));
        require(
            claims[hashedClaimId].created == true &&
            claims[hashedClaimId].proofData.created == true
        );
        claims[hashedClaimId].claimStatus = _claimStatus;

        emit ClaimStatusUpdated(
            _claimId,
            msg.sender,
            _claimStatus
        );

        return true;
    }

    /**
     * @dev Updates claim verifier in registry by id
     * @param _claimId - Unique identifier of claim
     */
    function updateClaimVerifier(
        string _claimId,
        string _claimVerifierId
    )
        public
        hasPermission(msg.sender, PERMISSION_TO_MODIFY_VERIFIER)
        returns (bool)
    {
        bytes32 hashedClaimId = keccak256(bytes(_claimId));
        require(
            claims[hashedClaimId].created == true &&
            claims[hashedClaimId].proofData.created == true
        );
        
        claims[hashedClaimId].claimVerifierId = _claimVerifierId;

        emit ClaimVerifierUpdated(
            _claimId,
            msg.sender,
            _claimVerifierId
        );

        return true;
    }
}