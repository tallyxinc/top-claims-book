pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol'; 

contract ClaimsBook is Ownable {

    struct Claim {
        uint256 claimType;
        bytes metadata;
        bool claimPeriodStatus;
    }

    mapping (address => bool) private changeAgent;

    mapping (uint256 => Claim) public claims;

    mapping (uint256 => bool) public existingClaims;

    event CreateClaim(
        uint256 claimId,
        address creator
    );

    event RetrieveClaim(
        uint256 claimId,
        address retriever
    );

    constructor(address _agent) public {
        changeAgent[_agent] = true;
    }

    modifier onlyChangeAgent() {
        require(changeAgent[msg.sender] == true);
        _;
    }

    function updateChangeAgent(
        address _agent,
        bool _status
    )   
        public 
        onlyOwner
    {
        require(
            _agent != address(0) &&
            changeAgent[_agent] != _status
        );
        changeAgent[_agent] = _status;
    }

    function getClaimPeriodStatus(uint256 _claimId)
        public
        view
        returns (bool)
    {
        require(_claimId > 0);
        return claims[_claimId].claimPeriodStatus;
    }

    function isChangeAgent(address _user)  
        public 
        view 
        returns (bool) 
    {
        return changeAgent[_user];
    }

    function isClaimExists(uint256 _claimId)
        public
        view
        returns (bool)
    {
        require(_claimId > 0);
        return existingClaims[_claimId];
    }

    function createClaim(
        uint256 _claimId,
        uint256 _claimType,
        bytes _metadata
    )
        public
        onlyChangeAgent
    {
        require(
            _claimId > 0 &&
            _claimType > 0 &&
            existingClaims[_claimId] == false
        );

        claims[_claimId] = Claim({
            claimType: _claimType,
            metadata: _metadata,
            claimPeriodStatus: true
        });

        existingClaims[_claimId] = true;

        emit CreateClaim(
            _claimId,
            msg.sender
        );
    }

    function retrieveClaim(
        uint256 _claimId,
        bytes _metadata
    )
        public
        onlyChangeAgent
    {
        require(
            _claimId > 0 &&
            isClaimExists(_claimId) == true
        );

        claims[_claimId].metadata = _metadata;
        claims[_claimId].claimPeriodStatus = false;

        emit RetrieveClaim(
            _claimId,
            msg.sender
        );
    }
}