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
          en: "Hi there! This is your main dashboard. Whenever you log in, you'll get a quick, bird's-eye view of today's patient queue and what's happening around the clinic.",
          am: "ሰላም! ይህ የእርስዎ ዋና ማሳያ ነው። በመግቡበት ጊዜ ሁሉ የዕለቱን ታካሚዎች ሰልፍ እና በክሊኒኩ ውስጥ ምን እየተከናወነ እንዳለ በፍጥነት መመልከት ይችላሉ።"
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
          en: "Whenever a new face walks into the clinic, this is the place to register them! You can also search for returning patients to quickly update their profiles and keep everything fresh.",
          am: "አዲስ ሰው ወደ ክሊኒኩ ሲመጣ፣ ይህ እነሱን ለመመዝገብ ትክክለኛው ቦታ ነው! እንዲሁም ነባር ታካሚዎችን በመፈለግ መረጃቸውን በፍጥነት ማዘመን ይችላሉ።"
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
          en: "Time to get people where they need to go. Here you can easily book new appointments and manage the active waiting list.",
          am: "ሰዎችን ወደሚፈልጉት ቦታ ለመምራት ጊዜው አሁን ነው። እዚህ አዳዲስ ቀጠሮዎችን በቀላሉ መያዝ እና ገባሪ የጥበቃ ዝርዝሩን ማስተዳደር ይችላሉ።"
        }
      },
      {
        title: {
          en: "Spot the Green Dot!",
          am: "አረንጓዴውን ነጥብ ይፈልጉ!"
        },
        content: {
          en: "Keep an eye on the Doctors' list. If you see a glowing green dot next to their name, it means they are currently inside their OPD room and ready to see patients!",
          am: "የዶክተሮችን ዝርዝር ይከታተሉ። ከስማቸው አጠገብ የሚያበራ አረንጓዴ ነጥብ ካዩ፣ በአሁኑ ጊዜ በOPD ክፍላቸው ውስጥ መሆናቸውን እና ታካሚዎችን ለማየት ዝግጁ መሆናቸውን ያሳያል!"
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
          en: "This dashboard is your personal medical hub. You can keep an eye on your active patient queue so you always know exactly who is waiting to see you.",
          am: "ይህ ማሳያ የእርስዎ የግል የህክምና ማዕከል ነው። ሁልጊዜ ማንን እንደሚያዩ ለማወቅ ገባሪ የታካሚዎችዎን ሰልፍ እዚህ መከታተል ይችላሉ።"
        }
      },
      {
        title: {
          en: "Go Online with 'My Station'",
          am: "'የእኔ ጣቢያ'ን በመጠቀም በመስመር ላይ ይሁኑ"
        },
        content: {
          en: "Crucial step: Before you start, use the 'My Station' dropdown on the left sidebar to select your OPD room. This lets Reception know you're at your desk and ready to consult!",
          am: "በጣም አስፈላጊ እርምጃ፡ ከመጀመርዎ በፊት በግራ በኩል ባለው አሞሌ ላይ 'የእኔ ጣቢያ'ን ተጠቅመው የOPD ክፍልዎን ይምረጡ። ይህ አቀባበል በስራ ቦታዎ መሆንዎን እንዲያውቅ ያደርጋል!"
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
          en: "Need a refresher? Search for any patient here to dive into their medical history, past notes, and lab results before they even walk into your room.",
          am: "ማስታወስ ይፈልጋሉ? ማንኛውንም ታካሚ እዚህ በመፈለግ ወደ ክፍልዎ ከመግባታቸው በፊት የህክምና ታሪካቸውን፣ ያለፉ ማስታወሻዎችን እና የላቦራቶሪ ውጤቶችን መገምገም ይችላሉ።"
        }
      }
    ]
  },
  Dataencoder: {
    "/dashboard": [
      {
        title: {
          en: "Welcome to the Billing Center!",
          am: "እንኳን ወደ ክፍያ ማዕከል በደህና መጡ!"
        },
        content: {
          en: "Hello there! This dashboard gives you a beautiful bird's-eye view of today's revenue and any payments that are still pending.",
          am: "ሰላም! ይህ ማሳያ የዛሬውን ገቢ እና አሁንም በመጠባበቅ ላይ ያሉ ክፍያዎችን አጠቃላይ እይታ ይሰጥዎታል።"
        }
      }
    ],
    "/billing": [
      {
        title: {
          en: "Processing Payments",
          am: "ክፍያዎችን ማስተናገድ"
        },
        content: {
          en: "This is the heart of your work. You can safely generate invoices, securely process patient payments, and easily apply any valid discounts before finalizing the bill.",
          am: "ይህ የስራዎ ማዕከል ነው። የክፍያ መጠየቂያዎችን ማመንጨት፣ የታካሚ ክፍያዎችን ደህንነቱ በተጠበቀ ሁኔታ ማስተናገድ እና ክፍያውን ከማጠናቀቅዎ በፊት ትክክለኛ ቅናሾችን መተግበር ይችላሉ።"
        }
      }
    ],
    "/patients": [
      {
        title: {
          en: "Quick Verification",
          am: "ፈጣን ማረጋገጫ"
        },
        content: {
          en: "You have a handy read-only view of the patient directory right here. It's perfect for double-checking a patient's details to ensure you're billing the right person.",
          am: "ትክክለኛውን ሰው እያስከፈሉ መሆንዎን ለማረጋገጥ የታካሚውን ዝርዝሮች ዳግም ለማረጋገጥ ይህ የታካሚ ማውጫ እይታ በጣም ጠቃሚ ነው።"
        }
      }
    ]
  },
  Laboratory: {
    "/dashboard": [
      {
        title: {
          en: "Welcome to the Lab!",
          am: "እንኳን ወደ ላቦራቶሪ በደህና መጡ!"
        },
        content: {
          en: "Grab your coat! Here's your daily summary of pending tests waiting for your expertise, alongside the ones you've successfully completed today.",
          am: "እንኳን በደህና መጡ! ዛሬ በተሳካ ሁኔታ ካጠናቀቋቸው ምርመራዎች ጎን ለጎን የእርስዎን ሙያዊ እገዛ የሚጠብቁ የምርመራዎች ዕለታዊ ማጠቃለያ እዚህ አለ።"
        }
      }
    ],
    "/laboratory": [
      {
        title: {
          en: "Your Main Workbench",
          am: "ዋና የስራ ጠረጴዛዎ"
        },
        content: {
          en: "Test requests from Doctors will pop up right here. Once you're done analyzing the samples, simply type in the results and mark them as complete. The Doctor will be notified instantly!",
          am: "ከዶክተሮች የሚመጡ የምርመራ ጥያቄዎች እዚህ ይታያሉ። ናሙናዎቹን መመርመር እንደጨረሱ፣ ውጤቶቹን ያስገቡ እና እንደተጠናቀቁ ምልክት ያድርጉባቸው። ለዶክተሩ ወዲያውኑ ማሳወቂያ ይደርሳል!"
        }
      }
    ],
    "/laboratory/catalog": [
      {
        title: {
          en: "Managing the Test Catalog",
          am: "የምርመራ ካታሎግ ማስተዳደር"
        },
        content: {
          en: "Missing a specific test type? Use this catalog to request new lab tests or update the prices of existing ones. Your requests will go to the Manager for a quick approval.",
          am: "የተለየ የምርመራ አይነት ጠፋብዎት? አዳዲስ የላቦራቶሪ ምርመራዎችን ለመጠየቅ ወይም የነባሮቹን ዋጋ ለማዘመን ይህንን ካታሎግ ይጠቀሙ። ጥያቄዎችዎ ለፈጣን ማረጋገጫ ወደ ስራ አስኪያጁ ይላካሉ።"
        }
      }
    ]
  },
  Testing: {
    "/dashboard": [
      {
        title: {
          en: "Testing Center",
          am: "የምርመራ ማዕከል"
        },
        content: {
          en: "Welcome! This is where you can view your assigned testing duties for the day. Keep up the great work!",
          am: "እንኳን በደህና መጡ! ለዕለቱ የተሰጡዎትን የምርመራ ተግባራት እዚህ ማየት ይችላሉ። ምርጥ ስራዎን ይቀጥሉ!"
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
          en: "Your dashboard gives you a fantastic overview of pending prescriptions from the Doctors, and it will alert you if any of your drug stocks are running low.",
          am: "ማሳያዎ ከዶክተሮች የሚመጡ በመጠባበቅ ላይ ያሉ የህክምና ማዘዣዎችን አጠቃላይ እይታ ይሰጥዎታል፣ እና የትኛውም የመድሃኒት ክምችትዎ እያለቀ ከሆነ ያሳውቀዎታል።"
        }
      }
    ],
    "/pharmacy": [
      {
        title: {
          en: "Dispensing Medications",
          am: "መድሃኒቶችን መስጠት"
        },
        content: {
          en: "Here you'll find the active prescriptions. You can review exactly what the Doctor ordered, safely dispense the medications, and the system will automatically adjust your inventory.",
          am: "እዚህ ገባሪ ማዘዣዎችን ያገኛሉ። ዶክተሩ ያዘዘውን በትክክል መገምገም፣ መድሃኒቶቹን በደህንነት መስጠት ይችላሉ፣ እና ስርአቱ ክምችትዎን በራስ-ሰር ያስተካክላል።"
        }
      }
    ],
    "/pharmacy/catalog": [
      {
        title: {
          en: "The Drug Catalog",
          am: "የመድሃኒት ካታሎግ"
        },
        content: {
          en: "Need to add a brand new drug to the system? This is where you can request additions or price changes for the clinic's medication list for the Manager to approve.",
          am: "ወደ ስርአቱ አዲስ መድሃኒት ማከል ይፈልጋሉ? ስራ አስኪያጁ እንዲያጸድቀው የክሊኒኩን የመድሃኒት ዝርዝር ለማከል ወይም የዋጋ ለውጦችን ለመጠየቅ ይህ ትክክለኛው ቦታ ነው።"
        }
      }
    ]
  },
  Manager: {
    "/dashboard": [
      {
        title: {
          en: "Welcome, Boss!",
          am: "እንኳን በደህና መጡ ስራ አስኪያጅ!"
        },
        content: {
          en: "As a Manager, this dashboard is your ultimate toolkit. It provides you with high-level statistics and a beautifully clear picture of the clinic's overall operations today.",
          am: "እንደ ስራ አስኪያጅ፣ ይህ ማሳያ የመጨረሻው መሳሪያዎ ነው። የክሊኒኩን አጠቃላይ የዕለት ተዕለት እንቅስቃሴዎች በግልፅ እና በከፍተኛ ደረጃ ስታቲስቲክስ ያቀርብልዎታል።"
        }
      }
    ],
    "/catalogs/approvals": [
      {
        title: {
          en: "You Call the Shots",
          am: "እርስዎ ይወስናሉ"
        },
        content: {
          en: "Whenever the Lab or Pharmacy requests a new item or a price change for their catalogs, it lands right here for your final review and approval. Keep the data clean!",
          am: "ላቦራቶሪ ወይም ፋርማሲ ለአዲሱ ዕቃ ወይም ለዋጋ ለውጥ ሲጠይቁ፣ ለመጨረሻ ግምገማ እና ማረጋገጫ እዚህ ይደርሳል።"
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
          en: "Welcome, Admin! This is your technical command center. You have a comprehensive, raw overview of the application's health, performance, and user activity.",
          am: "እንኳን በደህና መጡ አድሚን! ይህ የቴክኒክ መቆጣጠሪያ ማዕከልዎ ነው። የስርዓቱን ጤንነት፣ አፈጻጸም እና የተጠቃሚ እንቅስቃሴ አጠቃላይ እይታ አለዎት።"
        }
      }
    ],
    "/admin": [
      {
        title: {
          en: "The Engine Room",
          am: "የሞተር ክፍል"
        },
        content: {
          en: "From here, you have the power to manage user accounts, change roles, forcefully reset passwords, and tweak global system settings (like the number of active OPD rooms). Handle with care!",
          am: "ከዚህ ሆነው የተጠቃሚ መለያዎችን ማስተዳደር፣ ሚናዎችን መቀየር፣ የይለፍ ቃላትን ዳግም ማስጀመር እና ዓለም አቀፍ የስርዓት ቅንብሮችን (እንደ ገባሪ የOPD ክፍሎች ብዛት) ማስተካከል ይችላሉ። በጥንቃቄ ይጠቀሙ!"
        }
      }
    ],
    "/audit": [
      {
        title: {
          en: "Security First",
          am: "ደህንነት ቅድሚያ"
        },
        content: {
          en: "Trust, but verify. The audit logs allow you to cleanly trace back system activities so you can see exactly who did what, and when.",
          am: "የኦዲት መዝገቦቹ የስርዓት እንቅስቃሴዎችን በግልፅ ለመከታተል ያስችሉዎታል፣ ስለዚህ ማን ምን እንዳደረገ እና መቼ እንደሆነ በትክክል ማየት ይችላሉ።"
        }
      }
    ]
  }
};
