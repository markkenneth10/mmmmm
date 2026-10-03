import { IncidentReport, WeatherAdvisory, Announcement, CommunityActivity, Article, QuizQuestion } from '../types';

export const initialReports: IncidentReport[] = [
  {
    id: 'REP-1089',
    reporterName: 'Juan Dela Cruz',
    title: 'Clogged Drainage & Canal Overflow',
    category: 'Flood & Clogged Drainage',
    severity: 'High',
    description: 'Heavy rain causes garbage-clogged drainage canal to spill floodwater onto the main road near Barangay Hall.',
    barangay: 'Barangay Makilas',
    locationText: 'Purok 3, Near Barangay Hall',
    latitude: 14.5995,
    longitude: 120.9842,
    photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80',
    status: 'In Inspection',
    assignedUnit: 'CENRO Quick Response Team B',
    inspectionNotes: 'Team dispatched to clear plastic debris from the main culvert intake.',
    upvotes: 24,
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 2
  },
  {
    id: 'REP-1088',
    reporterName: 'Maria Santos',
    title: 'Illegal Plastic Dump Site near Riverbank',
    category: 'Illegal Solid Waste Dumping',
    severity: 'Critical',
    description: 'Uncovered commercial trash bags and hazardous plastics dumped along the river embankment threatening water flow.',
    barangay: 'Barangay San Isidro',
    locationText: 'Riverbank Sector 4',
    latitude: 14.6095,
    longitude: 120.9942,
    photoUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80',
    status: 'Submitted',
    upvotes: 18,
    createdAt: Date.now() - 3600000 * 8,
    updatedAt: Date.now() - 3600000 * 8
  },
  {
    id: 'REP-1087',
    reporterName: 'Ricardo D.',
    title: 'Fallen Mahogany Tree Blocking Evacuation Route',
    category: 'Fallen Trees & Erosion',
    severity: 'Moderate',
    description: 'Strong wind gusts uprooted an old tree branch resting on secondary power lines.',
    barangay: 'Barangay Verde Coast',
    locationText: 'Coastal Access Road 2',
    latitude: 14.5895,
    longitude: 120.9742,
    photoUrl: 'https://images.unsplash.com/photo-1511497584788-876761c1193c?w=800&auto=format&fit=crop&q=80',
    status: 'Resolved',
    assignedUnit: 'CENRO Arborist Team',
    inspectionNotes: 'Branch cut and safely removed. Access road cleared.',
    resolutionSummary: 'Debris completely hauled away by CENRO truck.',
    upvotes: 31,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 12
  }
];

export const initialWeather: WeatherAdvisory = {
  temperature: 32,
  heatIndex: 38,
  condition: 'Partly Cloudy with Scattered Thunderstorms',
  conditionIcon: '⛅',
  alertLevel: 'Yellow',
  airQuality: 'Moderate (AQI 62)',
  typhoonSignal: 'None',
  advisoryNotice: 'Yellow Rainfall Advisory active for low-lying barangays. River levels monitored by CENRO hydrology telemetry.',
  safetyTip: 'Hydrate frequently, avoid prolonged sun exposure between 11 AM - 3 PM, and clear household roof gutters.',
  updatedAt: Date.now()
};

export const initialAnnouncements: Announcement[] = [
  {
    id: 'ANN-201',
    title: 'Yellow Rainfall Advisory & High Tide Alert',
    category: 'Advisory',
    priority: 'High',
    content: 'Coastal and riverside barangays are advised to prepare for high tide peak at 3:30 PM. CENRO pumping stations are fully operational.',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80',
    author: 'CENRO Disaster Command',
    timestamp: Date.now() - 3600000 * 2
  },
  {
    id: 'ANN-202',
    title: 'Municipal Plastic Waste Segregation Enforcement',
    category: 'Regulation',
    priority: 'Normal',
    content: 'Strict implementation of Republic Act 9003. Barangays with unsegregated waste bins will face temporary collection halts.',
    author: 'CENRO Environmental Compliance',
    timestamp: Date.now() - 3600000 * 24
  }
];

export const initialActivities: CommunityActivity[] = [
  {
    id: 'ACT-301',
    title: 'Mangrove Reforestation & River Restoration Drive',
    category: 'Tree Planting',
    date: 'Saturday, Oct 24 • 7:00 AM',
    location: 'Barangay Makilas Riverbank',
    description: 'Join CENRO in planting 500 mangrove saplings along the river delta to build natural storm surge barriers.',
    organizer: 'LGU CENRO & Eco-Youth',
    points: 100,
    registered: 86,
    max: 150,
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'ACT-302',
    title: 'Coastal Zero Waste Plastic Cleanup',
    category: 'River Cleanup',
    date: 'Sunday, Nov 01 • 6:30 AM',
    location: 'Metro Verde Beachfront',
    description: 'Community beach cleanup to collect marine microplastics and haul recyclable waste for material recovery.',
    organizer: 'Metro Verde Coastal Volunteers',
    points: 150,
    registered: 112,
    max: 200,
    imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80'
  }
];

export const initialArticles: Article[] = [
  {
    id: 'ART-401',
    title: 'How Mangrove Belts Prevent Coastal Surge Inundation',
    category: 'Climate Science',
    readTime: '4 min read',
    summary: 'Discover why mangrove roots act as natural wave attenuators and reduce typhoon surge impact by up to 66%.',
    content: 'Mangroves serve as the first line of defense against typhoon storm surges. Their intricate root networks slow down incoming water velocity, trap sediment, and protect inland communities from coastal erosion...',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'ART-402',
    title: 'Urban Heat Island Effect in Philippine Cities',
    category: 'Heat & Adaptation',
    readTime: '5 min read',
    summary: 'Concrete infrastructure and lack of urban canopy increase city temperatures by 3-5°C above rural baselines.',
    content: 'The Urban Heat Island (UHI) phenomenon occurs when dense concentration of asphalt, buildings, and vehicular emissions trap heat during peak hours...',
    imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80'
  }
];

export const initialQuizzes: QuizQuestion[] = [
  {
    id: 'Q-1',
    question: 'What is the primary ecological benefit of planting mangroves along coastal zones?',
    options: [
      'They increase ocean water temperature',
      'They act as natural storm surge wave buffers and nursery habitats for marine life',
      'They eliminate the need for river dredging',
      'They turn salt water into fresh drinking water automatically'
    ],
    correctAnswer: 1,
    explanation: 'Mangrove root systems attenuate wave energy by up to 66%, serving as living bio-shields against storm surges.'
  },
  {
    id: 'Q-2',
    question: 'How does improper plastic waste dumping exacerbate urban flooding during heavy typhoons?',
    options: [
      'Plastics absorb floodwater and make it heavier',
      'Plastic debris clogs culverts and drainage intakes, causing water to back up into streets',
      'Plastics increase cloud rainfall formation',
      'It has no effect on drainage infrastructure'
    ],
    correctAnswer: 1,
    explanation: 'Solid waste clogs urban drainage channels, preventing storm runoff from draining into rivers and sea outlets.'
  }
];
