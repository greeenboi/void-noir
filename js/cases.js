const gameCases = [
    {
      id: 1,
      title: "The Wedding Day Mystery: A Shot in the Bark",
      description:
        "A gunshot was heard during a wedding ceremony at a luxurious jungle mansion. The bride is in tears, the groom is panicking, and you're here to 'solve' the case. Totally not suspicious at all.",
  
      briefing:
        "The gunshot occurred around 2:30 PM during the exchange of vows. Check the security logs and guest list to determine who was in suspicious locations at the time. Of course, you already know what happened, but you need to pin it on someone else.",
  
      tables: [
        {
          name: "guests",
          createStatement: `CREATE TABLE guests (
                      guest_id INTEGER PRIMARY KEY,
                      name TEXT NOT NULL,
                      relationship TEXT NOT NULL,
                      invitation_status TEXT NOT NULL,
                      table_assignment INTEGER
                  )`,
          insertStatements: [
            `INSERT INTO guests VALUES (1, 'Victor Blackwood', 'Best Man', 'Confirmed', 1)`,
            `INSERT INTO guests VALUES (2, 'Elena Rodriguez', 'Maid of Honor', 'Confirmed', 1)`,
            `INSERT INTO guests VALUES (3, 'Theodore Maxwell', 'Bride\'s Uncle', 'Confirmed', 2)`,
            `INSERT INTO guests VALUES (4, 'Isabella Chang', 'Groom\'s Ex', 'Confirmed', 5)`,
            `INSERT INTO guests VALUES (5, 'Richard Sterling', 'Business Partner', 'Confirmed', 3)`,
            `INSERT INTO guests VALUES (6, 'Olivia Bennett', 'Bridesmaid', 'Confirmed', 1)`,
            `INSERT INTO guests VALUES (7, 'James Thornton', 'Groomsman', 'Confirmed', 1)`,
            `INSERT INTO guests VALUES (8, 'Alexandra Dupont', 'Family Friend', 'Confirmed', 4)`,
            `INSERT INTO guests VALUES (9, 'Carlos Mendez', 'Chef', 'Staff', NULL)`,
            `INSERT INTO guests VALUES (10, 'Sarah Williams', 'Wedding Planner', 'Staff', NULL)`,
            `INSERT INTO guests VALUES (11, 'Marcus Greene', 'Security', 'Staff', NULL)`,
            `INSERT INTO guests VALUES (12, 'Diana Foster', 'Photographer', 'Confirmed', NULL)`,
            `INSERT INTO guests VALUES (13, 'Detective J. Smith', 'Security Consultant', 'Staff', NULL)`,
          ],
        },
        {
          name: "security_zones",
          createStatement: `CREATE TABLE security_zones (
                      zone_id INTEGER PRIMARY KEY,
                      zone_name TEXT NOT NULL,
                      restricted BOOLEAN NOT NULL,
                      security_level INTEGER NOT NULL
                  )`,
          insertStatements: [
            `INSERT INTO security_zones VALUES (1, 'Main Garden', 0, 1)`,
            `INSERT INTO security_zones VALUES (2, 'Reception Hall', 0, 1)`,
            `INSERT INTO security_zones VALUES (3, 'West Wing', 0, 2)`,
            `INSERT INTO security_zones VALUES (4, 'East Wing', 0, 2)`,
            `INSERT INTO security_zones VALUES (5, 'Main House', 0, 2)`,
            `INSERT INTO security_zones VALUES (6, 'Kitchen', 1, 3)`,
            `INSERT INTO security_zones VALUES (7, 'Security Office', 1, 4)`,
            `INSERT INTO security_zones VALUES (8, 'Master Bedroom', 1, 3)`,
            `INSERT INTO security_zones VALUES (9, 'Wine Cellar', 1, 3)`,
            `INSERT INTO security_zones VALUES (10, 'Hunting Trophy Room', 1, 3)`,
          ],
        },
        {
          name: "access_logs",
          createStatement: `CREATE TABLE access_logs (
                      log_id INTEGER PRIMARY KEY,
                      guest_id INTEGER,
                      zone_id INTEGER,
                      timestamp DATETIME NOT NULL,
                      access_type TEXT NOT NULL,
                      FOREIGN KEY (guest_id) REFERENCES guests (guest_id),
                      FOREIGN KEY (zone_id) REFERENCES security_zones (zone_id)
                  )`,
          insertStatements: [
            `INSERT INTO access_logs VALUES (1, 3, 1, '2023-06-15 13:45:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (2, 3, 5, '2023-06-15 14:10:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (3, 3, 10, '2023-06-15 14:15:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (4, 3, 10, '2023-06-15 14:28:00', 'Exit')`,
            `INSERT INTO access_logs VALUES (5, 3, 5, '2023-06-15 14:30:00', 'Exit')`,
            `INSERT INTO access_logs VALUES (6, 3, 1, '2023-06-15 14:35:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (7, 4, 1, '2023-06-15 13:30:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (8, 4, 2, '2023-06-15 14:20:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (9, 5, 1, '2023-06-15 13:15:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (10, 5, 3, '2023-06-15 14:00:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (11, 5, 9, '2023-06-15 14:25:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (12, 5, 9, '2023-06-15 14:40:00', 'Exit')`,
            `INSERT INTO access_logs VALUES (13, 9, 6, '2023-06-15 12:00:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (14, 11, 7, '2023-06-15 13:00:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (15, 11, 7, '2023-06-15 14:45:00', 'Exit')`,
            `INSERT INTO access_logs VALUES (16, 12, 1, '2023-06-15 13:00:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (17, 12, 5, '2023-06-15 14:15:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (18, 12, 5, '2023-06-15 14:35:00', 'Exit')`,
            `INSERT INTO access_logs VALUES (19, 13, 7, '2023-06-15 13:30:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (20, 13, 10, '2023-06-15 14:20:00', 'Entry')`,
            `INSERT INTO access_logs VALUES (21, 13, 10, '2023-06-15 14:27:00', 'Exit')`,
            `INSERT INTO access_logs VALUES (22, 13, 5, '2023-06-15 14:27:30', 'Entry')`,
            `INSERT INTO access_logs VALUES (23, 13, 5, '2023-06-15 14:29:30', 'Exit')`,
            `INSERT INTO access_logs VALUES (24, 13, 7, '2023-06-15 14:31:00', 'Entry')`,
          ],
        },
        {
          name: "security_alerts",
          createStatement: `CREATE TABLE security_alerts (
                      alert_id INTEGER PRIMARY KEY,
                      zone_id INTEGER,
                      alert_type TEXT NOT NULL,
                      timestamp DATETIME NOT NULL,
                      resolved BOOLEAN NOT NULL,
                      FOREIGN KEY (zone_id) REFERENCES security_zones (zone_id)
                  )`,
          insertStatements: [
            `INSERT INTO security_alerts VALUES (1, 10, 'Motion Detected', '2023-06-15 14:27:30', 1)`,
            `INSERT INTO security_alerts VALUES (2, 10, 'Loud Noise', '2023-06-15 14:28:15', 1)`,
            `INSERT INTO security_alerts VALUES (3, 5, 'Door Forced', '2023-06-15 14:29:00', 1)`,
            `INSERT INTO security_alerts VALUES (4, 1, 'Loud Noise', '2023-06-15 14:31:20', 1)`,
            `INSERT INTO security_alerts VALUES (5, 9, 'Motion Detected', '2023-06-15 14:35:45', 1)`,
          ],
        },
        {
          name: "security_logs",
          createStatement: `CREATE TABLE security_logs (
                      log_id INTEGER PRIMARY KEY,
                      staff_id INTEGER,
                      log_type TEXT NOT NULL,
                      details TEXT NOT NULL,
                      timestamp DATETIME NOT NULL
                  )`,
          insertStatements: [
            `INSERT INTO security_logs VALUES (1, 11, 'Patrol', 'Regular perimeter check', '2023-06-15 12:30:00')`,
            `INSERT INTO security_logs VALUES (2, 11, 'Incident', 'Unauthorized person near kitchen', '2023-06-15 13:15:00')`,
            `INSERT INTO security_logs VALUES (3, 13, 'Equipment', 'Checked out sidearm for duty', '2023-06-15 13:25:00')`,
            `INSERT INTO security_logs VALUES (4, 11, 'Patrol', 'All clear in east wing', '2023-06-15 14:00:00')`,
            `INSERT INTO security_logs VALUES (5, 13, 'Assignment', 'Stationed at trophy room', '2023-06-15 14:20:00')`,
            `INSERT INTO security_logs VALUES (6, 11, 'Incident', 'Responded to gunshot report', '2023-06-15 14:32:00')`,
            `INSERT INTO security_logs VALUES (7, 13, 'Report', 'Filed initial incident report', '2023-06-15 14:40:00')`,
            `INSERT INTO security_logs VALUES (8, 13, 'Equipment', 'Returned sidearm to security office', '2023-06-15 14:45:00')`,
          ],
        },
        {
          name: "deleted_logs",
          createStatement: `CREATE TABLE deleted_logs (
                      recovery_id INTEGER PRIMARY KEY,
                      original_table TEXT NOT NULL,
                      data_fragment TEXT NOT NULL,
                      deletion_timestamp DATETIME
                  )`,
          insertStatements: [
            `INSERT INTO deleted_logs VALUES (1, 'access_logs', 'Detective J. Smith, Hunting Trophy Room, 14:28:00, Gun Cabinet Opened', '2023-06-15 15:10:00')`,
            `INSERT INTO deleted_logs VALUES (2, 'security_alerts', 'Hunting Trophy Room, Weapon Discharged, 2023-06-15 14:28:10', '2023-06-15 15:10:00')`,
          ],
        },
      ],
  
      challenges: [
        {
          question: "Find all guests who entered restricted areas (security_level >= 3) around the time of the gunshot (between 14:20 and 14:35)",
          hint: "Join the guests, access_logs, and security_zones tables, then filter by timestamp and security_level",
          solution: `
                      SELECT g.name, g.relationship, sz.zone_name, al.timestamp 
                      FROM guests g
                      JOIN access_logs al ON g.guest_id = al.guest_id
                      JOIN security_zones sz ON al.zone_id = sz.zone_id
                      WHERE al.timestamp BETWEEN '2023-06-15 14:20:00' AND '2023-06-15 14:35:00'
                      AND sz.security_level >= 3
                      ORDER BY al.timestamp
                  `,
          validateFn: (result, expectedResult) => {
            // Both results should have same number of rows
            if (result.rows.length !== expectedResult.rows.length) return false;
  
            // Check if same names and timestamps are present
            const resultData = result.rows.map((r) => `${r.name}-${r.zone_name}`).sort();
            const expectedData = expectedResult.rows.map((r) => `${r.name}-${r.zone_name}`).sort();
            return resultData.every((data, i) => data === expectedData[i]);
          },
        },
        {
          question:
            "Identify which security alerts occurred in the same zone where Theodore Maxwell (the bride's uncle) was present, and within 5 minutes of his presence",
          hint: "Use subqueries or joins with the security_alerts and access_logs tables, filtering by guest_id and comparing timestamps",
          solution: `
                      SELECT sa.alert_id, sa.alert_type, sz.zone_name, sa.timestamp,
                             g.name, al.timestamp as guest_time
                      FROM security_alerts sa
                      JOIN security_zones sz ON sa.zone_id = sz.zone_id
                      JOIN access_logs al ON sa.zone_id = al.zone_id
                      JOIN guests g ON al.guest_id = g.guest_id
                      WHERE g.name = 'Theodore Maxwell'
                      AND ABS(STRFTIME('%s', sa.timestamp) - STRFTIME('%s', al.timestamp)) < 300
                      ORDER BY sa.timestamp
                  `,
          validateFn: (result, expectedResult) => {
            // Check if the same alerts are found
            const resultIds = result.rows.map((r) => r.alert_id).sort();
            const expectedIds = expectedResult.rows.map((r) => r.alert_id).sort();
            return resultIds.every((id, i) => id === expectedIds[i]);
          },
        },
      ],
  
      conclusion:
        "Based on your investigation of the security logs, you've managed to successfully frame Theodore Maxwell, the bride's uncle. The evidence suggests he was in the Hunting Trophy Room shortly before a loud noise alert, then exited through the Main House. Perfect! No one will ever suspect it was you who fired that warning shot to remind the happy couple of your unfinished business. Your work here is only beginning...",
    },
  
    {
      id: 2,
      title: "Skeletons in the Trophy Room: Hunt the Hunter",
      description:
        "After successfully framing Theodore Maxwell for the gunshot incident, the persistent bride has hired a 'real detective' to review your investigation. Time to cover your tracks... while planting a few new ones.",
  
      briefing:
        "A forensic expert has been called in to verify your findings. Access the mansion's additional databases to further implicate Theodore Maxwell and ensure your own involvement remains hidden. Nothing says 'happy wedding' like a family member behind bars!",
  
      tables: [
        {
          name: "family_relationships",
          createStatement: `CREATE TABLE family_relationships (
                      relationship_id INTEGER PRIMARY KEY,
                      person1_id INTEGER,
                      person2_id INTEGER,
                      relationship_type TEXT NOT NULL,
                      notes TEXT
                  )`,
          insertStatements: [
            `INSERT INTO family_relationships VALUES (1, 3, NULL, 'Previous Marriage', 'Theodore was married to the late heiress Victoria Maxwell')`,
            `INSERT INTO family_relationships VALUES (2, 3, 5, 'Business Rivalry', 'Theodore and Richard have competing businesses')`,
            `INSERT INTO family_relationships VALUES (3, 4, NULL, 'Previous Engagement', 'Isabella was previously engaged to the groom')`,
            `INSERT INTO family_relationships VALUES (4, 5, NULL, 'Business Partner', 'Richard is the groom\'s current business partner')`,
            `INSERT INTO family_relationships VALUES (5, 3, 8, 'Lawsuit', 'Theodore is currently suing Alexandra over property boundaries')`,
          ],
        },
        {
          name: "financial_transactions",
          createStatement: `CREATE TABLE financial_transactions (
                      transaction_id INTEGER PRIMARY KEY,
                      person_id INTEGER,
                      transaction_type TEXT NOT NULL,
                      amount DECIMAL(10,2) NOT NULL,
                      transaction_date DATE NOT NULL,
                      description TEXT
                  )`,
          insertStatements: [
            `INSERT INTO financial_transactions VALUES (1, 3, 'Withdrawal', 50000.00, '2023-06-10', 'Large cash withdrawal')`,
            `INSERT INTO financial_transactions VALUES (2, 3, 'Purchase', 4500.00, '2023-06-12', 'Antique shop purchase')`,
            `INSERT INTO financial_transactions VALUES (3, 5, 'Wire Transfer', 75000.00, '2023-06-08', 'International wire transfer')`,
            `INSERT INTO financial_transactions VALUES (4, 5, 'Deposit', 100000.00, '2023-06-13', 'Business proceeds')`,
            `INSERT INTO financial_transactions VALUES (5, 4, 'Purchase', 2500.00, '2023-06-11', 'Designer dress purchase')`,
            `INSERT INTO financial_transactions VALUES (6, 8, 'Withdrawal', 15000.00, '2023-06-14', 'Cash withdrawal')`,
            `INSERT INTO financial_transactions VALUES (7, 13, 'Deposit', 10000.00, '2023-06-01', 'Payment for services')`,
          ],
        },
        {
          name: "gift_registry",
          createStatement: `CREATE TABLE gift_registry (
                      gift_id INTEGER PRIMARY KEY,
                      guest_id INTEGER,
                      gift_description TEXT NOT NULL,
                      estimated_value DECIMAL(10,2),
                      status TEXT NOT NULL
                  )`,
          insertStatements: [
            `INSERT INTO gift_registry VALUES (1, 1, 'Silver Cutlery Set', 1200.00, 'Received')`,
            `INSERT INTO gift_registry VALUES (2, 2, 'Crystal Vase', 800.00, 'Received')`,
            `INSERT INTO gift_registry VALUES (3, 3, 'Family Heirloom Painting', 75000.00, 'Promised')`,
            `INSERT INTO gift_registry VALUES (4, 4, 'Designer Throw Pillows', 500.00, 'Received')`,
            `INSERT INTO gift_registry VALUES (5, 5, 'Investment Portfolio Share', 100000.00, 'Pending')`,
            `INSERT INTO gift_registry VALUES (6, 8, 'Vacation Property Timeshare', 25000.00, 'Contested')`,
          ],
        },
        {
          name: "personal_items",
          createStatement: `CREATE TABLE personal_items (
                      item_id INTEGER PRIMARY KEY,
                      owner_id INTEGER,
                      item_type TEXT NOT NULL,
                      description TEXT NOT NULL,
                      brought_to_wedding BOOLEAN
                  )`,
          insertStatements: [
            `INSERT INTO personal_items VALUES (1, 3, 'Weapon', 'Antique Family Pistol', 1)`,
            `INSERT INTO personal_items VALUES (2, 3, 'Jewelry', 'Gold Pocket Watch', 1)`,
            `INSERT INTO personal_items VALUES (3, 5, 'Document', 'Contract Papers', 1)`,
            `INSERT INTO personal_items VALUES (4, 4, 'Accessory', 'Designer Handbag', 1)`,
            `INSERT INTO personal_items VALUES (5, 8, 'Document', 'Property Deed', 1)`,
            `INSERT INTO personal_items VALUES (6, 11, 'Weapon', 'Security Firearm', 1)`,
            `INSERT INTO personal_items VALUES (7, 13, 'Weapon', 'Service Revolver', 1)`,
            `INSERT INTO personal_items VALUES (8, 13, 'Document', 'Past Case Files', 1)`,
          ],
        },
        {
          name: "evidence_log",
          createStatement: `CREATE TABLE evidence_log (
                      evidence_id INTEGER PRIMARY KEY,
                      item_description TEXT NOT NULL,
                      location_found TEXT NOT NULL,
                      collection_time DATETIME NOT NULL,
                      handler_id INTEGER,
                      notes TEXT
                  )`,
          insertStatements: [
            `INSERT INTO evidence_log VALUES (1, 'Shell Casing', 'Hunting Trophy Room', '2023-06-15 15:00:00', 13, 'Standard 9mm, wiped of prints')`,
            `INSERT INTO evidence_log VALUES (2, 'Gunpowder Residue', 'Trophy Room Gun Cabinet', '2023-06-15 15:15:00', 13, 'Consistent with recent discharge')`,
            `INSERT INTO evidence_log VALUES (3, 'Fingerprints', 'Trophy Room Door Handle', '2023-06-15 15:30:00', 13, 'Partial prints, possibly Theodore Maxwell\'s')`,
            `INSERT INTO evidence_log VALUES (4, 'Security Footage', 'Main House Corridor', '2023-06-15 16:00:00', 11, '30 seconds missing around 14:28-14:29')`,
            `INSERT INTO evidence_log VALUES (5, 'Handkerchief', 'Behind Trophy Room Cabinet', '2023-06-15 16:15:00', 13, 'Monogrammed "TM", suspect planted')`,
          ],
        },
        {
          name: "investigator_notes",
          createStatement: `CREATE TABLE investigator_notes (
                      note_id INTEGER PRIMARY KEY,
                      investigator_id INTEGER,
                      timestamp DATETIME NOT NULL,
                      note_text TEXT NOT NULL,
                      case_relevant BOOLEAN
                  )`,
          insertStatements: [
            `INSERT INTO investigator_notes VALUES (1, 13, '2023-06-15 13:00:00', 'Wedding security job. Easy money with bonus opportunity.', 1)`,
            `INSERT INTO investigator_notes VALUES (2, 13, '2023-06-15 14:00:00', 'Groom seems nervous. Probably remembers our previous encounter.', 1)`,
            `INSERT INTO investigator_notes VALUES (3, 13, '2023-06-15 14:15:00', 'Uncle Theodore keeps wandering. Perfect patsy.', 1)`,
            `INSERT INTO investigator_notes VALUES (4, 13, '2023-06-15 14:50:00', 'Mission accomplished. Sent a message without leaving evidence.', 1)`,
            `INSERT INTO investigator_notes VALUES (5, 13, '2023-06-15 16:30:00', 'All evidence points to Theodore. My tracks covered. Payback served.', 1)`,
          ],
        },
      ],
  
      challenges: [
        {
          question:
            "Find all guests who brought weapons to the wedding, their relationship to the couple, and what zones they accessed around the time of the gunshot",
          hint: "Join multiple tables including guests, personal_items, and access_logs to track weapon-carriers' movements",
          solution: `
                      SELECT g.name, g.relationship, pi.description, sz.zone_name, al.timestamp, al.access_type
                      FROM guests g
                      JOIN personal_items pi ON g.guest_id = pi.owner_id
                      JOIN access_logs al ON g.guest_id = al.guest_id
                      JOIN security_zones sz ON al.zone_id = sz.zone_id
                      WHERE pi.item_type = 'Weapon' 
                      AND pi.brought_to_wedding = 1
                      AND al.timestamp BETWEEN '2023-06-15 14:15:00' AND '2023-06-15 14:40:00'
                      ORDER BY al.timestamp
                  `,
          validateFn: (result, expectedResult) => {
            // Check if we have the same weapon-carriers and movements
            const resultData = result.rows.map((r) => `${r.name}-${r.zone_name}-${r.access_type}`).sort();
            const expectedData = expectedResult.rows.map((r) => `${r.name}-${r.zone_name}-${r.access_type}`).sort();
            return resultData.length === expectedData.length && resultData.every((data, i) => data === expectedData[i]);
          },
        },
        {
          question: "Analyze the evidence log and investigator notes to find any inconsistencies in the investigation",
          hint: "Compare timestamps across evidence collection and investigator notes to detect potential issues",
          solution: `
                      SELECT e.evidence_id, e.item_description, e.collection_time, e.handler_id,
                             g.name as handler_name, in.note_id, in.timestamp as note_time, in.note_text
                      FROM evidence_log e
                      JOIN guests g ON e.handler_id = g.guest_id
                      LEFT JOIN investigator_notes in ON e.handler_id = in.investigator_id
                      AND DATE(e.collection_time) = DATE(in.timestamp)
                      WHERE in.case_relevant = 1
                      ORDER BY e.collection_time
                  `,
          validateFn: (result, expectedResult) => {
            // Check if same evidence/note combinations are found
            const resultIds = result.rows
              .map((r) => `${r.evidence_id}-${r.note_id}`)
              .filter((id) => id.includes("null") === false)
              .sort();
            const expectedIds = expectedResult.rows
              .map((r) => `${r.evidence_id}-${r.note_id}`)
              .filter((id) => id.includes("null") === false)
              .sort();
            return resultIds.length === expectedIds.length && resultIds.every((id, i) => id === expectedIds[i]);
          },
        },
      ],
  
      conclusion:
        "Excellent work planting additional evidence against Theodore Maxwell! Your expert manipulation of the evidence log and security records has thoroughly convinced everyone of his guilt. The bride and groom remain oblivious to your real connection to their past and your true motives. As Theodore faces serious accusations, you walk away with both your revenge and your reputation intact. Perhaps they'll think twice before crossing a detective next time. Case closed...for now.",
    },
  ];
  
  // Export for use in other modules
  export default gameCases;
  