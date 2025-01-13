import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Wallet, Plus, RefreshCw } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // This is the default local deployment address
const CONTRACT_ABI = [
  "function createProperty(string memory _id, string memory _title, string memory _description, uint256 _price, string memory _location, string[] memory _documents) public",
  "function getAllProperties() public view returns (tuple(string id, string title, string description, uint256 price, string location, address owner, string[] documents, bool isActive, uint256 createdAt)[] memory)",
  "function createContract(string memory _contractId, string memory _propertyId) public payable",
  "event PropertyListed(string id, string title, string location, uint256 price, address owner, uint256 timestamp)",
  "event PropertySold(string propertyId, string contractId, address buyer, address seller, uint256 value, uint256 timestamp)"
];

const RealEstateApp = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [properties, setProperties] = useState([]);
  const [newProperty, setNewProperty] = useState({
    id: '',
    title: '',
    description: '',
    location: '',
    price: '',
    documents: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      initializeContract();
    }
  }, [account]);

  const initializeContract = async () => {
    try {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        const realEstateContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        setContract(realEstateContract);
        await loadProperties();
      }
    } catch (err) {
      setError('Failed to initialize contract');
      console.error(err);
    }
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setAccount(accounts[0]);
      } else {
        setError('Please install MetaMask to use this application');
      }
    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    }
  };

  const loadProperties = async () => {
    try {
      const allProperties = await contract.methods.getAllProperties().call();
      setProperties(allProperties);
    } catch (err) {
      setError('Failed to load properties');
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProperty(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const web3 = new Web3(window.ethereum);
      const priceInWei = web3.utils.toWei(newProperty.price, 'ether');
      
      await contract.methods.createProperty(
        newProperty.id,
        newProperty.title,
        newProperty.description,
        priceInWei,
        newProperty.location,
        []  // Empty documents array for now
      ).send({ from: account });
      
      await loadProperties();
      
      setNewProperty({
        id: '',
        title: '',
        description: '',
        location: '',
        price: '',
        documents: []
      });
    } catch (err) {
      setError('Failed to list property');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (propertyId) => {
    setLoading(true);
    setError('');

    try {
      const property = properties.find(p => p.id === propertyId);
      const contractId = `${propertyId}-${Date.now()}`;
      
      await contract.methods.createContract(
        contractId,
        propertyId
      ).send({ 
        from: account,
        value: property.price 
      });
      
      await loadProperties();
    } catch (err) {
      setError('Failed to purchase property');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInWei) => {
    if (!window.ethereum) return '0';
    const web3 = new Web3(window.ethereum);
    return web3.utils.fromWei(priceInWei, 'ether');
  };

  const PropertyCard = ({ property }) => (
    <Card className="p-4">
      <div className="space-y-2">
        <h3 className="font-semibold">{property.title}</h3>
        <div className="text-sm text-gray-600">
          <p>{property.description}</p>
          <p>Location: {property.location}</p>
          <p>Price: {formatPrice(property.price)} ETH</p>
          <p className="truncate">Owner: {property.owner}</p>
          <p>Status: {property.isActive ? 'Active' : 'Sold'}</p>
        </div>
        {property.isActive && property.owner.toLowerCase() !== account.toLowerCase() && (
          <Button 
            onClick={() => handlePurchase(property.id)}
            disabled={loading}
            className="w-full mt-2"
          >
            Purchase Property
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Real Estate DApp</h1>
            <div className="flex gap-2">
              <Button onClick={loadProperties} disabled={!contract} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={connectWallet} className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5" />
              List New Property
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  name="id"
                  placeholder="Property ID"
                  value={newProperty.id}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Input
                  name="title"
                  placeholder="Property Title"
                  value={newProperty.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Textarea
                  name="description"
                  placeholder="Property Description"
                  value={newProperty.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Input
                  name="location"
                  placeholder="Location"
                  value={newProperty.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Price (ETH)"
                  value={newProperty.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading || !contract} 
                className="w-full"
              >
                {loading ? 'Processing...' : 'List Property'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              Listed Properties
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {properties.length === 0 ? (
                <p className="text-center text-gray-500">No properties listed yet</p>
              ) : (
                properties.map((property, index) => (
                  <PropertyCard key={index} property={property} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealEstateApp;