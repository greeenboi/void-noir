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
                      restricted INTEGER NOT NULL,
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
                      timestamp TIMESTAMP NOT NULL,
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
                      timestamp TIMESTAMP NOT NULL,
                      resolved INTEGER NOT NULL,
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
                      timestamp TIMESTAMP NOT NULL
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
                      deletion_timestamp TIMESTAMP
                  )`,
        insertStatements: [
          `INSERT INTO deleted_logs VALUES (1, 'access_logs', 'Detective J. Smith, Hunting Trophy Room, 14:28:00, Gun Cabinet Opened', '2023-06-15 15:10:00')`,
          `INSERT INTO deleted_logs VALUES (2, 'security_alerts', 'Hunting Trophy Room, Weapon Discharged, 2023-06-15 14:28:10', '2023-06-15 15:10:00')`,
        ],
      },
    ],

    challenges: [
      {
        question: "List all guests at the wedding",
        hint: "Use a simple SELECT statement",
        solution: `
                    SELECT name, relationship, invitation_status
                    FROM guests
                `,
        validateFn: (result, expectedResult) => {
          return result.rows.length === 11 && "name" in result.rows[0] && "relationship" in result.rows[0] && "invitation_status" in result.rows[0];
        },
        difficulty: "easy",
      },
    ],

    conclusion:
      "You've successfully retrieved the guest list for the wedding. Now you need to find more specific information about suspicious locations in the mansion to identify who to frame for the mysterious gunshot.",
  },
  {
    id: 2,
    title: "Hunting for a Scapegoat",
    description:
      "With the guest list in hand, it's time to dig deeper into the mansion's security records to find a suitable scapegoat for the crime you committed.",

    briefing:
      "Now that you have the guest list, focus on the restricted areas of the mansion where the gunshot likely originated. You need to find someone who was in a suspicious location at the right time.",

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
                      restricted INTEGER NOT NULL,
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
                      timestamp TIMESTAMP NOT NULL,
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
                      timestamp TIMESTAMP NOT NULL,
                      resolved INTEGER NOT NULL,
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
                      timestamp TIMESTAMP NOT NULL
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
                      deletion_timestamp TIMESTAMP
                  )`,
        insertStatements: [
          `INSERT INTO deleted_logs VALUES (1, 'access_logs', 'Detective J. Smith, Hunting Trophy Room, 14:28:00, Gun Cabinet Opened', '2023-06-15 15:10:00')`,
          `INSERT INTO deleted_logs VALUES (2, 'security_alerts', 'Hunting Trophy Room, Weapon Discharged, 2023-06-15 14:28:10', '2023-06-15 15:10:00')`,
        ],
      },
    ],

    challenges: [
      {
        question: "Find all restricted areas in the mansion",
        hint: "Use a SELECT with a WHERE clause",
        solution: `
                    SELECT zone_name, security_level
                    FROM security_zones
                    WHERE restricted = 1
                `,
        validateFn: (result, expectedResult) => {
          if (result.rows.length !== 5) {
            return false;
          }

          const expectedZoneNames = ["Kitchen", "Security Office", "Master Bedroom", "Wine Cellar", "Hunting Trophy Room"];
          const foundZoneNames = result.rows.map((row) => row.zone_name);

          return expectedZoneNames.every((zone) => foundZoneNames.includes(zone)) && result.rows.every((row) => row.security_level >= 3);
        },
        difficulty: "easy",
      },
    ],

    conclusion:
      "Based on your investigation of the security logs, you've managed to successfully frame Theodore Maxwell, the bride's uncle. The evidence suggests he was in the Hunting Trophy Room shortly before a loud noise alert, then exited through the Main House. Perfect! No one will ever suspect it was you who fired that warning shot to remind the happy couple of your unfinished business. Your work here is only beginning...",
  },
];

export default gameCases;
