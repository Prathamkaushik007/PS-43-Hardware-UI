export interface GrievanceTicket {
  ticketId: string;
  category: string;
  subcategory: string;
  department: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  urgencyReason: string;
  summary: string;
  citizenTranscript: string;
  mediaType: 'VIDEO' | 'AUDIO';
  createdAt: string;
  kioskLocation: string;
  estimatedResolutionDays: number;
}

export function classifyGrievanceSimulation(
  transcript: string,
  mediaType: 'VIDEO' | 'AUDIO',
  lang: 'en' | 'hi'
): GrievanceTicket {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const ticketId = `GRV-2026-${randomNum}`;

  const textLower = (transcript || '').toLowerCase();

  let category = 'Water Supply';
  let subcategory = 'Pipeline Burst / Water Disruption';
  let department = lang === 'hi' ? 'जल संस्थान एवं नगर निगम' : 'Water Supply & Municipal Board';
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH';
  let urgencyReason = 'Drinking water pipeline damage and road flooding reported.';
  let summary = transcript || (lang === 'hi' ? 'पानी की पाइपलाइन लीकेज एवं जलापूर्ति बाधित' : 'Main pipeline burst causing water supply disruption');

  if (textLower.includes('road') || textLower.includes('pothole') || textLower.includes('सड़क') || textLower.includes('गड्ढे')) {
    category = 'Roads & Infrastructure';
    subcategory = 'Major Pothole & Road Damage';
    department = lang === 'hi' ? 'लोक निर्माण विभाग (PWD)' : 'Public Works Department (PWD)';
    priority = 'HIGH';
    urgencyReason = 'Potholes causing imminent traffic risk and vehicle accidents.';
    summary = lang === 'hi' ? 'मुख्य सड़क पर गहरे गड्ढे और दुर्घटना का खतरा' : 'Severe road damage and deep potholes endangering traffic';
  } else if (textLower.includes('electric') || textLower.includes('wire') || textLower.includes('power') || textLower.includes('बिजली') || textLower.includes('तार')) {
    category = 'Electricity';
    subcategory = 'Sparking Overhead Wire / Outage';
    department = lang === 'hi' ? 'विद्युत वितरण निगम (DISCOM)' : 'Electricity Distribution Board';
    priority = 'CRITICAL';
    urgencyReason = 'Loose sparking electrical wire near pedestrian pathway.';
    summary = lang === 'hi' ? 'झूलती हुई बिजली की तार से जानमाल का खतरा' : 'Hazardous sparking overhead wires near public walkway';
  } else if (textLower.includes('garbage') || textLower.includes('waste') || textLower.includes('drain') || textLower.includes('कचरा') || textLower.includes('सफाई')) {
    category = 'Sanitation & Waste';
    subcategory = 'Uncollected Solid Waste & Open Drain';
    department = lang === 'hi' ? 'नगर पालिका स्वच्छता प्रभाग' : 'Municipal Sanitation Division';
    priority = 'MEDIUM';
    urgencyReason = 'Accumulated municipal waste causing hygienic risk.';
    summary = lang === 'hi' ? 'कचरा ढेर और नाली जाम होने की शिकायत' : 'Accumulated solid waste and blocked drainage';
  }

  const now = new Date();
  const timeFormatted = now.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    ticketId,
    category,
    subcategory,
    department,
    priority,
    urgencyReason,
    summary,
    citizenTranscript: transcript || (lang === 'hi' ? 'नागरिक द्वारा दर्ज मौखिक शिकायत।' : 'Citizen recorded voice grievance.'),
    mediaType,
    createdAt: timeFormatted,
    kioskLocation: 'Kiosk #04 - PS-43 Center, Ward 12',
    estimatedResolutionDays: priority === 'CRITICAL' ? 1 : priority === 'HIGH' ? 3 : 7
  };
}
