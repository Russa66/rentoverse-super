export interface RoomListing {
  id: string;
  title: string;
  location: string;
  locality?: string;
  nearestCommunication: string;
  nearestCommunicationOptions?: string[];
  wifiAvailable: boolean;
  inverterAvailable: boolean;
  acAvailable: boolean;
  waterSupplyCondition: string;
  monthlyRent: string | number;
  description: string;
  idealFor: 'Family' | 'Single Tenant' | 'Commercial' | 'All purpose';
  photos?: string[];
  photoUrls?: string[];
  landlord?: {
    name: string;
    whatsapp: string;
  };
  areaSqFt?: number;
  bhkCount?: string;
  propertyType?: string;
}

export const MOCK_ROOMS: RoomListing[] = [
  {
    id: '1',
    title: 'Modern Studio in Downtown',
    location: '123 Main St, Downtown, Metropolis',
    locality: 'Downtown',
    nearestCommunication: '2-min walk to Metro Station',
    wifiAvailable: true,
    inverterAvailable: true,
    acAvailable: true,
    waterSupplyCondition: '24/7 Water Supply',
    monthlyRent: 25000,
    idealFor: 'Single Tenant',
    description: 'A beautiful modern studio perfect for professionals.',
    photoUrls: ['https://picsum.photos/seed/room1/800/600'],
    landlord: { name: 'John Doe', whatsapp: '+1234567890' }
  },
  {
    id: '2',
    title: 'Spacious Room near University',
    location: '45 University Rd, West End',
    locality: 'West End',
    nearestCommunication: '5-min walk to Bus Stop',
    wifiAvailable: true,
    inverterAvailable: false,
    acAvailable: false,
    waterSupplyCondition: 'Morning/Evening Supply',
    monthlyRent: 12000,
    idealFor: 'Single Tenant',
    description: 'Perfect for students, quiet neighborhood.',
    photoUrls: ['https://picsum.photos/seed/room2/800/600'],
    landlord: { name: 'Jane Smith', whatsapp: '+0987654321' }
  },
  {
    id: '3',
    title: 'Luxury 3BHK Apartment',
    location: '78 Green Valley, Suburbs',
    locality: 'Suburbs',
    nearestCommunication: '10-min drive to Rail Station',
    wifiAvailable: true,
    inverterAvailable: true,
    acAvailable: true,
    waterSupplyCondition: '24/7 Filtered Water',
    monthlyRent: 45000,
    idealFor: 'Family',
    description: 'Experience luxury living in a green environment.',
    photoUrls: ['https://picsum.photos/seed/room3/800/600'],
    landlord: { name: 'Robert Brown', whatsapp: '+1122334455' }
  },
  {
    id: '4',
    title: 'Cozy PG for Students',
    location: 'Poabagan Main Road',
    locality: 'Poabagan',
    nearestCommunication: 'Near Poabagan More',
    wifiAvailable: true,
    inverterAvailable: true,
    acAvailable: false,
    waterSupplyCondition: 'Borewell',
    monthlyRent: 6000,
    idealFor: 'Single Tenant',
    description: 'Affordable and clean PG for students.',
    photoUrls: ['https://picsum.photos/seed/room4/800/600'],
    landlord: { name: 'S. K. Gupta', whatsapp: '+919876543210' }
  },
  {
    id: '5',
    title: 'Commercial Shop Space',
    location: 'Heavir More Market Complex',
    locality: 'Heavir More',
    nearestCommunication: 'Main Junction',
    wifiAvailable: false,
    inverterAvailable: true,
    acAvailable: false,
    waterSupplyCondition: 'Municipal',
    monthlyRent: 15000,
    idealFor: 'Commercial',
    description: 'Prime location for a retail shop or office.',
    photoUrls: ['https://picsum.photos/seed/room5/800/600'],
    landlord: { name: 'Amit Das', whatsapp: '+919876543211' }
  },
  {
    id: '6',
    title: 'Premium 2BHK Flat',
    location: 'Rosewood Enclave, Block B',
    locality: 'Rosewood',
    nearestCommunication: '8-min walk to station',
    wifiAvailable: true,
    inverterAvailable: true,
    acAvailable: true,
    waterSupplyCondition: '24/7 Supply',
    monthlyRent: 18000,
    idealFor: 'Family',
    description: 'Modern flat with all amenities.',
    photoUrls: ['https://picsum.photos/seed/room6/800/600'],
    landlord: { name: 'Priya Sharma', whatsapp: '+919876543212' }
  },
  {
    id: '7',
    title: 'Single Room with Balcony',
    location: 'Green Park Extension',
    locality: 'Green Park',
    nearestCommunication: 'Walking distance to Metro',
    wifiAvailable: true,
    inverterAvailable: false,
    acAvailable: false,
    waterSupplyCondition: 'Municipal',
    monthlyRent: 8500,
    idealFor: 'Single Tenant',
    description: 'Quiet room with a great view.',
    photoUrls: ['https://picsum.photos/seed/room7/800/600'],
    landlord: { name: 'Rahul Sen', whatsapp: '+919876543213' }
  },
  {
    id: '8',
    title: 'Office Space in IT Hub',
    location: 'Tech Park, Sector 5',
    locality: 'Sector 5',
    nearestCommunication: 'Inside Tech Park',
    wifiAvailable: true,
    inverterAvailable: true,
    acAvailable: true,
    waterSupplyCondition: '24/7 Filtered',
    monthlyRent: 55000,
    idealFor: 'Commercial',
    description: 'Fully furnished office space.',
    photoUrls: ['https://picsum.photos/seed/room8/800/600'],
    landlord: { name: 'Vikram Singh', whatsapp: '+919876543214' }
  },
  {
    id: '9',
    title: 'Budget Single Room',
    location: 'Old Town Lane 4',
    locality: 'Old Town',
    nearestCommunication: 'Bus Stand nearby',
    wifiAvailable: false,
    inverterAvailable: false,
    acAvailable: false,
    waterSupplyCondition: 'Manual',
    monthlyRent: 4000,
    idealFor: 'Single Tenant',
    description: 'Cheap and best for solo stay.',
    photoUrls: ['https://picsum.photos/seed/room9/800/600'],
    landlord: { name: 'Mohan Lal', whatsapp: '+919876543215' }
  },
  {
    id: '10',
    title: 'Family Apartment with Garden',
    location: 'Gardenia Heights, Poabagan',
    locality: 'Poabagan',
    nearestCommunication: '10 mins from Heavir More',
    wifiAvailable: true,
    inverterAvailable: true,
    acAvailable: false,
    waterSupplyCondition: '24/7 Supply',
    monthlyRent: 22000,
    idealFor: 'Family',
    description: 'Spacious apartment with a private garden area.',
    photoUrls: ['https://picsum.photos/seed/room10/800/600'],
    landlord: { name: 'Sneha Roy', whatsapp: '+919876543216' }
  }
];
