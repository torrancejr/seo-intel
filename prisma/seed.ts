import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const prisma = new PrismaClient();

const cities = [
  // Top 50 US Cities by Population
  { name: 'New York', state: 'New York', stateCode: 'NY', slug: 'new-york-ny', population: 8336817, metroPopulation: 19768458 },
  { name: 'Los Angeles', state: 'California', stateCode: 'CA', slug: 'los-angeles-ca', population: 3979576, metroPopulation: 13200998 },
  { name: 'Chicago', state: 'Illinois', stateCode: 'IL', slug: 'chicago-il', population: 2746388, metroPopulation: 9618502 },
  { name: 'Houston', state: 'Texas', stateCode: 'TX', slug: 'houston-tx', population: 2304580, metroPopulation: 7122240 },
  { name: 'Phoenix', state: 'Arizona', stateCode: 'AZ', slug: 'phoenix-az', population: 1650070, metroPopulation: 4946145 },
  { name: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', slug: 'philadelphia-pa', population: 1584064, metroPopulation: 6245051 },
  { name: 'San Antonio', state: 'Texas', stateCode: 'TX', slug: 'san-antonio-tx', population: 1547253, metroPopulation: 2558143 },
  { name: 'San Diego', state: 'California', stateCode: 'CA', slug: 'san-diego-ca', population: 1423851, metroPopulation: 3298634 },
  { name: 'Dallas', state: 'Texas', stateCode: 'TX', slug: 'dallas-tx', population: 1343573, metroPopulation: 7637387 },
  { name: 'San Jose', state: 'California', stateCode: 'CA', slug: 'san-jose-ca', population: 1021795, metroPopulation: 1990660 },
  { name: 'Austin', state: 'Texas', stateCode: 'TX', slug: 'austin-tx', population: 979882, metroPopulation: 2283371 },
  { name: 'Jacksonville', state: 'Florida', stateCode: 'FL', slug: 'jacksonville-fl', population: 954614, metroPopulation: 1605848 },
  { name: 'Fort Worth', state: 'Texas', stateCode: 'TX', slug: 'fort-worth-tx', population: 942323, metroPopulation: 7637387 },
  { name: 'Columbus', state: 'Ohio', stateCode: 'OH', slug: 'columbus-oh', population: 905748, metroPopulation: 2138926 },
  { name: 'Charlotte', state: 'North Carolina', stateCode: 'NC', slug: 'charlotte-nc', population: 897720, metroPopulation: 2660329 },
  { name: 'San Francisco', state: 'California', stateCode: 'CA', slug: 'san-francisco-ca', population: 873965, metroPopulation: 4749008 },
  { name: 'Indianapolis', state: 'Indiana', stateCode: 'IN', slug: 'indianapolis-in', population: 876384, metroPopulation: 2111040 },
  { name: 'Seattle', state: 'Washington', stateCode: 'WA', slug: 'seattle-wa', population: 749256, metroPopulation: 4018762 },
  { name: 'Denver', state: 'Colorado', stateCode: 'CO', slug: 'denver-co', population: 715522, metroPopulation: 2963821 },
  { name: 'Washington', state: 'District of Columbia', stateCode: 'DC', slug: 'washington-dc', population: 689545, metroPopulation: 6385162 },
  { name: 'Boston', state: 'Massachusetts', stateCode: 'MA', slug: 'boston-ma', population: 675647, metroPopulation: 4941632 },
  { name: 'El Paso', state: 'Texas', stateCode: 'TX', slug: 'el-paso-tx', population: 678815, metroPopulation: 868859 },
  { name: 'Nashville', state: 'Tennessee', stateCode: 'TN', slug: 'nashville-tn', population: 689447, metroPopulation: 1989519 },
  { name: 'Detroit', state: 'Michigan', stateCode: 'MI', slug: 'detroit-mi', population: 639111, metroPopulation: 4365205 },
  { name: 'Oklahoma City', state: 'Oklahoma', stateCode: 'OK', slug: 'oklahoma-city-ok', population: 687725, metroPopulation: 1425695 },
  { name: 'Portland', state: 'Oregon', stateCode: 'OR', slug: 'portland-or', population: 652503, metroPopulation: 2512859 },
  { name: 'Las Vegas', state: 'Nevada', stateCode: 'NV', slug: 'las-vegas-nv', population: 641903, metroPopulation: 2265461 },
  { name: 'Memphis', state: 'Tennessee', stateCode: 'TN', slug: 'memphis-tn', population: 633104, metroPopulation: 1346045 },
  { name: 'Louisville', state: 'Kentucky', stateCode: 'KY', slug: 'louisville-ky', population: 633045, metroPopulation: 1395855 },
  { name: 'Baltimore', state: 'Maryland', stateCode: 'MD', slug: 'baltimore-md', population: 585708, metroPopulation: 2844510 },
  { name: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI', slug: 'milwaukee-wi', population: 577222, metroPopulation: 1574731 },
  { name: 'Albuquerque', state: 'New Mexico', stateCode: 'NM', slug: 'albuquerque-nm', population: 564559, metroPopulation: 916528 },
  { name: 'Tucson', state: 'Arizona', stateCode: 'AZ', slug: 'tucson-az', population: 548073, metroPopulation: 1043433 },
  { name: 'Fresno', state: 'California', stateCode: 'CA', slug: 'fresno-ca', population: 542107, metroPopulation: 1008654 },
  { name: 'Mesa', state: 'Arizona', stateCode: 'AZ', slug: 'mesa-az', population: 504258, metroPopulation: 4946145 },
  { name: 'Sacramento', state: 'California', stateCode: 'CA', slug: 'sacramento-ca', population: 524943, metroPopulation: 2397382 },
  { name: 'Atlanta', state: 'Georgia', stateCode: 'GA', slug: 'atlanta-ga', population: 498715, metroPopulation: 6089815 },
  { name: 'Kansas City', state: 'Missouri', stateCode: 'MO', slug: 'kansas-city-mo', population: 508090, metroPopulation: 2192035 },
  { name: 'Colorado Springs', state: 'Colorado', stateCode: 'CO', slug: 'colorado-springs-co', population: 478961, metroPopulation: 755105 },
  { name: 'Raleigh', state: 'North Carolina', stateCode: 'NC', slug: 'raleigh-nc', population: 474069, metroPopulation: 1413982 },
  { name: 'Omaha', state: 'Nebraska', stateCode: 'NE', slug: 'omaha-ne', population: 486051, metroPopulation: 967604 },
  { name: 'Miami', state: 'Florida', stateCode: 'FL', slug: 'miami-fl', population: 442241, metroPopulation: 6166488 },
  { name: 'Long Beach', state: 'California', stateCode: 'CA', slug: 'long-beach-ca', population: 466742, metroPopulation: 13200998 },
  { name: 'Virginia Beach', state: 'Virginia', stateCode: 'VA', slug: 'virginia-beach-va', population: 459470, metroPopulation: 1799674 },
  { name: 'Oakland', state: 'California', stateCode: 'CA', slug: 'oakland-ca', population: 440646, metroPopulation: 4749008 },
  { name: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', slug: 'minneapolis-mn', population: 429954, metroPopulation: 3690261 },
  { name: 'Tulsa', state: 'Oklahoma', stateCode: 'OK', slug: 'tulsa-ok', population: 413066, metroPopulation: 1023988 },
  { name: 'Tampa', state: 'Florida', stateCode: 'FL', slug: 'tampa-fl', population: 403364, metroPopulation: 3175275 },
  { name: 'Arlington', state: 'Texas', stateCode: 'TX', slug: 'arlington-tx', population: 398121, metroPopulation: 7637387 },
  { name: 'New Orleans', state: 'Louisiana', stateCode: 'LA', slug: 'new-orleans-la', population: 383997, metroPopulation: 1270530 },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed cities
  console.log('📍 Seeding cities...');
  for (const city of cities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: { ...city, lastDataRefresh: new Date() },
      create: { ...city, lastDataRefresh: new Date() },
    });
  }
  console.log(`✅ Seeded ${cities.length} cities`);

  // Seed default tenant
  console.log('🏢 Seeding default tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'seointel' },
    update: {},
    create: {
      name: 'SEOIntel',
      slug: 'seointel',
      domain: 'seointel.io',
      websiteUrl: 'https://seointel.io',
      businessDescription: 'SEOIntel is an AI-powered platform that generates location-specific blog content at scale.',
      planTier: 'ENTERPRISE',
    },
  });
  console.log('✅ Seeded default tenant');

  // Seed default topics
  console.log('🏷️  Seeding default topics...');
  const defaultTopics = [
    { name: 'Local Business', slug: 'local-business', isCustom: false },
    { name: 'Real Estate', slug: 'real-estate', isCustom: false },
    { name: 'Legal Services', slug: 'legal-services', isCustom: false },
    { name: 'Healthcare', slug: 'healthcare', isCustom: false },
    { name: 'Technology', slug: 'technology', isCustom: false },
  ];

  for (const topic of defaultTopics) {
    await prisma.topic.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: topic.slug } },
      update: {},
      create: { ...topic, tenantId: tenant.id },
    });
  }
  console.log(`✅ Seeded ${defaultTopics.length} topics`);

  // Seed demo user
  console.log('👤 Seeding demo user...');
  const hashedPassword = await hash('password', 10);
  await prisma.user.upsert({
    where: { email: 'admin@seointel.io' },
    update: {},
    create: {
      email: 'admin@seointel.io',
      name: 'Admin User',
      password: hashedPassword,
      tenantId: tenant.id,
      role: 'ADMIN',
    },
  });
  console.log('✅ Seeded demo user (admin@seointel.io / password)');

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
