import { UploadCase, CsvCell } from './types';

const DEFAULT_START_DATE = '2026-03-08';
const DEFAULT_END_DATE = '2026-03-21';

const STANDARD_DATES = [
  '2026-03-08',
  '2026-03-09',
  '2026-03-10',
  '2026-03-11',
  '2026-03-12',
  '2026-03-15',
  '2026-03-16',
  '2026-03-17',
  '2026-03-18',
  '2026-03-19',
];

const REP_HEADERS = ['id', 'name', 'home_address', 'home_lat', 'home_lng', 'status', 'employment_type'];
const LOCATION_HEADERS = ['id', 'name', 'address', 'lat', 'lng'];
const AVAILABILITY_HEADERS = ['id', 'rep_id', 'date', 'start_time', 'end_time'];
const TIMEOFF_HEADERS = ['id', 'rep_id', 'date', 'reason'];

function availabilityRows(
  repId: string,
  dates: string[],
  idPrefix: string,
  startIndex = 1,
  startTime = '10:00',
  endTime = '19:00'
): CsvCell[][] {
  return dates.map((date, idx) => [
    `${idPrefix}${String(startIndex + idx).padStart(3, '0')}`,
    repId,
    date,
    startTime,
    endTime,
  ]);
}

const caseHappyPathMinimal: UploadCase = {
  id: 'happy-path-minimal',
  title: 'Happy Path Minimal Files',
  description: 'Required files only should generate a valid schedule.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [
        ['R101', 'Alex Carter', 'Downtown LA', 34.0522, -118.2437, 'active', 'full-time'],
        ['R102', 'Casey Park', 'Hollywood', 34.0928, -118.3287, 'active', 'part-time'],
      ],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [
        ['L101', 'Sunset Store', '900 Sunset Blvd', 34.0983, -118.3295],
        ['L102', 'DTLA Store', '500 W 7th St', 34.047, -118.257],
      ],
    },
    availability: {
      headers: AVAILABILITY_HEADERS,
      rows: [
        ...availabilityRows('R101', STANDARD_DATES, 'A101', 1),
        ...availabilityRows('R102', STANDARD_DATES, 'A102', 101, '12:00', '19:00'),
      ],
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 'm1', description: 'Reps mapped', kind: 'mapped_reps_count', op: 'eq', value: 2 },
      { id: 'm2', description: 'Locations mapped', kind: 'mapped_locations_count', op: 'eq', value: 2 },
      { id: 'm3', description: 'Availability mapped', kind: 'mapped_availability_count', op: 'eq', value: 20 },
      { id: 's1', description: 'Schedule has generated shifts', kind: 'schedule_shift_count', op: 'gte', value: 8 },
      { id: 's2', description: 'Part-time rep weekly cap respected over two weeks', kind: 'rep_hours_at_most', repId: 'R102', value: 48 },
    ],
  },
  tags: ['happy-path', 'required-files'],
};

const caseHappyPathTimeoff: UploadCase = {
  id: 'happy-path-with-timeoff',
  title: 'Happy Path With Time Off',
  description: 'Optional timeoff file should be honored by scheduling.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [
        ['R201', 'Timeoff Target', 'Koreatown', 34.0628, -118.3089, 'active', 'full-time'],
        ['R202', 'Backup Rep', 'Silver Lake', 34.0866, -118.27, 'active', 'part-time'],
      ],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [
        ['L201', 'Central Store', '300 E 1st St', 34.05, -118.25],
        ['L202', 'West Store', '100 W Pico Blvd', 34.041, -118.268],
      ],
    },
    availability: {
      headers: AVAILABILITY_HEADERS,
      rows: [
        ...availabilityRows('R201', STANDARD_DATES, 'A201', 1),
        ...availabilityRows('R202', STANDARD_DATES, 'A202', 101, '12:00', '19:00'),
      ],
    },
    timeoff: {
      headers: TIMEOFF_HEADERS,
      rows: [['T201', 'R201', '2026-03-10', 'Sick leave']],
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 'm1', description: 'Timeoff rows mapped', kind: 'mapped_timeoff_count', op: 'eq', value: 1 },
      { id: 's1', description: 'Schedule has generated shifts', kind: 'schedule_shift_count', op: 'gte', value: 8 },
      { id: 's2', description: 'Timeoff date blocked for target rep', kind: 'timeoff_blocked', repId: 'R201', date: '2026-03-10' },
    ],
  },
  tags: ['happy-path', 'timeoff'],
};

const caseMissingAvailability: UploadCase = {
  id: 'missing-availability-file',
  title: 'Missing Availability File',
  description: 'No availability file should result in no generated shifts.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [
        ['R301', 'Jordan Blake', 'Pasadena', 34.1478, -118.1445, 'active', 'full-time'],
        ['R302', 'Taylor Quinn', 'Glendale', 34.1486, -118.2551, 'active', 'part-time'],
      ],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [['L301', 'Pasadena Store', '300 E Colorado Blvd', 34.145, -118.144]],
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 'm1', description: 'Availability rows should be zero', kind: 'mapped_availability_count', op: 'eq', value: 0 },
      { id: 's1', description: 'No shifts generated', kind: 'schedule_shift_count', op: 'eq', value: 0 },
      { id: 's2', description: 'Hour gaps reported', kind: 'stat_hourgap_count', op: 'gte', value: 1 },
    ],
  },
  tags: ['missing-file', 'validation'],
};

const caseEmptyReps: UploadCase = {
  id: 'empty-reps-file',
  title: 'Empty Reps File',
  description: 'Empty reps input should gracefully produce an empty schedule.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [['L401', 'Central', 'Main St', 34.05, -118.24]],
    },
    availability: {
      headers: AVAILABILITY_HEADERS,
      rows: availabilityRows('R404', STANDARD_DATES.slice(0, 3), 'A401', 1),
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 'm1', description: 'No reps mapped', kind: 'mapped_reps_count', op: 'eq', value: 0 },
      { id: 's1', description: 'No shifts generated', kind: 'schedule_shift_count', op: 'eq', value: 0 },
      { id: 's2', description: 'No hour gaps when no reps', kind: 'stat_hourgap_count', op: 'eq', value: 0 },
    ],
  },
  tags: ['empty-file'],
};

const caseInvalidRepCoords: UploadCase = {
  id: 'invalid-rep-coordinates-filtered',
  title: 'Invalid Rep Coordinates Filtered',
  description: 'Rows with invalid rep lat/lng should be filtered out.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [
        ['R501', 'Valid Rep', 'Mid City', 34.06, -118.31, 'active', 'full-time'],
        ['R502', 'Bad Coord Rep', 'Nowhere', 'not-a-lat', -118.25, 'active', 'full-time'],
      ],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [['L501', 'Mid City Store', 'Beverly Blvd', 34.07, -118.32]],
    },
    availability: {
      headers: AVAILABILITY_HEADERS,
      rows: [
        ...availabilityRows('R501', STANDARD_DATES.slice(0, 5), 'A501', 1),
        ...availabilityRows('R502', STANDARD_DATES.slice(0, 5), 'A502', 101),
      ],
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 'm1', description: 'Only valid rep mapped', kind: 'mapped_reps_count', op: 'eq', value: 1 },
      { id: 's1', description: 'Schedule still generated', kind: 'schedule_shift_count', op: 'gte', value: 1 },
    ],
  },
  tags: ['data-quality', 'coords'],
};

const caseInvalidLocationCoords: UploadCase = {
  id: 'invalid-location-coordinates-filtered',
  title: 'Invalid Location Coordinates Filtered',
  description: 'Rows with invalid location lat/lng should be filtered out.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [['R601', 'Location Test Rep', 'DTLA', 34.0522, -118.2437, 'active', 'full-time']],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [
        ['L601', 'Valid Location', '7th St', 34.047, -118.257],
        ['L602', 'Invalid Location', 'Broken St', 34.05, 'bad-lng'],
      ],
    },
    availability: {
      headers: AVAILABILITY_HEADERS,
      rows: availabilityRows('R601', STANDARD_DATES.slice(0, 5), 'A601', 1),
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 'm1', description: 'Only valid location mapped', kind: 'mapped_locations_count', op: 'eq', value: 1 },
      { id: 's1', description: 'Schedule still generated', kind: 'schedule_shift_count', op: 'gte', value: 1 },
    ],
  },
  tags: ['data-quality', 'coords'],
};

const caseFuzzyHeaders: UploadCase = {
  id: 'fuzzy-column-mapping',
  title: 'Fuzzy Column Mapping Support',
  description: 'Parser should map alternative header names successfully.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: ['Rep ID', 'Rep Name', 'Home Address', 'Latitude', 'Longitude', 'Current Status', 'Employment Type'],
      rows: [
        ['R701', 'Fuzzy One', 'Echo Park', 34.0782, -118.2606, 'Active', 'Full-time'],
        ['R702', 'Fuzzy Two', 'Los Feliz', 34.104, -118.292, 'Active', 'Part-time'],
      ],
    },
    locations: {
      headers: ['Location ID', 'Location Name', 'Street Address', 'Latitude', 'Longitude'],
      rows: [
        ['L701', 'Fuzzy Store A', 'Sunset Blvd', 34.099, -118.327],
        ['L702', 'Fuzzy Store B', 'Hollywood Blvd', 34.101, -118.326],
      ],
    },
    availability: {
      headers: ['Record ID', 'Rep ID', 'Work Date', 'Start Time', 'End Time'],
      rows: [
        ...availabilityRows('R701', STANDARD_DATES.slice(0, 4), 'A701', 1),
        ...availabilityRows('R702', STANDARD_DATES.slice(0, 4), 'A702', 101, '12:00', '19:00'),
      ],
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 'm1', description: 'Reps mapped with fuzzy headers', kind: 'mapped_reps_count', op: 'eq', value: 2 },
      { id: 'm2', description: 'Locations mapped with fuzzy headers', kind: 'mapped_locations_count', op: 'eq', value: 2 },
      { id: 'm3', description: 'Availability mapped with fuzzy headers', kind: 'mapped_availability_count', op: 'eq', value: 8 },
      { id: 's1', description: 'Schedule generated', kind: 'schedule_shift_count', op: 'gte', value: 2 },
    ],
  },
  tags: ['parser', 'fuzzy-headers'],
};

const caseDuplicateRepIds: UploadCase = {
  id: 'duplicate-rep-ids',
  title: 'Duplicate Rep IDs',
  description: 'Duplicate rep IDs should not crash scheduling path.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [
        ['R801', 'Duplicate Alpha', 'Studio City', 34.139, -118.391, 'active', 'full-time'],
        ['R801', 'Duplicate Beta', 'Studio City', 34.139, -118.391, 'active', 'full-time'],
      ],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [
        ['L801', 'Studio A', 'Ventura Blvd', 34.143, -118.395],
        ['L802', 'Studio B', 'Coldwater Canyon', 34.14, -118.41],
      ],
    },
    availability: {
      headers: AVAILABILITY_HEADERS,
      rows: availabilityRows('R801', STANDARD_DATES.slice(0, 6), 'A801', 1),
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 'm1', description: 'Both duplicate rows mapped', kind: 'mapped_reps_count', op: 'eq', value: 2 },
      { id: 's1', description: 'Rep stats entries retained', kind: 'rep_stats_count', op: 'eq', value: 2 },
      { id: 's2', description: 'Schedule still generated', kind: 'schedule_shift_count', op: 'gte', value: 1 },
    ],
  },
  tags: ['duplicates'],
};

const caseInactiveNotScheduled: UploadCase = {
  id: 'inactive-rep-not-scheduled',
  title: 'Inactive Rep Not Scheduled',
  description: 'Inactive reps may appear in files but must never receive shifts.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [
        ['R901', 'Active Member', 'Santa Monica', 34.02, -118.49, 'active', 'full-time'],
        ['R902', 'Inactive Member', 'Santa Monica', 34.03, -118.48, 'inactive', 'full-time'],
      ],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [['L901', 'SM Store', 'Main St', 34.015, -118.49]],
    },
    availability: {
      headers: AVAILABILITY_HEADERS,
      rows: [
        ...availabilityRows('R901', STANDARD_DATES.slice(0, 6), 'A901', 1),
        ...availabilityRows('R902', STANDARD_DATES.slice(0, 6), 'A902', 101),
      ],
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 's1', description: 'Schedule generated for active rep', kind: 'schedule_shift_count', op: 'gte', value: 1 },
      { id: 's2', description: 'Inactive rep has no assignments', kind: 'inactive_rep_not_scheduled', repId: 'R902' },
    ],
  },
  tags: ['status'],
};

const caseZeroAvailabilityHourGap: UploadCase = {
  id: 'active-rep-zero-availability-hourgap',
  title: 'Active Rep Zero Availability Causes Hour Gap',
  description: 'Active reps without availability should show up in hour gap report.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [
        ['R1001', 'No Availability', 'Burbank', 34.1808, -118.309, 'active', 'full-time'],
        ['R1002', 'Available Worker', 'Burbank', 34.18, -118.31, 'active', 'full-time'],
      ],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [['L1001', 'Burbank Store', 'Olive Ave', 34.1815, -118.307]],
    },
    availability: {
      headers: AVAILABILITY_HEADERS,
      rows: availabilityRows('R1002', STANDARD_DATES, 'A100', 1),
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 's1', description: 'Hour gap entries are present', kind: 'stat_hourgap_count', op: 'gte', value: 1 },
      { id: 's2', description: 'No Availability rep appears in hour gap', kind: 'hourgap_for_rep', repName: 'No Availability' },
    ],
  },
  tags: ['availability', 'hour-gap'],
};

const caseOverflow: UploadCase = {
  id: 'overflow-when-reps-exceed-locations',
  title: 'Overflow When Eligible Reps Exceed Locations',
  description: 'More eligible reps than locations should create overflow entries.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [
        ['R1101', 'Rep A', 'North Hollywood', 34.172, -118.379, 'active', 'full-time'],
        ['R1102', 'Rep B', 'North Hollywood', 34.173, -118.378, 'active', 'full-time'],
        ['R1103', 'Rep C', 'North Hollywood', 34.174, -118.377, 'active', 'full-time'],
        ['R1104', 'Rep D', 'North Hollywood', 34.175, -118.376, 'active', 'full-time'],
      ],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [['L1101', 'Single Capacity Store', 'Lankershim Blvd', 34.171, -118.377]],
    },
    availability: {
      headers: AVAILABILITY_HEADERS,
      rows: [
        ...availabilityRows('R1101', STANDARD_DATES.slice(0, 3), 'A110', 1),
        ...availabilityRows('R1102', STANDARD_DATES.slice(0, 3), 'A111', 101),
        ...availabilityRows('R1103', STANDARD_DATES.slice(0, 3), 'A112', 201),
        ...availabilityRows('R1104', STANDARD_DATES.slice(0, 3), 'A113', 301),
      ],
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 's1', description: 'Overflow records captured', kind: 'stat_overflow_count', op: 'gte', value: 1 },
      { id: 's2', description: 'At least two shifts generated', kind: 'schedule_shift_count', op: 'gte', value: 2 },
    ],
  },
  tags: ['overflow'],
};

const caseConstraintCollision: UploadCase = {
  id: 'constraint-collision-unassigned-days',
  title: 'Constraint Collision Creates Unassigned Days',
  description: 'Single rep and single location should trigger unassigned days because of rotation rule.',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  files: {
    reps: {
      headers: REP_HEADERS,
      rows: [['R1201', 'Solo Rep', 'Eagle Rock', 34.135, -118.214, 'active', 'full-time']],
    },
    locations: {
      headers: LOCATION_HEADERS,
      rows: [['L1201', 'Only Location', 'Colorado Blvd', 34.139, -118.214]],
    },
    availability: {
      headers: AVAILABILITY_HEADERS,
      rows: availabilityRows('R1201', STANDARD_DATES.slice(0, 5), 'A120', 1),
    },
  },
  expected: {
    shouldGenerate: true,
    rules: [
      { id: 's1', description: 'At least one shift generated', kind: 'schedule_shift_count', op: 'gte', value: 1 },
      { id: 's2', description: 'Unassigned days recorded', kind: 'stat_unassigned_count', op: 'gte', value: 1 },
    ],
  },
  tags: ['constraints', 'unassigned'],
};

export const uploadCases: UploadCase[] = [
  caseHappyPathMinimal,
  caseHappyPathTimeoff,
  caseMissingAvailability,
  caseEmptyReps,
  caseInvalidRepCoords,
  caseInvalidLocationCoords,
  caseFuzzyHeaders,
  caseDuplicateRepIds,
  caseInactiveNotScheduled,
  caseZeroAvailabilityHourGap,
  caseOverflow,
  caseConstraintCollision,
];

export const uploadCaseById = new Map(uploadCases.map((testCase) => [testCase.id, testCase]));

export const uploadCaseIds = uploadCases.map((testCase) => testCase.id);
