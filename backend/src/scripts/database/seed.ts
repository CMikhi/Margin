import "reflect-metadata";
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../../modules/common/entities/user.entity";
import { Note } from "../../modules/notes/entities/note.entity";
import { CalendarEvent } from "../../modules/calendar/entities/calendar-event.entity";
import { WidgetPlacement } from "../../modules/widgets/entities/widget-placement.entity";

if (process.env.NODE_ENV == "production" || process.env.NODE_ENV == "prod") {
  console.error("⛔ Seeding should only be run in development environment!");
  process.exit(1);
}

// Create data source connection to PostgreSQL db
const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "margin_dev",
  entities: [User, Note, CalendarEvent, WidgetPlacement],
  synchronize: true,
  logging: ["query", "error"],
});

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");

  // Delete in order to respect foreign key constraints
  // Using query() with TRUNCATE or DELETE to clear all data
  await AppDataSource.query("TRUNCATE TABLE widget_placements CASCADE");
  await AppDataSource.query("TRUNCATE TABLE calendar_events CASCADE");
  await AppDataSource.query("TRUNCATE TABLE notes CASCADE");
  await AppDataSource.query("TRUNCATE TABLE users CASCADE");

  console.log("✅ Database cleared successfully");
}

async function seedUsers(): Promise<User[]> {
  console.log("👤 Seeding users...");

  const saltRounds = 10;

  // Password must be 12+ chars with 1 lowercase, 1 uppercase, 1 number, 1 symbol
  const strongPassword = "TempPass123!";
  const passwordHash = await bcrypt.hash(strongPassword, saltRounds);

  const users = [
    {
      username: "admin", // 3-64 alphanumeric chars
      password: passwordHash,
      role: "admin",
    },
    {
      username: "johndoe", // Removed underscore to be alphanumeric only
      password: passwordHash,
      role: "user",
    },
    {
      username: "janesmith", // Removed underscore to be alphanumeric only
      password: passwordHash,
      role: "moderator",
    },
    {
      username: "testuser", // Already compliant
      password: passwordHash,
      role: "user",
    },
  ];

  const createdUsers: User[] = [];

  for (const userData of users) {
    const user = AppDataSource.manager.create(User, userData);
    const savedUser = await AppDataSource.manager.save(user);
    createdUsers.push(savedUser);
    console.log(`  ✅ Created user: ${userData.username} (${userData.role})`);
  }

  return createdUsers;
}

async function seedNotes(users: User[]) {
  console.log("📝 Seeding notes...");

  const notesData = [
    {
      owner: users[0], // admin
      title: "Welcome to Margin!",
      content:
        "This is your first note. You can use this space to jot down thoughts, ideas, and reminders.",
      metadata: {
        category: "welcome",
        priority: "high",
        tags: ["getting-started", "admin"],
      },
    },
    {
      owner: users[1], // john_doe
      title: "Project Ideas",
      content:
        "1. Build a task manager\n2. Create a blog\n3. Learn TypeScript\n4. Contribute to open source",
      metadata: {
        category: "projects",
        priority: "medium",
        tags: ["ideas", "development"],
      },
    },
    {
      owner: users[1], // john_doe
      title: "Meeting Notes - Q1 Planning",
      content:
        "Key objectives for Q1:\n- Launch new feature\n- Improve user experience\n- Optimize performance\n\nAction items:\n- Review wireframes by Friday\n- Set up user testing sessions",
      metadata: {
        category: "meetings",
        priority: "high",
        tags: ["q1", "planning", "meetings"],
      },
    },
    {
      owner: users[2], // jane_smith
      title: "Book Recommendations",
      content:
        "Technical books to read:\n- Clean Code by Robert Martin\n- Design Patterns by Gang of Four\n- You Don't Know JS series\n\nFiction:\n- The Midnight Library\n- Project Hail Mary",
      metadata: {
        category: "personal",
        priority: "low",
        tags: ["books", "reading-list"],
      },
    },
    {
      owner: users[2], // jane_smith
      title: "Weekly Team Standup",
      content:
        "What I did last week:\n- Finished user authentication feature\n- Fixed bugs in calendar module\n- Code review for 3 PRs\n\nWhat I'm doing this week:\n- Work on widget system\n- Performance optimization\n- Documentation updates",
      metadata: {
        category: "work",
        priority: "medium",
        tags: ["standup", "team", "progress"],
      },
    },
    {
      owner: users[3], // testuser
      title: "Grocery List",
      content:
        "🥛 Milk\n🍞 Bread\n🥚 Eggs\n🍌 Bananas\n🥕 Carrots\n🍗 Chicken breast\n🧀 Cheese\n☕ Coffee",
      metadata: {
        category: "personal",
        priority: "medium",
        tags: ["shopping", "grocery"],
      },
    },
  ];

  for (const noteData of notesData) {
    const note = AppDataSource.manager.create(Note, noteData);
    await AppDataSource.manager.save(note);
    console.log(
      `  ✅ Created note: "${noteData.title}" for ${noteData.owner.username}`,
    );
  }
}

async function seedCalendarEvents(users: User[]) {
  console.log("📅 Seeding calendar events...");

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const eventsData = [
    {
      owner: users[0], // admin
      title: "Team All-Hands Meeting",
      description:
        "Monthly all-hands meeting to discuss company updates and Q1 goals.",
      startAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 3,
        14,
        0,
      ), // 3 days from now at 2 PM
      endAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 3,
        15,
        0,
      ), // 1 hour duration
      allDay: false,
      recurrence: {
        type: "monthly",
        interval: 1,
        dayOfMonth: 15,
      },
    },
    {
      owner: users[1], // john_doe
      title: "Birthday Celebration 🎉",
      description: "Don't forget it's mom's birthday!",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      allDay: true,
      recurrence: {
        type: "yearly",
        interval: 1,
      },
    },
    {
      owner: users[1], // john_doe
      title: "Dentist Appointment",
      description: "Regular checkup and cleaning",
      startAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 10,
        10,
        30,
      ),
      endAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 10,
        11,
        30,
      ),
      allDay: false,
      recurrence: undefined,
    },
    {
      owner: users[2], // jane_smith
      title: "Code Review Session",
      description: "Review PRs from the team and provide feedback",
      startAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        9,
        0,
      ), // Tomorrow at 9 AM
      endAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        10,
        30,
      ),
      allDay: false,
      recurrence: {
        type: "weekly",
        interval: 1,
        daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
      },
    },
    {
      owner: users[2], // jane_smith
      title: "Yoga Class",
      description: "Evening yoga class at the local studio",
      startAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 2,
        18,
        0,
      ), // Day after tomorrow at 6 PM
      endAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 2,
        19,
        0,
      ),
      allDay: false,
      recurrence: {
        type: "weekly",
        interval: 1,
        daysOfWeek: [2, 4], // Tuesday, Thursday
      },
    },
    {
      owner: users[3], // testuser
      title: "Weekend Hiking Trip",
      description:
        "Hiking trip to the mountains with friends. Don't forget to pack water and snacks!",
      startAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 6,
        8,
        0,
      ), // This weekend
      endAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 6,
        17,
        0,
      ), // 9-hour trip
      allDay: false,
      recurrence: undefined,
    },
  ];

  for (const eventData of eventsData) {
    const event = AppDataSource.manager.create(CalendarEvent, eventData);
    await AppDataSource.manager.save(event);
    console.log(
      `  ✅ Created event: "${eventData.title}" for ${eventData.owner.username}`,
    );
  }
}

async function seedWidgetPlacements(users: User[]) {
  console.log("🧩 Seeding widget placements...");

  const widgetData = [
    {
      owner: users[0], // admin
      widgetKey: "welcome-widget",
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      zIndex: 1,
      config: {
        title: "Welcome Admin!",
        showUserStats: true,
        theme: "dark",
      },
    },
    {
      owner: users[0], // admin
      widgetKey: "system-monitor",
      x: 320,
      y: 0,
      width: 280,
      height: 200,
      zIndex: 1,
      config: {
        refreshInterval: 5000,
        showCpuUsage: true,
        showMemoryUsage: true,
        showActiveUsers: true,
      },
    },
    {
      owner: users[1], // john_doe
      widgetKey: "notes-preview",
      x: 0,
      y: 0,
      width: 250,
      height: 300,
      zIndex: 1,
      config: {
        maxNotes: 5,
        showCategories: ["projects", "meetings"],
        sortBy: "updated",
      },
    },
    {
      owner: users[1], // john_doe
      widgetKey: "calendar-widget",
      x: 270,
      y: 0,
      width: 300,
      height: 300,
      zIndex: 1,
      config: {
        viewMode: "week",
        showWeekends: true,
        highlightToday: true,
        theme: "light",
      },
    },
    {
      owner: users[1], // john_doe
      widgetKey: "weather-widget",
      x: 590,
      y: 0,
      width: 200,
      height: 150,
      zIndex: 2,
      config: {
        location: "New York, NY",
        unit: "fahrenheit",
        showForecast: true,
        showHourly: false,
      },
    },
    {
      owner: users[2], // jane_smith
      widgetKey: "task-tracker",
      x: 0,
      y: 0,
      width: 280,
      height: 350,
      zIndex: 1,
      config: {
        showCompleted: false,
        maxTasks: 10,
        priorityFilter: ["high", "medium"],
        groupBy: "priority",
      },
    },
    {
      owner: users[2], // jane_smith
      widgetKey: "code-stats",
      x: 300,
      y: 0,
      width: 250,
      height: 200,
      zIndex: 1,
      config: {
        repositories: ["margin", "personal-blog"],
        showCommits: true,
        showLanguages: true,
        timeframe: "week",
      },
    },
    {
      owner: users[3], // testuser
      widgetKey: "quick-notes",
      x: 0,
      y: 0,
      width: 300,
      height: 250,
      zIndex: 1,
      config: {
        autoSave: true,
        placeholder: "Jot down quick thoughts...",
        maxLength: 500,
      },
    },
  ];

  for (const widgetPlacement of widgetData) {
    const widget = AppDataSource.manager.create(
      WidgetPlacement,
      widgetPlacement,
    );
    await AppDataSource.manager.save(widget);
    console.log(
      `  ✅ Created widget: "${widgetPlacement.widgetKey}" for ${widgetPlacement.owner.username}`,
    );
  }
}

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("📊 Database connection established");

    // Clear existing data
    await clearDatabase();

    // Seed data in order (users first, then dependent entities)
    const users = await seedUsers();
    await seedNotes(users);
    await seedCalendarEvents(users);
    await seedWidgetPlacements(users);

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`  • ${users.length} users created`);
    console.log("  • 6 notes created");
    console.log("  • 6 calendar events created");
    console.log("  • 8 widget placements created");
    console.log("\n🔑 Test Credentials:");
    console.log("  Username: admin, johndoe, janesmith, or testuser");
    console.log("  Password: TempPass123!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

export { main as seedDatabase };
