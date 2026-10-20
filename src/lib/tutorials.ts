export type TutorialStep = {
  targetSelector?: string; // CSS selector to highlight (optional)
  title: {
    en: string;
    am: string;
  };
  content: {
    en: string;
    am: string;
  };
};

export type RoleTutorials = {
  [pathname: string]: TutorialStep[];
};

export const TUTORIALS: Record<string, RoleTutorials> = {
  Reception: {
    "/dashboard": [
      {
        title: {
          en: "Welcome to your Command Center!",
          am: "እንኳን ወደ መቆጣጠሪያ ማዕከልዎ በደህና መጡ!"
        },
        content: {
          en: "This is your main dashboard. You'll get a real-time, bird's-eye view of today's patient queue and outpatient diagnosis room statuses (OPD 1 through OPD 5).",
          am: "ይህ የእርስዎ ዋና ማሳያ ነው። የዕለቱን ታካሚዎች ሰልፍ እና የOPD ክፍሎችን (ከOPD 1 እስከ OPD 5) ወቅታዊ ሁኔታ በቅጽበት መመልከት ይችላሉ።"
        }
      },
      {
        title: {
          en: "Spot the Green Dot & Doctor Stations",
          am: "አረንጓዴውን ነጥብ እና የዶክተሮች ጣቢያን ይከታተሉ"
        },
        content: {
          en: "Keep an eye on the doctor station cards. A glowing green dot next to a physician's name means they are currently online in their OPD room and ready for patient consultations.",
          am: "የዶክተሮች ጣቢያ ካርዶችን ይከታተሉ። ከሐኪሙ ስም አጠገብ የሚያበራ አረንጓዴ ነጥብ ካዩ፣ በአሁኑ ጊዜ በOPD ክፍላቸው ውስጥ መሆናቸውን እና ታካሚዎችን ለማየት ዝግጁ መሆናቸውን ያሳያል!"
        }
      },
      {
        title: {
          en: "Patient Check-In & Auto-Routing",
          am: "የታካሚዎች ምዝገባ እና ራስ-ሰር ክፍል አመዳደብ"
        },
        content: {
          en: "Search for a patient using the fast check-in search bar. Leave the doctor blank to automatically route the patient to the active room with the shortest queue, or pick a specific physician.",
          am: "የፈጣን መፈለጊያ አሞሌውን ተጠቅመው ታካሚውን ይፈልጉ። ዶክተሩን ሳይመርጡ ካለፉ ስርአቱ አነስተኛ ሰልፍ ወዳለው ገባሪ ክፍል በራስ-ሰር ይመድባቸዋል፣ ወይም የተለየ ዶክተር መምረጥ ይችላሉ።"
        }
      },
      {
        title: {
          en: "Room Availability Controls",
          am: "የክፍል ዝግጁነት መቆጣጠሪያዎች"
        },
        content: {
          en: "If an OPD room is temporarily unavailable (e.g. emergency or physician break), toggle the room switch off so auto-routing bypasses it until reopened.",
          am: "አንድ የOPD ክፍል ለጊዜው የማይሰራ ከሆነ (ለምሳሌ ድንገተኛ አደጋ ወይም እረፍት)፣ ክፍሉን ያጥፉት፤ መልሰው እስኪከፍቱት ድረስ አዲስ ታካሚ ወደዚያ አይመደብም።"
        }
      }
    ],
    "/patients": [
      {
        title: {
          en: "Meet the Patient Directory",
          am: "የታካሚዎች ማውጫን ይተዋወቁ"
        },
        content: {
          en: "Instant multi-token search across the entire clinic archive. Search by full name, Ethiopian phone number (09... / +2519...), Card Number, Employee ID, or Military ID.",
          am: "በክሊኒኩ አጠቃላይ ማህደር ውስጥ ፈጣን ፍለጋ ያካሂዱ። በሙሉ ስም፣ በስልክ ቁጥር (09... / +2519...)፣ በካርድ ቁጥር፣ በሰራተኛ መታወቂያ ወይም በውትድርና መታወቂያ መፈለግ ይችላሉ።"
        }
      },
      {
        title: {
          en: "Family & Dependent Linking",
          am: "የቤተሰብ እና ጥገኞች ትስስር"
        },
        content: {
          en: "Searching a civilian staff member's Employee ID or phone number automatically surfaces both the primary employee and all their linked dependents.",
          am: "የሲቪል ሰራተኛውን መታወቂያ ወይም ስልክ ቁጥር ሲፈልጉ፣ ዋናውን ሰራተኛ እና ሁሉንም የተሳሰሩ የቤተሰብ አባላት በአንድ ላይ ያገኛሉ።"
        }
      }
    ],
    "/patients/new": [
      {
        title: {
          en: "Registering a New Patient",
          am: "አዲስ ታካሚ መመዝገብ"
        },
        content: {
          en: "Enter personal details, phone number, and age or Ethiopian Calendar (E.C.) birth year. The system automatically reconciles Ethiopian year calculations.",
          am: "የግል መረጃዎችን፣ ስልክ ቁጥርን እና ዕድሜን ወይም የኢትዮጵያ ዘመን አቆጣጠር የልደት ዓመትን ያስገቡ። ስርአቱ የዕድሜ ስሌቱን በራስ-ሰር ያመሳስላል።"
        }
      },
      {
        title: {
          en: "Selecting Patient Classification",
          am: "የታካሚውን አይነት መምረጥ"
        },
        content: {
          en: "Choose the correct classification: Soldier (Military ID, Rank, Division - 100% free care), Civilian Staff (Employee ID, Department, Permanent Since hired date), Civilian Family, or Guest.",
          am: "ትክክለኛውን ምድብ ይምረጡ፡ ወታደር (የውትድርና መታወቂያ፣ ማዕረግ፣ ሻለቃ - 100% ነፃ)፣ ሲቪል ሰራተኛ (የሰራተኛ መታወቂያ፣ የስራ ክፍል፣ ቋሚ የሆነበት ቀን)፣ የሲቪል ቤተሰብ ወይም እንግዳ።"
        }
      },
      {
        title: {
          en: "Family Sponsor Selector",
          am: "የቤተሰብ ስፖንሰር መራጭ"
        },
        content: {
          en: "For Civilian Family or Soldier Family dependents, use the Family Link Selector to search and bind their primary staff sponsor and specify the relationship (Spouse, Child, Parent).",
          am: "ለቤተሰብ ጥገኞች፣ ዋናውን ሰራተኛ/ወታደር በስም ወይም በመታወቂያ ፈልገው ያገናኙ እና ዝምድናቸውን (የትዳር አጋር፣ ልጅ፣ ወላጅ) ይምረጡ።"
        }
      }
    ],
    "/patients/*": [
      {
        title: {
          en: "Patient EMR Profile",
          am: "የታካሚው የህክምና ማህደር መገለጫ"
        },
        content: {
          en: "Review demographic details, linked family sponsors or dependents, past visits, and print physical card slips for the patient.",
          am: "የታካሚውን የስነ-ህዝብ መረጃ፣ የተሳሰሩ የቤተሰብ አባላትን፣ ያለፉ ጉብኝቶችን መመልከት እና የታካሚውን የወረቀት ካርድ ማተም ይችላሉ።"
        }
      },
      {
        title: {
          en: "Demographic Data Locks",
          am: "የስነ-ህዝብ መረጃ መቆለፊያ"
        },
        content: {
          en: "To prevent billing discrepancies, demographic details are locked after registration. Receptionists have a 24-hour grace window only for missing permanent hired dates.",
          am: "የክፍያ ስህተቶችን ለመከላከል፣ የተመዘገበ መረጃ ይቆለፋል። የአቀባበል ሰራተኞች ያልተሞላ ቋሚ የተቀጠሩበትን ቀን ለማስተካከል የ24 ሰዓት የይቅርታ ጊዜ አላቸው።"
        }
      }
    ],
    "/patients/import": [
      {
        title: {
          en: "Bulk Patient Data Migration",
          am: "የታካሚዎችን መረጃ በጅምላ ማስገቢያ"
        },
        content: {
          en: "Upload legacy patient databases using CSV or formatted Excel files. Review column mappings and preview records before finalizing the bulk import.",
          am: "የነባር ታካሚዎችን ማህደር በCSV ወይም Excel ፋይል በጅምላ ያስገቡ። መረጃውን ከማረጋገጥዎ በፊት የአምዶችን አሰላለፍ መገምገም ይችላሉ።"
        }
      }
    ],
    "/visits": [
      {
        title: {
          en: "Mastering the Queue",
          am: "ሰልፉን ማስተዳደር"
        },
        content: {
          en: "Easily book appointments, manage the active waiting queue, and track which patients are currently in consultation across all OPD rooms.",
          am: "ቀጠሮዎችን በቀላሉ ይያዙ፣ ገባሪ የጥበቃ ሰልፉን ያስተዳድሩ እና በሁሉም የOPD ክፍሎች ውስጥ በምርመራ ላይ ያሉ ታካሚዎችን ይከታተሉ።"
        }
      },
      {
        title: {
          en: "Automated Daily Queue Reset",
          am: "የዕለቱ ሰልፍ ራስ-ሰር ዳግም ማስጀመሪያ"
        },
        content: {
          en: "Queues are locked strictly to clinic local time (Africa/Addis_Ababa). Every midnight, unresolved visits automatically reset to ensure each morning begins with a clean queue.",
          am: "ሰልፉ በሀገር ውስጥ ሰዓት (አዲስ አበባ) የሚመራ ነው። ያልተጠናቀቁ ጉብኝቶች በየዕለቱ እኩለ ሌሊት በራስ-ሰር ይጸዳሉ፣ ይህም ጠዋት ንጹህ ሰልፍ እንዲኖር ያደርጋል።"
        }
      }
    ]
  },

  Nurse: {
    "/dashboard": [
      {
        title: {
          en: "Welcome to Nurse Triage!",
          am: "እንኳን ወደ ነርስ ትሪያጅ በደህና መጡ!"
        },
        content: {
          en: "This workstation is the clinical bridge between Reception check-in and Doctor consultation. Here you record baseline vitals before the physician examines the patient.",
          am: "ይህ የስራ ቦታ በአቀባበል እና በዶክተሩ ምርመራ መካከል ያለ ወሳኝ ድልድይ ነው። ሐኪሙ ታካሚውን ከማየቱ በፊት የህይወት ምልክቶችን እዚህ ይመዘግባሉ።"
        }
      },
      {
        title: {
          en: "Capturing Vital Signs",
          am: "የህይወት ምልክቶችን መመዝገብ"
        },
        content: {
          en: "Locate the patient under their assigned OPD room and enter Weight (kg), Blood Pressure (e.g. 120/80 mmHg), Temperature (°C), and Heart Rate (Pulse bpm).",
          am: "በተመደበው የOPD ክፍል ስር ታካሚውን ያግኙ እና ክብደት (ኪ.ግ)፣ የደም ግፊት (ለምሳሌ 120/80)፣ የሰውነት ሙቀት (°C) እና የልብ ምት ያስገቡ።"
        }
      },
      {
        title: {
          en: "Instant Clinical Sync",
          am: "ፈጣን የህክምና መረጃ ማመሳሰል"
        },
        content: {
          en: "Clicking 'Save Vitals' attaches a green badge to the visit and synchronizes the measurements straight into the Doctor's consultation screen in real time.",
          am: "'የህይወት ምልክቶችን መዝግብ'ን ሲጫኑ አረንጓዴ ባጅ ይሰጠዋል እና መረጃው ወዲያውኑ ወደ ዶክተሩ የኮምፒውተር ስክሪን ያለ ምንም መዘግየት ይተላለፋል።"
        }
      }
    ],
    "/patients": [
      {
        title: {
          en: "Patient Search & Records",
          am: "የታካሚ ፍለጋ እና ማህደር"
        },
        content: {
          en: "Search any patient to review past triage assessments, baseline measurements, and medical backgrounds.",
          am: "ያለፉ የትሪያጅ ግምገማዎችን፣ መነሻ ልኬቶችን እና የህክምና ታሪኮችን ለመገምገም ማንኛውንም ታካሚ ይፈልጉ።"
        }
      }
    ],
    "/patients/*": [
      {
        title: {
          en: "Patient Vitals History",
          am: "የታካሚው የህይወት ምልክቶች ታሪክ"
        },
        content: {
          en: "Track longitudinal vitals trends, historical blood pressure charts, and previous nursing notes across earlier clinic visits.",
          am: "የቀደሙ የደም ግፊት እና የክብደት ለውጦችን እንዲሁም ያለፉ የነርሲንግ ማስታወሻዎችን በዝርዝር መከታተል ይችላሉ።"
        }
      }
    ]
  },

  Doctor: {
    "/dashboard": [
      {
        title: {
          en: "Welcome, Doctor!",
          am: "እንኳን በደህና መጡ ዶክተር!"
        },
        content: {
          en: "Your clinical hub displays your active patient queue, unread laboratory diagnostic alerts, and upcoming weekly scheduled appointments.",
          am: "ይህ ማሳያ የእርስዎ የግል የህክምና ማዕከል ነው። የዕለቱን የታካሚዎች ሰልፍ፣ ያልተነበቡ የላቦራቶሪ ውጤቶችን እና የሳምንቱን ቀጠሮዎች ያሳየዎታል።"
        }
      },
      {
        title: {
          en: "Crucial Step: Go Online with 'My Station'",
          am: "ዋና እርምጃ፡ በ'የእኔ ጣቢያ' አማካኝነት በመስመር ላይ ይሁኑ"
        },
        content: {
          en: "Before consulting, select your occupied OPD room from the 'My Station' dropdown in the sidebar. This broadcasts your green dot to Reception and routes checked-in patients to your room.",
          am: "ምርመራ ከመጀመርዎ በፊት፣ በግራ በኩል ባለው አሞሌ ላይ 'የእኔ ጣቢያ'ን ተጠቅመው የOPD ክፍልዎን ይምረጡ። ይህም ለአቀባበል በመስሪያ ክፍልዎ መሆንዎን ያሳውቃል፤ ታካሚዎችም በቀጥታ ወደ እርስዎ ይመራሉ!"
        }
      },
      {
        title: {
          en: "Unread Lab Alerts Inbox",
          am: "ያልተነበቡ የላቦራቶሪ ውጤቶች ሳጥን"
        },
        content: {
          en: "Whenever the Laboratory completes a diagnostic panel, an instant notification appears at the top of your dashboard. Click to review findings immediately.",
          am: "ላቦራቶሪው የምርመራ ውጤቶችን ሲያጠናቅቅ በማሳያዎ አናት ላይ ፈጣን ማሳወቂያ ይመጣል። ውጤቱን ወዲያውኑ ለመገምገም ጠቅ ያድርጉ።"
        }
      },
      {
        title: {
          en: "Active Room Queue",
          am: "የክፍልዎ ገባሪ ሰልፍ"
        },
        content: {
          en: "Patients waiting outside your door are listed with triage vitals already pre-filled by the Nurse. Click 'Consult' to open their EMR chart.",
          am: "በበርዎ ላይ የሚጠብቁ ታካሚዎች በነርስ የተሞሉ የህይወት ምልክቶች ጋር ተዘርዝረዋል። የህክምና ማህደራቸውን ለመክፈት 'ምርመራ ጀምር'ን ይጫኑ።"
        }
      }
    ],
    "/patients": [
      {
        title: {
          en: "Your Patient Archive",
          am: "የእርስዎ ታካሚዎች ማህደር"
        },
        content: {
          en: "Search any patient to review past SOAP notes, medication regimens, and diagnostic histories before they enter your examination room.",
          am: "ማንኛውንም ታካሚ እዚህ በመፈለግ ወደ ክፍልዎ ከመግባታቸው በፊት የህክምና ታሪካቸውን፣ የወሰዷቸውን መድሃኒቶች እና ያለፉ ውጤቶችን መገምገም ይችላሉ።"
        }
      }
    ],
    "/patients/*": [
      {
        title: {
          en: "Electronic Medical Record & SOAP Notes",
          am: "የኤሌክትሮኒክ የህክምና ማህደር እና የSOAP ማስታወሻዎች"
        },
        content: {
          en: "Record structured clinical SOAP notes (Subjective complaints, Objective findings, Assessment, and Plan). Document legacy historical physical records using the Paper-Trail form.",
          am: "የተዋቀሩ የSOAP ማስታወሻዎችን (ህመሙን፣ ምርመራውን፣ ምዘናውን እና እቅዱን) ይመዝግቡ። የቆዩ የወረቀት ካርዶችንም በቀን ጠቅሰው ማስገባት ይችላሉ።"
        }
      },
      {
        title: {
          en: "Selective Lab Orders & Urgent Priority",
          am: "የተመረጡ የላብ ምርመራዎች እና አስቸኳይ ትዕዛዝ"
        },
        content: {
          en: "Click diagnostic chip cards to order tests. Toggle '⚡ Urgent Request' for emergency priority. Select specific sub-tests (e.g. Occult Blood only, CBC differential only) to avoid unnecessary tests.",
          am: "ምርመራዎችን ለማዘዝ ካርዶቹን ይጫኑ። ለድንገተኛ ቅድሚያ '⚡ አስቸኳይ ትዕዛዝ'ን ያብሩ። አላስፈላጊ ወጪን ለማስቀረት የተወሰኑ ንዑስ ምርመራዎችን ብቻ መምረጥ ይችላሉ።"
        }
      },
      {
        title: {
          en: "Electronic Prescribing",
          am: "የኤሌክትሮኒክ መድሃኒት ማዘዣ"
        },
        content: {
          en: "Search drugs from the active formulary, enter quantity, and type instructions. The system validates real-time stock levels so you don't prescribe out-of-stock medications.",
          am: "መድሃኒቶችን ይፈልጉ፣ ብዛት እና የአወሳሰድ መመሪያ ያስገቡ። ስርአቱ ያለቀባቸውን መድሃኒቶች እንዳያዙ የክምችት መጠንን በቅጽበት ያረጋግጣል።"
        }
      },
      {
        title: {
          en: "Single-Page A4 Referral Generator",
          am: "የአንድ ገጽ A4 የሪፈራል ደብዳቤ አዘጋጅ"
        },
        content: {
          en: "Need to transfer a patient? Click 'Referral Letter'. The system pre-fills patient details and clinical findings into a formatted letter guaranteed to fit exactly on 1 page of A4 paper.",
          am: "ታካሚውን ሪፈር ማድረግ ይፈልጋሉ? 'የሪፈራል ደብዳቤ'ን ይጫኑ። የታካሚው መረጃ እና የህክምና ውጤቶች በአንድ የA4 ገጽ ላይ በሚስማማ መልኩ ተዘጋጅተው ይቀርባሉ።"
        }
      }
    ],
    "/visits": [
      {
        title: {
          en: "Doctor Appointments Schedule",
          am: "የሐኪሙ የቀጠሮዎች ሰሌዳ"
        },
        content: {
          en: "Review upcoming patient bookings, scheduled follow-up visits, and completed consultation logs.",
          am: "የታካሚዎችን የቀጠሮ ቀናት፣ ተከታታይ ጉብኝቶችን እና የተጠናቀቁ የህክምና መዝገቦችን እዚህ ይገምግሙ።"
        }
      }
    ]
  },

  Dataencoder: {
    "/dashboard": [
      {
        title: {
          en: "Welcome to Data Encoder Billing!",
          am: "እንኳን ወደ ዳታ ኢንኮደር የክፍያ ማዕከል በደህና መጡ!"
        },
        content: {
          en: "Your dashboard provides a high-level view of daily revenue, unbilled transactions, and tenure discounts absorbed by the institution.",
          am: "ይህ ማሳያ የዕለቱን ጠቅላላ ገቢ፣ ያልተከፈሉ ሂሳቦችን እና በተቋሙ የተሸፈኑ የቅናሽ ድጎማዎችን በጨረፍታ ያሳየዎታል።"
        }
      }
    ],
    "/dataencoder": [
      {
        title: {
          en: "Unbilled Transactions Queue",
          am: "ያልተከፈሉ የሂሳብ ዝርዝሮች ሰልፍ"
        },
        content: {
          en: "Whenever the Pharmacy dispenses medications or the Laboratory finishes diagnostic tests, unbilled invoice items appear here automatically in real time.",
          am: "ፋርማሲው መድሃኒት ሲሰጥ ወይም ላቦራቶሪው ምርመራ ሲያጠናቅቅ፣ ያልተከፈሉ የክፍያ መጠየቂያዎች እዚህ በራስ-ሰር ይታያሉ።"
        }
      },
      {
        title: {
          en: "Dynamic Tenure Discount Engine",
          am: "ተለዋዋጭ የአገልግሎት ዘመን የቅናሽ ስሌት"
        },
        content: {
          en: "Discounts are automatically calculated from Ethiopian hired year (permanentSince): 50% to 100% staff tiers; 100% military coverage; and Civilian Family 5% direct discount with 95% charged to staff salary deduction.",
          am: "ቅናሾች በኢትዮጵያ ዘመን አቆጣጠር ከቋሚ ቅጥር ዓመት ይሰላሉ፡ ከ50% እስከ 100% ለሰራተኞች፤ 100% ለውትድርና፤ ለሲቪል ቤተሰብ ደግሞ 5% ቀጥታ ቅናሽ ተደርጎ 95% ከሰራተኛው ደመወዝ ተቀናሽ ይሆናል።"
        }
      },
      {
        title: {
          en: "Invoice Approval & Verification",
          am: "የክፍያ መጠየቂያን ማረጋገጥ እና ማጽደቅ"
        },
        content: {
          en: "Review itemized lab and pharmacy costs, confirm applied discounts, and click the green checkmark (✓) to approve the invoice, or (✕) to disapprove disputed charges.",
          am: "የላቦራቶሪ እና የመድሃኒት ወጪዎችን ገምግመው ትክክለኛውን ሂሳብ በአረንጓዴው ምልክት (✓) ያጽድቁ፣ ወይም ስህተት ያለበትን በ(✕) ምልክት ይመልሱ።"
        }
      }
    ],
    "/dataencoder/z-reports": [
      {
        title: {
          en: "Z-Reports & Daily Settlement",
          am: "ዜድ-ሪፖርት እና የዕለት ሂሳብ ማጠቃለያ"
        },
        content: {
          en: "The financial close center displays Gross Revenue, Absorbed Discounts, Collectible Balance, and Departmental splits between Laboratory and Pharmacy.",
          am: "የፋይናንስ ማጠቃለያ ማዕከሉ ጠቅላላ ገቢን፣ የተደረጉ ቅናሾችን፣ ተሰብሳቢ ሂሳብን እና የላቦራቶሪ እንዲሁም የፋርማሲ የገቢ ክፍፍልን ያቀርባል።"
        }
      },
      {
        title: {
          en: "Payroll Salary Deduction Export",
          am: "የደመወዝ ተቀናሽ መረጃ ወደ ኤክሴል ማውጫ"
        },
        content: {
          en: "Export the official Excel salary deduction ledger for the institutional Finance / HR payroll department with primary staff IDs and aggregated dependent costs.",
          am: "ለተቋሙ የፋይናንስ እና የሰው ኃይል ክፍል የሚላከውን ይፋዊ የደመወዝ ተቀናሽ የኤክሴል ሰነድ በሰራተኛ መታወቂያ ተደራጅቶ በ1 ጠቅታ ያውርዱ።"
        }
      }
    ],
    "/patients": [
      {
        title: {
          en: "Patient Demographic Verification",
          am: "የታካሚ ማንነት ማረጋገጫ"
        },
        content: {
          en: "Quick read-only access to verify patient details, civilian staff tenure years, and family sponsor IDs before finalizing billing.",
          am: "ክፍያዎችን ከማጽደቅዎ በፊት የታካሚውን ማንነት፣ የቅጥር ዘመን እና የስፖንሰር መታወቂያን እዚህ በቀላሉ ያረጋግጡ።"
        }
      }
    ],
    "/patients/*": [
      {
        title: {
          en: "Patient Financial Profile",
          am: "የታካሚው የክፍያ እና የሂሳብ ታሪክ"
        },
        content: {
          en: "Inspect previous invoices, applied discount rates, and the full billing transaction history for this patient.",
          am: "የታካሚውን የቀደሙ የክፍያ መጠየቂያዎች፣ የተደረጉ ቅናሾችን እና አጠቃላይ የክፍያ ታሪካቸውን በዝርዝር ይመልከቱ።"
        }
      }
    ]
  },

  Laboratory: {
    "/dashboard": [
      {
        title: {
          en: "Welcome to the Lab Dashboard!",
          am: "እንኳን ወደ ላቦራቶሪ ማዕከል በደህና መጡ!"
        },
        content: {
          en: "Your dashboard summarizes pending test requests awaiting analysis, urgent physician orders, and completed tests for today.",
          am: "ማሳያዎ ትንታኔ የሚጠብቁ የምርመራ ጥያቄዎችን፣ አስቸኳይ ትዕዛዞችን እና የዕለቱን የተጠናቀቁ ምርመራዎች ያጠቃልላል።"
        }
      }
    ],
    "/laboratory": [
      {
        title: {
          en: "Laboratory Dual-Column Workbench",
          am: "የላቦራቶሪ የሁለት አምድ የስራ ገበታ"
        },
        content: {
          en: "Pending and urgent requisitions appear on the left column. Urgent orders pulse in red. The right column displays verified completed history.",
          am: "በመጠባበቅ ላይ ያሉ እና አስቸኳይ ትዕዛዞች በግራ አምድ ላይ ይታያሉ። አስቸኳይ ጥያቄዎች በቀይ ያበራሉ። በቀኝ በኩል ደግሞ የተጠናቀቁት ይመዘገባሉ።"
        }
      },
      {
        title: {
          en: "Combined Panel Requisitions",
          am: "የተጣመሩ የፓነል ምርመራ ጥያቄዎች"
        },
        content: {
          en: "When physicians order multiple panel sub-tests for a patient, they are grouped into a single combined request so you can collect samples and report results together.",
          am: "ሐኪሞች ለአንድ ታካሚ በርካታ ንዑስ ምርመራዎችን ሲያዝዙ፣ በአንድ ጊዜ ናሙና ወስደው ውጤት እንዲሰጡ ጥያቄዎቹ በአንድ ላይ ተጣምረው ይቀርባሉ።"
        }
      },
      {
        title: {
          en: "Structured Clinical Result Entry",
          am: "የተዋቀረ የላቦራቶሪ ውጤት ማስገቢያ"
        },
        content: {
          en: "Dedicated clinical input panels are provided for Hematology/CBC, Stool Examination, Urinalysis, and Clinical Chemistry with reference ranges.",
          am: "ለደም ምርመራ (CBC)፣ ለሰገራ፣ ለሽንት እና ለክሊኒካል ኬሚስትሪ ምርመራዎች ደረጃቸውን የጠበቁ የውጤት መሙያ ቅጾች ተዘጋጅተዋል።"
        }
      },
      {
        title: {
          en: "'Fill Requested Normal' Shortcut",
          am: "የተጠየቁ መደበኛ ውጤቶችን በ1 ጠቅታ መሙያ"
        },
        content: {
          en: "Requested sub-tests display a highlighted '★ REQUIRED' border. Click 'Fill Requested Normal' to populate clinical baseline normal values in 1 click, then modify only abnormal findings.",
          am: "የተጠየቁ ምርመራዎች በ'★ REQUIRED' ምልክት ጎልተው ይታያሉ። 'መደበኛውን ሙላ' የሚለውን በመጫን ጤናማ እሴቶችን በ1 ጠቅታ ይሙሉ፤ ከዚያም ያልተለመዱትን ብቻ ይቀይሩ።"
        }
      },
      {
        title: {
          en: "Instant Doctor Notification",
          am: "ለሐኪሙ ወዲያውኑ ማሳወቅ"
        },
        content: {
          en: "Submitting verified results immediately alerts the ordering Doctor with an unread result ping and automatically routes the billing charge to the Data Encoder.",
          am: "ውጤቱን አጽድቀው ሲልኩ ወዲያውኑ ለጠየቀው ሐኪም የማንቂያ ደወል ይደርሰዋል፤ የክፍያ መጠየቂያውም በቀጥታ ወደ ዳታ ኢንኮደር ይተላለፋል።"
        }
      }
    ],
    "/laboratory/catalog": [
      {
        title: {
          en: "Managing the Test Catalog",
          am: "የምርመራ ካታሎግን ማስተዳደር"
        },
        content: {
          en: "View registered diagnostic tests, price tariffs in ETB, and turnaround times. Request additions or price adjustments for Manager approval.",
          am: "የተመዘገቡ የምርመራ አይነቶችን፣ የዋጋ ዝርዝሮችን እና የሚፈጁትን ጊዜ ይመልከቱ። አዳዲስ ምርመራዎችን ወይም የዋጋ ማሻሻያዎችን ለስራ አስኪያጁ ማቅረብ ይችላሉ።"
        }
      },
      {
        title: {
          en: "Equipment Operational Status",
          am: "የመሳሪያዎች የስራ ዝግጁነት ሁኔታ"
        },
        content: {
          en: "When diagnostic reagents or machine components are depleted, toggle the test off to inform physicians before they place unavailable orders.",
          am: "የምርመራ ኬሚካሎች ወይም ማሽኖች በማይሰሩበት ጊዜ፣ ዶክተሮች ትዕዛዝ እንዳይሰጡ የምርመራውን ዝግጁነት ለጊዜው ማጥፋት ይችላሉ።"
        }
      }
    ]
  },

  Pharmacy: {
    "/dashboard": [
      {
        title: {
          en: "Hello, Pharmacist!",
          am: "ሰላም ፋርማሲስት!"
        },
        content: {
          en: "Your command center highlights pending prescriptions from physicians, critical low-stock medications, and batches nearing expiry.",
          am: "ይህ ማሳያ ከሐኪሞች የተላኩ በመጠባበቅ ላይ ያሉ ማዘዣዎችን፣ እያለቁ ያሉ መድሃኒቶችን እና የአገልግሎት ጊዜያቸው ሊያበቃ የደረሱ ባቾችን ያሳውቀዎታል።"
        }
      }
    ],
    "/pharmacy": [
      {
        title: {
          en: "Tab 1: Prescriptions & Automated FEFO",
          am: "ክፍል 1፡ ማዘዣዎች እና ራስ-ሰር የFEFO ቅነሳ"
        },
        content: {
          en: "Under the Prescriptions tab, review ordered drugs, dosages, and doctor instructions. Dispensing automatically deducts inventory using First-Expired-First-Out (FEFO) logic.",
          am: "በማዘዣዎች ክፍል ስር ዶክተሩ ያዘዘውን መድሃኒት፣ መጠን እና መመሪያ ይገምግሙ። መድሃኒቱን ሲሰጡ ስርአቱ የአገልግሎት ጊዜው ቀድሞ ከሚያበቃው ባች (FEFO) በራስ-ሰር ይቀንሳል።"
        }
      },
      {
        title: {
          en: "Patient Signature Receipt",
          am: "የታካሚው ፊርማ ያለበት ደረሰኝ"
        },
        content: {
          en: "Click 'Print Receipt' after dispensing to print a formatted pharmacy voucher with medication names, batch numbers, and a physical signature line for patient sign-off.",
          am: "መድሃኒት ከሰጡ በኋላ 'ደረሰኝ አትም'ን በመጫን የመድሃኒቱን ስም፣ የባች ቁጥር እና የታካሚው ፊርማ ማረፊያ ያለበትን ህጋዊ ደረሰኝ ያትሙ።"
        }
      },
      {
        title: {
          en: "Tab 2: Inventory & Batch Registration",
          am: "ክፍል 2፡ የመድሃኒት ክምችት እና የባች ምዝገባ"
        },
        content: {
          en: "Under Inventory, register newly received shipments with Batch Number, Expiry Date, Quantity, Cost, and Document Number (docNo). Monitor items with <100 and <500 unit warnings.",
          am: "በክምችት ክፍል ስር አዲስ የገቡ መድሃኒቶችን በባች ቁጥር፣ በአገልግሎት ማብቂያ ቀን፣ በብዛት፣ በዋጋ እና በሰነድ ቁጥር (docNo) ይመዝግቡ። ከ100 እና 500 በታች የሆኑትን ይከታተሉ።"
        }
      },
      {
        title: {
          en: "Tab 3: Temporary Tracking (Hamle Reconciliation)",
          am: "ክፍል 3፡ ጊዜያዊ ክትትል (የሐምሌ ቆጠራ ማመሳከሪያ)"
        },
        content: {
          en: "Annual baseline stock imported from Hamle is active as primary available stock for dispensing. Items with unverified physical counts display an amber '⚠️ Needs Update' warning.",
          am: "ከሐምሌ ቆጠራ የገባ የመነሻ ክምችት ለመስጠት ዝግጁ ሆኖ ያገለግላል። ትክክለኛ ቆጠራቸው ያልተረጋገጠ መድሃኒቶች '⚠️ ማሻሻያ ያስፈልጋል' የሚል ቢጫ ማስጠንቀቂያ ያሳያሉ።"
        }
      },
      {
        title: {
          en: "Temporary Hamle Input",
          am: "ጊዜያዊ የሐምሌ ቆጠራ ማስገቢያ"
        },
        content: {
          en: "Enter the verified physical count into the Temporary Hamle Input and save (or click 'Use {initial}') to set amountInStock, synchronize batches, and resolve the warning.",
          am: "ትክክለኛውን ቆጠራ በጊዜያዊ የሐምሌ ማስገቢያው ውስጥ ሞልተው ሲያድኑ (ወይም 'Use {initial}'ን ሲጫኑ)፣ ትክክለኛውን የክምችት መጠን ያረጋግጣል፤ ማስጠንቀቂያውም ይጠፋል።"
        }
      }
    ],
    "/pharmacy/catalog": [
      {
        title: {
          en: "Drug Catalog & Replenishment",
          am: "የመድሃኒት ካታሎግ እና ማሟያ"
        },
        content: {
          en: "Search registered pharmaceuticals, review prices in ETB, and add stock batches directly to existing medicines.",
          am: "የተመዘገቡ መድሃኒቶችን ይፈልጉ፣ ዋጋቸውን በብር ይመልከቱ እና አዳዲስ ባቾችን በቀጥታ ወደ ነባር መድሃኒቶች ያክሉ።"
        }
      },
      {
        title: {
          en: "Standard 12-Column Import Template",
          am: "መደበኛ የ12 አምድ የማስገቢያ ሰነድ"
        },
        content: {
          en: "Download the formatted Excel or CSV template with the 12 standard columns (id, nameOfMed, description, price, category, initialStock, amountInStock, batchNumber, expiryDate, dateAddedToStock, docNo, units) for seamless bulk imports.",
          am: "መደበኛውን የ12 አምድ ኤክሴል ወይም CSV ሰነድ (መታወቂያ፣ የመድሃኒት ስም፣ መግለጫ፣ ዋጋ፣ ምድብ፣ መነሻ ክምችት፣ አሁን ያለ፣ ባች፣ ማብቂያ ቀን፣ የገባበት ቀን፣ የሰነድ ቁጥር፣ መለኪያ) አውርደው በጅምላ ያስገቡ።"
        }
      }
    ]
  },

  Manager: {
    "/dashboard": [
      {
        title: {
          en: "Welcome to Executive Management!",
          am: "እንኳን ወደ ስራ አስኪያጅ መቆጣጠሪያ ማዕከል በደህና መጡ!"
        },
        content: {
          en: "Your executive cockpit tracks institutional KPIs: total patient visits today, active doctor OPD rooms, daily gross revenue, absorbed tenure subsidies, and low drug stock alerts.",
          am: "ይህ ዋና የመቆጣጠሪያ ማዕከል የክሊኒኩን ቁልፍ የስራ አፈጻጸም ያሳያል፡ የዕለቱ ታካሚዎች ብዛት፣ ገባሪ የዶክተር ክፍሎች፣ አጠቃላይ ገቢ፣ የተደረጉ ቅናሾች እና የመድሃኒት ክምችት ማንቂያዎች።"
        }
      }
    ],
    "/catalogs/approvals": [
      {
        title: {
          en: "Catalog Governance & Approvals",
          am: "የካታሎግ አስተዳደር እና ማጽደቂያ"
        },
        content: {
          en: "Whenever the Laboratory or Pharmacy requests a new diagnostic test, medication, or price change, it arrives here for your final institutional review.",
          am: "ላቦራቶሪ ወይም ፋርማሲ አዲስ ምርመራ፣ አዲስ መድሃኒት ወይም የዋጋ ለውጥ ሲጠይቁ ለመጨረሻ ውሳኔ እና ማረጋገጫ እዚህ ይደርሳል።"
        }
      },
      {
        title: {
          en: "Approve or Reject Changes",
          am: "ለውጦችን ማጽደቅ ወይም ውድቅ ማድረግ"
        },
        content: {
          en: "Review requested prices against institutional budgets. Approving instantly applies the changes to live clinical ordering; rejecting returns notes to the requesting department.",
          am: "የተጠየቁ ዋጋዎችን ከተቋሙ በጀት አንጻር ይገምግሙ። ሲያጸድቁት ወዲያውኑ በስራ ላይ ይውላል፤ ውድቅ ሲያደርጉትም ማብራሪያ ለጠያቂው ክፍል ይመለሳል።"
        }
      }
    ],
    "/dataencoder/z-reports": [
      {
        title: {
          en: "Financial Oversight & Audits",
          am: "የፋይናንስ ቁጥጥር እና ኦዲት"
        },
        content: {
          en: "Monitor daily and monthly Z-Reports, inspect departmental revenue shares between Laboratory and Pharmacy, and audit payroll salary deductions.",
          am: "የዕለት እና የወር ዜድ-ሪፖርቶችን ይከታተሉ፣ የላቦራቶሪ እና የፋርማሲ ገቢ ድርሻን ይገምግሙ እንዲሁም የደመወዝ ተቀናሾችን ይቆጣጠሩ።"
        }
      }
    ],
    "/pharmacy": [
      {
        title: {
          en: "Pharmacy & Stock Oversight",
          am: "የፋርማሲ እና የመድሃኒት ክምችት ቁጥጥር"
        },
        content: {
          en: "Supervise medication dispensing rates, inspect stock movement audit trails, review expiring drug batches, and monitor Hamle baseline physical counts.",
          am: "የመድሃኒት አሰጣጥን፣ የክምችት እንቅስቃሴ ኦዲትን፣ የአገልግሎት ማብቂያ ቀናትን እና የሐምሌ ቆጠራ ማመሳከሪያን በበላይነት ይቆጣጠሩ።"
        }
      }
    ],
    "/patients": [
      {
        title: {
          en: "Patient Registry Oversight",
          am: "የታካሚዎች ማህደር የበላይ ቁጥጥር"
        },
        content: {
          en: "Inspect patient demographic records, verify civilian staff tenure calculations, and unlock demographic fields when official administrative corrections are required.",
          am: "የታካሚዎችን መረጃ ይገምግሙ፣ የሲቪል ሰራተኞችን የቅጥር ዘመን ያረጋግጡ እና ህጋዊ እርማት ሲያስፈልግ የተቆለፉ መረጃዎችን ይክፈቱ።"
        }
      }
    ],
    "/visits": [
      {
        title: {
          en: "Clinic Outpatient Flow Supervision",
          am: "የክሊኒኩ የውጭ ታካሚዎች ፍሰት ክትትል"
        },
        content: {
          en: "Monitor OPD room queue balancing, identify outpatient bottlenecks, and oversee doctor station attendance in real time.",
          am: "የOPD ክፍሎች የሰልፍ ሚዛንን ይከታተሉ፣ መጨናነቅ ያለባቸውን ቦታዎች ይለዩ እና የሐኪሞችን የስራ ላይ መገኘት በቅጽበት ይቆጣጠሩ።"
        }
      }
    ]
  },

  Admin: {
    "/dashboard": [
      {
        title: {
          en: "System Command Center",
          am: "የስርዓት መቆጣጠሪያ ማዕከል"
        },
        content: {
          en: "Welcome, Administrator! This dashboard provides technical diagnostics: application uptime, active database connections, user sessions, and performance indicators.",
          am: "እንኳን በደህና መጡ አስተዳዳሪ! ይህ ማሳያ የስርዓቱን ጤንነት፣ የዳታቤዝ ግንኙነትን፣ የተጠቃሚዎች ክፍለ-ጊዜዎችን እና አጠቃላይ የስርዓት አፈጻጸምን ያሳያል።"
        }
      }
    ],
    "/admin": [
      {
        title: {
          en: "User Account Management",
          am: "የተጠቃሚዎች መለያ አስተዳደር"
        },
        content: {
          en: "Create staff accounts, assign professional titles (Dr., Nurse, Pharmacist, Lab Tech), assign roles, deactivate departed staff, and forcefully reset user passwords.",
          am: "የሰራተኞች መለያ ይፍጠሩ፣ የሙያ ማዕረግ (ዶክተር፣ ነርስ፣ ፋርማሲስት፣ ላብ ቴክ) ይስጡ፣ ሚናዎችን ይመድቡ፣ የቀሩትን ያግዱ እና የይለፍ ቃላትን ዳግም ያስጀምሩ።"
        }
      },
      {
        title: {
          en: "Clinic Branding & Bilingual Profiles",
          am: "የክሊኒኩ ይፋዊ ስም እና አርማ"
        },
        content: {
          en: "Configure the clinic's official bilingual name (English and Amharic) and upload the institutional logo displayed on headers, cards, and printed vouchers.",
          am: "የክሊኒኩን ይፋዊ ስም በእንግሊዝኛ እና በአማርኛ ያስተካክሉ እንዲሁም በደረሰኞች እና በካርዶች ላይ የሚታየውን አርማ ይስቀሉ።"
        }
      },
      {
        title: {
          en: "OPD Room Limits Configuration",
          am: "የOPD ክፍሎች ብዛት ውቅር"
        },
        content: {
          en: "Adjust global outpatient diagnosis room limits (e.g. 5, 8, 10 rooms) to scale with expanding clinic facilities and doctor workstations.",
          am: "ክሊኒኩ እያደገ ሲሄድ እና አዳዲስ ክፍሎች ሲጨመሩ ዓለም አቀፍ የOPD ክፍሎች ብዛትን (ለምሳሌ 5፣ 8፣ 10 ክፍሎች) ያሻሽሉ።"
        }
      },
      {
        title: {
          en: "Database Backup & Safety Restore",
          am: "የዳታቤዝ የመረጃ ቅጂ (ባክአፕ) እና መልሶ ማግኛ"
        },
        content: {
          en: "Generate manual database backup snapshots with 1 click, download encrypted backup files, or restore the database from a backup file with automated verification checks.",
          am: "የዳታቤዙን ቅጂ በ1 ጠቅታ ይውሰዱ፣ የባክአፕ ፋይሎችን ያውርዱ፣ ወይም አስፈላጊ ሆኖ ሲገኝ ዳታቤዙን ከባክአፕ ፋይል ደህንነቱን አረጋግጠው ይመልሱ።"
        }
      }
    ],
    "/audit": [
      {
        title: {
          en: "Security Audit Logs",
          am: "የደህንነት እና የቁጥጥር ኦዲት መዝገቦች"
        },
        content: {
          en: "Review an immutable, tamper-evident record of all critical system events: user authentication, clinical record edits, invoice approvals, and catalog changes.",
          am: "ማን ምን እንደሰራ የሚመዘግቡ የማያዳግሙ የኦዲት መዝገቦችን ይመርምሩ፡ የተጠቃሚዎች መግባት፣ የህክምና መረጃ እርማቶች፣ የክፍያ ማጽደቆች እና የካታሎግ ለውጦች።"
        }
      },
      {
        title: {
          en: "Forensic Search & Filter",
          am: "ጥልቅ ፍለጋ እና ማጣሪያ"
        },
        content: {
          en: "Filter audit trails by acting user, date range, action type (e.g. INVENTORY_ADJUST, USER_UPDATE), or affected patient ID.",
          am: "የኦዲት መዝገቦችን በሰራተኛው ስም፣ በቀን፣ በተከናወነው ተግባር ወይም በታካሚው መታወቂያ ለይተው ይፈልጉ።"
        }
      }
    ],
    "/patients/import": [
      {
        title: {
          en: "Enterprise Patient Import",
          am: "የታካሚዎች መረጃ የጅምላ ማስገቢያ"
        },
        content: {
          en: "Migrate or bulk-upload institutional patient populations using formatted spreadsheets with automated field sanitization.",
          am: "የተቋሙን የታካሚዎች መረጃ በኤክሴል ሰነድ አማካኝነት ስህተቶችን በራስ-ሰር እያረሙ በጅምላ ያስገቡ።"
        }
      }
    ]
  },

  Testing: {
    "/dashboard": [
      {
        title: {
          en: "Testing Center Operations",
          am: "የምርመራ ማዕከል ተግባራት"
        },
        content: {
          en: "Welcome to the testing workstation. View your assigned diagnostic and specimen testing duties for today.",
          am: "እንኳን ወደ ምርመራ ማዕከል በደህና መጡ። ለዕለቱ የተመደቡልዎትን የምርመራ እና የናሙና ተግባራት እዚህ ይመልከቱ።"
        }
      }
    ]
  }
};

/**
 * Resilient lookup helper that normalizes role strings and aliases
 * (e.g. 'Lab Technician' -> 'Laboratory', 'Pharmacist' -> 'Pharmacy', 'Data Encoder' -> 'Dataencoder')
 */
export function getTutorialsForRole(roleStr: string | null | undefined): RoleTutorials | undefined {
  if (!roleStr) return undefined;
  if (TUTORIALS[roleStr]) return TUTORIALS[roleStr];
  const r = roleStr.toLowerCase().trim();
  if (r.includes("nurse")) return TUTORIALS["Nurse"];
  if (r.includes("doctor") || r.includes("physician")) return TUTORIALS["Doctor"];
  if (r.includes("reception")) return TUTORIALS["Reception"];
  if (r.includes("pharm")) return TUTORIALS["Pharmacy"];
  if (r.includes("lab")) return TUTORIALS["Laboratory"];
  if (r.includes("encoder") || r.includes("bill") || r.includes("cashier")) return TUTORIALS["Dataencoder"];
  if (r.includes("manager")) return TUTORIALS["Manager"];
  if (r.includes("admin")) return TUTORIALS["Admin"];
  if (r.includes("test")) return TUTORIALS["Testing"];
  return undefined;
}
