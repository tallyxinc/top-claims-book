pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol'; 

contract ClaimsBook is Ownable {

    mapping (address => bool) private eventReporter;

    event FungibleTransfer(
        address _from, 
        address _to, 
        address _fungibleToken, 
        address _nftBase, 
        uint256 _amount
    );

    event ObligatureSplit(
        address _tokenOwner, 
        address _nftBase, 
        uint256 _obligatureId, 
        uint256 _marketplaceId
    );

    constructor(address _eventReporter) public {
        eventReporter[_eventReporter] = true;
    }

    modifier onlyEventReporter() {
        require(eventReporter[msg.sender] == true);
        _;
    }

    function updateEventReporter(
        address _eventReporter,
        bool _status
    )   
        public 
        onlyOwner
    {
        require(_eventReporter != address(0));
        eventReporter[_eventReporter] = _status;
    }

    function isEventReporter(address _user)  
        public 
        view 
        returns (bool) 
    {
        return eventReporter[_user];
    }

    function emitFungibleTransfer(
        address _from,
        address _to,
        address _fungibleToken,
        address _nftBase,
        uint256 _amount
    ) 
        public 
        onlyEventReporter
    {
        require(
           _from != address(0) &&
           _to != address(0) &&
           _fungibleToken != address(0) &&
           _nftBase != address(0) &&
           _amount > 0
        );
        emit FungibleTransfer(
            _from,
            _to,
            _fungibleToken,
            _nftBase,
            _amount
        );
    }

    function emitNonFungibleSplit(
        address _tokenOwner,
        address _nftBase,
        uint256 _obligatureId,
        uint256 _marketplaceId
    ) 
        public 
        onlyEventReporter
    {
        require(
            _tokenOwner != address(0) &&
            _nftBase != address(0)
        );
        emit ObligatureSplit(
            _tokenOwner,
            _nftBase,
            _obligatureId,
            _marketplaceId
        );
    }
}