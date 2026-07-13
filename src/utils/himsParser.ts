// Helper function to extract structured data from raw clipboard text dumps or OCR text of any HIMS software
export const parseHimsText = (text: string) => {
  const data: any = {
    name: '',
    uhid: '',
    age: 0,
    gender: 'Male',
    diagnosis: '',
    procedurePlanned: '',
    vitals: { bp: '', pulse: '', temp: '', rr: '', spo2: '' },
    investigations: { hb: '', wbc: '', platelets: '', creatinine: '' }
  };

  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

  // 1. Patient Name matching
  const nameRegexes = [
    /(?:Patient\s*Name|Name\s*of\s*Patient|Pt\s*Name|REGISTRATION|Patient)\s*[:|-]?\s*([^\n\r]+)/i,
    /Name\s*[:|-]\s*([^\n\r]+)/i
  ];
  
  let nameFound = false;
  for (const regex of nameRegexes) {
    const match = text.match(regex);
    if (match) {
      let cleanedName = match[1].trim();
      // Split on typical next fields if they are inline (e.g. Name: Sanjay Kulkarni Age: 39)
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

  // Fallback: If no name regex matched, search first 3 lines for a line that contains 2-3 words (all letters) and doesn't contain headers
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
    text.match(/(?:Age|Yr|Years)[^0-9\n\r]*(\d+)/i) || 
    text.match(/\b(\d+)\s*(?:Years|Yrs|Yr|Yo|old)\b/i) ||
    text.match(/\b(?:Male|Female|M|F)\s*\/\s*(\d+)\b/i) ||
    text.match(/\b(\d+)\s*\/\s*(?:Male|Female|M|F)\b/i);
  if (ageMatch) {
    data.age = parseInt(ageMatch[1] || ageMatch[2]);
  }

  // 4. Gender matching
  const genderMatch = 
    text.match(/\b(Female|Male|Other)\b/i) || 
    text.match(/\b(F|M)\b/i) || 
    text.match(/\/\s*(Male|Female|Other|M|F)\b/i);
  if (genderMatch) {
    const g = genderMatch[1].trim().toLowerCase();
    if (g.startsWith('f')) data.gender = 'Female';
    else if (g.startsWith('m')) data.gender = 'Male';
    else if (g.startsWith('o')) data.gender = 'Other';
  }

  // 5. Diagnosis matching
  const dxRegexes = [
    /(?:Diagnosis|Dx|Indication|Clinical\s*Diagnosis|Provisional\s*Diagnosis|Final\s*Diagnosis|Impression|Assessment)\s*[:|-]?\s*([^\n\r|]+)/i,
    /(?:Dx|Diagnosis)\s*[:|-]?\s*([^\n\r|]+)/i
  ];
  let dxFound = false;
  for (const regex of dxRegexes) {
    const match = text.match(regex);
    if (match) {
      data.diagnosis = match[1].trim();
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
        dxFound = true;
        break;
      }
    }
  }

  // 6. Planned Procedure matching
  const pxRegexes = [
    /(?:Procedure|Rx|Surgery|Planned\s*Surgery|Planned\s*Procedure|Proposed\s*Action|Operation|Treatment)\s*[:|-]?\s*([^\n\r|]+)/i,
    /(?:Planned\s*Procedure|Procedure\s*Planned)\s*[:|-]?\s*([^\n\r|]+)/i
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

  // 7. Vitals (BP, Pulse, Temp, SpO2)
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

  // 8. Investigations (Hb, Platelets, Creatinine)
  const hbMatch = text.match(/(?:Hb|Hemoglobin)\s*[:|-]?\s*([\d.]+)/i);
  if (hbMatch) data.investigations.hb = hbMatch[1].trim();

  const platMatch = text.match(/(?:Platelet|Platelets|Plt)\s*[:|-]?\s*(\d+)/i);
  if (platMatch) data.investigations.platelets = platMatch[1].trim();

  const creatMatch = text.match(/(?:Creatinine|Creat)\s*[:|-]?\s*([\d.]+)/i);
  if (creatMatch) data.investigations.creatinine = creatMatch[1].trim();

  return data;
};
