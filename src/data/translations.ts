export type Language = 'en' | 'hi';

export interface TranslationStrings {
  kioskTitle: string;
  kioskSubtitle: string;
  kioskOnline: string;
  hardwareSpec: string;
  listenBtn: string;
  listeningNow: string;
  helpBtn: string;
  pressEitherPrompt: string;

  // Video Card
  videoBadge: string;
  videoTitle: string;
  videoSubtitle: string;
  videoActionBtn: string;
  videoKeyHint: string;

  // Audio Card
  audioBadge: string;
  audioTitle: string;
  audioSubtitle: string;
  audioActionBtn: string;
  audioKeyHint: string;

  // Highlights
  noTyping: string;
  speakComplaint: string;
  maxDuration: string;

  // Footer
  hardwareStatus: string;
  keysMapped: string;
  voiceActive: string;
  helpline: string;

  // Modals & Recording
  recordingVideo: string;
  recordingAudio: string;
  speakNowPrompt: string;
  stopRecording: string;
  cancel: string;
  retake: string;
  submitGrievance: string;
  previewHeading: string;
  speechRecognized: string;
  speechPlaceholder: string;
  timeRemaining: string;

  // Submission & Ticket
  submittingTitle: string;
  submittingDesc: string;
  ticketSuccess: string;
  ticketNumber: string;
  categoryLabel: string;
  departmentLabel: string;
  urgencyLabel: string;
  summaryLabel: string;
  printReceipt: string;
  newComplaint: string;
  autoReturnNotice: string;
  scanTrackQR: string;

  // TTS Voice Prompts
  welcomeTTS: string;
  videoStartTTS: string;
  audioStartTTS: string;
  submittedTTS: string;

  // Pre-recording Instructions
  videoInfoText: string;
  audioInfoText: string;
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    kioskTitle: 'Public Grievance Kiosk',
    kioskSubtitle: 'जन सेवा केंद्र',
    kioskOnline: 'KIOSK ONLINE',
    hardwareSpec: 'RPi5 • CAM • MIC',
    listenBtn: 'LISTEN',
    listeningNow: 'READING ALOUD...',
    helpBtn: 'Help',
    pressEitherPrompt: 'Press either button below to report your issue',

    videoBadge: 'CAMERA RECORDING',
    videoTitle: 'VIDEO',
    videoSubtitle: 'Record with Camera',
    videoActionBtn: 'Press 1 Button',
    videoKeyHint: 'Or press [V] on Keypad',

    audioBadge: 'VOICE ONLY',
    audioTitle: 'AUDIO',
    audioSubtitle: 'Speak your Problem',
    audioActionBtn: '🎤 Microphone will start',
    audioKeyHint: 'Or press [A] on Keypad',

    noTyping: 'No typing needed',
    speakComplaint: 'Speak your complaint',
    maxDuration: 'Maximum 1 minute',

    hardwareStatus: 'Hardware Ready (Raspberry Pi 5)',
    keysMapped: 'Physical Keys mapped: V - Video, A - Audio, S - Stop, C - Cancel',
    voiceActive: 'Voice Engine Active',
    helpline: 'Toll-Free Helpline: 1800-11-2024',

    recordingVideo: 'Video Grievance Recording',
    recordingAudio: 'Voice Grievance Recording',
    speakNowPrompt: 'Please look at the camera and clearly state your complaint, location, and issue.',
    stopRecording: 'Stop Recording [S]',
    cancel: 'Cancel / Back [C]',
    retake: 'Record Again',
    submitGrievance: 'Submit Grievance Now',
    previewHeading: 'Grievance Review',
    speechRecognized: 'Live Speech-to-Text Transcription',
    speechPlaceholder: 'Listening to your voice in real time... Please speak your complaint clearly.',
    timeRemaining: 'Remaining',

    submittingTitle: 'Processing Grievance with Gemini AI...',
    submittingDesc: 'Categorizing problem, estimating priority, and allocating responsible department.',
    ticketSuccess: 'Grievance Registered Successfully!',
    ticketNumber: 'Grievance Tracking Number',
    categoryLabel: 'Category',
    departmentLabel: 'Assigned Department',
    urgencyLabel: 'Urgency Priority',
    summaryLabel: 'AI Summary',
    printReceipt: 'Print Receipt',
    newComplaint: 'Submit Another Grievance',
    autoReturnNotice: 'Auto-returning to home screen in',
    scanTrackQR: 'Scan QR code on mobile to track status',

    welcomeTTS: 'Welcome to the Public Grievance Kiosk. To submit your complaint without typing, press the red Video button on the left or the blue Audio button on the right. You can also press key V for video or key A for audio.',
    videoStartTTS: 'Camera recording has started. Please look directly at the screen and speak your complaint clearly. Press Stop when finished.',
    audioStartTTS: 'Microphone is recording. Please speak your complaint clearly into the microphone. Press Stop when finished.',
    submittedTTS: 'Your grievance has been submitted successfully. Please collect your printed receipt or scan the QR code to track your issue.',

    videoInfoText: 'Please explain your problem clearly in front of the camera.\nYou have a maximum of 1 minute.\nYour recording will start automatically after the countdown.',
    audioInfoText: 'Please clearly explain your problem.\nSpeak slowly and clearly.\nYou have a maximum of 1 minute.\nYour recording will start automatically after the countdown.'
  },
  hi: {
    kioskTitle: 'जन सेवा केंद्र',
    kioskSubtitle: 'Public Grievance Kiosk',
    kioskOnline: 'कियोस्क सक्रिय',
    hardwareSpec: 'RPi5 • कैमरा • माइक',
    listenBtn: 'सुनें',
    listeningNow: 'बोल रहा है...',
    helpBtn: 'मदद',
    pressEitherPrompt: 'अपनी समस्या दर्ज करने के लिए नीचे दिए गए किसी भी बटन को दबाएं',

    videoBadge: 'कैमरा रिकॉर्डिंग',
    videoTitle: 'वीडियो',
    videoSubtitle: 'कैमरा से रिकॉर्ड करें',
    videoActionBtn: '1 नंबर बटन दबाएं',
    videoKeyHint: 'या कीपैड पर [V] दबाएं',

    audioBadge: 'केवल आवाज़',
    audioTitle: 'ऑडियो',
    audioSubtitle: 'अपनी समस्या बोलें',
    audioActionBtn: '🎤 माइक शुरू होगा',
    audioKeyHint: 'या कीपैड पर [A] दबाएं',

    noTyping: 'लिखने की जरूरत नहीं',
    speakComplaint: 'बोलकर शिकायत दर्ज करें',
    maxDuration: 'अधिकतम 1 मिनट',

    hardwareStatus: 'हार्डवेयर तैयार है (रास्पबेरी पाई 5)',
    keysMapped: 'भौतिक बटन: V - वीडियो, A - ऑडियो, S - रोकें, C - रद्द',
    voiceActive: 'वॉयस इंजन सक्रिय',
    helpline: 'टोल-फ्री हेल्पलाइन: 1800-11-2024',

    recordingVideo: 'वीडियो शिकायत रिकॉर्डिंग',
    recordingAudio: 'ऑडियो शिकायत रिकॉर्डिंग',
    speakNowPrompt: 'कृपया कैमरे की तरफ देखें और अपनी समस्या, स्थान और शिकायत साफ-साफ बोलें।',
    stopRecording: 'रिकॉर्डिंग रोकें [S]',
    cancel: 'रद्द करें / वापस [C]',
    retake: 'पुनः रिकॉर्ड करें',
    submitGrievance: 'शिकायत जमा करें',
    previewHeading: 'शिकायत पूर्वावलोकन',
    speechRecognized: 'लाइव आवाज़ से टेक्स्ट रूपांतरण',
    speechPlaceholder: 'आपकी आवाज़ सुनी जा रही है... कृपया अपनी शिकायत स्पष्ट रूप से बोलें।',
    timeRemaining: 'शेष समय',

    submittingTitle: 'जेमिनी एआई द्वारा शिकायत का विश्लेषण जारी...',
    submittingDesc: 'विभाग आवंटन, प्राथमिकता और मुख्य समस्या का विश्लेषण किया जा रहा है।',
    ticketSuccess: 'आपकी शिकायत सफलतापूर्वक दर्ज हो गई है!',
    ticketNumber: 'शिकायत ट्रैकिंग संख्या',
    categoryLabel: 'श्रेणी',
    departmentLabel: 'संबंधित विभाग',
    urgencyLabel: 'प्राथमिकता स्तर',
    summaryLabel: 'एआई सारांश',
    printReceipt: 'रसीद प्रिंट करें',
    newComplaint: 'नई शिकायत दर्ज करें',
    autoReturnNotice: 'कियोस्क होम स्क्रीन पर स्वतः वापस जाएगा:',
    scanTrackQR: 'मोबाइल से स्थिति जांचने के लिए क्यूआर कोड स्कैन करें',

    welcomeTTS: 'जन सेवा केंद्र में आपका स्वागत है। बिना लिखे शिकायत दर्ज करने के लिए बाईं ओर लाल वीडियो बटन दबाएं या दाईं ओर नीला ऑडियो बटन दबाएं। आप कीबोर्ड पर वी या ए बटन भी दबा सकते हैं।',
    videoStartTTS: 'कैमरा रिकॉर्डिंग शुरू हो गई है। कृपया स्क्रीन की तरफ देखकर अपनी समस्या स्पष्ट बोलें। पूरा होने पर स्टॉप बटन दबाएं।',
    audioStartTTS: 'माइक रिकॉर्डिंग शुरू हो गई है। कृपया अपनी समस्या साफ-साफ बोलें। पूरा होने पर स्टॉप बटन दबाएं।',
    submittedTTS: 'आपकी शिकायत सफलतापूर्वक दर्ज हो गई है। कृपया अपनी रसीद प्राप्त करें या क्यूआर कोड स्कैन करें।',

    videoInfoText: 'कृपया कैमरे के सामने अपनी समस्या स्पष्ट रूप से समझाएं।\nआपके पास अधिकतम 1 मिनट का समय है।\nकाउंटडाउन के बाद आपकी रिकॉर्डिंग अपने आप शुरू हो जाएगी।',
    audioInfoText: 'कृपया अपनी समस्या स्पष्ट रूप से समझाएं।\nधीरे और साफ बोलें।\nआपके पास अधिकतम 1 मिनट का समय है।\nकाउंटडाउन के बाद आपकी रिकॉर्डिंग अपने आप शुरू हो जाएगी।'
  }
};
