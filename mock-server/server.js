import express from 'express';
import cors from 'cors';
const app = express();
const port = 8088;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// In-memory storage for mock identities
let identities = {};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'mock-identity-system' });
});

// Register a new mock identity
app.post('/identity/register', (req, res) => {
  const { id, fullName, dateOfBirth, address, phoneNumber, email, photo, status } = req.body;
  
  if (!id || !fullName) {
    return res.status(400).json({ error: 'ID and fullName are required' });
  }
  
  const identity = {
    id,
    fullName,
    dateOfBirth: dateOfBirth || '1990-01-01',
    address: address || 'Default Address',
    phoneNumber: phoneNumber || '+257 79 000 000',
    email: email || `${id}@example.com`,
    photo: photo || '',
    status: status || 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  
  identities[id] = identity;
  
  res.status(201).json({
    message: 'Identity registered successfully',
    id: id
  });
});

// Get identity by ID
app.get('/identity/:id', (req, res) => {
  const { id } = req.params;
  const identity = identities[id];
  
  if (!identity) {
    return res.status(404).json({ error: 'Identity not found' });
  }
  
  res.status(200).json(identity);
});

// List all identities
app.get('/identity/list', (req, res) => {
  res.status(200).json({
    identities: Object.values(identities),
    total: Object.keys(identities).length
  });
});

// Delete identity
app.delete('/identity/:id', (req, res) => {
  const { id } = req.params;
  
  if (!identities[id]) {
    return res.status(404).json({ error: 'Identity not found' });
  }
  
  delete identities[id];
  res.status(200).json({ message: 'Identity deleted successfully' });
});

// Pre-populate with some test data
const testIdentities = [
  {
    id: '1234567890123456',
    fullName: 'Jean Baptiste Ndayisenga',
    dateOfBirth: '1990-05-15',
    address: 'Bujumbura, Rohero, Zone 1, Avenue de la Paix 123',
    phoneNumber: '+257 79 123 456',
    email: 'jean.ndayisenga@example.com',
    photo: '',
    status: 'ACTIVE'
  },
  {
    id: '9876543210987654',
    fullName: 'Marie Claire Uwimana',
    dateOfBirth: '1985-12-03',
    address: 'Gitega, Centre-ville, Quartier 1, Rue de la République 45',
    phoneNumber: '+257 68 987 654',
    email: 'marie.uwimana@example.com',
    photo: '',
    status: 'ACTIVE'
  }
];

// Register test identities on startup
testIdentities.forEach(identity => {
  identities[identity.id] = {
    ...identity,
    createdAt: new Date().toISOString()
  };
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Mock Identity System running at http://0.0.0.0:${port}`);
  console.log('Pre-loaded test identities:');
  testIdentities.forEach(identity => {
    console.log(`- ${identity.id}: ${identity.fullName}`);
  });
});
