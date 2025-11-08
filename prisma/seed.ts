import { Prisma, PrismaClient, ModuleType, OrganizationType, UserRole, ConsentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const PASSWORD_SALT_ROUNDS = 11;

async function main() {
  const users = await seedUsers();
  await seedAssessments(users);
  await seedCourses();
  await seedMentors(users);
  await seedOrganizations();
  await seedEmergencyResources();
}

type SeededUsers = {
  teen: { id: string };
  mentorOne: { id: string };
  mentorTwo: { id: string };
};

async function seedUsers(): Promise<SeededUsers> {
  const commonPasswordHash = await bcrypt.hash('ChangeMe123!', PASSWORD_SALT_ROUNDS);

  const teenUser = await prisma.user.upsert({
    where: { id: 'user-teen-alex-rivera' },
    update: {
      email: 'alex.rivera@example.com',
      passwordHash: commonPasswordHash,
      role: UserRole.TEEN,
      firstName: 'Alex',
      lastName: 'Rivera',
      guardianEmail: 'jordan.rivera@example.com',
      guardianConsentStatus: ConsentStatus.APPROVED,
    },
    create: {
      id: 'user-teen-alex-rivera',
      email: 'alex.rivera@example.com',
      passwordHash: commonPasswordHash,
      role: UserRole.TEEN,
      firstName: 'Alex',
      lastName: 'Rivera',
      guardianEmail: 'jordan.rivera@example.com',
      guardianConsentStatus: ConsentStatus.APPROVED,
    },
  });

  const mentorTaylor = await prisma.user.upsert({
    where: { id: 'user-mentor-taylor-chen' },
    update: {
      email: 'taylor.chen@example.com',
      passwordHash: commonPasswordHash,
      role: UserRole.MENTOR,
      firstName: 'Taylor',
      lastName: 'Chen',
      bio: 'Licensed professional counselor focusing on resilience and positive psychology.',
    },
    create: {
      id: 'user-mentor-taylor-chen',
      email: 'taylor.chen@example.com',
      passwordHash: commonPasswordHash,
      role: UserRole.MENTOR,
      firstName: 'Taylor',
      lastName: 'Chen',
      bio: 'Licensed professional counselor focusing on resilience and positive psychology.',
    },
  });

  const mentorJordan = await prisma.user.upsert({
    where: { id: 'user-mentor-jordan-lee' },
    update: {
      email: 'jordan.lee@example.com',
      passwordHash: commonPasswordHash,
      role: UserRole.MENTOR,
      firstName: 'Jordan',
      lastName: 'Lee',
      bio: 'Former educator helping teens build strong communication habits.',
    },
    create: {
      id: 'user-mentor-jordan-lee',
      email: 'jordan.lee@example.com',
      passwordHash: commonPasswordHash,
      role: UserRole.MENTOR,
      firstName: 'Jordan',
      lastName: 'Lee',
      bio: 'Former educator helping teens build strong communication habits.',
    },
  });

  return {
    teen: { id: teenUser.id },
    mentorOne: { id: mentorTaylor.id },
    mentorTwo: { id: mentorJordan.id },
  };
}

async function seedAssessments(users: SeededUsers) {
  const assessmentVersions = [
    {
      version: 1,
      isActive: true,
      questions: [
        {
          id: 'stress-level',
          prompt: 'How often have you felt overwhelmed in the past two weeks?',
          type: 'scale-1-5',
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost Daily'],
        },
        {
          id: 'coping-tools',
          prompt: 'Which coping tools do you rely on most?',
          type: 'multi-select',
          options: ['Breathing exercises', 'Talking to someone', 'Journaling', 'Physical activity', 'Other'],
        },
        {
          id: 'support-system',
          prompt: 'Who do you reach out to when you need support?',
          type: 'single-select',
          options: ['Parent/Guardian', 'Mentor', 'Friend', 'Counselor', 'I usually handle it alone'],
        },
        {
          id: 'wind-down-routine',
          prompt: 'Describe any routines that help you wind down before bed.',
          type: 'open-ended',
        },
        {
          id: 'screen-time-check',
          prompt: 'Do you spend more than four hours on a screen after school most days?',
          type: 'boolean',
          labels: ['No, usually less than four hours', 'Yes, more than four hours'],
        },
      ],
    },
    {
      version: 2,
      isActive: false,
      questions: [
        {
          id: 'sleep-patterns',
          prompt: 'How would you rate your sleep over the past week?',
          type: 'scale-1-5',
          labels: ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'],
        },
        {
          id: 'motivation',
          prompt: 'What keeps you motivated when things get hard?',
          type: 'open-ended',
        },
      ],
    },
  ];

  const versionRecords = [];
  for (const definition of assessmentVersions) {
    const record = await prisma.assessmentVersion.upsert({
      where: { version: definition.version },
      update: {
        questions: definition.questions as Prisma.JsonArray,
        isActive: definition.isActive,
      },
      create: {
        version: definition.version,
        questions: definition.questions as Prisma.JsonArray,
        isActive: definition.isActive,
      },
    });
    versionRecords.push({ definition, record });
  }

  const activeVersion = versionRecords.find((entry) => entry.definition.isActive)?.record;
  if (!activeVersion) {
    return;
  }

  await prisma.assessmentResponse.upsert({
    where: { id: 'assessment-response-alex-rivera' },
    update: {
      userId: users.teen.id,
      versionId: activeVersion.id,
      answers: [
        { questionId: 'stress-level', value: 3 },
        { questionId: 'coping-tools', value: ['Breathing exercises', 'Journaling'] },
        { questionId: 'support-system', value: 'Mentor' },
        { questionId: 'wind-down-routine', value: 'I journal for 10 minutes and stretch before bed.' },
        { questionId: 'screen-time-check', value: true },
      ] as Prisma.JsonArray,
      recommendations: {
        highlights: ['You already rely on breathing exercises and journaling - keep it up!'],
        nextSteps: [
          'Try adding a short grounding routine before bed to lower evening stress.',
          'Reach out to a mentor or trusted adult twice this week to expand your support circle.',
        ],
      } as Prisma.JsonObject,
    },
    create: {
      id: 'assessment-response-alex-rivera',
      userId: users.teen.id,
      versionId: activeVersion.id,
      answers: [
        { questionId: 'stress-level', value: 3 },
        { questionId: 'coping-tools', value: ['Breathing exercises', 'Journaling'] },
        { questionId: 'support-system', value: 'Mentor' },
        { questionId: 'wind-down-routine', value: 'I journal for 10 minutes and stretch before bed.' },
        { questionId: 'screen-time-check', value: true },
      ] as Prisma.JsonArray,
      recommendations: {
        highlights: ['You already rely on breathing exercises and journaling - keep it up!'],
        nextSteps: [
          'Try adding a short grounding routine before bed to lower evening stress.',
          'Reach out to a mentor or trusted adult twice this week to expand your support circle.',
        ],
      } as Prisma.JsonObject,
    },
  });
}

async function seedCourses() {
  const courses = [
    {
      id: 'course-resilience-101',
      title: 'Resilience 101',
      description: 'Build the mindset and skills to bounce back from setbacks and stay grounded.',
      category: 'Wellness Foundations',
      difficulty: 'Beginner',
      points: 120,
      heroImageUrl: 'https://cdn.altdap.org/images/courses/resilience.jpg',
      tags: ['resilience', 'mindset', 'growth'],
      modules: [
        {
          id: 'module-resilience-101-intro',
          title: 'Understanding Resilience',
          type: ModuleType.VIDEO,
          contentUrl: 'https://cdn.altdap.org/videos/resilience-intro.mp4',
          orderIndex: 0,
          metadata: { durationMinutes: 8 },
        },
        {
          id: 'module-resilience-101-reflection',
          title: 'Daily Reflection Journal',
          type: ModuleType.ACTIVITY,
          contentUrl: 'https://cdn.altdap.org/resources/resilience-journal.pdf',
          orderIndex: 1,
          metadata: { prompts: 5 },
        },
        {
          id: 'module-resilience-101-quiz',
          title: 'Check Your Resilience Skills',
          type: ModuleType.QUIZ,
          contentUrl: 'https://cdn.altdap.org/quizzes/resilience.json',
          orderIndex: 2,
          metadata: { questions: 7 },
        },
      ],
    },
    {
      id: 'course-communication-confidence',
      title: 'Communication & Confidence',
      description: 'Practice the tools for meaningful conversations and confident self-expression.',
      category: 'Relationships',
      difficulty: 'Intermediate',
      points: 150,
      heroImageUrl: 'https://cdn.altdap.org/images/courses/communication.jpg',
      tags: ['communication', 'confidence', 'relationships'],
      modules: [
        {
          id: 'module-communication-active-listening',
          title: 'Active Listening Workshop',
          type: ModuleType.VIDEO,
          contentUrl: 'https://cdn.altdap.org/videos/active-listening.mp4',
          orderIndex: 0,
          metadata: { durationMinutes: 10 },
        },
        {
          id: 'module-communication-roleplay',
          title: 'Conversation Roleplay',
          type: ModuleType.ACTIVITY,
          contentUrl: 'https://cdn.altdap.org/resources/conversation-roleplay.pdf',
          orderIndex: 1,
          metadata: { partnerRequired: false },
        },
        {
          id: 'module-communication-checkin',
          title: 'Weekly Confidence Check-In',
          type: ModuleType.READING,
          contentUrl: 'https://cdn.altdap.org/articles/confidence-checkin.html',
          orderIndex: 2,
          metadata: { estimatedReadMinutes: 6 },
        },
      ],
    },
  ];

  for (const course of courses) {
    await prisma.module.deleteMany({ where: { courseId: course.id } });
    await prisma.course.upsert({
      where: { id: course.id },
      update: {
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        points: course.points,
        heroImageUrl: course.heroImageUrl,
        tags: course.tags as Prisma.JsonArray,
      },
      create: {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        points: course.points,
        heroImageUrl: course.heroImageUrl,
        tags: course.tags as Prisma.JsonArray,
      },
    });

    for (const module of course.modules) {
      await prisma.module.upsert({
        where: { id: module.id },
        update: {
          title: module.title,
          type: module.type,
          contentUrl: module.contentUrl,
          orderIndex: module.orderIndex,
          metadata: module.metadata ?? Prisma.JsonNull,
          courseId: course.id,
        },
        create: {
          id: module.id,
          courseId: course.id,
          title: module.title,
          type: module.type,
          contentUrl: module.contentUrl,
          orderIndex: module.orderIndex,
          metadata: module.metadata ?? Prisma.JsonNull,
        },
      });
    }
  }
}

async function seedMentors(users: SeededUsers) {
  const mentors = [
    {
      id: 'mentor-profile-taylor-chen',
      userId: users.mentorOne.id,
      bio: 'Taylor helps teens identify their strengths and build resilience routines.',
      specialties: ['resilience coaching', 'stress management', 'goal setting'],
      rating: 4.8,
      availability: [
        {
          id: 'availability-taylor-monday',
          startTime: new Date('2025-01-06T22:00:00.000Z'),
          endTime: new Date('2025-01-06T22:45:00.000Z'),
          isRecurring: true,
        },
        {
          id: 'availability-taylor-thursday',
          startTime: new Date('2025-01-09T21:00:00.000Z'),
          endTime: new Date('2025-01-09T21:45:00.000Z'),
          isRecurring: true,
        },
      ],
    },
    {
      id: 'mentor-profile-jordan-lee',
      userId: users.mentorTwo.id,
      bio: 'Jordan specializes in communication practice and navigating tough conversations.',
      specialties: ['communication skills', 'family relationships', 'confidence building'],
      rating: 4.6,
      availability: [
        {
          id: 'availability-jordan-tuesday',
          startTime: new Date('2025-01-07T23:00:00.000Z'),
          endTime: new Date('2025-01-07T23:45:00.000Z'),
          isRecurring: true,
        },
        {
          id: 'availability-jordan-saturday',
          startTime: new Date('2025-01-11T18:00:00.000Z'),
          endTime: new Date('2025-01-11T18:45:00.000Z'),
          isRecurring: false,
        },
      ],
    },
  ];

  for (const mentor of mentors) {
    await prisma.mentorAvailability.deleteMany({ where: { mentorId: mentor.id } });
    const mentorRecord = await prisma.mentor.upsert({
      where: { id: mentor.id },
      update: {
        userId: mentor.userId,
        bio: mentor.bio,
        specialties: mentor.specialties as Prisma.JsonArray,
        rating: mentor.rating,
      },
      create: {
        id: mentor.id,
        userId: mentor.userId,
        bio: mentor.bio,
        specialties: mentor.specialties as Prisma.JsonArray,
        rating: mentor.rating,
      },
    });

    for (const slot of mentor.availability) {
      await prisma.mentorAvailability.upsert({
        where: { id: slot.id },
        update: {
          mentorId: mentorRecord.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isRecurring: slot.isRecurring,
        },
        create: {
          id: slot.id,
          mentorId: mentorRecord.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isRecurring: slot.isRecurring,
        },
      });
    }
  }
}

async function seedOrganizations() {
  const organizations = [
    {
      id: 'organization-rise-rehab',
      name: 'Rise Youth Rehabilitation Center',
      type: OrganizationType.REHABILITATION,
      location: 'Denver, CO',
      phone: '303-555-0198',
      email: 'intake@riseyouth.org',
      services: ['outpatient counseling', 'family therapy', 'peer support circles'],
      imageUrl: 'https://cdn.altdap.org/images/organizations/rise.jpg',
    },
    {
      id: 'organization-bridge-mental-health',
      name: 'Bridge Mental Health Collective',
      type: OrganizationType.MENTAL_HEALTH,
      location: 'Seattle, WA',
      phone: '206-555-0142',
      email: 'hello@bridgementalhealth.org',
      services: ['virtual therapy', 'mindfulness groups', 'crisis planning'],
      imageUrl: 'https://cdn.altdap.org/images/organizations/bridge.jpg',
    },
  ];

  for (const org of organizations) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: {
        name: org.name,
        type: org.type,
        location: org.location,
        phone: org.phone,
        email: org.email,
        services: org.services as Prisma.JsonArray,
        imageUrl: org.imageUrl,
      },
      create: {
        id: org.id,
        name: org.name,
        type: org.type,
        location: org.location,
        phone: org.phone,
        email: org.email,
        services: org.services as Prisma.JsonArray,
        imageUrl: org.imageUrl,
      },
    });
  }
}

async function seedEmergencyResources() {
  const resources = [
    {
      id: 'emergency-resource-usa',
      region: 'United States',
      label: '988 Suicide & Crisis Lifeline',
      phone: '988',
      sms: '988',
      website: 'https://988lifeline.org',
      availableHours: '24/7',
    },
    {
      id: 'emergency-resource-canada',
      region: 'Canada',
      label: 'Kids Help Phone',
      phone: '1-800-668-6868',
      sms: '686868',
      website: 'https://kidshelpphone.ca',
      availableHours: '24/7',
    },
    {
      id: 'emergency-resource-uk',
      region: 'United Kingdom',
      label: 'Samaritans',
      phone: '116 123',
      sms: null,
      website: 'https://www.samaritans.org',
      availableHours: '24/7',
    },
  ];

  for (const resource of resources) {
    await prisma.emergencyResource.upsert({
      where: { id: resource.id },
      update: {
        region: resource.region,
        label: resource.label,
        phone: resource.phone,
        sms: resource.sms,
        website: resource.website,
        availableHours: resource.availableHours,
      },
      create: {
        id: resource.id,
        region: resource.region,
        label: resource.label,
        phone: resource.phone,
        sms: resource.sms,
        website: resource.website,
        availableHours: resource.availableHours,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Failed to seed database', error);
    await prisma.$disconnect();
    process.exit(1);
  });
