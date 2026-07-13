// Helper function to extract structured data from raw clipboard text dumps or OCR text of any HIMS software
export const parseHimsText = (text: string) => {
  const data: any = {
    name: '',
    uhid: '',
    age: 0,
    gender: 'Male',
    mobile: '',
    laterality: 'Not Applicable',
    diagnosis: '',
    procedurePlanned: '',
    vitals: { bp: '', pulse: '', temp: '', rr: '', spo2: '' },
    investigations: { hb: '', wbc: '', platelets: '', creatinine: '' }
  };

  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

  // 1. Patient Name matching (including Eka.care style name | gender | age lines)
  const nameRegexes = [
    // Eka.care line: MR. ATUL WAIRAGADE | M | 40y
    /(?:MR\.|MRS\.|MS\.|DR\.)\s*([A-Za-z\s]+)\s*\|\s*(?:M|F|Male|Female)\s*\|\s*\d+\s*y/i,
    /([A-Za-z\s.]+)\s*\|\s*(?:M|F|Male|Female|Other)\s*\|\s*(\d+)\s*y/i,
    /(?:Patient\s*Name|Name\s*of\s*Patient|Pt\s*Name|REGISTRATION|Patient)\s*[:|-]?\s*([^\n\r]+)/i,
    /Name\s*[:|-]\s*([^\n\r]+)/i
  ];
  
  let nameFound = false;
  for (const regex of nameRegexes) {
    const match = text.match(regex);
    if (match) {
      let cleanedName = match[1].trim();
      // Split on typical next fields if they are inline
      cleanedName = cleanedName.split(/(?:,|\bAge\b|\bGender\b|\bSex\b|\bUHID\b|\bID\b|\bMRN\b|\bDOB\b|\|)/i)[0].trim();
      // Remove salutations
      cleanedName = cleanedName.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Mast\.|Baby\s*of)\s+/i, '');
      if (cleanedName.length > 2 && !/^(registration|summary|report|clinical|sheet)$/i.test(cleanedName)) {
        data.name = cleanedName;
        nameFound = true;
        break;
      }
    }
  }

  // Fallback: If no name regex matched, search first 3 lines
  if (!nameFound) {
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      if (/^[A-Za-z\s]{4,30}$/.test(line) && !/^(report|summary|clinical|sheet|hims|ehr|emr|patient|visit|record)$/i.test(line)) {
        data.name = line.trim();
        break;
      }
    }
  }

  // 2. UHID / Patient ID matching
  const uhidRegexes = [
    // Match line like: #AAS676 | +919307927891
    /#([A-Za-z0-9-]+)\s*\|/i,
    /(?:UHID|HIMS\s*ID|MRN|PID|Reg\s*No|MR\s*No|OPD\s*No|IPD\s*No)\s*[:|-]?\s*([A-Za-z0-9-]+)/i,
    /\b(AAS|EPIC|EKA|HOSP)-\d{4,8}\b/i,
    /\b[A-Za-z]{2,4}-\d{5,10}\b/
  ];
  for (const regex of uhidRegexes) {
    const match = text.match(regex);
    if (match) {
      data.uhid = match[1] ? match[1].trim() : match[0].trim();
      break;
    }
  }

  // 3. Age matching
  const ageMatch = 
    text.match(/\b([A-Za-z\s.]+)\s*\|\s*(?:M|F|Male|Female|Other)\s*\|\s*(\d+)\s*y/i) ||
    text.match(/(?:Age|Yr|Years)[^0-9\n\r]*(\d+)/i) || 
    text.match(/\b(\d+)\s*(?:Years|Yrs|Yr|Yo|old)\b/i) ||
    text.match(/\b(?:Male|Female|M|F)\s*\/\s*(\d+)\b/i) ||
    text.match(/\b(\d+)\s*\/\s*(?:Male|Female|M|F)\b/i);
  if (ageMatch) {
    data.age = parseInt(ageMatch[2] || ageMatch[1]);
  }

  // 4. Gender matching
  const genderMatch = 
    text.match(/\b([A-Za-z\s.]+)\s*\|\s*(M|F|Male|Female|Other)\s*\|/i) ||
    text.match(/\b(Female|Male|Other)\b/i) || 
    text.match(/\b(F|M)\b/i) || 
    text.match(/\/\s*(Male|Female|Other|M|F)\b/i);
  if (genderMatch) {
    const g = (genderMatch[2] || genderMatch[1]).trim().toLowerCase();
    if (g.startsWith('f')) data.gender = 'Female';
    else if (g.startsWith('m')) data.gender = 'Male';
    else if (g.startsWith('o')) data.gender = 'Other';
  }

  // 5. Mobile matching
  const mobileMatch = 
    text.match(/\|\s*(?:\+91|0)?\s*([6-9]\d{9})\b/) ||
    text.match(/(?:\+91|0)?\s*([6-9]\d{9})\b/);
  if (mobileMatch) {
    data.mobile = mobileMatch[1];
  }

  // 6. Diagnosis matching (allowing optional newlines before the diagnosis name)
  const dxRegexes = [
    /(?:Diagnosis|Dx|Indication|Clinical\s*Diagnosis|Provisional\s*Diagnosis|Final\s*Diagnosis|Impression|Assessment)\s*[:|-]?\s*(?:\r?\n\s*)*([^\n\r|]+)/i,
    /(?:Dx|Diagnosis)\s*[:|-]?\s*(?:\r?\n\s*)*([^\n\r|]+)/i
  ];
  let dxFound = false;
  for (const regex of dxRegexes) {
    const match = text.match(regex);
    if (match) {
      let dxText = match[1].trim();
      // Remove trailing ICD codes like " - K40.90"
      dxText = dxText.replace(/\s*-\s*[A-Z]\d{2}(?:\.\d{1,2})?.*$/i, '').trim();
      data.diagnosis = dxText;
      dxFound = true;
      break;
    }
  }

  // Fallback: search lines for disease keywords
  if (!dxFound) {
    const diseaseKeywords = [
      /Otitis\s*Media/i, /CSOM/i, /Osteoarthritis/i, /Hernia/i, /Fibroids/i, 
      /Appendicitis/i, /Cholecystitis/i, /Pancreatitis/i, /Pregnancy/i, 
      /Hydrocele/i, /Hemorrhoid/i, /Fissure/i, /Breech/i, /Cholelithiasis/i
    ];
    for (const line of lines) {
      if (diseaseKeywords.some(kw => kw.test(line)) && !/planned|procedure|surgery|rx|treatment|action/i.test(line)) {
        data.diagnosis = line.replace(/^(Diagnosis|Dx|Clinical|Final|Provisional|Impression)\s*[:|-]?\s*/i, '').trim();
        // Remove trailing ICD codes
        data.diagnosis = data.diagnosis.replace(/\s*-\s*[A-Z]\d{2}(?:\.\d{1,2})?.*$/i, '').trim();
        dxFound = true;
        break;
      }
    }
  }

  // 7. Planned Procedure matching (robust check for procedure tables and inline strings)
  const procIndex = lines.findIndex(l => /^(procedures|procedure|proposed action|surgery|planned surgery)$/i.test(l));
  if (procIndex !== -1) {
    // Look at next 3 lines
    for (let j = 1; j <= 3; j++) {
      const nextLine = lines[procIndex + j];
      if (nextLine && !/^(medications|medicine|rx|symptoms|examination|investigations|follow up)/i.test(nextLine)) {
        let cleaned = nextLine.replace(/^\d+[\s\t]+/, ''); // remove leading number and tabs/spaces
        cleaned = cleaned.split('\t')[0].trim(); // take the first column if tab separated
        if (cleaned.length > 5 && !/^(procedure|date|other)/i.test(cleaned)) {
          data.procedurePlanned = cleaned;
          break;
        }
      }
    }
  }

  if (!data.procedurePlanned) {
    const pxRegexes = [
      /(?:Procedure|Rx|Surgery|Planned\s*Surgery|Planned\s*Procedure|Proposed\s*Action|Operation|Treatment)\s*[:|-]?\s*(?:\r?\n\s*)*([^\n\r|]+)/i,
      /(?:Planned\s*Procedure|Procedure\s*Planned)\s*[:|-]?\s*(?:\r?\n\s*)*([^\n\r|]+)/i
    ];
    let pxFound = false;
    for (const regex of pxRegexes) {
      const match = text.match(regex);
      if (match) {
        data.procedurePlanned = match[1].trim();
        pxFound = true;
        break;
      }
    }

    // Fallback: search lines for procedure keywords
    if (!pxFound) {
      const procedureKeywords = [
        /Tympanoplasty/i, /Arthroplasty/i, /Cholecystectomy/i, /Hemorrhoidectomy/i, 
        /Sphincterotomy/i, /Hernioplasty/i, /Hysterectomy/i, /Appendicectomy/i, 
        /Cesarean/i, /LSCS/i, /Knee\s*Replacement/i, /Mastectomy/i
      ];
      for (const line of lines) {
        if (procedureKeywords.some(kw => kw.test(line)) && !/diagnosis|dx|history|indication/i.test(line)) {
          data.procedurePlanned = line.replace(/^(Procedure|Rx|Surgery|Planned|Proposed|Operation|Action)\s*[:|-]?\s*/i, '').trim();
          pxFound = true;
          break;
        }
      }
    }
  }

  // 8. Laterality matching
  let lateralityVal = 'Not Applicable';
  const lateralityMatch = text.match(/(?:Laterality|Side|Site)\s*[:|-]?\s*(Left|Right|Bilateral)/i);
  if (lateralityMatch) {
    lateralityVal = lateralityMatch[1].trim();
  } else {
    const textToSearch = ((data.diagnosis || '') + ' ' + (data.procedurePlanned || '') + ' ' + text).toLowerCase();
    if (textToSearch.includes('left')) lateralityVal = 'Left';
    else if (textToSearch.includes('right')) lateralityVal = 'Right';
    else if (textToSearch.includes('bilateral')) lateralityVal = 'Bilateral';
  }
  data.laterality = lateralityVal.charAt(0).toUpperCase() + lateralityVal.slice(1).toLowerCase();

  // 9. Vitals (BP, Pulse, Temp, SpO2)
  const bpMatch = text.match(/\b(\d{2,3}\s*\/\s*\d{2,3})\b/);
  if (bpMatch) data.vitals.bp = bpMatch[1].trim();

  const pulseMatch = 
    text.match(/(?:Pulse|HR|Heart\s*Rate|PR)[^0-9\n\r]*(\d+)/i) || 
    text.match(/\b(\d+)\s*(?:bpm|\/min|beats\/min)\b/i);
  if (pulseMatch) data.vitals.pulse = pulseMatch[1].trim();

  const tempMatch = 
    text.match(/(?:Temp|Temperature)[^0-9\n\r]*([\d.]+)/i) || 
    text.match(/\b([\d.]+)\s*(?:F|C|°F|°C)\b/i);
  if (tempMatch) data.vitals.temp = tempMatch[1].trim();

  const spo2Match = 
    text.match(/(?:SpO2|Oxygen|O2\s*Sat|Sat)[^0-9\n\r]*(\d+)/i) || 
    text.match(/\b(\d+)\s*%/);
  if (spo2Match) data.vitals.spo2 = spo2Match[1].trim();

  // 10. Investigations (Hb, Platelets, Creatinine)
  const hbMatch = text.match(/(?:Hb|Hemoglobin)\s*[:|-]?\s*([\d.]+)/i);
  if (hbMatch) data.investigations.hb = hbMatch[1].trim();

  const platMatch = text.match(/(?:Platelet|Platelets|Plt)\s*[:|-]?\s*(\d+)/i);
  if (platMatch) data.investigations.platelets = platMatch[1].trim();

  const creatMatch = text.match(/(?:Creatinine|Creat)\s*[:|-]?\s*([\d.]+)/i);
  if (creatMatch) data.investigations.creatinine = creatMatch[1].trim();

  return data;
};
