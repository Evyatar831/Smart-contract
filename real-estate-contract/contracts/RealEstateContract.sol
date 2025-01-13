// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RealEstateContract {
    struct Property {
        string id;
        string title;
        string description;
        uint256 price;
        string location;
        address owner;
        string[] documents;
        bool isActive;
        uint256 createdAt;
    }

    struct Contract {
        string propertyId;
        address buyer;
        address seller;
        uint256 value;
        uint256 createdAt;
        bool isCompleted;
    }

    mapping(string => Property) public properties;
    mapping(string => Contract) public contracts;
    string[] public propertyIds;

    event PropertyListed(
        string id,
        string title,
        string location,
        uint256 price,
        address owner,
        uint256 timestamp
    );
    
    event PropertyUpdated(
        string id,
        uint256 newPrice,
        bool isActive,
        uint256 timestamp
    );

    event PropertySold(
        string propertyId,
        string contractId,
        address buyer,
        address seller,
        uint256 value,
        uint256 timestamp
    );

    modifier propertyExists(string memory _propertyId) {
        require(properties[_propertyId].owner != address(0), "Property does not exist");
        _;
    }

    modifier onlyPropertyOwner(string memory _propertyId) {
        require(properties[_propertyId].owner == msg.sender, "Not the property owner");
        _;
    }

    function createProperty(
        string memory _id,
        string memory _title,
        string memory _description,
        uint256 _price,
        string memory _location,
        string[] memory _documents
    ) public {
        require(properties[_id].owner == address(0), "Property already exists");
        require(bytes(_id).length > 0, "Invalid property ID");
        require(_price > 0, "Price must be greater than 0");

        properties[_id] = Property({
            id: _id,
            title: _title,
            description: _description,
            price: _price,
            location: _location,
            owner: msg.sender,
            documents: _documents,
            isActive: true,
            createdAt: block.timestamp
        });

        propertyIds.push(_id);

        emit PropertyListed(
            _id,
            _title,
            _location,
            _price,
            msg.sender,
            block.timestamp
        );
    }

    function updateProperty(
        string memory _propertyId,
        uint256 _newPrice,
        bool _isActive
    ) public onlyPropertyOwner(_propertyId) propertyExists(_propertyId) {
        Property storage property = properties[_propertyId];
        property.price = _newPrice;
        property.isActive = _isActive;

        emit PropertyUpdated(
            _propertyId,
            _newPrice,
            _isActive,
            block.timestamp
        );
    }

    function createContract(
        string memory _contractId,
        string memory _propertyId
    ) public payable propertyExists(_propertyId) {
        Property storage property = properties[_propertyId];
        require(property.isActive, "Property is not active");
        require(property.owner != msg.sender, "Owner cannot buy their own property");
        require(msg.value == property.price, "Incorrect value sent");
        require(contracts[_contractId].buyer == address(0), "Contract ID already exists");

        contracts[_contractId] = Contract({
            propertyId: _propertyId,
            buyer: msg.sender,
            seller: property.owner,
            value: msg.value,
            createdAt: block.timestamp,
            isCompleted: false
        });

        // Transfer ownership
        property.owner = msg.sender;
        property.isActive = false;

        // Transfer payment to seller
        payable(contracts[_contractId].seller).transfer(msg.value);

        emit PropertySold(
            _propertyId,
            _contractId,
            msg.sender,
            contracts[_contractId].seller,
            msg.value,
            block.timestamp
        );
    }

    function getAllProperties() public view returns (Property[] memory) {
        Property[] memory allProperties = new Property[](propertyIds.length);
        
        for (uint i = 0; i < propertyIds.length; i++) {
            allProperties[i] = properties[propertyIds[i]];
        }
        
        return allProperties;
    }

    function getActiveProperties() public view returns (Property[] memory) {
        uint256 activeCount = 0;
        
        for (uint i = 0; i < propertyIds.length; i++) {
            if (properties[propertyIds[i]].isActive) {
                activeCount++;
            }
        }
        
        Property[] memory activeProperties = new Property[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint i = 0; i < propertyIds.length; i++) {
            if (properties[propertyIds[i]].isActive) {
                activeProperties[currentIndex] = properties[propertyIds[i]];
                currentIndex++;
            }
        }
        
        return activeProperties;
    }
}