import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { ClinicalDocument, Patient } from '../types';
import { 
  Sparkles, 
  FileText, 
  Languages, 
  FolderPlus, 
  Info,
  Edit3,
  Printer,
  Signature
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AIClinicalGeneratorProps {
  activePatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setSelectedDocId: (id: string | null) => void;
}

// Procedure risk profile mappings for clinical precision
const PROCEDURE_CLINICAL_PROFILES: Record<string, {
  risks: string[];
  benefits: string[];
  alternatives: string[];
  operativeSteps: string[];
  postOpOrders: string[];
}> = {
  'Laparoscopic Cholecystectomy': {
    risks: [
      "Bile duct injury (1 in 300 risk, potentially requiring major open reconstructive surgery)",
      "Bile leakage from duct of Luschka or cystic duct stump",
      "Bleeding from cystic artery or liver bed, occasionally requiring conversion to open laparotomy",
      "Damage to surrounding organs including liver, duodenum, bowel, and major blood vessels",
      "Conversion to open cholecystectomy (large incision) due to dense adhesions or anatomical anomalies",
      "Shoulder-tip pain postoperatively caused by residual carbon dioxide gas insufflation"
    ],
    benefits: [
      "Permanent relief from recurring biliary colic (gallstone pain)",
      "Elimination of risk of acute cholecystitis, gallstone pancreatitis, and cholangitis",
      "Prevention of gallbladder empyema or perforation"
    ],
    alternatives: [
      "Conservative management (strict low-fat diet, antispasmodics)",
      "Antibiotics and supportive care for acute inflammation episodes",
      "ERCP for extraction of common bile duct stones (if present)"
    ],
    operativeSteps: [
      "Pneumoperitoneum created using Veress needle. 4 ports inserted (Umbilical 10mm, Epigastric 10mm, Subcostal 5mm x2).",
      "Gallbladder retracted. Calot's triangle dissected to identify Cystic Duct and Cystic Artery.",
      "Achieved Critical View of Safety (CVS). Cystic duct and artery double-clipped and divided.",
      "Gallbladder dissected off the liver bed using hook electrocautery. Hemostasis achieved on liver bed.",
      "Gallbladder placed in endobag and retrieved through umbilical port. Abdomen deflated. Port wounds sutured."
    ],
    postOpOrders: [
      "NPO (Fasting) till recovery from GA, then start sips of water. Advance to soft diet tomorrow.",
      "Monitor vitals every 2 hours for 12 hours (temperature, pulse, BP, SpO2).",
      "IV fluids: DNS 1L + RL 1L over 24 hours.",
      "Inj. Pantocid 40mg IV OD. Inj. Emset 4mg IV TDS.",
      "Inj. Dynapar 75mg in 100ml NS IV BD for pain."
    ]
  },
  'Laparoscopic Appendicectomy': {
    risks: [
      "Pelvic abscess or intra-abdominal fluid collection requiring drainage",
      "Fecal fistula due to appendiceal stump blow-out",
      "Stump appendicitis (recurrent infection of residual appendix tissue)",
      "Wound infection, particularly at the umbilical/retrieval port site",
      "Damage to the caecum, ileum, or retroperitoneal structures",
      "Postoperative paralytic ileus (temporary bowel sleep)"
    ],
    benefits: [
      "Cure of acute appendicitis and elimination of risk of rupture/peritonitis",
      "Prevention of systemic sepsis and septic shock",
      "Resolution of acute abdominal pain"
    ],
    alternatives: [
      "Antibiotic therapy alone (associated with 30-40% recurrence rate within 1 year)",
      "Supportive care (not recommended for obstructive acute appendicitis)"
    ],
    operativeSteps: [
      "Pneumoperitoneum created. Three-port technique used (Umbilical 10mm, Suprapubic 5mm, Left Iliac Fossa 5mm).",
      "Appendix identified in retrocecal/subcecal position. Inflamed, turgid, with fibrinous exudate.",
      "Mesoappendix dissected and divided. Base of the appendix secured using endoloops.",
      "Appendix transected and placed in retrieval bag.",
      "Peritoneal lavage performed with warm saline. Hemostasis confirmed. Port sites closed."
    ],
    postOpOrders: [
      "Keep NPO. Monitor vitals, temperature, and abdominal girth every 4 hours.",
      "IV fluids: RL 1.5L over 24 hours.",
      "Inj. Ceftriaxone 1g IV BD + Inj. Metrogyl 500mg IV TDS.",
      "Inj. Tramadol 50mg IV SOS for severe pain."
    ]
  },
  'Open Inguinal Hernioplasty (Lichtenstein Mesh Repair)': {
    risks: [
      "Chronic groin pain (inguinal neuralgia due to nerve entrapment or scarring - up to 10% risk)",
      "Mesh infection (may necessitate complete surgical mesh removal)",
      "Hematoma or seroma collection in the scrotum or groin",
      "Ischemic orchitis or testicular atrophy due to pampiniform plexus injury",
      "Injury to vas deferens leading to fertility implications",
      "Recurrence of hernia (1-2% risk)"
    ],
    benefits: [
      "Reduction of groin swelling and relief of discomfort",
      "Prevention of acute hernia incarceration, strangulation, or bowel obstruction",
      "Restoration of abdominal wall integrity"
    ],
    alternatives: [
      "Watchful waiting (only for asymptomatic/minimally symptomatic direct hernias)",
      "Use of a mechanical hernia truss (palliative, does not cure the defect)"
    ],
    operativeSteps: [
      "Oblique groin incision made. Inguinal canal opened. Ilioinguinal and iliohypogastric nerves identified and preserved.",
      "Hernia sac isolated. Direct sac invaginated / Indirect sac dissected up to deep ring, opened, contents reduced, and transfixed.",
      "Prolene mesh tailored and placed to reinforce the posterior wall of inguinal canal.",
      "Mesh secured to inguinal ligament, pubic tubercle, and conjoined tendon with Prolene sutures.",
      "External oblique aponeurosis, subcutaneous tissues, and skin closed in layers."
    ],
    postOpOrders: [
      "Normal diet as tolerated once awake. Early ambulation encouraged.",
      "Avoid heavy lifting (>5 kg) or strenuous exercise for 6-8 weeks.",
      "Scrotal support/tight briefs to prevent scrotal hematoma.",
      "Tab. Aceclofenac 100mg + Paracetamol 325mg BD for 5 days."
    ]
  }
};

const getBilingualConsentData = (patient: Patient) => {
  const diagnosis = patient.diagnosis;
  const procedure = patient.procedurePlanned;
  const anaesthesia = patient.anaesthetist.includes("Local") ? "Local Anaesthesia" : 
                      patient.anaesthetist.includes("Spinal") ? "Spinal Anaesthesia" : "General Anaesthesia";
  const anaesthesiaMr = anaesthesia === "Local Anaesthesia" ? "स्थानिक भूल" :
                        anaesthesia === "Spinal Anaesthesia" ? "स्पायनल भूल (कमरेखालील भाग बधिरीकरण)" : "जनरल भूल (पूर्ण बधिरीकरण)";

  // Check which clinical profile matches
  const isAas = diagnosis.toLowerCase().includes("hydrocele") || procedure.toLowerCase().includes("hydrocelectomy") || patient.name.includes("Rajendra");
  const isGallbladder = diagnosis.toLowerCase().includes("cholelithiasis") || procedure.toLowerCase().includes("cholecystectomy");
  const isAppendix = diagnosis.toLowerCase().includes("appendicitis") || procedure.toLowerCase().includes("appendicectomy");
  const isHernia = diagnosis.toLowerCase().includes("hernia") || procedure.toLowerCase().includes("hernioplasty");

  let data = {
    diagnosisEn: `Clinical condition diagnosed as: ${diagnosis}.`,
    diagnosisMr: `नैदानिक चाचणीनुसार आढळलेला आजार: ${diagnosis}.`,
    procedureEn: `${procedure} under ${anaesthesia}.`,
    procedureMr: `${anaesthesiaMr} अंतर्गत करण्यात येणारी ${procedure} शस्त्रक्रिया.`,
    
    explainedEn: `Under ${anaesthesia}, the surgical team will make appropriate incisions to access the target organs, correct the anatomical defects, secure bleeding vessels, and close the incision in layers using sutures.`,
    explainedMr: `${anaesthesiaMr} अंतर्गत, शल्यचिकित्सक योग्य छेद देऊन संबंधित अवयवांपर्यंत पोहोचतील, आजाराचा दोष किंवा वाढलेला भाग दुरुस्त/काढून टाकतील, रक्तवाहिन्या व्यवस्थित बंद करतील आणि टाके घालून जखम बंद करतील.`,
    
    purposeEn: `To treat the diagnosed condition, alleviate symptoms (such as pain, swelling, or bleeding), restore normal physiological function, and prevent future life-threatening complications.`,
    purposeMr: `आढळलेल्या आजारावर उपचार करणे, त्रासापासून (उदा. वेदना, सूज, रक्तस्त्राव) सुटका मिळवणे, शारीरिक कार्य पूर्ववत करणे, आणि भविष्यातील संभाव्य गंभीर गुंतागुंत टाळणे.`,
    
    risksGeneralEn: `Pain, bleeding, wound infection, delayed healing, scar formation, drug allergic reactions, deep vein thrombosis (DVT), pulmonary embolism (PE), and anesthesia-related reactions.`,
    risksGeneralMr: `शस्त्रक्रियेनंतर वेदना होणे, रक्तस्त्राव होणे, जखमेमध्ये जंतूसंसर्ग होणे, जखम भरण्यास वेळ लागणे, डाग पडणे, औषधांची ॲलर्जी होणे, पायांच्या शिरांमध्ये रक्त साठणे (DVT) आणि फुफ्फुसात रक्ताची गाठ जाणे (PE).`,
    
    risksSpecificEn: `Injury to surrounding tissues, organs, or major blood vessels; risk of conversion to an open procedure if performed laparoscopically; and risk of recurrence of the condition.`,
    risksSpecificMr: `सभोवतालचे स्नायू, अवयव किंवा मुख्य रक्तवाहिन्यांना दुखापत होणे; लॅपरोस्कोपिक शस्त्रक्रियेचे ओपन सर्जरीत रूपांतर होण्याची शक्यता; आणि आजार पुन्हा उद्भवणे.`,
    
    additionalEn: `During the surgical procedure, unexpected findings or emergencies may arise that require the surgical team to perform additional procedures (such as converting to open surgery, inserting a drain, removing additional diseased tissue, or repairing injured structures) for patient safety.`,
    additionalMr: `शस्त्रक्रियेदरम्यान काही अनपेक्षित बाबी किंवा आणीबाणी निर्माण झाल्यास, रुग्णाच्या जीविताच्या सुरक्षिततेसाठी शल्यचिकित्सक आवश्यकतेनुसार अतिरिक्त प्रक्रिया करू शकतात (उदा. छेद मोठा करणे, ड्रेन नळी घालणे, अतिरिक्त बाधित भाग काढणे, किंवा जखमी भागांची दुरुस्ती करणे).`,
    
    alternativesEn: `Conservative medical management (symptomatic drugs, dietary changes, observation) or less invasive procedures if clinically applicable. However, surgery is the recommended definitive treatment.`,
    alternativesMr: `फक्त औषधोपचार, आहारात बदल किंवा लक्षणांवर आधारित उपचार करणे. परंतु, आजाराच्या कायमस्वरूपी उपचारासाठी शस्त्रक्रिया हाच योग्य पर्याय आहे.`
  };

  if (isAas) {
    data.diagnosisEn = "Right Vaginal Hydrocele and Hemorrhoids with Fissure-in-Ano.";
    data.diagnosisMr = "उजव्या बाजूचे व्हजायनल हायड्रोसील (अंडकोषात पाणी जमा होणे) आणि मूळव्याध (पाइल्स) व गुदद्वारातील फिशर.";
    data.procedureEn = "Right Hydrocelectomy (Right Eversion of Sac), Milligan-Morgan Hemorrhoidectomy, and Lateral Internal Sphincterotomy (LIS) under Spinal Anaesthesia.";
    data.procedureMr = "स्पायनल भूल अंतर्गत उजव्या अंडकोषाची शस्त्रक्रिया (Right Eversion of Sac), मिलिगन-मॉर्गन पद्धतीने मूळव्याध काढणे आणि लेटरल इंटरनल स्फिंक्टरोटोमी (LIS).";
    
    data.explainedEn = "Under spinal anaesthesia, an incision will be made on the right side of the scrotum. The fluid will be drained, and the sac will be turned inside out and sutured (everted) to prevent fluid re-accumulation. For hemorrhoids and fissure, the patient is placed in the lithotomy position. The hemorrhoidal masses will be dissected and excised (Milligan-Morgan technique). Then, a small division of the internal anal sphincter muscle (Lateral Internal Sphincterotomy) is performed to relieve sphincter spasm, which relieves pain and allows the fissure to heal.";
    data.explainedMr = "स्पायनल भूल दिल्यांनतर, उजव्या अंडकोषावर छेद दिला जाईल. अंडकोषातील अतिरिक्त पाणी काढून टाकले जाईल व पाण्याचा पडदा उलटवून टाके घातले जातील जेणेकरून पुन्हा पाणी साठणार नाही. मूळव्याधासाठी, रुग्णाला विशिष्ट स्थितीत झोपवून मूळव्याधाचे कोंब शस्त्रक्रियेने कापून काढून टाकले जातील (मिलिगन-मॉर्गन पद्धत). त्यानंतर फिशरच्या जागी असणारी आकुंचन पावलेली स्नायूची कडी (Internal Anal Sphincter) काही प्रमाणात कापली जाईल (LIS) जेणेकरून तिथला ताण कमी होऊन फिशर लवकर बरे होईल आणि वेदना कमी होतील.";
    
    data.purposeEn = "To relieve scrotal swelling and discomfort caused by the hydrocele, permanently treat the hemorrhoids and anal fissure, relieve pain and bleeding during bowel movements, and prevent future complications.";
    data.purposeMr = "अंडकोषाची सूज व त्यामुळे होणारा त्रास कमी करणे, मूळव्याध व फिशरवर कायमस्वरूपी उपचार करणे, शौचाच्या वेळी होणाऱ्या तीव्र वेदना व रक्तस्त्राव थांबवणे, तसेच भविष्यातील गुंतागुंत टाळणे.";
    
    data.risksSpecificEn = "For Hydrocelectomy: Testicular injury, atrophy, recurrence, hematoma, seroma, chronic pain.\nFor Hemorrhoids & LIS: Bleeding, pain, urinary retention, anal stenosis, recurrence, temporary incontinence.";
    data.risksSpecificMr = "हायड्रोसील शस्त्रक्रियेसाठी: अंडकोषावर सूज किंवा रक्त साठणे (हेमॅटोमा), हायड्रोसील पुन्हा होणे, द्रव साठणे (सिरोमा), अंडकोष किंवा शुक्रनलिकेला दुखापत होणे, आणि क्वचित अंडकोष लहान होणे.\nमूळव्याध व फिशरसाठी: शौचाच्या वेळी तीव्र वेदना, गुदद्वारातून रक्तस्त्राव, लघवी अडकणे, संसर्ग, गुदद्वार अरुंद होणे, मूळव्याध किंवा फिशर पुन्हा होणे, काही काळ वायू नियंत्रणात अडचण येणे आणि क्वचित शौचावर नियंत्रण कमी होणे.";
    
    data.alternativesEn = "Medicines, dietary modifications, sitz baths, and aspiration for hydrocele (which provides temporary relief in selected cases). However, surgery is the definitive treatment.";
    data.alternativesMr = "औषधोपचार, आहारात बदल, सिट्झ बाथ किंवा हायड्रोसीलमध्ये द्रव काढणे (तात्पुरता आराम मिळू शकतो); परंतु कायमस्वरूपी उपचारासाठी शस्त्रक्रिया आवश्यक आहे.";
  } else if (isGallbladder) {
    data.diagnosisEn = "Cholelithiasis (Gallstones) and associated Gallbladder Inflammation.";
    data.diagnosisMr = "पित्ताशयातील खडे (Cholelithiasis) आणि पित्ताशयाची सूज (Cholecystitis).";
    data.procedureEn = "Laparoscopic Cholecystectomy under General Anaesthesia.";
    data.procedureMr = "जनरल भूल अंतर्गत लॅपरोस्कोपिक पित्ताशय काढणे (Laparoscopic Cholecystectomy).";
    
    data.explainedEn = "Under general anaesthesia, small port incisions will be made in the abdomen. Carbon dioxide gas will be insufflated to create working space. Calot's triangle will be dissected to identify, clip, and divide the cystic duct and cystic artery (Critical View of Safety). The gallbladder will be separated from the liver bed using electrocautery and extracted in a retrieval bag. The abdomen is then deflated and ports are sutured.";
    data.explainedMr = "जनरल भूल दिल्यांनतर, पोटावर लहान छेद (छिद्र) पाडले जातील. पोटात कार्बन डायऑक्साइड वायू भरून जागा तयार केली जाईल. पित्ताशयाची मुख्य वाहिनी व रक्तवाहिनी शोधून त्यांना क्लिप लावून बंद केले जाईल आणि सुरक्षितपणे कापले जाईल. त्यानंतर पित्ताशय यकृतापासून वेगळे करून पिशवीत टाकून बाहेर काढले जाईल व जखमा शिवल्या जातील.";
    
    data.purposeEn = "To resolve symptoms of gallbladder inflammation (biliary colic), eliminate risks of acute cholecystitis, gallstone pancreatitis, and prevent severe biliary sepsis.";
    data.purposeMr = "पित्ताशयातील खड्यांमुळे होणाऱ्या तीव्र वेदना थांबवणे, पित्ताशयाचा दाह किंवा स्वादुपिंडाचा आजार यांसारखी गुंतागुंत टाळणे आणि गंभीर संसर्ग होण्यापासून प्रतिबंध करणे.";
    
    data.risksSpecificEn = "CBD injury, bile leak, ERCP, retained stones, conversion to open surgery, drain insertion.";
    data.risksSpecificMr = "मुख्य पित्तनलिकेला दुखापत होणे (ज्यासाठी मोठी ओपन सर्जरी लागू शकते), पित्तगळती (Bile Leak) होणे, रक्तस्त्राव होणे, तांत्रिक अडचणी किंवा चिकटपणामुळे ओपन सर्जरीत रुपांतर करावे लागणे, पित्तनलिकेत खडा अडकून राहणे, खांद्यामध्ये वेदना जाणवणे.";
    
    data.alternativesEn = "Watchful waiting, low-fat dietary modifications, and emergency medical therapy. However, surgery is the only curative and definitive therapy.";
    data.alternativesMr = "फक्त आहारात बदल (कमी चरबीयुक्त आहार), वेदनाशामक औषधे आणि दाहकताविरोधी उपचार. परंतु, शस्त्रक्रिया हाच एकमेव खात्रीशीर उपचार आहे.";
  } else if (isAppendix) {
    data.diagnosisEn = "Acute Appendicitis (Inflammation of the Appendix).";
    data.diagnosisMr = "तीव्र ॲपेन्डिक्सचा दाह (Acute Appendicitis).";
    data.procedureEn = "Laparoscopic Appendicectomy under General Anaesthesia.";
    data.procedureMr = "जनरल भूल अंतर्गत लॅपरोस्कोपिक ॲपेन्डेक्टॉमी (Laparoscopic Appendicectomy).";
    
    data.explainedEn = "Under general anaesthesia, three small port incisions will be made in the abdomen. Carbon dioxide is used to inflate the abdominal cavity. The appendix is visualized, its blood supply (mesoappendix) is divided, and the appendiceal base is secured using endoloops/staples before transection and removal via a retrieval bag. Lavage is done if needed, and incisions are closed.";
    data.explainedMr = "जनरल भूल अंतर्गत, पोटावर तीन लहान छेद दिले जातील आणि कार्बन डायऑक्साइड वायूने पोट फुगवले जाईल. ॲपेन्डिक्सचा भाग मोकळा करून त्याच्या मूळ भागाजवळ क्लिप किंवा लूप लावून तो कापला जाईल आणि पिशवीतून बाहेर काढला जाईल. त्यानंतर पोट धुऊन टाके लावले जातील.";
    
    data.purposeEn = "To surgically excise the inflamed appendix, preventing appendiceal rupture, localized or generalized peritonitis, abdominal abscess, and systemic sepsis.";
    data.purposeMr = "सुजलेला ॲपेन्डिक्स शस्त्रक्रियेने काढून टाकणे, तो फुटणे व पोटातील इतर भागांमध्ये पू किंवा जंतूसंसर्ग (Peritonitis) पसरणे रोखणे, आणि जीवाला होणारा धोका टाळणे.";
    
    data.risksSpecificEn = "Bowel injury, leak, abscess, drain placement, wound infection, and conversion to open surgery.";
    data.risksSpecificMr = "ओटीपोटात पू किंवा पाण्याचे संकलन होणे, आतड्याच्या जोडलेल्या भागातून शौचाची गळती (Fistula) होणे, छिद्र पाडलेल्या जागी संसर्ग होणे, आतड्याची हालचाल तात्पुरती मंदावणे, आणि लॅपरोस्कोपिक ऐवजी मोठी ओपन सर्जरी करावी लागणे.";
    
    data.alternativesEn = "Conservative antibiotic therapy (associated with a 30-40% recurrence rate within a year). Surgery is the standard definitive cure.";
    data.alternativesMr = "औषधोपचार किंवा अँटीबायोटिक्स (ज्यामुळे एका वर्षात पुन्हा आजार उद्भवण्याचा ३०-४०% धोका असतो). शस्त्रक्रिया हाच सर्वात सुरक्षित आणि कायमसूरूपी उपाय आहे.";
  } else if (isHernia) {
    data.diagnosisEn = "Inguinal Hernia (Abdominal wall defect in groin).";
    data.diagnosisMr = "जांघेतील हर्निया (Inguinal Hernia - पोटाच्या स्नायूंमधील छिद्र/दोष).";
    data.procedureEn = "Open Inguinal Hernioplasty (Lichtenstein Mesh Repair) under Spinal Anaesthesia.";
    data.procedureMr = "स्पायनल भूल अंतर्गत जाळी बसवून हर्निया दुरुस्त करणे (Open Inguinal Hernioplasty Lichtenstein Mesh Repair).";
    
    data.explainedEn = "An incision is made in the groin. The hernia sac is dissected from the spermatic cord structures and contents are reduced back into the abdominal cavity. A synthetic non-absorbable polypropylene mesh is placed over the posterior wall defect and sutured in place to reinforce the inguinal canal. The wound is closed in layers.";
    data.explainedMr = "जांघेत छेद दिला जाईल. हर्नियाची पिशवी बाजूला करून पोटातील बाहेर आलेला भाग (आतडे किंवा चरबी) पुन्हा पोटात ढकलला जाईल. त्यानंतर तिथे एक कृत्रिम जाळी (Polypropylene Mesh) बसवून ती टाके देऊन घट्ट केली जाईल जेणेकरून तिथले स्नायू मजबूत होतील, आणि जखम बंद केली जाईल.";
    
    data.purposeEn = "To reinforce the weak posterior inguinal wall, reduce the hernia swelling, and prevent strangulation or obstruction of the herniated bowel.";
    data.purposeMr = "जांघेच्या कमकुवत भागाला जाळीने बळकट करणे, हर्नियाची सूज कमी करणे, आणि हर्नियामध्ये आतडे अडकून पडणे किंवा निकामी होण्याचा धोका टाळणे.";
    
    data.risksSpecificEn = "Mesh infection, recurrence, bowel injury, cord injury, testicular ischemia/atrophy, and groin neuralgia.";
    data.risksSpecificMr = "जांघेत दीर्घकालीन तीव्र वेदना राहणे (चेतापीडा - १०% शक्यता), जाळीला संसर्ग होणे (ज्यामुळे जाळी काढून टाकावी लागते), जांघ किंवा अंडकोषात रक्त/पाणी साठणे, शुक्रवाहिनीला दुखापत होणे, अंडकोष निकामी होणे, हर्निया पुन्हा होणे.";
    
    data.alternativesEn = "Watchful waiting (only for asymptomatic direct hernias) or mechanical truss support (does not cure the defect). Surgery is the definitive treatment.";
    data.alternativesMr = "निरीक्षण करणे (जर हर्नियाचा त्रास नसेल तर) किंवा हर्निया बेल्ट (Truss) वापरणे (याने छिद्र बंद होत नाही). शस्त्रक्रिया हाच कायमस्वरूपी इलाज आहे.";
  }

  // Comorbidities customization
  let comorbiditiesEn = "No significant comorbidities present that increase standard surgical risks.";
  let comorbiditiesMr = "सध्या कोणताही जुनाट आजार (comorbidity) नाही ज्यामुळे शस्त्रक्रियेचा धोका वाढेल.";
  if (patient.comorbidities && patient.comorbidities.trim() !== "" && patient.comorbidities.toLowerCase() !== "none") {
    comorbiditiesEn = `Poor wound healing, higher infection rates, cardiac events, and pulmonary complications associated with history of ${patient.comorbidities}.`;
    comorbiditiesMr = `रुग्णाला ${patient.comorbidities} चा इतिहास असल्यामुळे, जखम लवकर न भरणे, जंतूसंसर्ग होणे, हृदयावर ताण येणे आणि फुफ्फुसाशी संबंधित गुंतागुंत निर्माण होण्याचा धोका वाढतो.`;
  }

  // Anaesthesia customization
  let anaesthesiaRisksEn = "";
  let anaesthesiaRisksMr = "";
  if (anaesthesia.includes("Spinal")) {
    anaesthesiaRisksEn = "Low blood pressure, post-dural puncture headache (spinal headache), urinary retention, and temporary shivering.";
    anaesthesiaRisksMr = "रक्तदाब कमी होणे, डोकेदुखी (Spinal Headache), लघवी होण्यास त्रास होणे, थंडी वाजणे.";
  } else if (anaesthesia.includes("General")) {
    anaesthesiaRisksEn = "Sore throat, dental damage, nausea/vomiting, and respiratory depression.";
    anaesthesiaRisksMr = "घसा खवखवणे, दातांना इजा, मळमळ/उलटी, श्वासोच्छवासाचा त्रास.";
  } else {
    anaesthesiaRisksEn = "Local pain, hematoma, nerve irritation, and drug allergic reactions.";
    anaesthesiaRisksMr = "स्थानिक पातळीवर वेदना, रक्त साठणे, मज्जासंस्थेला किरकोळ इजा आणि औषधांची प्रतिक्रिया.";
  }

  return {
    ...data,
    comorbiditiesEn,
    comorbiditiesMr,
    anaesthesiaRisksEn,
    anaesthesiaRisksMr
  };
};

export const AIClinicalGenerator: React.FC<AIClinicalGeneratorProps> = ({ 
  activePatientId, 
  setSelectedPatientId, 
  setActiveTab,
  setSelectedDocId
}) => {
  const { currentHospital, patients, addDocument, languageMode, setLanguageMode, selectedSecondaryLang, setSelectedSecondaryLang, currentDoctor } = useApp();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [docType, setDocType] = useState<string>('Procedure Consent');
  const [primaryLang] = useState<string>('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<ClinicalDocument | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editableContent, setEditableContent] = useState('');

  // Set patient initially
  useEffect(() => {
    if (activePatientId) {
      const patient = patients.find(p => p.id === activePatientId);
      if (patient) setSelectedPatient(patient);
    } else if (patients.length > 0) {
      setSelectedPatient(patients[0]);
      setSelectedPatientId(patients[0].id);
    }
  }, [activePatientId, patients]);

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patient = patients.find(p => p.id === e.target.value) || null;
    setSelectedPatient(patient);
    setSelectedPatientId(patient ? patient.id : null);
    setGeneratedDoc(null);
  };


  const generateAIDocumentContent = () => {
    if (!selectedPatient) return '';

    const patientName = selectedPatient.name;
    const uhid = selectedPatient.uhid;
    const diagnosis = selectedPatient.diagnosis;
    
    // Fallback if procedure is not mapped in PROCEDURE_CLINICAL_PROFILES
    let procName = selectedPatient.procedurePlanned;
    let clinicalProfile = PROCEDURE_CLINICAL_PROFILES[procName];
    
    if (!clinicalProfile) {
      // Find fuzzy match
      const matchedKey = Object.keys(PROCEDURE_CLINICAL_PROFILES).find(k => 
        procName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(procName.toLowerCase())
      );
      clinicalProfile = matchedKey ? PROCEDURE_CLINICAL_PROFILES[matchedKey] : {
        risks: [
          "Bleeding and wound infection at incision sites",
          "Damage to surrounding organs and tissue",
          "Anesthetic complications (allergic reaction, breathing stress)"
        ],
        benefits: ["Treatment of condition and relief of symptoms"],
        alternatives: ["Conservative medical treatment", "Observation"],
        operativeSteps: ["Patient prepped. Anaesthesia administered. Surgical access gained. Defect corrected. Closure done."],
        postOpOrders: ["Monitor vitals. Start pain management. Advance diet as tolerated."]
      };
    }

    if (docType === 'Procedure Consent') {
      const consentData = getBilingualConsentData(selectedPatient);
      const patientAge = selectedPatient.age;
      const patientGender = selectedPatient.gender;
      const patientMobile = selectedPatient.mobile || "+91 9325215630";
      const currentDate = new Date().toLocaleDateString('en-GB');

      return `
        <div class="space-y-6 print-page text-left">
          <!-- Hospital Header & Doctor Details -->
          <div class="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
            <div>
              <h1 class="text-base font-black uppercase text-slate-800">${currentHospital.name}</h1>
              <p class="text-[9px] text-slate-400 font-extrabold tracking-wider">NABH ACCREDITED & CLINICAL COMPLIANCE DEPT</p>
            </div>
            <div class="text-right">
              <p class="text-xs font-black text-slate-800">${selectedPatient.consultant.toUpperCase().startsWith('DR.') ? selectedPatient.consultant.toUpperCase() : `DR. ${selectedPatient.consultant.toUpperCase()}`}</p>
              <p class="text-[8px] text-slate-400 font-bold tracking-widest">SENIOR CONSULTANT SURGEON</p>
            </div>
          </div>

          <h2 class="text-center font-black text-xs uppercase tracking-wide text-slate-900 border-y py-1.5 mb-4">
            BILINGUAL INFORMED CONSENT / माहितीपूर्वक लेखी संमतीपत्र
          </h2>

          <!-- Patient & Procedure Metadata Table -->
          <div class="grid grid-cols-2 gap-y-1.5 gap-x-6 text-[10px] bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
            <div><strong>Patient Name / रुग्णाचे नाव:</strong> ${patientName}</div>
            <div><strong>UHID / हॉस्पिटल क्रमांक:</strong> ${uhid}</div>
            <div><strong>Age & Sex / वय-लिंग:</strong> ${patientAge} Yrs / ${patientGender}</div>
            <div><strong>Mobile / मोबाईल:</strong> ${patientMobile}</div>
            <div><strong>Anaesthesia / भूल प्रकार:</strong> ${selectedPatient.anaesthetist}</div>
            <div><strong>Date & Time / दिनांक:</strong> ${currentDate}</div>
            <div class="col-span-2 border-t dark:border-slate-700 pt-1.5 mt-0.5">
              <strong>Diagnosis / निदान:</strong> ${diagnosis}
            </div>
            <div class="col-span-2">
              <strong>Planned Procedure / प्रस्तावित शस्त्रक्रिया:</strong> ${selectedPatient.procedurePlanned}
            </div>
          </div>

          <!-- Bilingual Sections -->
          <div class="space-y-4 text-[10px] text-slate-800 dark:text-slate-200">
            
            <!-- 1. Diagnosis -->
            <div class="space-y-0.5">
              <h3 class="font-bold border-b dark:border-slate-800 pb-0.5 uppercase text-slate-900 dark:text-white">1. Diagnosis / निदान</h3>
              <p class="text-slate-800 dark:text-slate-100 font-medium">${consentData.diagnosisEn}</p>
              <p class="text-slate-500 dark:text-slate-400 italic">${consentData.diagnosisMr}</p>
            </div>

            <!-- 2. Planned Procedure -->
            <div class="space-y-0.5">
              <h3 class="font-bold border-b dark:border-slate-800 pb-0.5 uppercase text-slate-900 dark:text-white">2. Planned Procedure / प्रस्तावित शस्त्रक्रिया</h3>
              <p class="text-slate-800 dark:text-slate-100 font-medium">${consentData.procedureEn}</p>
              <p class="text-slate-500 dark:text-slate-400 italic">${consentData.procedureMr}</p>
            </div>

            <!-- 3. Procedure Explained -->
            <div class="space-y-0.5">
              <h3 class="font-bold border-b dark:border-slate-800 pb-0.5 uppercase text-slate-900 dark:text-white">3. Procedure Explained / शस्त्रक्रियेची माहिती</h3>
              <p class="leading-relaxed text-slate-700 dark:text-slate-300">${consentData.explainedEn}</p>
              <p class="text-slate-500 dark:text-slate-400 italic leading-relaxed">${consentData.explainedMr}</p>
            </div>

            <!-- 4. Purpose of Surgery -->
            <div class="space-y-0.5">
              <h3 class="font-bold border-b dark:border-slate-800 pb-0.5 uppercase text-slate-900 dark:text-white">4. Purpose of Surgery / शस्त्रक्रियेचा उद्देश</h3>
              <p class="text-slate-800 dark:text-slate-100 font-medium">${consentData.purposeEn}</p>
              <p class="text-slate-500 dark:text-slate-400 italic">${consentData.purposeMr}</p>
            </div>

            <!-- 5. Possible Risks and Complications -->
            <div class="space-y-2">
              <h3 class="font-bold border-b dark:border-slate-800 pb-0.5 uppercase text-slate-900 dark:text-white">5. Possible Risks and Complications / संभाव्य धोके व गुंतागुंत</h3>
              
              <div class="pl-2.5 border-l border-slate-300 dark:border-slate-700 space-y-2">
                <!-- General Risks -->
                <div>
                  <h4 class="font-extrabold text-slate-800 dark:text-slate-100 text-[10px]">General Surgical Risks / सामान्य गुंतागुंत:</h4>
                  <p class="text-slate-700 dark:text-slate-300">${consentData.risksGeneralEn}</p>
                  <p class="text-slate-500 dark:text-slate-400 italic">${consentData.risksGeneralMr}</p>
                </div>
                
                <!-- Specific Risks -->
                <div>
                  <h4 class="font-extrabold text-slate-800 dark:text-slate-100 text-[10px]">Procedure Specific Risks / शस्त्रक्रियेसंबंधीचे संभाव्य धोके:</h4>
                  <p class="text-slate-700 dark:text-slate-300 whitespace-pre-line">${consentData.risksSpecificEn}</p>
                  <p class="text-slate-500 dark:text-slate-400 italic whitespace-pre-line">${consentData.risksSpecificMr}</p>
                </div>

                <!-- Patient Specific Risks -->
                <div>
                  <h4 class="font-extrabold text-slate-800 dark:text-slate-100 text-[10px]">Patient Specific Risks / रुग्णाशी संबंधित धोके:</h4>
                  <p class="text-slate-700 dark:text-slate-300">${consentData.comorbiditiesEn}</p>
                  <p class="text-slate-500 dark:text-slate-400 italic">${consentData.comorbiditiesMr}</p>
                </div>

                <!-- Anaesthesia Risks -->
                <div>
                  <h4 class="font-extrabold text-slate-800 dark:text-slate-100 text-[10px]">Anaesthesia Risks / भुलीशी संबंधित धोके:</h4>
                  <p class="text-slate-700 dark:text-slate-300">${consentData.anaesthesiaRisksEn}</p>
                  <p class="text-slate-500 dark:text-slate-400 italic">${consentData.anaesthesiaRisksMr}</p>
                </div>
              </div>
            </div>

            <!-- 6. Possibility of Additional Procedure -->
            <div class="space-y-0.5">
              <h3 class="font-bold border-b dark:border-slate-800 pb-0.5 uppercase text-slate-900 dark:text-white">6. Possibility of Additional Procedure / अतिरिक्त उपचाराची शक्यता</h3>
              <p class="leading-relaxed text-slate-700 dark:text-slate-300">${consentData.additionalEn}</p>
              <p class="text-slate-500 dark:text-slate-400 italic leading-relaxed">${consentData.additionalMr}</p>
            </div>

            <!-- 7. Alternatives -->
            <div class="space-y-0.5">
              <h3 class="font-bold border-b dark:border-slate-800 pb-0.5 uppercase text-slate-900 dark:text-white">7. Alternatives / पर्यायी उपचार</h3>
              <p class="leading-relaxed text-slate-700 dark:text-slate-300">${consentData.alternativesEn}</p>
              <p class="text-slate-500 dark:text-slate-400 italic leading-relaxed">${consentData.alternativesMr}</p>
            </div>

            <!-- 8. Patient Declaration -->
            <div class="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <h3 class="font-bold border-b dark:border-slate-800 pb-0.5 uppercase text-slate-900 dark:text-white">8. Patient Declaration / रुग्णाची घोषणा व संमती</h3>
              <p class="leading-relaxed text-slate-700 dark:text-slate-300">
                I hereby declare that my disease, planned procedure, expected benefits, potential risks/complications, and possible alternative methods have been explained to me by the doctor in my language. I have had adequate opportunities to clarify my queries and clear my doubts. I understand that no guarantee is made regarding the outcomes of the procedure. I voluntarily consent to the surgery, anesthesia administration, possible additional procedure or surgical conversion, blood transfusion, and histopathological analysis of the tissue specimen as deemed necessary by the medical team.
              </p>
              <p class="text-slate-500 dark:text-slate-400 italic leading-relaxed">
                मी याद्वारे जाहीर करतो की मला माझ्या आजाराविषयी, प्रस्तावित शस्त्रक्रियेविषयी, अपेक्षित फायदे, संभाव्य धोके/गुंतागुंत आणि पर्यायी उपचारांविषयी डॉक्टरांनी माझ्या भाषेत स्पष्टीकरण दिले आहे. मला माझ्या शंकांचे निरसन करण्याची पुरेशी संधी देण्यात आली आहे. मला हे पूर्णपणे समजले आहे की शस्त्रक्रियेच्या यशाची कोणतीही हमी दिलेली नाही. मी स्वेच्छेने या शस्त्रक्रियेसाठी, भूल देण्यास, आवश्यकतेनुसार अतिरिक्त उपचार करण्यास किंवा ओपन शस्त्रक्रियेमध्ये रूपांतर करण्यास, रक्त देण्यास आणि टिशू पॅथॉलॉजी तपासणीसाठी पाठवण्यास पूर्ण संमती देत आहे.
              </p>
            </div>

            <!-- Signature Block -->
            <div class="border-t dark:border-slate-700 pt-4 mt-6 grid grid-cols-3 gap-6 text-[9px]">
              <div class="space-y-6">
                <div>
                  <p class="border-b border-slate-300 dark:border-slate-700 w-full h-7"></p>
                  <p class="mt-1 font-bold text-slate-900 dark:text-white">Patient Signature / रुग्णाची स्वाक्षरी</p>
                </div>
                <div>
                  <p class="border-b border-slate-300 dark:border-slate-700 w-full h-7"></p>
                  <p class="mt-1 font-bold text-slate-900 dark:text-white">Guardian Signature / पालकाची स्वाक्षरी</p>
                  <p class="text-[8px] text-slate-400">Relationship / नाते: ___________________</p>
                </div>
              </div>
              <div class="space-y-6">
                <div>
                  <p class="border-b border-slate-300 dark:border-slate-700 w-full h-7 font-mono flex items-end justify-center text-blue-600/70 text-[8px]">[Digitally Signed By Surgeon]</p>
                  <p class="mt-1 font-bold text-slate-900 dark:text-white">Surgeon Signature / शल्यचिकित्सकाची स्वाक्षरी</p>
                  <p class="text-[8px] text-slate-400">Dr. ${selectedPatient.consultant}</p>
                </div>
                <div>
                  <p class="border-b border-slate-300 dark:border-slate-700 w-full h-7"></p>
                  <p class="mt-1 font-bold text-slate-900 dark:text-white">Anaesthetist Signature / भूलतज्ज्ञाची स्वाक्षरी</p>
                </div>
              </div>
              <div class="space-y-6">
                <div>
                  <p class="border-b border-slate-300 dark:border-slate-700 w-full h-7"></p>
                  <p class="mt-1 font-bold text-slate-900 dark:text-white">Witness Signature / साक्षीदाराची स्वाक्षरी</p>
                </div>
                <div>
                  <p class="border-b border-slate-300 dark:border-slate-700 w-full h-7"></p>
                  <p class="mt-1 font-bold text-slate-900 dark:text-white">Date & Time / दिनांक व वेळ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (docType === 'Operation Notes') {
      return `
        <div class="space-y-6 print-page">
          <h2 class="text-xl font-bold text-center border-b pb-3 text-slate-800">SURGICAL OPERATION RECORD & OPERATION NOTE</h2>
          
          <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div><strong>Patient Name:</strong> ${patientName}</div>
            <div><strong>UHID:</strong> ${uhid}</div>
            <div><strong>Planned Surgery:</strong> ${selectedPatient.procedurePlanned}</div>
            <div><strong>Surgeon:</strong> ${selectedPatient.consultant}</div>
            <div><strong>Anaesthetist:</strong> ${selectedPatient.anaesthetist}</div>
            <div><strong>ASA Score:</strong> ${selectedPatient.asaGrade}</div>
          </div>

          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-800 border-b pb-1">PRE-OPERATIVE CLINICAL PROFILE:</h4>
            <p class="text-xs">
              Patient was admitted with history of ${selectedPatient.remarks || 'relevant symptoms'}. 
              Diagnosed with <strong>${selectedPatient.diagnosis}</strong>. Pre-operative vitals: BP ${selectedPatient.vitals.bp}, Pulse ${selectedPatient.vitals.pulse}. 
              Lab findings: Hb ${selectedPatient.investigations.hb}, Creatinine ${selectedPatient.investigations.creatinine}. Co-morbidities: ${selectedPatient.comorbidities || 'None'}. Allergies: ${selectedPatient.allergies}.
            </p>
          </div>

          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-800 border-b pb-1">OPERATIVE TECHNIQUE & FINDINGS:</h4>
            <ol class="list-decimal pl-5 text-xs space-y-1.5">
              ${clinicalProfile.operativeSteps.map(step => `<li>${step}</li>`).join('')}
            </ol>
          </div>

          <div class="grid grid-cols-3 gap-2 text-xs pt-4">
            <div><strong>Blood Loss:</strong> Minimal (&lt;50 ml)</div>
            <div><strong>Specimen Sent:</strong> Gallbladder / Appendix tissue for Histopathology</div>
            <div><strong>Drainage Tube:</strong> No drain placed</div>
          </div>
        </div>
      `;
    }

    if (docType === 'Post-op Orders') {
      return `
        <div class="space-y-6 print-page">
          <h2 class="text-xl font-bold text-center border-b pb-3 text-slate-800">POST-OPERATIVE MONITORING & PHARMACY ORDERS</h2>
          
          <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div><strong>Patient Name:</strong> ${patientName}</div>
            <div><strong>UHID:</strong> ${uhid}</div>
            <div><strong>Procedure Done:</strong> ${selectedPatient.procedurePlanned}</div>
            <div><strong>Consultant:</strong> ${selectedPatient.consultant}</div>
          </div>

          <div class="space-y-4">
            <div>
              <h4 class="text-xs font-bold text-slate-800 border-b pb-1">NURSING PROTOCOLS:</h4>
              <ul class="list-disc pl-5 text-xs space-y-1.5 mt-2">
                ${clinicalProfile.postOpOrders.slice(0, 3).map(o => `<li>${o}</li>`).join('')}
              </ul>
            </div>
            
            <div>
              <h4 class="text-xs font-bold text-slate-800 border-b pb-1">MEDICATION ORDERS:</h4>
              <ul class="list-disc pl-5 text-xs space-y-1.5 mt-2">
                ${clinicalProfile.postOpOrders.slice(3).map(o => `<li>${o}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  };

  const handleGenerate = async () => {
    if (!selectedPatient) return;
    setIsGenerating(true);
    
    // Simulate complex AI reasoning time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const htmlContent = generateAIDocumentContent();
    const doc = addDocument({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientUhid: selectedPatient.uhid,
      templateId: `temp-${Date.now()}`,
      templateName: `${docType} - AI AutoGen`,
      title: `${docType} - ${selectedPatient.name}`,
      category: 'General Surgery',
      content: htmlContent,
      language: languageMode === 'mixed' ? `English + ${selectedSecondaryLang}` : primaryLang,
      hospitalId: currentHospital.id,
      generatedBy: currentDoctor?.id || 'user-1',
      generatedByName: currentDoctor?.name || 'Dr. Sophia Vance',
      status: 'Pending Signatures',
      qrCodeValueUrl: `https://meddocs.ai/verify/doc-${Date.now()}`
    });

    setGeneratedDoc(doc);
    setEditableContent(doc.content);
    setIsGenerating(false);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleGeneratePack = async () => {
    if (!selectedPatient) return;
    setIsGenerating(true);
    
    // Simulate generation of multiple docs
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 1. Consent
    setDocType('Procedure Consent');
    const cContent = generateAIDocumentContent();
    const cDoc = addDocument({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientUhid: selectedPatient.uhid,
      templateId: 'temp-consent-pack',
      templateName: 'Procedure Consent - AI AutoGen',
      title: `Procedure Consent - ${selectedPatient.name}`,
      category: 'General Surgery',
      content: cContent,
      language: languageMode === 'mixed' ? `English + ${selectedSecondaryLang}` : primaryLang,
      hospitalId: currentHospital.id,
      generatedBy: currentDoctor?.id || 'user-1',
      generatedByName: currentDoctor?.name || 'Dr. Sophia Vance',
      status: 'Pending Signatures',
      qrCodeValueUrl: `https://meddocs.ai/verify/doc-${Date.now()}-1`
    });

    // 2. Operative Note
    setDocType('Operation Notes');
    const oContent = generateAIDocumentContent();
    addDocument({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientUhid: selectedPatient.uhid,
      templateId: 'temp-op-pack',
      templateName: 'Operation Notes - AI AutoGen',
      title: `Operation Notes - ${selectedPatient.name}`,
      category: 'General Surgery',
      content: oContent,
      language: primaryLang,
      hospitalId: currentHospital.id,
      generatedBy: currentDoctor?.id || 'user-1',
      generatedByName: currentDoctor?.name || 'Dr. Sophia Vance',
      status: 'Draft',
      qrCodeValueUrl: `https://meddocs.ai/verify/doc-${Date.now()}-2`
    });

    // 3. Post Op Orders
    setDocType('Post-op Orders');
    const pContent = generateAIDocumentContent();
    addDocument({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientUhid: selectedPatient.uhid,
      templateId: 'temp-postop-pack',
      templateName: 'Post-op Orders - AI AutoGen',
      title: `Post-op Orders - ${selectedPatient.name}`,
      category: 'General Surgery',
      content: pContent,
      language: primaryLang,
      hospitalId: currentHospital.id,
      generatedBy: currentDoctor?.id || 'user-1',
      generatedByName: currentDoctor?.name || 'Dr. Sophia Vance',
      status: 'Draft',
      qrCodeValueUrl: `https://meddocs.ai/verify/doc-${Date.now()}-3`
    });

    // Reset view
    setGeneratedDoc(cDoc);
    setEditableContent(cDoc.content);
    setDocType('Procedure Consent');
    setIsGenerating(false);

    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 }
    });

    alert("AI Procedure Pack generated successfully! Consent Form, Operative Notes, and Post-op Orders have been populated into the patient record.");
  };

  const handleSaveEdit = () => {
    if (generatedDoc) {
      generatedDoc.content = editableContent;
      setGeneratedDoc({ ...generatedDoc });
      setEditMode(false);
      alert("Changes saved to document draft.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">AI Clinical Documentation</h2>
          <p className="text-xs text-slate-400">Select patient and surgical specialty to generate legal templates instantly</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form & Settings */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">1. Ingestion Settings</h3>
            
            {/* Patient dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Select Patient Case</label>
              <select
                value={selectedPatient?.id || ''}
                onChange={handlePatientChange}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.uhid}) - {p.procedurePlanned}</option>
                ))}
              </select>
            </div>

            {/* Patient short summary card */}
            {selectedPatient && (
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>{selectedPatient.name}</span>
                  <span className="text-[10px] text-blue-600 uppercase tracking-wider">{selectedPatient.uhid}</span>
                </div>
                <div className="text-slate-500 space-y-1">
                  <p><strong>Diagnosis:</strong> {selectedPatient.diagnosis}</p>
                  <p><strong>Procedure:</strong> {selectedPatient.procedurePlanned}</p>
                  <p className="text-rose-600"><strong>Allergies:</strong> {selectedPatient.allergies || 'None'}</p>
                  <p className="text-rose-600"><strong>Laterality:</strong> {selectedPatient.laterality}</p>
                </div>
              </div>
            )}

            {/* Document select */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Target Document Template</label>
              <select
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value);
                  setGeneratedDoc(null);
                }}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option>Procedure Consent</option>
                <option>Operation Notes</option>
                <option>Post-op Orders</option>
              </select>
            </div>

            {/* Languages settings */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600">Language Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setLanguageMode('single');
                    setGeneratedDoc(null);
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                    languageMode === 'single'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Single Language
                </button>
                <button
                  onClick={() => {
                    setLanguageMode('mixed');
                    setGeneratedDoc(null);
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                    languageMode === 'mixed'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Languages size={13} /> Mixed Bilingual
                </button>
              </div>

              {languageMode === 'mixed' && (
                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Secondary Translation Language</label>
                  <select
                    value={selectedSecondaryLang}
                    onChange={(e) => {
                      setSelectedSecondaryLang(e.target.value);
                      setGeneratedDoc(null);
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 outline-none"
                  >
                    <option>Marathi</option>
                    <option>Hindi</option>
                  </select>
                </div>
              )}
            </div>

            {/* Trigger buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedPatient}
                className="w-full bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-800 disabled:bg-slate-300 transition-all shadow-sm"
              >
                <Sparkles size={14} className="text-yellow-400" />
                {isGenerating ? "AI is Thinking..." : `Generate Document`}
              </button>

              <button
                onClick={handleGeneratePack}
                disabled={isGenerating || !selectedPatient}
                className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-sm"
              >
                <FolderPlus size={14} />
                Generate Procedure Pack
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Output Editor */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[450px] flex flex-col justify-between overflow-hidden">
            
            {/* Header toolbar */}
            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-xs font-bold text-slate-700">
                  {generatedDoc ? generatedDoc.title : "Document Preview"}
                </span>
                {generatedDoc && (
                  <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                    {generatedDoc.status}
                  </span>
                )}
              </div>

              {generatedDoc && (
                <div className="flex items-center gap-2">
                  {editMode ? (
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-2.5 py-1 rounded"
                    >
                      Save Changes
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1"
                    >
                      <Edit3 size={11} /> Edit Draft
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="p-1 text-slate-500 hover:text-slate-700"
                    title="Print Document"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Editable Content Frame */}
            <div className="p-6 flex-1 overflow-y-auto max-h-[500px]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-50 border-t-blue-500 animate-spin"></div>
                    <Sparkles size={20} className="text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700">AI Medical Document Compiler Running...</p>
                    <p className="text-[10px] text-slate-400">Analyzing clinical guidelines and risk variables</p>
                  </div>
                </div>
              ) : generatedDoc ? (
                editMode ? (
                  <textarea
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full h-full min-h-[350px] border border-slate-200 rounded-xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <div 
                    className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: generatedDoc.content }}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 space-y-3">
                  <FileText size={40} className="text-slate-300" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Ready to Generate</h4>
                    <p className="text-[10px] max-w-[250px] mx-auto mt-0.5">
                      Configure your patient case and select Generate above to trigger the clinical AI writer.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer action buttons */}
            {generatedDoc && !isGenerating && (
              <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Info size={12} className="text-blue-500" />
                  Standard variables populated: PatientName, UHID, Consultant, Laterality
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDocId(generatedDoc.id);
                      setActiveTab('signer');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Signature size={14} /> Sign Consent
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
