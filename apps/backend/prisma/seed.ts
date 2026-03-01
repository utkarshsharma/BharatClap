import { PrismaClient, UserRole, KycStatus, BookingStatus, PaymentStatus, PayoutStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BharatClap database...');

  // ─── Clean existing data ──────────────────────────────────────────────────
  await prisma.chatMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingStatusLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.recurringBooking.deleteMany();
  await prisma.favoriteProvider.deleteMany();
  await prisma.providerAvailability.deleteMany();
  await prisma.providerPortfolio.deleteMany();
  await prisma.providerService.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.address.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('  Cleaned existing data');

  // ─── Categories (8) ─────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Salon for Women', nameHi: 'महिलाओं के लिए सैलून', nameMr: 'महिलांसाठी सलून', nameKn: 'ಮಹಿಳೆಯರಿಗೆ ಸಲೂನ್', slug: 'salon-women', iconUrl: '💇‍♀️', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { name: 'Salon for Men', nameHi: 'पुरुषों के लिए सैलून', nameMr: 'पुरुषांसाठी सलून', nameKn: 'ಪುರುಷರಿಗೆ ಸಲೂನ್', slug: 'salon-men', iconUrl: '💈', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { name: 'AC & Appliance Repair', nameHi: 'AC और उपकरण मरम्मत', nameMr: 'AC आणि उपकरण दुरुस्ती', nameKn: 'AC ಮತ್ತು ಉಪಕರಣ ರಿಪೇರಿ', slug: 'ac-appliance', iconUrl: '❄️', sortOrder: 3 },
    }),
    prisma.category.create({
      data: { name: 'Home Cleaning', nameHi: 'घर की सफाई', nameMr: 'घराची सफाई', nameKn: 'ಮನೆ ಶುಚಿಗೊಳಿಸುವಿಕೆ', slug: 'cleaning', iconUrl: '🧹', sortOrder: 4 },
    }),
    prisma.category.create({
      data: { name: 'Electrician', nameHi: 'इलेक्ट्रीशियन', nameMr: 'इलेक्ट्रिशियन', nameKn: 'ಎಲೆಕ್ಟ್ರೀಶಿಯನ್', slug: 'electrician', iconUrl: '⚡', sortOrder: 5 },
    }),
    prisma.category.create({
      data: { name: 'Plumber', nameHi: 'प्लंबर', nameMr: 'प्लंबर', nameKn: 'ಪ್ಲಂಬರ್', slug: 'plumber', iconUrl: '🔧', sortOrder: 6 },
    }),
    prisma.category.create({
      data: { name: 'Painter', nameHi: 'पेंटर', nameMr: 'पेंटर', nameKn: 'ಪೇಂಟರ್', slug: 'painter', iconUrl: '🎨', sortOrder: 7 },
    }),
    prisma.category.create({
      data: { name: 'Pest Control', nameHi: 'कीट नियंत्रण', nameMr: 'कीटक नियंत्रण', nameKn: 'ಕೀಟ ನಿಯಂತ್ರಣ', slug: 'pest-control', iconUrl: '🐛', sortOrder: 8 },
    }),
  ]);

  console.log(`  Created ${categories.length} categories`);

  const [salonWomen, salonMen, acAppliance, cleaning, electrician, plumber, painter, pestControl] = categories;

  // ─── Services (50+) ────────────────────────────────────────────────────
  const servicesData = [
    // Salon for Women (8)
    { categoryId: salonWomen.id, name: 'Haircut & Styling', nameHi: 'हेयरकट और स्टाइलिंग', slug: 'haircut-styling-women', basePrice: 49900, durationMin: 45, inclusions: ['Wash', 'Cut', 'Blow dry'], exclusions: ['Hair color', 'Treatment'] },
    { categoryId: salonWomen.id, name: 'Classic Facial', nameHi: 'क्लासिक फेशियल', slug: 'classic-facial', basePrice: 69900, durationMin: 60, inclusions: ['Cleansing', 'Scrub', 'Massage', 'Pack'], exclusions: ['Gold pack', 'De-tan'] },
    { categoryId: salonWomen.id, name: 'Full Body Waxing', nameHi: 'फुल बॉडी वैक्सिंग', slug: 'full-body-waxing', basePrice: 129900, durationMin: 90, inclusions: ['Arms', 'Legs', 'Underarms'], exclusions: ['Face', 'Bikini'] },
    { categoryId: salonWomen.id, name: 'Manicure & Pedicure', nameHi: 'मैनीक्योर और पेडीक्योर', slug: 'manicure-pedicure', basePrice: 89900, durationMin: 75, inclusions: ['Soak', 'Scrub', 'Shape', 'Polish'], exclusions: ['Gel polish', 'Nail art'] },
    { categoryId: salonWomen.id, name: 'Bridal Makeup', nameHi: 'ब्राइडल मेकअप', slug: 'bridal-makeup', basePrice: 499900, durationMin: 120, inclusions: ['HD makeup', 'Hairstyling', 'Draping'], exclusions: ['Pre-bridal package', 'Travel'] },
    { categoryId: salonWomen.id, name: 'Threading (Full Face)', nameHi: 'थ्रेडिंग (पूरा चेहरा)', slug: 'threading-full-face', basePrice: 19900, durationMin: 20, inclusions: ['Eyebrows', 'Upper lip', 'Forehead'], exclusions: ['Waxing'] },
    { categoryId: salonWomen.id, name: 'Hair Color', nameHi: 'हेयर कलर', slug: 'hair-color-women', basePrice: 149900, durationMin: 90, inclusions: ['Global color', "L'Oreal products"], exclusions: ['Highlights', 'Balayage'] },
    { categoryId: salonWomen.id, name: 'Head Massage', nameHi: 'हेड मसाज', slug: 'head-massage-women', basePrice: 34900, durationMin: 30, inclusions: ['Oil massage', 'Relaxation'], exclusions: ['Full body massage'] },

    // Salon for Men (7)
    { categoryId: salonMen.id, name: 'Haircut', nameHi: 'हेयरकट', slug: 'haircut-men', basePrice: 29900, durationMin: 30, inclusions: ['Wash', 'Cut', 'Styling'], exclusions: ['Beard trim', 'Color'] },
    { categoryId: salonMen.id, name: 'Beard Trim & Styling', nameHi: 'दाढ़ी ट्रिम और स्टाइलिंग', slug: 'beard-trim', basePrice: 19900, durationMin: 20, inclusions: ['Trim', 'Shape', 'Oil'], exclusions: ['Shave'] },
    { categoryId: salonMen.id, name: 'Clean Shave', nameHi: 'क्लीन शेव', slug: 'clean-shave', basePrice: 14900, durationMin: 15, inclusions: ['Hot towel', 'Shave', 'Aftershave'], exclusions: ['Beard styling'] },
    { categoryId: salonMen.id, name: 'Hair Color', nameHi: 'हेयर कलर', slug: 'hair-color-men', basePrice: 49900, durationMin: 45, inclusions: ['Color', 'Wash'], exclusions: ['Highlights'] },
    { categoryId: salonMen.id, name: 'Facial (Men)', nameHi: 'फेशियल (पुरुष)', slug: 'facial-men', basePrice: 59900, durationMin: 45, inclusions: ['Cleansing', 'Scrub', 'Pack'], exclusions: ['De-tan', 'Gold facial'] },
    { categoryId: salonMen.id, name: 'Head Massage', nameHi: 'हेड मसाज', slug: 'head-massage-men', basePrice: 29900, durationMin: 30, inclusions: ['Oil massage', 'Pressure points'], exclusions: ['Full body'] },
    { categoryId: salonMen.id, name: 'Detan Pack', nameHi: 'डीटैन पैक', slug: 'detan-pack-men', basePrice: 39900, durationMin: 30, inclusions: ['Face', 'Neck', 'Arms'], exclusions: ['Full body'] },

    // AC & Appliance (7)
    { categoryId: acAppliance.id, name: 'AC Service (Split)', nameHi: 'AC सर्विस (स्प्लिट)', slug: 'ac-service-split', basePrice: 49900, durationMin: 60, inclusions: ['Gas check', 'Filter clean', 'Jet spray'], exclusions: ['Spare parts', 'Gas refill'] },
    { categoryId: acAppliance.id, name: 'AC Service (Window)', nameHi: 'AC सर्विस (विंडो)', slug: 'ac-service-window', basePrice: 39900, durationMin: 45, inclusions: ['Filter clean', 'Gas check', 'Coil clean'], exclusions: ['Spare parts'] },
    { categoryId: acAppliance.id, name: 'AC Gas Refill', nameHi: 'AC गैस रिफिल', slug: 'ac-gas-refill', basePrice: 199900, durationMin: 60, inclusions: ['R32/R410 gas', 'Leak check'], exclusions: ['Compressor repair'] },
    { categoryId: acAppliance.id, name: 'AC Installation', nameHi: 'AC इंस्टॉलेशन', slug: 'ac-installation', basePrice: 149900, durationMin: 120, inclusions: ['Mounting', 'Piping up to 3ft', 'Testing'], exclusions: ['Extra piping', 'Electrical work'] },
    { categoryId: acAppliance.id, name: 'Washing Machine Repair', nameHi: 'वॉशिंग मशीन रिपेयर', slug: 'washing-machine-repair', basePrice: 39900, durationMin: 60, inclusions: ['Diagnosis', 'Minor repair'], exclusions: ['Spare parts', 'Motor replacement'] },
    { categoryId: acAppliance.id, name: 'Refrigerator Repair', nameHi: 'रेफ्रिजरेटर रिपेयर', slug: 'refrigerator-repair', basePrice: 39900, durationMin: 60, inclusions: ['Diagnosis', 'Gas check', 'Thermostat'], exclusions: ['Compressor', 'Spare parts'] },
    { categoryId: acAppliance.id, name: 'Geyser Repair', nameHi: 'गीजर रिपेयर', slug: 'geyser-repair', basePrice: 29900, durationMin: 45, inclusions: ['Element check', 'Thermostat', 'Leak fix'], exclusions: ['Tank replacement'] },

    // Home Cleaning (6)
    { categoryId: cleaning.id, name: 'Full Home Deep Clean', nameHi: 'पूरे घर की डीप क्लीनिंग', slug: 'full-home-deep-clean', basePrice: 299900, durationMin: 240, inclusions: ['All rooms', 'Kitchen', 'Bathrooms', 'Balcony'], exclusions: ['Carpet shampooing', 'Sofa cleaning'] },
    { categoryId: cleaning.id, name: 'Kitchen Deep Clean', nameHi: 'किचन डीप क्लीन', slug: 'kitchen-deep-clean', basePrice: 149900, durationMin: 120, inclusions: ['Chimney', 'Gas stove', 'Cabinets', 'Sink'], exclusions: ['Appliance repair'] },
    { categoryId: cleaning.id, name: 'Bathroom Deep Clean', nameHi: 'बाथरूम डीप क्लीन', slug: 'bathroom-deep-clean', basePrice: 79900, durationMin: 60, inclusions: ['Tiles', 'Toilet', 'Basin', 'Mirror'], exclusions: ['Plumbing repair'] },
    { categoryId: cleaning.id, name: 'Sofa Cleaning', nameHi: 'सोफा क्लीनिंग', slug: 'sofa-cleaning', basePrice: 99900, durationMin: 90, inclusions: ['Vacuuming', 'Shampooing', 'Stain removal'], exclusions: ['Leather conditioning'] },
    { categoryId: cleaning.id, name: 'Carpet Shampooing', nameHi: 'कार्पेट शैम्पूइंग', slug: 'carpet-shampooing', basePrice: 79900, durationMin: 60, inclusions: ['Vacuum', 'Shampoo', 'Extraction'], exclusions: ['Stain guarantee'] },
    { categoryId: cleaning.id, name: 'Water Tank Cleaning', nameHi: 'पानी की टंकी साफ़', slug: 'water-tank-cleaning', basePrice: 119900, durationMin: 90, inclusions: ['Drain', 'Scrub', 'Disinfect', 'Refill'], exclusions: ['Plumbing repair'] },

    // Electrician (7)
    { categoryId: electrician.id, name: 'Fan Installation', nameHi: 'पंखा लगाना', slug: 'fan-installation', basePrice: 24900, durationMin: 30, inclusions: ['Installation', 'Wiring', 'Testing'], exclusions: ['Fan purchase', 'New wiring'] },
    { categoryId: electrician.id, name: 'Switchboard Repair', nameHi: 'स्विचबोर्ड रिपेयर', slug: 'switchboard-repair', basePrice: 19900, durationMin: 30, inclusions: ['Diagnosis', 'Switch replacement', 'Testing'], exclusions: ['New board', 'Wiring'] },
    { categoryId: electrician.id, name: 'Wiring & Cabling', nameHi: 'वायरिंग और केबलिंग', slug: 'wiring-cabling', basePrice: 49900, durationMin: 60, inclusions: ['New points', 'Cabling', 'Testing'], exclusions: ['MCB panel', 'Heavy load'] },
    { categoryId: electrician.id, name: 'Inverter Installation', nameHi: 'इन्वर्टर इंस्टॉलेशन', slug: 'inverter-installation', basePrice: 49900, durationMin: 60, inclusions: ['Setup', 'Battery connection', 'Testing'], exclusions: ['Inverter purchase', 'Wiring'] },
    { categoryId: electrician.id, name: 'Light Fixture Installation', nameHi: 'लाइट फिक्सचर लगाना', slug: 'light-fixture-install', basePrice: 19900, durationMin: 30, inclusions: ['Mounting', 'Wiring', 'Testing'], exclusions: ['Fixture purchase'] },
    { categoryId: electrician.id, name: 'MCB/Fuse Repair', nameHi: 'MCB/फ्यूज रिपेयर', slug: 'mcb-fuse-repair', basePrice: 29900, durationMin: 30, inclusions: ['Diagnosis', 'Replacement', 'Testing'], exclusions: ['Panel upgrade'] },
    { categoryId: electrician.id, name: 'Doorbell Installation', nameHi: 'डोरबेल लगाना', slug: 'doorbell-installation', basePrice: 14900, durationMin: 20, inclusions: ['Installation', 'Wiring', 'Testing'], exclusions: ['Doorbell purchase'] },

    // Plumber (7)
    { categoryId: plumber.id, name: 'Tap Repair/Replace', nameHi: 'नल रिपेयर/बदलना', slug: 'tap-repair', basePrice: 19900, durationMin: 30, inclusions: ['Repair', 'Washer replace', 'Leak fix'], exclusions: ['New tap', 'Pipe change'] },
    { categoryId: plumber.id, name: 'Toilet Repair', nameHi: 'टॉयलेट रिपेयर', slug: 'toilet-repair', basePrice: 29900, durationMin: 45, inclusions: ['Flush repair', 'Seat fix', 'Leak fix'], exclusions: ['Toilet replacement', 'Pipe work'] },
    { categoryId: plumber.id, name: 'Pipe Leak Repair', nameHi: 'पाइप लीक रिपेयर', slug: 'pipe-leak-repair', basePrice: 29900, durationMin: 45, inclusions: ['Leak detection', 'Joint repair', 'Testing'], exclusions: ['Pipe replacement', 'Wall breaking'] },
    { categoryId: plumber.id, name: 'Drain Cleaning', nameHi: 'नाली साफ़', slug: 'drain-cleaning', basePrice: 24900, durationMin: 30, inclusions: ['Chemical treatment', 'Manual clearing'], exclusions: ['Camera inspection', 'Pipe replacement'] },
    { categoryId: plumber.id, name: 'Basin/Sink Installation', nameHi: 'बेसिन/सिंक इंस्टॉलेशन', slug: 'basin-sink-install', basePrice: 39900, durationMin: 60, inclusions: ['Mounting', 'Plumbing connection', 'Testing'], exclusions: ['Basin purchase', 'Tiling'] },
    { categoryId: plumber.id, name: 'Water Purifier Installation', nameHi: 'वॉटर प्यूरीफायर इंस्टॉलेशन', slug: 'water-purifier-install', basePrice: 34900, durationMin: 45, inclusions: ['Mount', 'Plumbing', 'Testing'], exclusions: ['Purifier purchase'] },
    { categoryId: plumber.id, name: 'Geyser Installation', nameHi: 'गीजर इंस्टॉलेशन', slug: 'geyser-installation', basePrice: 44900, durationMin: 60, inclusions: ['Mounting', 'Plumbing', 'Electrical', 'Testing'], exclusions: ['Geyser purchase'] },

    // Painter (6)
    { categoryId: painter.id, name: '1 Room Painting', nameHi: '1 कमरा पेंटिंग', slug: 'one-room-painting', basePrice: 399900, durationMin: 480, inclusions: ['Primer', '2 coats', 'Asian Paints'], exclusions: ['Furniture moving', 'Texture'] },
    { categoryId: painter.id, name: 'Full Home Painting (2BHK)', nameHi: 'पूरा घर पेंटिंग (2BHK)', slug: 'full-home-painting-2bhk', basePrice: 1499900, durationMin: 2880, inclusions: ['All rooms', 'Primer', '2 coats'], exclusions: ['Texture', 'Waterproofing'] },
    { categoryId: painter.id, name: 'Texture Painting', nameHi: 'टेक्सचर पेंटिंग', slug: 'texture-painting', basePrice: 199900, durationMin: 240, inclusions: ['One wall', 'Royal Texture'], exclusions: ['Prep work', 'Multi-wall'] },
    { categoryId: painter.id, name: 'Waterproofing', nameHi: 'वॉटरप्रूफिंग', slug: 'waterproofing', basePrice: 249900, durationMin: 300, inclusions: ['Surface prep', 'Waterproof coat', '1-year warranty'], exclusions: ['Structural repair'] },
    { categoryId: painter.id, name: 'Wood Polish', nameHi: 'वुड पॉलिश', slug: 'wood-polish', basePrice: 149900, durationMin: 180, inclusions: ['Sanding', 'Polish', 'Melamine coat'], exclusions: ['Repair work'] },
    { categoryId: painter.id, name: 'Wall Stencil Art', nameHi: 'वॉल स्टेंसिल आर्ट', slug: 'wall-stencil-art', basePrice: 99900, durationMin: 120, inclusions: ['One wall', 'Stencil design', 'Paint'], exclusions: ['Custom design'] },

    // Pest Control (6)
    { categoryId: pestControl.id, name: 'Cockroach Control', nameHi: 'कॉकरोच कंट्रोल', slug: 'cockroach-control', basePrice: 99900, durationMin: 60, inclusions: ['Gel treatment', 'Kitchen + bathrooms', '30-day warranty'], exclusions: ['Deep infestation'] },
    { categoryId: pestControl.id, name: 'Ant Control', nameHi: 'चींटी कंट्रोल', slug: 'ant-control', basePrice: 79900, durationMin: 45, inclusions: ['Spray treatment', 'Entry points seal'], exclusions: ['Termite treatment'] },
    { categoryId: pestControl.id, name: 'Bed Bug Treatment', nameHi: 'बेड बग ट्रीटमेंट', slug: 'bed-bug-treatment', basePrice: 199900, durationMin: 120, inclusions: ['Full room spray', 'Mattress treatment', '60-day warranty'], exclusions: ['Mattress disposal'] },
    { categoryId: pestControl.id, name: 'Termite Control', nameHi: 'दीमक कंट्रोल', slug: 'termite-control', basePrice: 299900, durationMin: 180, inclusions: ['Drilling', 'Chemical treatment', '5-year warranty'], exclusions: ['Structural repair'] },
    { categoryId: pestControl.id, name: 'Mosquito Control', nameHi: 'मच्छर कंट्रोल', slug: 'mosquito-control', basePrice: 79900, durationMin: 45, inclusions: ['Fogging', 'Larvicide', 'All rooms'], exclusions: ['Outdoor treatment'] },
    { categoryId: pestControl.id, name: 'Rat Control', nameHi: 'चूहा कंट्रोल', slug: 'rat-control', basePrice: 149900, durationMin: 60, inclusions: ['Bait stations', 'Entry point sealing', '30-day warranty'], exclusions: ['Dead animal removal'] },
  ];

  const services = await Promise.all(
    servicesData.map((s, i) =>
      prisma.service.create({
        data: { ...s, sortOrder: i + 1, description: `Professional ${s.name.toLowerCase()} service at your doorstep.` },
      }),
    ),
  );

  console.log(`  Created ${services.length} services`);

  // ─── Demo Users (Admin + Customers + Providers) ─────────────────────────
  const cities = ['Delhi NCR', 'Mumbai', 'Bangalore'];

  // Admin
  const admin = await prisma.user.create({
    data: { phone: '9999900000', name: 'Admin', role: UserRole.ADMIN, firebaseUid: 'admin-uid-001', city: 'Delhi NCR', isActive: true },
  });

  // Customers (5)
  const customers = await Promise.all([
    prisma.user.create({ data: { phone: '9876543210', name: 'Priya Sharma', role: UserRole.CUSTOMER, firebaseUid: 'cust-uid-001', city: 'Bangalore', preferredLanguage: 'en' } }),
    prisma.user.create({ data: { phone: '9876543211', name: 'Rajesh Sharma', role: UserRole.CUSTOMER, firebaseUid: 'cust-uid-002', city: 'Delhi NCR', preferredLanguage: 'hi' } }),
    prisma.user.create({ data: { phone: '9876543212', name: 'Meera Joshi', role: UserRole.CUSTOMER, firebaseUid: 'cust-uid-003', city: 'Mumbai', preferredLanguage: 'en' } }),
    prisma.user.create({ data: { phone: '9876543213', name: 'Arjun Reddy', role: UserRole.CUSTOMER, firebaseUid: 'cust-uid-004', city: 'Bangalore', preferredLanguage: 'kn' } }),
    prisma.user.create({ data: { phone: '9876543214', name: 'Nisha Patel', role: UserRole.CUSTOMER, firebaseUid: 'cust-uid-005', city: 'Mumbai', preferredLanguage: 'mr' } }),
  ]);

  console.log(`  Created ${customers.length} customers + 1 admin`);

  // Provider users (25)
  const providerNames = [
    { name: 'Raju Kumar', city: 'Delhi NCR', phone: '9800000001' },
    { name: 'Sunita Devi', city: 'Mumbai', phone: '9800000002' },
    { name: 'Vikram Singh', city: 'Bangalore', phone: '9800000003' },
    { name: 'Pooja Mehra', city: 'Delhi NCR', phone: '9800000004' },
    { name: 'Amit Sharma', city: 'Mumbai', phone: '9800000005' },
    { name: 'Deepak Yadav', city: 'Delhi NCR', phone: '9800000006' },
    { name: 'Rekha Gupta', city: 'Bangalore', phone: '9800000007' },
    { name: 'Suresh Patel', city: 'Mumbai', phone: '9800000008' },
    { name: 'Kavita Singh', city: 'Delhi NCR', phone: '9800000009' },
    { name: 'Manoj Tiwari', city: 'Bangalore', phone: '9800000010' },
    { name: 'Anita Kumari', city: 'Mumbai', phone: '9800000011' },
    { name: 'Rohit Verma', city: 'Delhi NCR', phone: '9800000012' },
    { name: 'Priyanka Das', city: 'Bangalore', phone: '9800000013' },
    { name: 'Sanjay Mishra', city: 'Mumbai', phone: '9800000014' },
    { name: 'Neha Agarwal', city: 'Delhi NCR', phone: '9800000015' },
    { name: 'Kiran Reddy', city: 'Bangalore', phone: '9800000016' },
    { name: 'Ramesh Chauhan', city: 'Mumbai', phone: '9800000017' },
    { name: 'Geeta Devi', city: 'Delhi NCR', phone: '9800000018' },
    { name: 'Arun Kumar', city: 'Bangalore', phone: '9800000019' },
    { name: 'Sapna Jain', city: 'Mumbai', phone: '9800000020' },
    { name: 'Vijay Pandey', city: 'Delhi NCR', phone: '9800000021' },
    { name: 'Lakshmi Nair', city: 'Bangalore', phone: '9800000022' },
    { name: 'Mahesh Iyer', city: 'Mumbai', phone: '9800000023' },
    { name: 'Asha Rani', city: 'Delhi NCR', phone: '9800000024' },
    { name: 'Ganesh Pillai', city: 'Bangalore', phone: '9800000025' },
  ];

  const providerUsers = await Promise.all(
    providerNames.map((p, i) =>
      prisma.user.create({
        data: {
          phone: p.phone,
          name: p.name,
          role: UserRole.PROVIDER,
          firebaseUid: `prov-uid-${String(i + 1).padStart(3, '0')}`,
          city: p.city,
          preferredLanguage: p.city === 'Mumbai' ? 'mr' : p.city === 'Bangalore' ? 'kn' : 'hi',
        },
      }),
    ),
  );

  console.log(`  Created ${providerUsers.length} provider users`);

  // City coordinates
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'Delhi NCR': { lat: 28.6139, lng: 77.209 },
    Mumbai: { lat: 19.076, lng: 72.8777 },
    Bangalore: { lat: 12.9716, lng: 77.5946 },
  };

  // Create provider profiles
  const providerProfiles = await Promise.all(
    providerUsers.map((user, i) => {
      const coords = cityCoords[providerNames[i].city];
      const rating = 3.5 + Math.random() * 1.4; // 3.5-4.9
      const verified = i < 18; // first 18 verified
      return prisma.providerProfile.create({
        data: {
          userId: user.id,
          bio: `Experienced ${['plumber', 'electrician', 'beautician', 'AC technician', 'cleaner', 'painter', 'pest control expert'][i % 7]} with ${3 + (i % 10)} years of experience. Known for quality work and punctuality.`,
          kycStatus: verified ? KycStatus.VERIFIED : KycStatus.NOT_STARTED,
          aadhaarVerified: verified,
          aadhaarLast4: verified ? String(1000 + i * 111).slice(0, 4) : null,
          baseLatitude: coords.lat + (Math.random() - 0.5) * 0.1,
          baseLongitude: coords.lng + (Math.random() - 0.5) * 0.1,
          serviceRadiusKm: [10, 15, 20, 25][i % 4],
          avgRating: Math.round(rating * 10) / 10,
          avgPunctuality: Math.round((rating + (Math.random() - 0.5) * 0.5) * 10) / 10,
          avgQuality: Math.round((rating + (Math.random() - 0.5) * 0.3) * 10) / 10,
          avgBehavior: Math.round((rating + (Math.random() - 0.5) * 0.4) * 10) / 10,
          avgValue: Math.round((rating + (Math.random() - 0.5) * 0.6) * 10) / 10,
          totalJobs: 10 + Math.floor(Math.random() * 490),
          totalEarnings: (50000 + Math.floor(Math.random() * 500000)) * 100,
          walletBalance: Math.floor(Math.random() * 20000) * 100,
          isAvailable: true,
          yearsExperience: 3 + (i % 10),
          languagesSpoken: providerNames[i].city === 'Mumbai' ? ['Hindi', 'Marathi', 'English'] : providerNames[i].city === 'Bangalore' ? ['Kannada', 'Hindi', 'English'] : ['Hindi', 'English'],
          certifications: i % 3 === 0 ? ['ITI Certified', 'Safety Training'] : [],
        },
      });
    }),
  );

  console.log(`  Created ${providerProfiles.length} provider profiles`);

  // Assign services to providers (each provider gets 2-4 services)
  const categoryServices: Record<string, typeof services> = {};
  for (const s of services) {
    const catId = s.categoryId;
    if (!categoryServices[catId]) categoryServices[catId] = [];
    categoryServices[catId].push(s);
  }

  const categoryIds = Object.keys(categoryServices);
  let provServiceCount = 0;

  for (let i = 0; i < providerProfiles.length; i++) {
    const profile = providerProfiles[i];
    // Each provider specializes in 1-2 categories
    const primaryCatIdx = i % categoryIds.length;
    const secondaryCatIdx = (i + 3) % categoryIds.length;
    const catServicesArr = [
      ...categoryServices[categoryIds[primaryCatIdx]].slice(0, 3),
      ...categoryServices[categoryIds[secondaryCatIdx]].slice(0, 2),
    ];

    for (const svc of catServicesArr) {
      const priceMultiplier = 0.9 + Math.random() * 0.4; // 90%-130% of base
      await prisma.providerService.create({
        data: {
          providerId: profile.id,
          serviceId: svc.id,
          customPrice: Math.round(svc.basePrice * priceMultiplier),
          isActive: true,
        },
      });
      provServiceCount++;
    }
  }

  console.log(`  Created ${provServiceCount} provider-service assignments`);

  // Provider availability (Mon-Sat 8am-7pm for most)
  for (const profile of providerProfiles) {
    for (let day = 1; day <= 6; day++) {
      // Mon-Sat
      await prisma.providerAvailability.create({
        data: {
          providerId: profile.id,
          dayOfWeek: day,
          startHour: 8,
          endHour: 19,
          isActive: true,
        },
      });
    }
  }

  console.log(`  Created provider availability (Mon-Sat 8am-7pm)`);

  // Customer addresses
  const addresses = await Promise.all([
    prisma.address.create({ data: { userId: customers[0].id, label: 'Home', addressLine: '42 Koramangala 4th Block', city: 'Bangalore', pincode: '560034', latitude: 12.9352, longitude: 77.6245, isDefault: true } }),
    prisma.address.create({ data: { userId: customers[0].id, label: 'Office', addressLine: '100 Whitefield Main Road', city: 'Bangalore', pincode: '560066', latitude: 12.9698, longitude: 77.7499 } }),
    prisma.address.create({ data: { userId: customers[1].id, label: 'Home', addressLine: '15 Sector 62, Noida', city: 'Delhi NCR', pincode: '201301', latitude: 28.6271, longitude: 77.3699, isDefault: true } }),
    prisma.address.create({ data: { userId: customers[2].id, label: 'Home', addressLine: '78 Bandra West, Hill Road', city: 'Mumbai', pincode: '400050', latitude: 19.0596, longitude: 72.8295, isDefault: true } }),
    prisma.address.create({ data: { userId: customers[3].id, label: 'Home', addressLine: '23 Indiranagar 100 Feet Road', city: 'Bangalore', pincode: '560038', latitude: 12.9784, longitude: 77.6408, isDefault: true } }),
    prisma.address.create({ data: { userId: customers[4].id, label: 'Home', addressLine: '56 Andheri East, Marol', city: 'Mumbai', pincode: '400059', latitude: 19.1136, longitude: 72.8697, isDefault: true } }),
  ]);

  console.log(`  Created ${addresses.length} customer addresses`);

  // Sample bookings (10)
  const sampleBookings = [];
  for (let i = 0; i < 10; i++) {
    const customer = customers[i % customers.length];
    const providerUser = providerUsers[i % providerUsers.length];
    const service = services[i % services.length];
    const addr = addresses[i % addresses.length];
    const statuses: BookingStatus[] = [BookingStatus.COMPLETED, BookingStatus.COMPLETED, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.COMPLETED, BookingStatus.PENDING_PAYMENT, BookingStatus.COMPLETED];
    const status = statuses[i];

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        providerId: providerUser.id,
        serviceId: service.id,
        addressId: addr.id,
        status,
        scheduledDate: new Date(2026, 1, 15 + i),
        scheduledHour: 9 + (i % 10),
        amount: service.basePrice + Math.floor(Math.random() * 10000),
        otpCode: status !== BookingStatus.PENDING_PAYMENT ? String(1000 + Math.floor(Math.random() * 9000)) : null,
        completedAt: status === BookingStatus.COMPLETED ? new Date(2026, 1, 15 + i, 11 + (i % 5)) : null,
      },
    });
    sampleBookings.push(booking);
  }

  console.log(`  Created ${sampleBookings.length} sample bookings`);

  // Sample payments for completed/confirmed bookings
  let paymentCount = 0;
  for (const booking of sampleBookings) {
    if (booking.status === BookingStatus.PENDING_PAYMENT) continue;
    const commission = Math.round(booking.amount * 0.2);
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        razorpayOrderId: `order_test_${booking.id.slice(0, 8)}`,
        razorpayPaymentId: booking.status === BookingStatus.CANCELLED ? null : `pay_test_${booking.id.slice(0, 8)}`,
        amount: booking.amount,
        status: booking.status === BookingStatus.CANCELLED ? PaymentStatus.REFUNDED : PaymentStatus.CAPTURED,
        commission,
        providerPayout: booking.amount - commission,
        payoutStatus: booking.status === BookingStatus.COMPLETED ? PayoutStatus.COMPLETED : PayoutStatus.PENDING,
      },
    });
    paymentCount++;
  }

  console.log(`  Created ${paymentCount} payments`);

  // Sample reviews for completed bookings
  let reviewCount = 0;
  for (const booking of sampleBookings) {
    if (booking.status !== BookingStatus.COMPLETED || !booking.providerId) continue;
    const p = Math.round(3 + Math.random() * 2);
    const q = Math.round(3 + Math.random() * 2);
    const b = Math.round(3 + Math.random() * 2);
    const v = Math.round(3 + Math.random() * 2);
    await prisma.review.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        providerId: booking.providerId,
        ratingPunctuality: p,
        ratingQuality: q,
        ratingBehavior: b,
        ratingValue: v,
        ratingOverall: Math.round((p + q + b + v) / 4),
        comment: ['Great service, very professional!', 'Good work, arrived on time.', 'Excellent quality, highly recommend!', 'Decent work, could be better on time.', 'Amazing work, will book again!'][reviewCount % 5],
      },
    });
    reviewCount++;
  }

  console.log(`  Created ${reviewCount} reviews`);

  console.log('\n✅ Seeding complete!');
  console.log(`   ${categories.length} categories`);
  console.log(`   ${services.length} services`);
  console.log(`   ${providerUsers.length + customers.length + 1} users (1 admin, ${customers.length} customers, ${providerUsers.length} providers)`);
  console.log(`   ${providerProfiles.length} provider profiles`);
  console.log(`   ${provServiceCount} provider-service assignments`);
  console.log(`   ${sampleBookings.length} bookings`);
  console.log(`   ${paymentCount} payments`);
  console.log(`   ${reviewCount} reviews`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
