import { Database } from "bun:sqlite";

try {
  const db = new Database("./db/main.db");
  console.log("resetting database...");
  db.exec("DROP TABLE IF EXISTS resource_shares;");
  db.exec("DROP TABLE IF EXISTS user_groups;");
  db.exec("DROP TABLE IF EXISTS users;");
  db.exec("DROP TABLE IF EXISTS groups;");
  db.exec("DROP TABLE IF EXISTS resources;");
  console.log("database was reset...");

  console.log("creating schema...");
  const path = "./db/schema.sql";
  const file = Bun.file(path);
  const text = await file.text();
  db.exec(text);
  console.log("schema created...");

  const seedTransaction = db.transaction(() => {
    const insertUser = db.prepare("INSERT INTO users (name) VALUES (?)");
    const insertGroup = db.prepare("INSERT INTO groups (name) VALUES (?)");
    const insertUserGroup = db.prepare(
      "INSERT INTO user_groups (userId, groupId) VALUES (?, ?)"
    );
    const insertResource = db.prepare(
      "INSERT INTO resources (name, isPublic) VALUES (?, ?)"
    );
    const insertShare = db.prepare(
      "INSERT INTO resource_shares (resourceId, userId, groupId) VALUES (?, ?, ?)"
    );

    // 1. Create Users
    const users = ["Alice", "Bob", "Charlie", "David", "Eve"];
    users.forEach((user) => insertUser.run(user));

    // 2. Create Groups
    const groups = ["Developers", "Testers", "Admins"];
    groups.forEach((group) => insertGroup.run(group));

    // 3. Assign Users to Groups
    // Alice (ID 1): Developers
    // Bob (ID 2):   Developers, Testers
    // Charlie (ID 3): Testers
    // David (ID 4): Admins
    // Eve (ID 5):   (no groups)
    const userGroupMappings = [
      { userId: 1, groupId: 1 }, // Alice -> Developers
      { userId: 2, groupId: 1 }, // Bob   -> Developers
      { userId: 2, groupId: 2 }, // Bob   -> Testers
      { userId: 3, groupId: 2 }, // Charlie -> Testers
      { userId: 4, groupId: 3 }, // David -> Admins
    ];
    userGroupMappings.forEach((ug) =>
      insertUserGroup.run(ug.userId, ug.groupId)
    );

    // 4. Create Resources and Sharing Rules
    const resourcesToSeed = [
      // --- Basic Scenarios ---
      { name: "Alice's Personal Draft", isPublic: false }, // 1. Direct share
      { name: "Project Codebase", isPublic: false }, // 2. Group share
      { name: "Public Company Announcement", isPublic: true }, // 3. Public resource
      { name: "Orphaned Document", isPublic: false }, // 4. No shares

      // --- Overlap Scenarios ---
      // 5. Overlap: Direct user + Group
      { name: "Q3 Testing Plan", isPublic: false },
      // 6. Overlap: Direct user + Different Group
      { name: "Admin Dashboard Access", isPublic: false },
      // 7. Overlap: Public + Group
      { name: "Company-Wide Best Practices", isPublic: true },
      // 8. Overlap: Public + Direct User
      { name: "CEO's Open Letter", isPublic: true },
      // 9. Overlap: Public + Direct User + Group
      { name: "Emergency Protocol", isPublic: true },
      // 10. Overlap: Direct User + Multiple Groups
      { name: "Cross-Functional Project 'Phoenix'", isPublic: false },
    ];

    resourcesToSeed.forEach((res, index) => {
      const resourceId = index + 1;
      insertResource.run(res.name, res.isPublic ? 1 : 0);

      // Apply sharing rules based on the resourceId
      switch (resourceId) {
        case 1: // "Alice's Personal Draft" -> share with Alice (userId: 1)
          insertShare.run(resourceId, 1, null);
          break;
        case 2: // "Project Codebase" -> share with Developers (groupId: 1)
          insertShare.run(resourceId, null, 1);
          break;
        case 3: // "Public Company Announcement" -> no share rule needed, isPublic handles it
          break;
        case 4: // "Orphaned Document" -> no shares
          break;
        case 5: // "Q3 Testing Plan" -> share with Bob (userId: 2) AND Testers (groupId: 2). Bob is in Testers.
          insertShare.run(resourceId, 2, null); // Direct share with Bob
          insertShare.run(resourceId, null, 2); // Group share with Testers
          break;
        case 6: // "Admin Dashboard Access" -> share with Admins (groupId: 3) AND Eve (userId: 5)
          insertShare.run(resourceId, null, 3); // Group share with Admins
          insertShare.run(resourceId, 5, null); // Direct share with Eve
          break;
        case 7: // "Company-Wide Best Practices" -> Public, but also shared with Developers (groupId: 1)
          insertShare.run(resourceId, null, 1);
          break;
        case 8: // "CEO's Open Letter" -> Public, but also shared directly with David (userId: 4)
          insertShare.run(resourceId, 4, null);
          break;
        case 9: // "Emergency Protocol" -> Public, shared with Alice (userId: 1) and Admins (groupId: 3)
          insertShare.run(resourceId, 1, null);
          insertShare.run(resourceId, null, 3);
          break;
        case 10: // "Project 'Phoenix'" -> Shared with Eve (userId: 5), Developers (groupId: 1), and Testers (groupId: 2)
          insertShare.run(resourceId, 5, null); // Direct to Eve
          insertShare.run(resourceId, null, 1); // To Developers group
          insertShare.run(resourceId, null, 2); // To Testers group
          break;
      }
    });
  });

  console.log("seeding data...");
  seedTransaction();
  console.log("database seeded!!!");

  db.close();
} catch (error) {
  console.error("could not run seeding with error: ", error);
}
