import fs from 'node:fs';
import path from 'node:path';

type RepRow = {
  id: string;
  name: string;
  home_address: string;
  home_lat: number;
  home_lng: number;
  status: 'active' | 'inactive';
  employment_type: 'full-time' | 'part-time';
};

type LocationRow = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type AvailabilityRow = {
  id: string;
  rep_id: string;
  date: string;
  start_time: string;
  end_time: string;
};

type TimeOffRow = {
  id: string;
  rep_id: string;
  date: string;
  reason: string;
};

const outputDir = path.resolve(process.cwd(), 'manual-test-data', '30-rep-demo');
const weekOne = ['2026-03-15', '2026-03-16', '2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20', '2026-03-21'];
const weekTwo = ['2026-03-22', '2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26', '2026-03-27', '2026-03-28'];
const fullTimeDays = [weekOne[0], weekOne[1], weekOne[2], weekOne[3], weekOne[4], weekTwo[0], weekTwo[1], weekTwo[2], weekTwo[3], weekTwo[4]];
const partTimeDays = [weekOne[0], weekOne[1], weekOne[2], weekOne[3], weekTwo[0], weekTwo[1], weekTwo[2], weekTwo[3]];
const sparseDays = [weekOne[0], weekOne[2], weekTwo[0], weekTwo[2]];

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function writeCsv<T extends Record<string, string | number>>(filePath: string, rows: T[]): void {
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ];
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

const reps: RepRow[] = [
  { id: 'R001', name: 'Ava Brooks', home_address: 'Downtown Los Angeles', home_lat: 34.0469, home_lng: -118.2509, status: 'active', employment_type: 'full-time' },
  { id: 'R002', name: 'Noah Patel', home_address: 'Koreatown', home_lat: 34.0617, home_lng: -118.3004, status: 'active', employment_type: 'full-time' },
  { id: 'R003', name: 'Mia Carter', home_address: 'Hollywood', home_lat: 34.1015, home_lng: -118.3269, status: 'active', employment_type: 'full-time' },
  { id: 'R004', name: 'Liam Chen', home_address: 'Silver Lake', home_lat: 34.0869, home_lng: -118.2702, status: 'active', employment_type: 'full-time' },
  { id: 'R005', name: 'Emma Garcia', home_address: 'Echo Park', home_lat: 34.0782, home_lng: -118.2606, status: 'active', employment_type: 'full-time' },
  { id: 'R006', name: 'Ethan Kim', home_address: 'Pasadena', home_lat: 34.1478, home_lng: -118.1445, status: 'active', employment_type: 'full-time' },
  { id: 'R007', name: 'Sophia Nguyen', home_address: 'Glendale', home_lat: 34.1425, home_lng: -118.2551, status: 'active', employment_type: 'full-time' },
  { id: 'R008', name: 'Mason Rivera', home_address: 'Burbank', home_lat: 34.1808, home_lng: -118.3090, status: 'active', employment_type: 'full-time' },
  { id: 'R009', name: 'Isabella Torres', home_address: 'North Hollywood', home_lat: 34.1722, home_lng: -118.3781, status: 'active', employment_type: 'full-time' },
  { id: 'R010', name: 'Logan Murphy', home_address: 'Studio City', home_lat: 34.1391, home_lng: -118.3910, status: 'active', employment_type: 'full-time' },
  { id: 'R011', name: 'Charlotte Reed', home_address: 'West Hollywood', home_lat: 34.0900, home_lng: -118.3617, status: 'active', employment_type: 'full-time' },
  { id: 'R012', name: 'Lucas Flores', home_address: 'Mid City', home_lat: 34.0526, home_lng: -118.3443, status: 'active', employment_type: 'full-time' },
  { id: 'R013', name: 'Amelia Scott', home_address: 'Culver City', home_lat: 34.0211, home_lng: -118.3965, status: 'active', employment_type: 'full-time' },
  { id: 'R014', name: 'James Foster', home_address: 'Santa Monica', home_lat: 34.0195, home_lng: -118.4912, status: 'active', employment_type: 'full-time' },
  { id: 'R015', name: 'Harper Ward', home_address: 'Inglewood', home_lat: 33.9617, home_lng: -118.3531, status: 'active', employment_type: 'full-time' },
  { id: 'R016', name: 'Benjamin Diaz', home_address: 'El Segundo', home_lat: 33.9192, home_lng: -118.4165, status: 'active', employment_type: 'full-time' },
  { id: 'R017', name: 'Evelyn Price', home_address: 'Long Beach', home_lat: 33.7701, home_lng: -118.1937, status: 'active', employment_type: 'full-time' },
  { id: 'R018', name: 'Henry Cooper', home_address: 'Torrance', home_lat: 33.8358, home_lng: -118.3406, status: 'active', employment_type: 'full-time' },
  { id: 'R019', name: 'Abigail Perry', home_address: 'Redondo Beach', home_lat: 33.8492, home_lng: -118.3884, status: 'active', employment_type: 'full-time' },
  { id: 'R020', name: 'Sebastian Long', home_address: 'San Pedro', home_lat: 33.7361, home_lng: -118.2922, status: 'active', employment_type: 'full-time' },
  { id: 'R021', name: 'Ella Bennett', home_address: 'Downtown Los Angeles', home_lat: 34.0437, home_lng: -118.2519, status: 'active', employment_type: 'part-time' },
  { id: 'R022', name: 'Jack Hughes', home_address: 'Koreatown', home_lat: 34.0640, home_lng: -118.3070, status: 'active', employment_type: 'part-time' },
  { id: 'R023', name: 'Scarlett Ross', home_address: 'Hollywood', home_lat: 34.0988, home_lng: -118.3291, status: 'active', employment_type: 'part-time' },
  { id: 'R024', name: 'Owen Sanders', home_address: 'Pasadena', home_lat: 34.1494, home_lng: -118.1390, status: 'active', employment_type: 'part-time' },
  { id: 'R025', name: 'Grace Powell', home_address: 'Glendale', home_lat: 34.1500, home_lng: -118.2478, status: 'active', employment_type: 'part-time' },
  { id: 'R026', name: 'Leo Simmons', home_address: 'Burbank', home_lat: 34.1770, home_lng: -118.3150, status: 'active', employment_type: 'part-time' },
  { id: 'R027', name: 'Chloe Jenkins', home_address: 'West Hollywood', home_lat: 34.0887, home_lng: -118.3722, status: 'inactive', employment_type: 'full-time' },
  { id: 'R028', name: 'Daniel Hayes', home_address: 'Santa Monica', home_lat: 34.0138, home_lng: -118.4952, status: 'inactive', employment_type: 'full-time' },
  { id: 'R029', name: 'Lily Bryant', home_address: 'Inglewood', home_lat: 33.9591, home_lng: -118.3477, status: 'active', employment_type: 'part-time' },
  { id: 'R030', name: 'Wyatt Coleman', home_address: 'Culver City', home_lat: 34.0250, home_lng: -118.3959, status: 'active', employment_type: 'part-time' },
];

const locations: LocationRow[] = [
  { id: 'L001', name: 'DTLA Store', address: '500 W 7th St, Los Angeles, CA', lat: 34.0470, lng: -118.2570 },
  { id: 'L002', name: 'Sunset Store', address: '900 Sunset Blvd, Los Angeles, CA', lat: 34.0983, lng: -118.3295 },
  { id: 'L003', name: 'Pasadena Store', address: '300 E Colorado Blvd, Pasadena, CA', lat: 34.1450, lng: -118.1440 },
  { id: 'L004', name: 'Glendale Store', address: '201 N Brand Blvd, Glendale, CA', lat: 34.1486, lng: -118.2551 },
  { id: 'L005', name: 'Burbank Store', address: '201 E Magnolia Blvd, Burbank, CA', lat: 34.1817, lng: -118.3075 },
  { id: 'L006', name: 'Studio City Store', address: '12050 Ventura Blvd, Studio City, CA', lat: 34.1428, lng: -118.3989 },
  { id: 'L007', name: 'West Hollywood Store', address: '8801 Santa Monica Blvd, West Hollywood, CA', lat: 34.0907, lng: -118.3864 },
  { id: 'L008', name: 'Culver City Store', address: '9300 Culver Blvd, Culver City, CA', lat: 34.0239, lng: -118.3950 },
  { id: 'L009', name: 'Santa Monica Store', address: '1332 3rd Street Promenade, Santa Monica, CA', lat: 34.0168, lng: -118.4963 },
  { id: 'L010', name: 'Inglewood Store', address: '321 S Market St, Inglewood, CA', lat: 33.9611, lng: -118.3532 },
  { id: 'L011', name: 'El Segundo Store', address: '2041 Park Pl, El Segundo, CA', lat: 33.9180, lng: -118.4168 },
  { id: 'L012', name: 'Long Beach Store', address: '245 Pine Ave, Long Beach, CA', lat: 33.7691, lng: -118.1921 },
  { id: 'L013', name: 'Torrance Store', address: '21540 Hawthorne Blvd, Torrance, CA', lat: 33.8336, lng: -118.3497 },
  { id: 'L014', name: 'Redondo Beach Store', address: '1815 Hawthorne Blvd, Redondo Beach, CA', lat: 33.8672, lng: -118.3520 },
  { id: 'L015', name: 'San Pedro Store', address: '550 S Pacific Ave, San Pedro, CA', lat: 33.7391, lng: -118.2923 },
];

const availability: AvailabilityRow[] = [];
let availabilityCounter = 1;

function addAvailability(repIds: string[], dates: string[], startTime: string, endTime: string): void {
  for (const repId of repIds) {
    for (const date of dates) {
      availability.push({
        id: `A${String(availabilityCounter).padStart(4, '0')}`,
        rep_id: repId,
        date,
        start_time: startTime,
        end_time: endTime,
      });
      availabilityCounter += 1;
    }
  }
}

addAvailability(reps.slice(0, 20).map((rep) => rep.id), fullTimeDays, '10:00', '19:00');
addAvailability(reps.slice(20, 26).map((rep) => rep.id), partTimeDays, '12:00', '19:00');
addAvailability(['R029', 'R030'], sparseDays, '13:00', '19:00');

const timeoff: TimeOffRow[] = [
  { id: 'T001', rep_id: 'R003', date: '2026-03-17', reason: 'Medical appointment' },
  { id: 'T002', rep_id: 'R006', date: '2026-03-24', reason: 'Family event' },
  { id: 'T003', rep_id: 'R010', date: '2026-03-19', reason: 'Training day' },
  { id: 'T004', rep_id: 'R014', date: '2026-03-23', reason: 'Vacation day' },
  { id: 'T005', rep_id: 'R018', date: '2026-03-26', reason: 'Personal leave' },
  { id: 'T006', rep_id: 'R021', date: '2026-03-18', reason: 'Exam schedule' },
  { id: 'T007', rep_id: 'R022', date: '2026-03-25', reason: 'Doctor visit' },
  { id: 'T008', rep_id: 'R024', date: '2026-03-16', reason: 'Time off request' },
  { id: 'T009', rep_id: 'R029', date: '2026-03-22', reason: 'Family commitment' },
  { id: 'T010', rep_id: 'R030', date: '2026-03-24', reason: 'Class schedule' },
];

ensureDir(outputDir);
writeCsv(path.join(outputDir, 'reps.csv'), reps);
writeCsv(path.join(outputDir, 'locations.csv'), locations);
writeCsv(path.join(outputDir, 'availability.csv'), availability);
writeCsv(path.join(outputDir, 'timeoff.csv'), timeoff);

console.log(`Generated manual test pack in ${outputDir}`);
console.log(`Reps: ${reps.length}`);
console.log(`Locations: ${locations.length}`);
console.log(`Availability rows: ${availability.length}`);
console.log(`Time-off rows: ${timeoff.length}`);
