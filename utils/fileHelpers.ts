import * as XLSX from 'xlsx';

// Helper to normalize string for fuzzy matching
const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

export const parseExcelFile = async <T>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData as T[]);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const mapDataToRep = (data: any[]): any[] => {
  return data.map(row => {
    const keys = Object.keys(row);
    // Find keys that look like our targets
    const getKey = (target: string) => keys.find(k => normalize(k).includes(normalize(target)));
    
    // Strict Lat/Lng mapping to avoid mixing them up
    const latKey = keys.find(k => {
       const n = normalize(k);
       return n === 'homelat' || n === 'lat' || n === 'latitude';
    });
    const lngKey = keys.find(k => {
       const n = normalize(k);
       return n === 'homelng' || n === 'homelong' || n === 'lng' || n === 'long' || n === 'longitude';
    });

    const typeKey = getKey('type') || getKey('employment') || 'employment_type';
    const rawType = (row[typeKey] || 'full-time').toLowerCase();
    const employment_type = rawType.includes('part') ? 'part-time' : 'full-time';

    return {
      id: row[getKey('id') || 'id'],
      name: row[getKey('name') || 'name'],
      home_address: row[getKey('address') || 'home_address'] || '',
      home_lat: parseFloat(row[latKey || 'home_lat']),
      home_lng: parseFloat(row[lngKey || 'home_lng']),
      status: (row[getKey('status') || 'status'] || 'active').toLowerCase(),
      employment_type,
    };
  }).filter(r => !isNaN(r.home_lat) && !isNaN(r.home_lng));
};

export const mapDataToLocation = (data: any[]): any[] => {
  return data.map(row => {
    const keys = Object.keys(row);
    const getKey = (target: string) => keys.find(k => normalize(k).includes(normalize(target)));

    const latKey = keys.find(k => {
        const n = normalize(k);
        return n === 'lat' || n === 'latitude';
     });
     const lngKey = keys.find(k => {
        const n = normalize(k);
        return n === 'lng' || n === 'long' || n === 'longitude';
     });

    return {
      id: row[getKey('id') || 'id'],
      name: row[getKey('name') || 'name'],
      address: row[getKey('address') || 'address'] || '',
      lat: parseFloat(row[latKey || 'lat']),
      lng: parseFloat(row[lngKey || 'lng']),
    };
  }).filter(l => !isNaN(l.lat) && !isNaN(l.lng));
};

export const mapDataToAvailability = (data: any[]): any[] => {
  return data.map(row => {
    const keys = Object.keys(row);
    const getKey = (target: string) => keys.find(k => normalize(k).includes(normalize(target)));

    let dateStr = row[getKey('date') || 'date'];
    if (typeof dateStr === 'number') {
        const dateObj = new Date(Math.round((dateStr - 25569)*86400*1000));
        dateStr = dateObj.toISOString().split('T')[0];
    }

    return {
      id: row[getKey('id') || 'id'],
      rep_id: row[getKey('repid') || 'rep_id'],
      date: dateStr,
      start_time: row[getKey('starttime') || 'start_time'],
      end_time: row[getKey('endtime') || 'end_time'],
    };
  });
};

export const mapDataToTimeOff = (data: any[]): any[] => {
  return data.map(row => {
    const keys = Object.keys(row);
    const getKey = (target: string) => keys.find(k => normalize(k).includes(normalize(target)));

    let dateStr = row[getKey('date') || 'date'];
    if (typeof dateStr === 'number') {
        const dateObj = new Date(Math.round((dateStr - 25569)*86400*1000));
        dateStr = dateObj.toISOString().split('T')[0];
    }

    return {
      id: row[getKey('id') || 'id'],
      rep_id: row[getKey('repid') || 'rep_id'],
      date: dateStr,
      reason: row[getKey('reason') || 'reason'] || '',
    };
  });
};

export const exportScheduleToCSV = (schedule: any[], filename = 'schedule.csv') => {
  const ws = XLSX.utils.json_to_sheet(schedule);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Schedule");
  XLSX.writeFile(wb, filename);
};
