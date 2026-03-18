
export interface RoomListing {
  id: string;
  title: string;
  location: string;
  nearestCommunication: string;
  wifiAvailable: boolean;
  inverterAvailable: boolean;
  acAvailable: boolean;
  waterSupplyCondition: string;
  monthlyRent: string;
  description: string;
  photos: string[];
  landlord: {
    name: string;
    whatsapp: string;
  };
}

export const MOCK_ROOMS: RoomListing[] = [
  {
    id: '1',
    title: 'Modern Studio in Downtown',
    location: '123 Main St, Downtown, Metropolis',
    nearestCommunication: '2-min walk to Metro Station',
    wifiAvailable: true,
    inverterAvailable: true,
    acAvailable: true,
    waterSupplyCondition: '24/7 Water Supply',
    monthlyRent: '$850',
    description: 'A beautiful modern studio perfect for professionals.',
    photos: ['https://picsum.photos/seed/room1/800/600', 'https://picsum.photos/seed/room2/800/600'],
    landlord: { name: 'John Doe', whatsapp: '+1234567890' }
  },
  {
    id: '2',
    title: 'Spacious Room near University',
    location: '45 University Rd, West End',
    nearestCommunication: '5-min walk to Bus Stop',
    wifiAvailable: true,
    inverterAvailable: false,
    acAvailable: false,
    waterSupplyCondition: 'Morning/Evening Supply',
    monthlyRent: '$500',
    description: 'Perfect for students, quiet neighborhood.',
    photos: ['https://picsum.photos/seed/room3/800/600'],
    landlord: { name: 'Jane Smith', whatsapp: '+0987654321' }
  },
  {
    id: '3',
    title: 'Luxury 1BHK with Garden View',
    location: '78 Green Valley, Suburbs',
    nearestCommunication: '10-min drive to Rail Station',
    wifiAvailable: true,
    inverterAvailable: true,
    acAvailable: true,
    waterSupplyCondition: '24/7 Filtered Water',
    monthlyRent: '$1200',
    description: 'Experience luxury living in a green environment.',
    photos: ['https://picsum.photos/seed/room4/800/600', 'https://picsum.photos/seed/room1/800/600'],
    landlord: { name: 'Robert Brown', whatsapp: '+1122334455' }
  }
];
