import { User, Report, ReportUpdate, ClimateArticle, Activity, QuizQuestion, PointsLog, Notification, WeatherData } from '../types';

export const initialUsers: User[] = [
  {
    id: 1,
    name: 'John Santos',
    email: 'john.santos@climateaction.org',
    password: 'password123',
    phone: '0917-234-5678',
    role: 'Citizen',
    points: 290,
    barangay: 'Barangay San Jose',
    municipality: 'Metro Verde',
    address: 'Block 4, Lot 12, Sunrise Village',
    isVerified: true,
    kycStatus: 'verified',
    kycIdType: 'Philippine National ID (PhilSys)',
    kycIdNumber: '4819-2049-1823',
    avatarColorHex: '#3B82F6'
  },
  {
    id: 2,
    name: 'Maria Clara',
    email: 'maria.clara@climateaction.org',
    password: 'password123',
    phone: '0918-345-6789',
    role: 'Citizen',
    points: 240,
    barangay: 'Barangay Poblacion',
    municipality: 'Metro Verde',
    address: '14 Rizal Avenue',
    isVerified: true,
    kycStatus: 'verified',
    kycIdType: "Driver's License (LTO)",
    kycIdNumber: 'D02-18-091823',
    avatarColorHex: '#EC4899'
  },
  {
    id: 3,
    name: 'Engr. Elena Valdez',
    email: 'admin.valdez@metroverde.gov',
    password: 'password123',
    phone: '0919-456-7890',
    role: 'Administrator',
    points: 520,
    barangay: 'Barangay Central',
    municipality: 'Metro Verde',
    address: 'City Hall Complex',
    isVerified: true,
    kycStatus: 'verified',
    kycIdType: 'Government / Civil Service ID',
    kycIdNumber: 'CENRO-DIR-001',
    avatarColorHex: '#6366F1'
  },
  {
    id: 4,
    name: 'Officer Ricardo Reyes',
    email: 'officer.reyes@enro.gov',
    password: 'password123',
    phone: '0920-567-8901',
    role: 'Environmental Officer',
    points: 410,
    barangay: 'Barangay Riverside',
    municipality: 'Metro Verde',
    address: 'CENRO Field Station 2',
    isVerified: true,
    kycStatus: 'verified',
    kycIdType: 'Government / Civil Service ID',
    kycIdNumber: 'ENRO-FLD-042',
    avatarColorHex: '#F59E0B'
  },
  {
    id: 5,
    name: 'Mark Kenneth Ulgasan',
    email: 'markkennethulgasan@gmail.com',
    password: 'kenmark10',
    phone: '+63 917 123 4567',
    role: 'Administrator',
    points: 999,
    barangay: 'Barangay Central',
    municipality: 'Metro Verde',
    address: 'Executive Directorate & System Administration',
    isVerified: true,
    kycStatus: 'verified',
    kycIdType: 'Government / Civil Service ID',
    kycIdNumber: 'CENRO-SUPER-ADMIN',
    avatarColorHex: '#15803D'
  }
];

export const initialReports: Report[] = [
  {
    id: 101,
    userId: 1,
    authorName: 'John Santos',
    title: 'Improper Waste Disposal & Illegal Dump Site',
    category: 'Improper waste disposal',
    categoryIcon: 'Waste',
    description: 'Piles of unsegregated plastic bags, discarded packaging, and decaying household refuse accumulated along the creek bank, causing foul odors and runoff risk.',
    photoUri: '/assets/climate_hero_banner.jpg',
    latitude: 14.5995,
    longitude: 120.9842,
    barangay: 'Barangay Makilas',
    municipality: 'Metro Verde',
    province: 'Eco Province',
    severity: 'Critical',
    status: 'Under Review',
    adminRemarks: 'Forwarded to Municipal Solid Waste Management for scheduled site cleanup.',
    assignedOfficer: 'Officer Ricardo Reyes',
    timestamp: Date.now() - 86400000 * 2
  },
  {
    id: 102,
    userId: 2,
    authorName: 'Maria Clara',
    title: 'Illegal Cutting of Century Mangroves',
    category: 'Illegal cutting of trees',
    categoryIcon: 'Forestry',
    description: 'Commercial clearing spotted at the coastal mangrove strip without community permits. Several mature Rhizophora trees felled.',
    photoUri: '/assets/climate_hero_banner.jpg',
    latitude: 14.5880,
    longitude: 120.9780,
    barangay: 'Barangay Riverside',
    municipality: 'Metro Verde',
    province: 'Eco Province',
    severity: 'Critical',
    status: 'In Progress',
    adminRemarks: 'CENRO patrol dispatched; cease and desist notice issued to unauthorized contractor.',
    assignedOfficer: 'Officer Ricardo Reyes',
    timestamp: Date.now() - 86400000 * 4
  },
  {
    id: 103,
    userId: 1,
    authorName: 'John Santos',
    title: 'Open Burning of Agricultural Biomass',
    category: 'Open burning',
    categoryIcon: 'Burning',
    description: 'Dense smoke haze covering residential homes from burning leaves and plastic sacks, aggravating asthma among elderly residents.',
    photoUri: '/assets/climate_hero_banner.jpg',
    latitude: 14.6100,
    longitude: 120.9920,
    barangay: 'Barangay Maligaya',
    municipality: 'Metro Verde',
    province: 'Eco Province',
    severity: 'High',
    status: 'Verified',
    adminRemarks: 'Barangay Tanod notified and cited Clean Air Act RA 8749 violation notice.',
    assignedOfficer: 'Officer Ricardo Reyes',
    timestamp: Date.now() - 86400000 * 1
  },
  {
    id: 104,
    userId: 2,
    authorName: 'Maria Clara',
    title: 'Dark Effluent Discharge in River Tributary',
    category: 'Water pollution',
    categoryIcon: 'Water',
    description: 'Oily dark discharge emitting chemical smell flowing into the community creek from adjacent small warehouse.',
    photoUri: '/assets/climate_hero_banner.jpg',
    latitude: 14.5750,
    longitude: 120.9890,
    barangay: 'Barangay San Jose',
    municipality: 'Metro Verde',
    province: 'Eco Province',
    severity: 'Critical',
    status: 'In Progress',
    adminRemarks: 'Water samples collected for BOD/COD testing by City Environment Office.',
    assignedOfficer: 'Officer Ricardo Reyes',
    timestamp: Date.now() - 86400000 * 3
  },
  {
    id: 105,
    userId: 1,
    authorName: 'John Santos',
    title: 'Severe Flash Flooding & Blocked Culvert',
    category: 'Flooding',
    categoryIcon: 'Flood',
    description: 'Floodwater reaching knee-depth following 45 minutes of heavy rain due to storm drain choked with single-use plastic cups and sediment.',
    photoUri: '/assets/climate_hero_banner.jpg',
    latitude: 14.6050,
    longitude: 120.9750,
    barangay: 'Barangay Central',
    municipality: 'Metro Verde',
    province: 'Eco Province',
    severity: 'High',
    status: 'Resolved',
    adminRemarks: 'City engineering declogging crew cleared culvert grate; drainage flow restored.',
    assignedOfficer: 'Officer Ricardo Reyes',
    resolutionEvidence: 'Culvert cleared of 4 truckloads of debris, water fully receded.',
    timestamp: Date.now() - 86400000 * 6
  },
  {
    id: 106,
    userId: 1,
    authorName: 'John Santos',
    title: 'Severe Heat Island Effect on Main Avenue',
    category: 'Extreme heat',
    categoryIcon: 'Heat',
    description: 'Urban street corridor with zero shade trees recorded 43°C surface heat index. Commuters and street vendors lack hydration shade.',
    photoUri: '/assets/climate_hero_banner.jpg',
    latitude: 14.5920,
    longitude: 120.9990,
    barangay: 'Barangay Poblacion',
    municipality: 'Metro Verde',
    province: 'Eco Province',
    severity: 'Moderate',
    status: 'Under Review',
    adminRemarks: 'Incorporated into Green Urban Corridor Tree-Planting Masterplan.',
    assignedOfficer: 'Engr. Elena Valdez',
    timestamp: Date.now() - 86400000 * 5
  },
  {
    id: 107,
    userId: 2,
    authorName: 'Maria Clara',
    title: 'Community Water Shortage from Main Line Leak',
    category: 'Water shortage',
    categoryIcon: 'Supply',
    description: 'Underground transmission pipe fracture wasting clean potable water while 80 households suffer low water pressure.',
    photoUri: '/assets/climate_hero_banner.jpg',
    latitude: 14.6020,
    longitude: 120.9810,
    barangay: 'Barangay Makilas',
    municipality: 'Metro Verde',
    province: 'Eco Province',
    severity: 'Moderate',
    status: 'Resolved',
    adminRemarks: 'Water district crew excavated and clamped ruptured PVC section.',
    assignedOfficer: 'Officer Ricardo Reyes',
    resolutionEvidence: 'Line pressure restored to 28 psi; pipeline sealed.',
    timestamp: Date.now() - 86400000 * 8
  },
  {
    id: 108,
    userId: 1,
    authorName: 'John Santos',
    title: 'Untreated Boiler Smoke Emission',
    category: 'Air pollution',
    categoryIcon: 'Emissions',
    description: 'Continuous black particulate plume escaping secondary stack at night, exceeding ambient opacity thresholds.',
    photoUri: '/assets/climate_hero_banner.jpg',
    latitude: 14.5710,
    longitude: 120.9950,
    barangay: 'Barangay San Jose',
    municipality: 'Metro Verde',
    province: 'Eco Province',
    severity: 'High',
    status: 'Submitted',
    timestamp: Date.now() - 3600000 * 5
  }
];

export const initialReportUpdates: ReportUpdate[] = [
  {
    id: 1,
    reportId: 101,
    status: 'Submitted',
    remarks: 'Report lodged by citizen with geotagged photo evidence.',
    updatedBy: 'John Santos',
    timestamp: Date.now() - 86400000 * 2
  },
  {
    id: 2,
    reportId: 101,
    status: 'Under Review',
    remarks: 'Incident routed to Solid Waste Taskforce for ground validation.',
    updatedBy: 'Engr. Elena Valdez',
    timestamp: Date.now() - 86400000 * 1
  },
  {
    id: 3,
    reportId: 105,
    status: 'Submitted',
    remarks: 'Flash flood emergency report received.',
    updatedBy: 'John Santos',
    timestamp: Date.now() - 86400000 * 6
  },
  {
    id: 4,
    reportId: 105,
    status: 'Verified',
    remarks: 'City engineering team confirmed blocked culvert at intersection.',
    updatedBy: 'Officer Ricardo Reyes',
    timestamp: Date.now() - 86400000 * 5
  },
  {
    id: 5,
    reportId: 105,
    status: 'In Progress',
    remarks: 'Vactor truck and declogging crew on site clearing plastics.',
    updatedBy: 'Officer Ricardo Reyes',
    timestamp: Date.now() - 86400000 * 4
  },
  {
    id: 6,
    reportId: 105,
    status: 'Resolved',
    remarks: 'Debris extraction complete; water draining normally.',
    updatedBy: 'Engr. Elena Valdez',
    timestamp: Date.now() - 86400000 * 3
  }
];

export const initialArticles: ClimateArticle[] = [
  {
    id: 1,
    title: 'Mitigating Urban Heat Islands Through Green Canopies',
    category: 'Climate Change',
    icon: 'ThermometerSun',
    summary: 'How dense tree canopies reduce asphalt heat absorption and lower neighborhood temperatures by up to 4°C.',
    content: `Urban heat islands (UHIs) occur when cities replace natural land cover with dense concentrations of pavement, buildings, and other surfaces that absorb and retain heat. In tropical and subtropical cities, daytime temperatures in built-up neighborhoods can be 3°C to 8°C higher than nearby vegetated rural zones.

Strategic urban forestry cools cities through two primary physics processes: direct shading of pavements and evapotranspiration, where trees release water vapor into the surrounding air. Selecting drought-tolerant indigenous species ensures low maintenance and maximal canopy radius.`,
    actionTips: [
      'Plant shade trees on the eastern and western facades of dwellings',
      'Install reflective cool-roof coatings or vertical green walls',
      'Advocate for permeable pavement in local barangay parking lanes'
    ],
    references: 'IPCC 6th Assessment Report (WGII); UNEP Cool Coalition Framework 2024',
    readTimeMinutes: 4
  },
  {
    id: 2,
    title: 'Zero-Waste Household Strategies & Composting',
    category: 'Waste Management',
    icon: 'Recycle',
    summary: 'A practical guide to diverting 70% of municipal solid waste away from landfills through source segregation.',
    content: `Improper waste disposal and open dumpsites generate methane, a greenhouse gas with a global warming potential 28 times greater than carbon dioxide over a 100-year timescale. By segregating compostable organic food scraps at source, households eliminate leachate contamination and produce nutrient-rich soil enhancer for community gardens.

Key segregation categories include: Biodegradables (food waste, dried leaves), Recyclables (PET bottles, clean corrugated cardboard, HDPE), Residuals (sanitary waste, multi-layer sachets), and Special wastes (electronics, batteries, expired medicines).`,
    actionTips: [
      'Implement the 4-bin color-coded segregation system at home',
      'Adopt Bokashi bucket or tumbler composting for food scraps',
      'Refuse single-use plastics and carry durable canvas tote bags'
    ],
    references: 'RA 9003 Ecological Solid Waste Management Act; Global Alliance for Incinerator Alternatives (GAIA)',
    readTimeMinutes: 5
  },
  {
    id: 3,
    title: 'Community Flood Resilience & Stormwater Management',
    category: 'Disaster Preparedness',
    icon: 'Droplets',
    summary: 'Practical measures communities can take to prepare for extreme typhoons and flash flooding events.',
    content: `As global temperatures rise, the atmosphere holds 7% more moisture for every 1°C of warming, leading to more frequent cloudbursts and high-intensity tropical cyclones. Traditional concrete canals often bottleneck when clogged with urban trash.

Resilience combines structural measures (rainwater retention basins, bioswales, regular culvert maintenance) with non-structural preparedness (early warning sirens, family disaster grab bags, flood hazard zoning).`,
    actionTips: [
      'Keep an emergency GO-BAG packed with 72 hours of water and rations',
      'Participate in quarterly barangay canal declogging brigades',
      'Install rainwater collection barrels to buffer roof runoff'
    ],
    references: 'NDRRMC Disaster Preparedness Handbook; Sendai Framework for Disaster Risk Reduction',
    readTimeMinutes: 6
  },
  {
    id: 4,
    title: 'Native Tree Species for Carbon Sequestration',
    category: 'Tree Planting',
    icon: 'Trees',
    summary: 'Why planting indigenous species like Narra, Molave, and Mangroves outperforms monoculture plantations.',
    content: `Tree planting is one of the most cost-effective nature-based solutions for carbon sequestration, watershed protection, and biodiversity restoration. However, planting non-native exotic species can disrupt local ecosystems and yield low survival rates.

Native Philippine species such as Narra (Pterocarpus indicus), Molave (Vitex parviflora), and mangrove Rhizophora species boast deep root structures that stabilize riverbanks, buffer storm surges, and provide habitat for native pollinators.`,
    actionTips: [
      'Source saplings from accredited community native nurseries',
      'Plant during the onset of rainy season for optimal sapling root establishment',
      'Monitor and mulch planted seedlings for at least 36 months'
    ],
    references: 'DENR Forest Management Bureau Guidelines; Philippine Native Plants Conservation Society',
    readTimeMinutes: 4
  },
  {
    id: 5,
    title: 'Rooftop Solar & Energy Efficiency for Households',
    category: 'Renewable Energy',
    icon: 'SunMedium',
    summary: 'Decentralized clean energy reduces dependence on coal-fired power grids while saving up to 60% on electric bills.',
    content: `Electricity generation remains one of the largest contributors to greenhouse gas emissions. Distributed rooftop solar photovoltaic (PV) systems empower households to generate clean kilowatt-hours directly on-site, cutting peak grid demand during intense daytime heat.`,
    actionTips: [
      'Switch home lighting to high-efficiency LED fixtures',
      'Unplug phantom electronics on standby power strips',
      'Explore net-metering solar rooftop options with local utility'
    ],
    references: 'Department of Energy Renewable Energy Roadmap; International Renewable Energy Agency (IRENA)',
    readTimeMinutes: 4
  },
  {
    id: 6,
    title: 'Mangrove Conservation: Coastlines Under Protection',
    category: 'Coastal Protection',
    icon: 'ShieldAlert',
    summary: 'Mangrove forests store up to 5 times more carbon per hectare than terrestrial tropical rainforests.',
    content: `Mangroves represent the frontline of coastal climate defense. Their dense prop roots dissipate up to 66% of wave energy within the first 100 meters of forest, safeguarding coastal barangays from devastating storm surges during typhoons. Known as "blue carbon" reservoirs, mangrove soils sequester organic carbon for thousands of years without saturation.`,
    actionTips: [
      'Report any unauthorized mangrove cutting or clearing immediately',
      'Join local mangrove propagule planting and coastal mudflat cleanups',
      'Avoid dumping plastics into estuaries that empty into bays'
    ],
    references: 'Mangrove Action Project; World Bank Blue Carbon Valuation Report',
    readTimeMinutes: 5
  }
];

export const initialActivities: Activity[] = [
  {
    id: 1,
    title: 'Bayanihan Mangrove Tree Planting 2026',
    category: 'Tree planting',
    icon: 'Sprout',
    description: 'Join community volunteers to plant 1,500 Rhizophora mangrove propagules along the Makilas River estuary to protect coastal fish habitats and sequester blue carbon.',
    location: 'River Estuary Mudflat, Brgy Makilas',
    barangay: 'Barangay Makilas',
    dateText: 'Sat, Sep 20, 2026',
    timeText: '06:30 AM - 10:30 AM',
    rewardPoints: 30,
    maxParticipants: 50,
    currentParticipants: 34,
    isRegistered: true,
    isCompleted: false
  },
  {
    id: 2,
    title: 'Grand Coastal & Shoreline Cleanup',
    category: 'Coastal cleanup',
    icon: 'Waves',
    description: 'Help remove plastic debris, fishing gear, and styrofoam from the public beach before the storm season hits. Waste audit bags and gloves provided.',
    location: 'Baywalk Shoreline, Brgy Coastal Bay',
    barangay: 'Barangay Coastal Bay',
    dateText: 'Sun, Sep 28, 2026',
    timeText: '07:00 AM - 10:00 AM',
    rewardPoints: 20,
    maxParticipants: 100,
    currentParticipants: 68,
    isRegistered: false,
    isCompleted: false
  },
  {
    id: 3,
    title: 'E-Waste & Plastic Drop-Off Drive',
    category: 'Recycling campaigns',
    icon: 'BatteryCharging',
    description: 'Exchange clean plastic bottles and broken electronics for eco seeds and points! All gathered plastics are routed to community upcycling pavers.',
    location: 'Civic Center Covered Court, Brgy Central',
    barangay: 'Barangay Central',
    dateText: 'Sat, Oct 04, 2026',
    timeText: '08:00 AM - 04:00 PM',
    rewardPoints: 15,
    maxParticipants: 150,
    currentParticipants: 92,
    isRegistered: false,
    isCompleted: false
  },
  {
    id: 4,
    title: 'Youth Climate Awareness Seminar',
    category: 'Environmental seminars',
    icon: 'GraduationCap',
    description: 'Interactive workshop on climate change mitigation, local ecological zoning, and citizen science reporting tools for high school and college leaders.',
    location: 'University Amphitheater, Metro Verde',
    barangay: 'Barangay Poblacion',
    dateText: 'Fri, Oct 10, 2026',
    timeText: '01:00 PM - 05:00 PM',
    rewardPoints: 20,
    maxParticipants: 80,
    currentParticipants: 45,
    isRegistered: false,
    isCompleted: false
  }
];

export const initialQuizzes: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is one of the most effective community-level ways to reduce municipal solid waste?',
    optionA: 'Burning plastic bags in backyards',
    optionB: 'Source segregation and composting of organics',
    optionC: 'Throwing garbage into rivers at night',
    optionD: 'Burying electronic batteries in soil',
    correctAnswerIndex: 1,
    explanation: 'Composting organic waste diverts up to 50-70% of waste from landfills, eliminating methane emissions and groundwater leachate.',
    category: 'Waste Management'
  },
  {
    id: 2,
    question: 'Why are mangrove forests critical for coastal climate protection?',
    optionA: 'They consume all ocean water during high tide',
    optionB: 'They absorb up to 66% of wave energy and sequester massive blue carbon',
    optionC: 'They increase ocean temperatures by 5 degrees',
    optionD: 'They prevent rain clouds from forming over land',
    correctAnswerIndex: 1,
    explanation: 'Mangroves dissipate wave impact during storm surges and store 3-5 times more carbon per hectare than terrestrial forests.',
    category: 'Coastal Protection'
  },
  {
    id: 3,
    question: 'What primary mechanism causes the Urban Heat Island (UHI) effect?',
    optionA: 'High density of concrete, asphalt, and lack of tree shade',
    optionB: 'Too many bicycles on public streets',
    optionC: 'Planting excessive native flowering plants',
    optionD: 'Over-consumption of chilled beverages',
    correctAnswerIndex: 0,
    explanation: 'Asphalt and dark concrete absorb solar radiation, releasing heat slowly into surrounding air, exacerbated by minimal tree canopy.',
    category: 'Climate Change'
  },
  {
    id: 4,
    question: 'Under Clean Air Act policies, what is open burning (siga) of household waste classified as?',
    optionA: 'An eco-friendly waste disposal technique',
    optionB: 'A prohibited act that emits carcinogenic dioxins and particulate matter',
    optionC: 'Mandatory weekly practice for all residents',
    optionD: 'Recommended insect repellent method',
    correctAnswerIndex: 1,
    explanation: 'Open burning emits toxic particulate matter (PM2.5) and dioxins that exacerbate respiratory illnesses like asthma and COPD.',
    category: 'Air Pollution'
  }
];

export const initialPointsLogs: PointsLog[] = [
  {
    id: 1,
    userId: 1,
    action: 'Submit verified report on improper waste disposal',
    points: 10,
    timestamp: Date.now() - 86400000 * 2
  },
  {
    id: 2,
    userId: 1,
    action: 'Completed Climate Awareness Quiz (Score 4/4)',
    points: 10,
    timestamp: Date.now() - 86400000 * 3
  },
  {
    id: 3,
    userId: 1,
    action: 'Tree planting participation evidence verified',
    points: 30,
    timestamp: Date.now() - 86400000 * 7
  }
];

export const initialNotifications: Notification[] = [
  {
    id: 1,
    userId: 1,
    title: 'Report Verified: Waste Disposal',
    message: 'Your environmental report #101 in Brgy Makilas has been verified by Officer Reyes.',
    type: 'Report',
    isRead: false,
    timestamp: Date.now() - 3600000 * 2
  },
  {
    id: 2,
    userId: 1,
    title: 'Climate Advisory: Extreme Heat Warning',
    message: 'Heat index forecast to reach 42°C today in Metro Verde. Stay hydrated and avoid outdoor exertion between 11 AM - 3 PM.',
    type: 'Advisory',
    isRead: false,
    timestamp: Date.now() - 3600000 * 5
  },
  {
    id: 3,
    userId: 1,
    title: 'Upcoming Activity: Mangrove Tree Planting',
    message: 'Reminder: Bayanihan Mangrove Tree Planting is this Saturday at 06:30 AM in Brgy Makilas.',
    type: 'Activity',
    isRead: true,
    timestamp: Date.now() - 86400000 * 1
  },
  {
    id: 4,
    userId: 1,
    title: 'Points Awarded: +10 Climate Points',
    message: 'Congratulations! You earned 10 points for completing your climate action submission.',
    type: 'Quiz',
    isRead: true,
    timestamp: Date.now() - 86400000 * 2
  }
];

export const initialWeatherData: WeatherData = {
  temp: 32,
  heatIndex: 38,
  condition: 'Partly Cloudy with Extreme Heat Caution',
  alertLevel: 'Yellow',
  alertTitle: 'Yellow Extreme Heat Advisory',
  advisoryText: 'High heat index conditions active across Metro Verde. Drink plenty of water and limit prolonged solar exposure.',
  humidity: 68,
  windSpeed: 14,
  airQualityIndex: 42,
  updatedAt: 'Just now'
};

export const BARANGAYS = [
  'Barangay Makilas',
  'Barangay Poblacion',
  'Barangay San Jose',
  'Barangay Riverside',
  'Barangay Maligaya',
  'Barangay Central',
  'Barangay Coastal Bay',
  'Barangay Lumbia',
  'Barangay Taway',
  'Barangay Maasin'
];

export const REPORT_CATEGORIES = [
  { label: 'Improper waste disposal', icon: 'Trash2' },
  { label: 'Illegal cutting of trees', icon: 'TreePine' },
  { label: 'Open burning', icon: 'Flame' },
  { label: 'Water pollution', icon: 'Droplet' },
  { label: 'Flooding', icon: 'Waves' },
  { label: 'Extreme heat', icon: 'Sun' },
  { label: 'Water shortage', icon: 'Droplets' },
  { label: 'Air pollution', icon: 'Wind' }
];
