import { Job, User, Application, PaymentSettings, GatewayCredentials, Testimonial } from '../types';

export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
  'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
] as const;

export type KenyaCounty = typeof KENYA_COUNTIES[number];

export function getFeeForCountry(country: string): number {
  if (['Canada', 'Australia', 'Singapore', 'Kuwait', 'UK', 'USA'].includes(country)) {
    return 30000.0;
  }
  if (['Germany', 'Poland', 'Finland', 'Turkey'].includes(country)) {
    return 5000.0;
  }
  if (['Qatar', 'Saudi Arabia', 'Iraq', 'Iran', 'Oman', 'UAE'].includes(country)) {
    return 1500.0;
  }
  if (country === 'Kenya') {
    return 500.0;
  }
  return 1500.0;
}

export function generateCanonicalAndMassJobs(): Job[] {
  const jobs: Job[] = [];

  const canonicalJobs: Job[] = [
    {
      id: 'job_001',
      title: 'Fruit Picker & Agricultural Worker',
      country: 'Canada',
      region_county: 'British Columbia',
      category: 'Agriculture & Farming',
      description: 'Seasonal farm work including harvesting, sorting, and packaging various fruits. Accommodation provided.',
      requirements: 'Physical stamina, ability to work outdoors, valid international passport.',
      fee_amount: 30000.0,
      status: 'active',
      salary_range: 'CAD 3,200 - 4,500/month',
      positions_available: 30,
      created_at: new Date('2026-02-01T09:00:00Z').toISOString(),
    },
    {
      id: 'job_002',
      title: 'Hospitality & Guest Services Crew',
      country: 'Australia',
      region_county: 'Queensland',
      category: 'Hospitality & Culinary',
      description: 'Front-of-house positions at premium coastal holiday resorts. Training and uniform included.',
      requirements: 'Conversational English, energetic personality, clean police clearance.',
      fee_amount: 30000.0,
      status: 'active',
      salary_range: 'AUD 3,800 - 5,000/month',
      positions_available: 20,
      created_at: new Date('2026-02-03T10:00:00Z').toISOString(),
    },
    {
      id: 'job_003',
      title: 'Warehouse & Logistics Associate',
      country: 'Singapore',
      region_county: 'Central Region',
      category: 'Logistics & Supply Chain',
      description: 'Sorting, scanning, inventory logging, and packing electronic parts within state-of-the-art storage facilities.',
      requirements: 'High attention to detail, ability to lift moderate loads, basic computer literacy.',
      fee_amount: 30000.0,
      status: 'active',
      salary_range: 'SGD 2,800 - 3,600/month',
      positions_available: 15,
      created_at: new Date('2026-02-05T11:00:00Z').toISOString(),
    },
    {
      id: 'job_004',
      title: 'General Construction Worker',
      country: 'Kuwait',
      region_county: 'Al Asimah',
      category: 'Construction & Engineering',
      description: 'Site preparation, mixing materials, loading transport trucks, and assisting structural teams on commercial builds.',
      requirements: 'Medical fitness certificate, resilience to warm climates, valid passport.',
      fee_amount: 30000.0,
      status: 'active',
      salary_range: 'KWD 350 - 500/month',
      positions_available: 40,
      created_at: new Date('2026-02-07T08:30:00Z').toISOString(),
    },
    {
      id: 'job_005',
      title: 'Healthcare Assistant & Care Giver',
      country: 'UK',
      region_county: 'Greater London',
      category: 'Healthcare',
      description: 'Provide exceptional daily living assistance to residents in specialized residential care facilities.',
      requirements: 'Empathetic nature, basic health training certificate is an advantage, clean background history.',
      fee_amount: 30000.0,
      status: 'active',
      salary_range: 'GBP 2,200 - 2,900/month',
      positions_available: 25,
      created_at: new Date('2026-02-09T14:00:00Z').toISOString(),
    },
    {
      id: 'job_006',
      title: 'Hospitality & Culinary Assistant',
      country: 'USA',
      region_county: 'Texas',
      category: 'Hospitality & Culinary',
      description: 'Assist in high-volume food preparation, inventory restocking, and customer relations management.',
      requirements: 'Adaptable schedule, basic food safety understanding, clear communication skills.',
      fee_amount: 30000.0,
      status: 'active',
      salary_range: 'USD 3,000 - 4,200/month',
      positions_available: 18,
      created_at: new Date('2026-02-11T12:00:00Z').toISOString(),
    },
    {
      id: 'job_007',
      title: 'Customer Support Specialist',
      country: 'Kenya',
      region_county: 'Nairobi',
      category: 'Customer Care & Sales',
      description: 'Respond to incoming local client communications, process inquiries, and handle troubleshooting tickets.',
      requirements: 'Fluent in Swahili and English, diploma in communication or business administration.',
      fee_amount: 500.0,
      status: 'active',
      salary_range: 'KES 45,000 - 65,000/month',
      positions_available: 12,
      created_at: new Date('2026-02-13T09:30:00Z').toISOString(),
    },
    {
      id: 'job_008',
      title: 'Freight & Clearing Clerk',
      country: 'Kenya',
      region_county: 'Mombasa',
      category: 'Logistics & Supply Chain',
      description: 'Assist in filing documentation for port clearance, tracking manifests, and coordinate with ground transport providers.',
      requirements: 'Familiarity with port clearance processes, strong organizational skills.',
      fee_amount: 500.0,
      status: 'active',
      salary_range: 'KES 35,000 - 50,000/month',
      positions_available: 10,
      created_at: new Date('2026-02-15T10:00:00Z').toISOString(),
    },
  ];

  jobs.push(...canonicalJobs);

  const destinationConfig = [
    {
      country: 'Kenya',
      regions: [...KENYA_COUNTIES],
      currency: 'KES',
      minSal: 35000,
      maxSal: 85000,
    },
    { country: 'Canada', regions: ['Ontario', 'British Columbia', 'Alberta', 'Quebec', 'Nova Scotia'], currency: 'CAD', minSal: 3200, maxSal: 5200 },
    { country: 'Australia', regions: ['Queensland', 'New South Wales', 'Victoria', 'Western Australia', 'South Australia'], currency: 'AUD', minSal: 3800, maxSal: 5800 },
    { country: 'Singapore', regions: ['Central Region', 'Jurong East', 'Changi', 'Woodlands', 'Tampines'], currency: 'SGD', minSal: 2800, maxSal: 4200 },
    { country: 'Kuwait', regions: ['Al Asimah', 'Hawalli', 'Ahmadi', 'Farwaniya', 'Jahra'], currency: 'KWD', minSal: 350, maxSal: 600 },
    { country: 'UK', regions: ['Greater London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow'], currency: 'GBP', minSal: 2200, maxSal: 3400 },
    { country: 'USA', regions: ['Texas', 'California', 'New York', 'Florida', 'Illinois'], currency: 'USD', minSal: 3400, maxSal: 5500 },
    { country: 'Germany', regions: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'], currency: 'EUR', minSal: 2500, maxSal: 4000 },
    { country: 'Poland', regions: ['Warsaw', 'Krakow', 'Wroclaw', 'Gdansk', 'Poznan'], currency: 'EUR', minSal: 1800, maxSal: 2900 },
    { country: 'Finland', regions: ['Helsinki', 'Espoo', 'Tampere', 'Oulu', 'Vantaa'], currency: 'EUR', minSal: 2600, maxSal: 4100 },
    { country: 'Turkey', regions: ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa'], currency: 'USD', minSal: 1600, maxSal: 2800 },
    { country: 'Qatar', regions: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Lusail', 'Al Khor'], currency: 'QAR', minSal: 3500, maxSal: 6500 },
    { country: 'Saudi Arabia', regions: ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Medina'], currency: 'SAR', minSal: 3800, maxSal: 7000 },
    { country: 'Iraq', regions: ['Baghdad', 'Erbil', 'Basra', 'Sulaymaniyah', 'Najaf'], currency: 'USD', minSal: 1500, maxSal: 2800 },
    { country: 'Iran', regions: ['Tehran', 'Isfahan', 'Shiraz', 'Tabriz', 'Mashhad'], currency: 'USD', minSal: 1400, maxSal: 2600 },
    { country: 'Oman', regions: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur'], currency: 'OMR', minSal: 380, maxSal: 650 },
    { country: 'UAE', regions: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'], currency: 'AED', minSal: 4000, maxSal: 7500 },
  ];

  const categoriesWithTitles = [
    {
      category: 'Healthcare',
      titles: ['Registered Nurse', 'Care Giver', 'Medical Assistant', 'Lab Technician', 'Surgical Technologist', 'Phlebotomist', 'Clinical Support Worker'],
      descriptions: [
        'Deliver high quality compassionate patient care, assist medical teams, and maintain clinical logs.',
        'Assist elderly or recovering patients with daily mobility, personal care, and nutritional monitoring.',
        'Support clinical routines, record vitals, prepare examination rooms, and maintain medical inventories.',
        'Collect diagnostic samples, perform standardized laboratory tests, and process accurate analytical reports.',
        'Prepare operating rooms, sterilize surgical equipment, and assist surgical staff during procedures.',
        'Perform venipunctures, specimen collection, patient identification, and sample preservation.',
        'Provide bedside assistance, transport patients, restock medical supplies, and maintain hygiene standards.',
      ],
    },
    {
      category: 'Logistics & Supply Chain',
      titles: ['Warehouse Associate', 'Forklift Operator', 'Long-Haul Driver', 'Clearing Agent', 'Supply Chain Coordinator', 'Inventory Specialist'],
      descriptions: [
        'Organize inventory, operate barcoding scanners, fulfill orders, and maintain safety in logistics hubs.',
        'Safely maneuver industrial forklifts to stack palletized cargo, load freight trailers, and organize storage bays.',
        'Transport cargo across regional highway routes while maintaining strict transit logs and vehicle safety checks.',
        'Manage customs documentation, process port clearance papers, and expedite cargo transit schedules.',
        'Coordinate freight movements, monitor warehouse dispatch, and communicate with logistics vendors.',
        'Audit stock levels, manage cycle counts, resolve inventory discrepancies, and optimize storage layouts.',
      ],
    },
    {
      category: 'Agriculture & Farming',
      titles: ['Fruit Picker', 'Greenhouse Supervisor', 'Farm Equipment Mechanic', 'General Farm Hand', 'Crop Specialist', 'Irrigation Technician'],
      descriptions: [
        'Harvest, inspect, and package fresh agricultural produce in outdoor orchard and farm environments.',
        'Monitor automated climate controls, crop irrigation, pest control schedules, and greenhouse yields.',
        'Inspect, service, and repair diesel tractors, irrigation pumps, and harvesting equipment.',
        'Support daily farm operations including soil preparation, crop tending, fencing, and crop harvesting.',
        'Assess plant health, implement fertilizer application programs, and optimize crop harvest quality.',
        'Maintain drip irrigation systems, repair water pumps, and monitor agricultural water distribution.',
      ],
    },
    {
      category: 'Hospitality & Culinary',
      titles: ['Front Desk Clerk', 'Line Cook', 'Hotel Room Attendant', 'Food Service Worker', 'Sous Chef', 'Banquet Server', 'Barista'],
      descriptions: [
        'Welcome international guests, process reservations, coordinate luggage transfers, and handle check-ins.',
        'Prepare high quality culinary orders in commercial kitchens adhering strictly to hygiene standards.',
        'Maintain luxury guest suites, restock amenities, and ensure flawless cleanliness standards.',
        'Serve meals in dining facilities, assist kitchen staff, and handle food presentation.',
        'Assist executive chefs, supervise kitchen prep stations, and manage food safety compliance.',
        'Set up banquet tables, serve multi-course meals at events, and assist catering operations.',
        'Prepare specialized espresso beverages, maintain coffee bar inventory, and deliver warm guest service.',
      ],
    },
    {
      category: 'Construction & Engineering',
      titles: ['General Builder', 'Masonry Worker', 'Electrical Apprentice', 'Site Supervisor', 'Plumbing Technician', 'HVAC Installer', 'Scaffolder'],
      descriptions: [
        'Perform foundational construction tasks, assemble scaffolding, and assist specialized trades on site.',
        'Lay structural stone, concrete blocks, and brickwork according to architectural blueprints.',
        'Assist senior electricians in conduit installation, wiring layouts, and safety testing on commercial sites.',
        'Oversee daily site operations, enforce health & safety protocols, and manage subcontractor workflows.',
        'Install commercial piping systems, fit water lines, and perform structural plumbing repairs.',
        'Mount heating and ventilation ductwork, connect AC systems, and perform climate control testing.',
        'Erect structural scaffolding towers, inspect safety ties, and dismantle elevated platforms safely.',
      ],
    },
    {
      category: 'IT & Software Development',
      titles: ['Software Developer', 'Systems Support Specialist', 'Data Entry Technician', 'Network Assistant', 'QA Test Analyst', 'Cloud Support Engineer'],
      descriptions: [
        'Develop responsive web applications, write maintainable code, and collaborate with engineering teams.',
        'Troubleshoot hardware and software issues, manage user access, and maintain IT infrastructure.',
        'Input high-volume records into cloud database systems with precision and audit compliance.',
        'Support network setup, run diagnostic tests, configure routers, and monitor server uptime.',
        'Execute automated test scripts, record bug reports, and verify feature releases.',
        'Monitor cloud infrastructure metrics, assist with server provisioning, and manage user permissions.',
      ],
    },
    {
      category: 'Customer Care & Sales',
      titles: ['Customer Support Representative', 'Sales Executive', 'Call Center Operator', 'Client Manager', 'Telemarketing Agent', 'Retail Sales Consultant'],
      descriptions: [
        'Handle inbound client inquiries via phone, email, and live chat with professional warmth.',
        'Drive sales growth, reach out to prospective clients, and present tailored service solutions.',
        'Manage high-volume inbound call queues, resolve complaints, and log ticket details accurately.',
        'Build long term partnerships, coordinate account renewals, and ensure client satisfaction.',
        'Conduct outbound lead generation calls, qualify prospects, and book sales consultations.',
        'Greet retail shoppers, demonstrate product features, process transactions, and hit monthly targets.',
      ],
    },
    {
      category: 'General Manual Labor',
      titles: ['Factory Assembler', 'Packaging Worker', 'General Laborer', 'Facility Assistant', 'Material Handler', 'Sanitation Crew Member'],
      descriptions: [
        'Assemble products on fast-paced manufacturing lines maintaining strict quality standards.',
        'Package finished goods, apply shipping labels, and prepare pallets for distribution.',
        'Execute physical task assignments, move heavy materials, and keep operational areas organized.',
        'Perform facility maintenance, floor care, equipment cleaning, and waste management.',
        'Load and unload freight containers, move raw materials to assembly lines, and organize staging zones.',
        'Sanitize industrial equipment, clean production floors, and enforce workplace health regulations.',
      ],
    },
    {
      category: 'Administrative Support',
      titles: ['Administrative Assistant', 'Office Coordinator', 'Records Clerk', 'Front Desk Receptionist', 'Executive Secretary', 'Document Controller'],
      descriptions: [
        'Schedule executive meetings, manage office correspondence, and maintain digital filing systems.',
        'Coordinate office supplies, manage facility vendors, and support department administrative needs.',
        'Organize confidential archives, digitize paper documents, and verify database integrity.',
        'Greet office visitors, answer main switchboard lines, and manage incoming postal deliveries.',
        'Manage executive calendars, arrange corporate travel itineraries, and draft meeting minutes.',
        'Index project documentation, track drawing revisions, and ensure regulatory file compliance.',
      ],
    },
    {
      category: 'Security & Safety',
      titles: ['Security Guard', 'CCTV Monitoring Officer', 'Site Access Controller', 'Safety Warden', 'Patrol Guard', 'Loss Prevention Officer'],
      descriptions: [
        'Patrol premises, monitor surveillance cameras, control access points, and ensure building security.',
        'Monitor continuous live feeds across camera arrays, detect unauthorized movements, and dispatch responders.',
        'Verify visitor credentials, issue visitor badges, inspect vehicle gates, and record visitor registries.',
        'Enforce emergency evacuation procedures, inspect fire exits, and perform safety drills.',
        'Conduct routine perimeter patrols, check locked facilities, and submit daily security logbooks.',
        'Inspect merchandise flows, minimize shrinkage, detect suspicious activity, and audit floor security.',
      ],
    },
    {
      category: 'Education & Childcare',
      titles: ['Nanny & Au Pair', 'Early Childhood Assistant', 'Tutor', 'Childcare Worker', 'Learning Support Assistant'],
      descriptions: [
        'Provide nurturing childcare, assist with educational activities, organize meal routines, and ensure child safety.',
        'Support early childhood educators, prepare learning crafts, supervise play sessions, and organize storytime.',
        'Provide one-on-one academic tutoring, review homework assignments, and improve student comprehension.',
        'Supervise children at day care centers, coordinate healthy snacks, and support development milestones.',
        'Assist special learning programs, guide individual student exercises, and encourage positive engagement.',
      ],
    },
    {
      category: 'Cleaning & Housekeeping',
      titles: ['Commercial Cleaner', 'Executive Housekeeper', 'Residential Cleaner', 'Industrial Sanitation Specialist'],
      descriptions: [
        'Clean and sanitize corporate office spaces, disinfect surfaces, and restock washroom supplies.',
        'Manage comprehensive housekeeping duties for hospitality suites and executive residences.',
        'Perform thorough cleaning of domestic residences, vacuum carpets, polish surfaces, and organize living areas.',
        'Operate high-pressure industrial cleaners, disinfect food processing areas, and manage hazardous cleanup.',
      ],
    },
  ];

  let idCounter = 100;
  for (const dest of destinationConfig) {
    const fee = getFeeForCountry(dest.country);

    for (const region of dest.regions) {
      for (const cat of categoriesWithTitles) {
        for (let i = 0; i < cat.titles.length; i++) {
          const title = cat.titles[i];
          const desc = cat.descriptions[i % cat.descriptions.length];

          const salMin = Math.round(dest.minSal * (1 + ((i * 7) % 30) / 100));
          const salMax = Math.round(dest.maxSal * (1 + ((i * 11) % 35) / 100));
          const positions = 5 + ((idCounter * 3) % 45);

          const daysAgo = (idCounter % 40) + 1;
          const postDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

          const isKenya = dest.country === 'Kenya';
          const jobTitle = isKenya ? `${title} - ${region} County` : `${title} - ${dest.country} (${region})`;
          const jobDescription = isKenya
            ? `${desc} Direct local placement available across ${region} County, Kenya. Immediate onboarding with accredited statutory terms and localized career advancement.`
            : `${desc} Located in ${region}, ${dest.country}. Adecco Group Agency offers end-to-end relocation guidance, embassy documentation processing, and verified employment placement.`;
          const jobRequirements = isKenya
            ? `National ID card, valid certificate of good conduct, relevant vocational background in ${cat.category.toLowerCase()}, and strong work ethic.`
            : `Valid passport (for overseas roles), medical fitness clearance, relevant basic experience in ${cat.category.toLowerCase()}, and strong work ethic.`;

          jobs.push({
            id: `job_${idCounter}`,
            title: jobTitle,
            country: dest.country,
            region_county: region,
            category: cat.category,
            description: jobDescription,
            requirements: jobRequirements,
            fee_amount: fee,
            status: 'active',
            salary_range: `${dest.currency} ${salMin.toLocaleString()} - ${salMax.toLocaleString()}/month`,
            positions_available: positions,
            created_at: postDate,
          });

          idCounter++;
        }
      }
    }
  }

  return jobs;
}
