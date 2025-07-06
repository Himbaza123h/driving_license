// Temporary in-memory data store for testing without Supabase
// This will be replaced with real Supabase calls once configured

export const dummyCitizens = [
  {
    id: 1,
    national_id: '1234567890123456',
    full_name: 'Jean Baptiste Ndayisenga',
    date_of_birth: '1990-05-15',
    address: 'Avenue de la Révolution, Bujumbura, Burundi',
    phone_number: '+257 79 123 456',
    email: 'jean.baptiste@email.bi',
    photo_url: null,
    status: 'ACTIVE'
  },
  {
    id: 2,
    national_id: '2345678901234567',
    full_name: 'Marie Claire Uwimana',
    date_of_birth: '1985-12-03',
    address: 'Quartier Rohero, Bujumbura, Burundi',
    phone_number: '+257 78 234 567',
    email: 'marie.claire@email.bi',
    photo_url: null,
    status: 'ACTIVE'
  },
  {
    id: 3,
    national_id: '3456789012345678',
    full_name: 'Pierre Nkurunziza',
    date_of_birth: '1988-08-20',
    address: 'Avenue de l\'Indépendance, Bujumbura, Burundi',
    phone_number: '+257 76 345 678',
    email: 'pierre.nkurunziza@email.bi',
    photo_url: null,
    status: 'ACTIVE'
  }
];

export const dummyApplications = [];
export const dummySessions = [];

// In-memory storage helpers
export const findCitizenByNationalId = (nationalId) => {
  return dummyCitizens.find(citizen => citizen.national_id === nationalId && citizen.status === 'ACTIVE');
};

export const findSessionByTransactionId = (transactionId) => {
  return dummySessions.find(session => session.transaction_id === transactionId);
};

export const addSession = (session) => {
  dummySessions.push(session);
  return session;
};

export const updateSession = (transactionId, updates) => {
  const sessionIndex = dummySessions.findIndex(session => session.transaction_id === transactionId);
  if (sessionIndex !== -1) {
    dummySessions[sessionIndex] = { ...dummySessions[sessionIndex], ...updates };
    return dummySessions[sessionIndex];
  }
  return null;
};

export const findCitizenById = (id) => {
  return dummyCitizens.find(citizen => citizen.id === id);
};
