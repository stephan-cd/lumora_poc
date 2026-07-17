import { PrismaClient, Role, UserStatus, ApprovalStatus, LearningType, LearningSource, ProficiencyLevel, GoalType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SKILLS_DATA = [
  // Programming Languages (30 skills)
  { name: 'Java', category: 'Programming Languages' },
  { name: 'Python', category: 'Programming Languages' },
  { name: 'JavaScript', category: 'Programming Languages' },
  { name: 'TypeScript', category: 'Programming Languages' },
  { name: 'C#', category: 'Programming Languages' },
  { name: 'C++', category: 'Programming Languages' },
  { name: 'Go', category: 'Programming Languages' },
  { name: 'Rust', category: 'Programming Languages' },
  { name: 'PHP', category: 'Programming Languages' },
  { name: 'Kotlin', category: 'Programming Languages' },
  { name: 'Swift', category: 'Programming Languages' },
  { name: 'Ruby', category: 'Programming Languages' },
  { name: 'C', category: 'Programming Languages' },
  { name: 'Scala', category: 'Programming Languages' },
  { name: 'Haskell', category: 'Programming Languages' },
  { name: 'Perl', category: 'Programming Languages' },
  { name: 'Dart', category: 'Programming Languages' },
  { name: 'R', category: 'Programming Languages' },
  { name: 'Julia', category: 'Programming Languages' },
  { name: 'Lua', category: 'Programming Languages' },
  { name: 'Objective-C', category: 'Programming Languages' },
  { name: 'Clojure', category: 'Programming Languages' },
  { name: 'Groovy', category: 'Programming Languages' },
  { name: 'F#', category: 'Programming Languages' },
  { name: 'Erlang', category: 'Programming Languages' },
  { name: 'Elixir', category: 'Programming Languages' },
  { name: 'Cobol', category: 'Programming Languages' },
  { name: 'Fortran', category: 'Programming Languages' },
  { name: 'Assembly', category: 'Programming Languages' },
  { name: 'Shell Scripting', category: 'Programming Languages' },

  // Frontend (35 skills)
  { name: 'React', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Vue', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Redux', category: 'Frontend' },
  { name: 'Flutter', category: 'Frontend' },
  { name: 'React Native', category: 'Frontend' },
  { name: 'Svelte', category: 'Frontend' },
  { name: 'SolidJS', category: 'Frontend' },
  { name: 'Nuxt.js', category: 'Frontend' },
  { name: 'Remix', category: 'Frontend' },
  { name: 'MobX', category: 'Frontend' },
  { name: 'Recoil', category: 'Frontend' },
  { name: 'Zustand', category: 'Frontend' },
  { name: 'Jotai', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Bootstrap', category: 'Frontend' },
  { name: 'Material UI', category: 'Frontend' },
  { name: 'Ant Design', category: 'Frontend' },
  { name: 'Chakra UI', category: 'Frontend' },
  { name: 'HTML5', category: 'Frontend' },
  { name: 'CSS3', category: 'Frontend' },
  { name: 'Sass', category: 'Frontend' },
  { name: 'Less', category: 'Frontend' },
  { name: 'Webpack', category: 'Frontend' },
  { name: 'Vite', category: 'Frontend' },
  { name: 'Rollup', category: 'Frontend' },
  { name: 'Parcel', category: 'Frontend' },
  { name: 'Babel', category: 'Frontend' },
  { name: 'ESLint', category: 'Frontend' },
  { name: 'Prettier', category: 'Frontend' },
  { name: 'PostCSS', category: 'Frontend' },
  { name: 'jQuery', category: 'Frontend' },
  { name: 'Web Components', category: 'Frontend' },
  { name: 'RxJS', category: 'Frontend' },

  // Backend (30 skills)
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'NestJS', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  { name: '.NET', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'Flask', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'Ruby on Rails', category: 'Backend' },
  { name: 'Laravel', category: 'Backend' },
  { name: 'Symfony', category: 'Backend' },
  { name: 'ASP.NET Core', category: 'Backend' },
  { name: 'Koa', category: 'Backend' },
  { name: 'Hapi', category: 'Backend' },
  { name: 'FeathersJS', category: 'Backend' },
  { name: 'Fiber', category: 'Backend' },
  { name: 'Gin', category: 'Backend' },
  { name: 'Actix-web', category: 'Backend' },
  { name: 'Phoenix Framework', category: 'Backend' },
  { name: 'Micronaut', category: 'Backend' },
  { name: 'Quarkus', category: 'Backend' },
  { name: 'Tornado', category: 'Backend' },
  { name: 'Pyramid', category: 'Backend' },
  { name: 'Lumen', category: 'Backend' },
  { name: 'CakePHP', category: 'Backend' },
  { name: 'CodeIgniter', category: 'Backend' },
  { name: 'Yii', category: 'Backend' },
  { name: 'Spring Cloud', category: 'Backend' },
  { name: 'GraphQL Apollo', category: 'Backend' },
  { name: 'gRPC Node', category: 'Backend' },

  // Database (30 skills)
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MySQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Oracle', category: 'Database' },
  { name: 'Redis', category: 'Database' },
  { name: 'SQLite', category: 'Database' },
  { name: 'SQL Server', category: 'Database' },
  { name: 'Cassandra', category: 'Database' },
  { name: 'DynamoDB', category: 'Database' },
  { name: 'MariaDB', category: 'Database' },
  { name: 'CouchDB', category: 'Database' },
  { name: 'Neo4j', category: 'Database' },
  { name: 'Elasticsearch', category: 'Database' },
  { name: 'InfluxDB', category: 'Database' },
  { name: 'TimescaleDB', category: 'Database' },
  { name: 'CockroachDB', category: 'Database' },
  { name: 'Firebase Firestore', category: 'Database' },
  { name: 'Firebase Realtime DB', category: 'Database' },
  { name: 'ClickHouse', category: 'Database' },
  { name: 'SingleStore', category: 'Database' },
  { name: 'ArangoDB', category: 'Database' },
  { name: 'CosmosDB', category: 'Database' },
  { name: 'HBase', category: 'Database' },
  { name: 'Keyspace', category: 'Database' },
  { name: 'Db2', category: 'Database' },
  { name: 'Realm', category: 'Database' },
  { name: 'Memcached', category: 'Database' },
  { name: 'RethinkDB', category: 'Database' },
  { name: 'TiDB', category: 'Database' },
  { name: 'Supabase', category: 'Database' },

  // Cloud (30 skills)
  { name: 'AWS', category: 'Cloud' },
  { name: 'Azure', category: 'Cloud' },
  { name: 'Google Cloud', category: 'Cloud' },
  { name: 'AWS Lambda', category: 'Cloud' },
  { name: 'AWS S3', category: 'Cloud' },
  { name: 'AWS EC2', category: 'Cloud' },
  { name: 'AWS RDS', category: 'Cloud' },
  { name: 'AWS ECS', category: 'Cloud' },
  { name: 'AWS Fargate', category: 'Cloud' },
  { name: 'AWS DynamoDB', category: 'Cloud' },
  { name: 'Azure Functions', category: 'Cloud' },
  { name: 'Azure App Services', category: 'Cloud' },
  { name: 'Azure Blob Storage', category: 'Cloud' },
  { name: 'Azure SQL Database', category: 'Cloud' },
  { name: 'Google Cloud Run', category: 'Cloud' },
  { name: 'Google Cloud Storage', category: 'Cloud' },
  { name: 'Google Kubernetes Engine', category: 'Cloud' },
  { name: 'Google Compute Engine', category: 'Cloud' },
  { name: 'Heroku', category: 'Cloud' },
  { name: 'Vercel', category: 'Cloud' },
  { name: 'Netlify', category: 'Cloud' },
  { name: 'DigitalOcean', category: 'Cloud' },
  { name: 'Cloudflare', category: 'Cloud' },
  { name: 'OpenStack', category: 'Cloud' },
  { name: 'Cloud Foundry', category: 'Cloud' },
  { name: 'IBM Cloud', category: 'Cloud' },
  { name: 'Oracle Cloud Infrastructure', category: 'Cloud' },
  { name: 'Alibaba Cloud', category: 'Cloud' },
  { name: 'Linode', category: 'Cloud' },
  { name: 'Render', category: 'Cloud' },

  // DevOps (30 skills)
  { name: 'Docker', category: 'DevOps' },
  { name: 'Kubernetes', category: 'DevOps' },
  { name: 'Terraform', category: 'DevOps' },
  { name: 'Jenkins', category: 'DevOps' },
  { name: 'GitHub Actions', category: 'DevOps' },
  { name: 'Ansible', category: 'DevOps' },
  { name: 'Chef', category: 'DevOps' },
  { name: 'Puppet', category: 'DevOps' },
  { name: 'GitLab CI', category: 'DevOps' },
  { name: 'CircleCI', category: 'DevOps' },
  { name: 'Travis CI', category: 'DevOps' },
  { name: 'Helm', category: 'DevOps' },
  { name: 'Prometheus', category: 'DevOps' },
  { name: 'Grafana', category: 'DevOps' },
  { name: 'ELK Stack', category: 'DevOps' },
  { name: 'Splunk', category: 'DevOps' },
  { name: 'Datadog', category: 'DevOps' },
  { name: 'New Relic', category: 'DevOps' },
  { name: 'Octopus Deploy', category: 'DevOps' },
  { name: 'ArgoCD', category: 'DevOps' },
  { name: 'FluxCD', category: 'DevOps' },
  { name: 'Nomad', category: 'DevOps' },
  { name: 'Consul', category: 'DevOps' },
  { name: 'Vault', category: 'DevOps' },
  { name: 'Linkerd', category: 'DevOps' },
  { name: 'Istio', category: 'DevOps' },
  { name: 'SonarQube', category: 'DevOps' },
  { name: 'Vagrant', category: 'DevOps' },
  { name: 'Packer', category: 'DevOps' },
  { name: 'Rundeck', category: 'DevOps' },

  // Testing (30 skills)
  { name: 'JUnit', category: 'Testing' },
  { name: 'Selenium', category: 'Testing' },
  { name: 'Playwright', category: 'Testing' },
  { name: 'Cypress', category: 'Testing' },
  { name: 'TestNG', category: 'Testing' },
  { name: 'Jest', category: 'Testing' },
  { name: 'Mocha', category: 'Testing' },
  { name: 'Chai', category: 'Testing' },
  { name: 'Jasmine', category: 'Testing' },
  { name: 'Puppeteer', category: 'Testing' },
  { name: 'Appium', category: 'Testing' },
  { name: 'Cucumber', category: 'Testing' },
  { name: 'Karate Framework', category: 'Testing' },
  { name: 'WebdriverIO', category: 'Testing' },
  { name: 'PyTest', category: 'Testing' },
  { name: 'RSpec', category: 'Testing' },
  { name: 'NUnit', category: 'Testing' },
  { name: 'Vitest', category: 'Testing' },
  { name: 'Testing Library', category: 'Testing' },
  { name: 'Mock Service Worker (MSW)', category: 'Testing' },
  { name: 'Postman Testing', category: 'Testing' },
  { name: 'Newman', category: 'Testing' },
  { name: 'Locust', category: 'Testing' },
  { name: 'JMeter', category: 'Testing' },
  { name: 'Gatling', category: 'Testing' },
  { name: 'Artillery', category: 'Testing' },
  { name: 'Coded UI', category: 'Testing' },
  { name: 'Supertest', category: 'Testing' },
  { name: 'Ava', category: 'Testing' },
  { name: 'QUnit', category: 'Testing' },

  // AI (35 skills)
  { name: 'Machine Learning', category: 'AI' },
  { name: 'Generative AI', category: 'AI' },
  { name: 'Prompt Engineering', category: 'AI' },
  { name: 'LangChain', category: 'AI' },
  { name: 'RAG', category: 'AI' },
  { name: 'OpenAI', category: 'AI' },
  { name: 'Deep Learning', category: 'AI' },
  { name: 'PyTorch', category: 'AI' },
  { name: 'TensorFlow', category: 'AI' },
  { name: 'Keras', category: 'AI' },
  { name: 'Scikit-learn', category: 'AI' },
  { name: 'Pandas', category: 'AI' },
  { name: 'NumPy', category: 'AI' },
  { name: 'SciPy', category: 'AI' },
  { name: 'Matplotlib', category: 'AI' },
  { name: 'Seaborn', category: 'AI' },
  { name: 'Natural Language Processing (NLP)', category: 'AI' },
  { name: 'Computer Vision', category: 'AI' },
  { name: 'Transformers', category: 'AI' },
  { name: 'Hugging Face', category: 'AI' },
  { name: 'Large Language Models (LLMs)', category: 'AI' },
  { name: 'Vector DBs', category: 'AI' },
  { name: 'Milvus', category: 'AI' },
  { name: 'Pinecone', category: 'AI' },
  { name: 'ChromaDB', category: 'AI' },
  { name: 'Weaviate', category: 'AI' },
  { name: 'Apache Spark', category: 'AI' },
  { name: 'Hadoop', category: 'AI' },
  { name: 'Apache Kafka', category: 'AI' },
  { name: 'Apache Airflow', category: 'AI' },
  { name: 'Qdrant', category: 'AI' },
  { name: 'LlamaIndex', category: 'AI' },
  { name: 'AutoGPT', category: 'AI' },
  { name: 'Stable Diffusion', category: 'AI' },
  { name: 'Midjourney Prompting', category: 'AI' },

  // Security (30 skills)
  { name: 'OWASP', category: 'Security' },
  { name: 'IAM', category: 'Security' },
  { name: 'Penetration Testing', category: 'Security' },
  { name: 'Wireshark', category: 'Security' },
  { name: 'Metasploit', category: 'Security' },
  { name: 'Nmap', category: 'Security' },
  { name: 'Burp Suite', category: 'Security' },
  { name: 'OAuth 2.0', category: 'Security' },
  { name: 'SAML', category: 'Security' },
  { name: 'JWT Security', category: 'Security' },
  { name: 'SSL/TLS Administration', category: 'Security' },
  { name: 'Cryptography', category: 'Security' },
  { name: 'DevSecOps', category: 'Security' },
  { name: 'Vulnerability Assessment', category: 'Security' },
  { name: 'Threat Modeling', category: 'Security' },
  { name: 'Incident Response', category: 'Security' },
  { name: 'SIEM Integration', category: 'Security' },
  { name: 'Snort', category: 'Security' },
  { name: 'Nessus', category: 'Security' },
  { name: 'HashiCorp Vault Security', category: 'Security' },
  { name: 'Keycloak', category: 'Security' },
  { name: 'Auth0 Integration', category: 'Security' },
  { name: 'CIS Benchmarks', category: 'Security' },
  { name: 'HIPAA Compliance', category: 'Security' },
  { name: 'GDPR Compliance', category: 'Security' },
  { name: 'PCI-DSS Compliance', category: 'Security' },
  { name: 'Active Directory Security', category: 'Security' },
  { name: 'DDoS Mitigation', category: 'Security' },
  { name: 'Web Application Firewall (WAF)', category: 'Security' },
  { name: 'Endpoint Protection', category: 'Security' },

  // Project Management (35 skills)
  { name: 'Agile', category: 'Project Management' },
  { name: 'Scrum', category: 'Project Management' },
  { name: 'Jira', category: 'Project Management' },
  { name: 'Confluence', category: 'Project Management' },
  { name: 'Kanban', category: 'Project Management' },
  { name: 'Trello', category: 'Project Management' },
  { name: 'Asana', category: 'Project Management' },
  { name: 'Monday.com', category: 'Project Management' },
  { name: 'Product Backlog Management', category: 'Project Management' },
  { name: 'User Story Mapping', category: 'Project Management' },
  { name: 'Sprint Planning', category: 'Project Management' },
  { name: 'Retrospectives', category: 'Project Management' },
  { name: 'SAFe (Scaled Agile Framework)', category: 'Project Management' },
  { name: 'Prince2', category: 'Project Management' },
  { name: 'PMP (Project Management Professional)', category: 'Project Management' },
  { name: 'CAPM', category: 'Project Management' },
  { name: 'MS Project', category: 'Project Management' },
  { name: 'Basecamp', category: 'Project Management' },
  { name: 'Product Roadmap Design', category: 'Project Management' },
  { name: 'Risk Management', category: 'Project Management' },
  { name: 'Stakeholder Management', category: 'Project Management' },
  { name: 'Budget Tracking', category: 'Project Management' },
  { name: 'Lean Management', category: 'Project Management' },
  { name: 'Six Sigma', category: 'Project Management' },
  { name: 'ITIL Foundations', category: 'Project Management' },
  { name: 'DevOps Agile Integration', category: 'Project Management' },
  { name: 'Team Leadership', category: 'Project Management' },
  { name: 'Resource Allocation', category: 'Project Management' },
  { name: 'OKRs (Objectives & Key Results)', category: 'Project Management' },
  { name: 'WBS (Work Breakdown Structure)', category: 'Project Management' },
  { name: 'Slack Communication Management', category: 'Project Management' },
  { name: 'Zoom Webinars Management', category: 'Project Management' },
  { name: 'Scrum of Scrums', category: 'Project Management' },
  { name: 'Waterfall Methodology', category: 'Project Management' },
  { name: 'Design Thinking', category: 'Project Management' },

  // System & Architecture (25 skills)
  { name: 'Git', category: 'System & Architecture' },
  { name: 'SVN', category: 'System & Architecture' },
  { name: 'OpenAPI / Swagger', category: 'System & Architecture' },
  { name: 'REST APIs', category: 'System & Architecture' },
  { name: 'GraphQL Core', category: 'System & Architecture' },
  { name: 'gRPC Core', category: 'System & Architecture' },
  { name: 'WebSockets', category: 'System & Architecture' },
  { name: 'WebRTC', category: 'System & Architecture' },
  { name: 'Microservices Architecture', category: 'System & Architecture' },
  { name: 'Serverless Architecture', category: 'System & Architecture' },
  { name: 'Event-Driven Architecture', category: 'System & Architecture' },
  { name: 'CQRS Pattern', category: 'System & Architecture' },
  { name: 'Event Sourcing', category: 'System & Architecture' },
  { name: 'Domain-Driven Design (DDD)', category: 'System & Architecture' },
  { name: 'Design Patterns (GoF)', category: 'System & Architecture' },
  { name: 'SOLID Principles', category: 'System & Architecture' },
  { name: 'Clean Architecture', category: 'System & Architecture' },
  { name: 'OOP (Object Oriented)', category: 'System & Architecture' },
  { name: 'Functional Programming', category: 'System & Architecture' },
  { name: 'Single-Sign-On (SSO)', category: 'System & Architecture' },
  { name: 'Multi-Tenant Architecture', category: 'System & Architecture' },
  { name: 'High Availability Setup', category: 'System & Architecture' },
  { name: 'Load Balancing', category: 'System & Architecture' },
  { name: 'Content Delivery Networks (CDN)', category: 'System & Architecture' },
  { name: 'Linux System Admin', category: 'System & Architecture' }
];

async function main() {
  console.log('Seeding Database...');

  // 1. Create Users
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('password123', salt);

  console.log('Creating Tower Head...');
  const towerHead = await prisma.user.upsert({
    where: { email: 'th.manager@skilltrack.com' },
    update: {},
    create: {
      employeeId: 'ST-00001',
      name: 'Arthur Pendragon',
      email: 'th.manager@skilltrack.com',
      githubUsername: 'stephan-cd',
      passwordHash: commonPasswordHash,
      designation: 'Tower Head - Digital Engineering',
      department: 'Engineering',
      role: Role.TOWER_HEAD,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('Creating Reporting Manager...');
  const reportingManager = await prisma.user.upsert({
    where: { email: 'rm.lead@skilltrack.com' },
    update: {},
    create: {
      employeeId: 'ST-00002',
      name: 'Guinevere Pendragon',
      email: 'rm.lead@skilltrack.com',
      githubUsername: 'guinevere-lead',
      passwordHash: commonPasswordHash,
      designation: 'Engineering Manager',
      department: 'Engineering',
      role: Role.REPORTING_MANAGER,
      status: UserStatus.ACTIVE,
      managerId: towerHead.id,
    },
  });

  console.log('Creating Team Member...');
  const teamMember = await prisma.user.upsert({
    where: { email: 'tm.dev@skilltrack.com' },
    update: {},
    create: {
      employeeId: 'ST-00003',
      name: 'Lancelot du Lac',
      email: 'tm.dev@skilltrack.com',
      githubUsername: 'lancelot-code',
      passwordHash: commonPasswordHash,
      designation: 'Senior Frontend Developer',
      department: 'Engineering',
      role: Role.TEAM_MEMBER,
      status: UserStatus.ACTIVE,
      managerId: reportingManager.id,
    },
  });

  console.log('Creating additional team member...');
  const teamMember2 = await prisma.user.upsert({
    where: { email: 'galahad.dev@skilltrack.com' },
    update: {},
    create: {
      employeeId: 'ST-00004',
      name: 'Galahad Knight',
      email: 'galahad.dev@skilltrack.com',
      passwordHash: commonPasswordHash,
      designation: 'Backend Developer',
      department: 'Engineering',
      role: Role.TEAM_MEMBER,
      status: UserStatus.ACTIVE,
      managerId: reportingManager.id,
    },
  });

  console.log('Creating inactive user...');
  await prisma.user.upsert({
    where: { email: 'mordred.dev@skilltrack.com' },
    update: {},
    create: {
      employeeId: 'ST-00005',
      name: 'Mordred Pendragon',
      email: 'mordred.dev@skilltrack.com',
      passwordHash: commonPasswordHash,
      designation: 'Junior Developer',
      department: 'Engineering',
      role: Role.TEAM_MEMBER,
      status: UserStatus.INACTIVE,
      managerId: reportingManager.id,
    },
  });

  console.log('Creating Training Department...');
  await prisma.user.upsert({
    where: { email: 'training@skilltrack.com' },
    update: {},
    create: {
      employeeId: 'ST-99999',
      name: 'Merlin the Enchanter',
      email: 'training@skilltrack.com',
      passwordHash: commonPasswordHash,
      designation: 'Training Manager',
      department: 'Training',
      role: Role.TRAINING_DEPT,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('Creating Product Tower Head...');
  const productTowerHead = await prisma.user.upsert({
    where: { email: 'product.th@skilltrack.com' },
    update: {},
    create: {
      employeeId: 'ST-00011',
      name: 'Morgana le Fay',
      email: 'product.th@skilltrack.com',
      passwordHash: commonPasswordHash,
      designation: 'Tower Head - Product Management',
      department: 'Product',
      role: Role.TOWER_HEAD,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('Creating Product Manager...');
  const productManager = await prisma.user.upsert({
    where: { email: 'product.rm@skilltrack.com' },
    update: {},
    create: {
      employeeId: 'ST-00012',
      name: 'Kay Seneschal',
      email: 'product.rm@skilltrack.com',
      passwordHash: commonPasswordHash,
      designation: 'Product Manager',
      department: 'Product',
      role: Role.REPORTING_MANAGER,
      status: UserStatus.ACTIVE,
      managerId: productTowerHead.id,
    },
  });

  console.log('Creating Product Team Member...');
  const productMember = await prisma.user.upsert({
    where: { email: 'product.tm@skilltrack.com' },
    update: {},
    create: {
      employeeId: 'ST-00013',
      name: 'Bedivere Knight',
      email: 'product.tm@skilltrack.com',
      passwordHash: commonPasswordHash,
      designation: 'Associate Product Manager',
      department: 'Product',
      role: Role.TEAM_MEMBER,
      status: UserStatus.ACTIVE,
      managerId: productManager.id,
    },
  });

  // 2. Create Skills (300+ skills)
  console.log(`Upserting ${SKILLS_DATA.length} skills...`);
  let skillsCount = 0;
  const dbSkills = [];
  for (const skill of SKILLS_DATA) {
    const createdSkill = await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: {
        name: skill.name,
        category: skill.category,
        description: `Industry standard skill for ${skill.name} under ${skill.category}.`,
        isCustom: false,
      },
    });
    dbSkills.push(createdSkill);
    skillsCount++;
  }
  console.log(`Completed seeding ${skillsCount} skills!`);

  // 3. Create initial Skill Proficiencies for Devs
  console.log('Setting up proficiencies...');
  const reactSkill = dbSkills.find(s => s.name === 'React');
  const tsSkill = dbSkills.find(s => s.name === 'TypeScript');
  const pythonSkill = dbSkills.find(s => s.name === 'Python');
  const nextSkill = dbSkills.find(s => s.name === 'Next.js');
  const dockerSkill = dbSkills.find(s => s.name === 'Docker');
  const postgresSkill = dbSkills.find(s => s.name === 'PostgreSQL');

  if (reactSkill && tsSkill && pythonSkill && nextSkill && dockerSkill && postgresSkill) {
    // Lancelot (Team Member) proficiencies
    await prisma.skillProficiency.upsert({
      where: { userId_skillId: { userId: teamMember.id, skillId: reactSkill.id } },
      update: {},
      create: { userId: teamMember.id, skillId: reactSkill.id, level: ProficiencyLevel.EXPERT, assessedById: reportingManager.id }
    });
    await prisma.skillProficiency.upsert({
      where: { userId_skillId: { userId: teamMember.id, skillId: tsSkill.id } },
      update: {},
      create: { userId: teamMember.id, skillId: tsSkill.id, level: ProficiencyLevel.ADVANCED, assessedById: reportingManager.id }
    });
    await prisma.skillProficiency.upsert({
      where: { userId_skillId: { userId: teamMember.id, skillId: nextSkill.id } },
      update: {},
      create: { userId: teamMember.id, skillId: nextSkill.id, level: ProficiencyLevel.ADVANCED, assessedById: reportingManager.id }
    });

    // Galahad (Team Member 2) proficiencies
    await prisma.skillProficiency.upsert({
      where: { userId_skillId: { userId: teamMember2.id, skillId: pythonSkill.id } },
      update: {},
      create: { userId: teamMember2.id, skillId: pythonSkill.id, level: ProficiencyLevel.EXPERT, assessedById: reportingManager.id }
    });
    await prisma.skillProficiency.upsert({
      where: { userId_skillId: { userId: teamMember2.id, skillId: postgresSkill.id } },
      update: {},
      create: { userId: teamMember2.id, skillId: postgresSkill.id, level: ProficiencyLevel.ADVANCED, assessedById: reportingManager.id }
    });
    await prisma.skillProficiency.upsert({
      where: { userId_skillId: { userId: teamMember2.id, skillId: dockerSkill.id } },
      update: {},
      create: { userId: teamMember2.id, skillId: dockerSkill.id, level: ProficiencyLevel.INTERMEDIATE, assessedById: reportingManager.id }
    });
  }

  // 4. Create Learning Goals
  console.log('Creating learning goals...');
  await prisma.learningGoal.createMany({
    data: [
      {
        userId: teamMember.id,
        type: GoalType.MONTHLY,
        targetHours: 20,
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      },
      {
        userId: teamMember.id,
        type: GoalType.QUARTERLY,
        targetHours: 60,
        startDate: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1),
        endDate: new Date(new Date().getFullYear(), (Math.floor(new Date().getMonth() / 3) + 1) * 3, 0),
      },
      {
        userId: teamMember2.id,
        type: GoalType.MONTHLY,
        targetHours: 15,
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      }
    ],
    skipDuplicates: true
  });

  // 5. Create some Learning Entries
  console.log('Logging historical learning hours...');
  if (reactSkill && tsSkill && pythonSkill && nextSkill && postgresSkill) {
    // 3 approved logs for Lancelot
    await prisma.learningEntry.create({
      data: {
        userId: teamMember.id,
        skillId: reactSkill.id,
        date: new Date(new Date().setDate(new Date().getDate() - 10)),
        hoursSpent: 12.5,
        learningType: LearningType.COURSE,
        learningSource: LearningSource.UDEMY,
        description: 'Completed "React - The Complete Guide" section 5-10',
        status: ApprovalStatus.APPROVED,
        approverId: reportingManager.id,
        approvalDate: new Date(),
        comments: 'Great progress. Keep it up!'
      }
    });

    await prisma.learningEntry.create({
      data: {
        userId: teamMember.id,
        skillId: tsSkill.id,
        date: new Date(new Date().setDate(new Date().getDate() - 5)),
        hoursSpent: 4.0,
        learningType: LearningType.WORKSHOP,
        learningSource: LearningSource.INTERNAL_LMS,
        description: 'Internal Advanced TypeScript workshop session 1',
        status: ApprovalStatus.APPROVED,
        approverId: reportingManager.id,
        approvalDate: new Date(),
        comments: 'Excellent.'
      }
    });

    // 1 pending log for Lancelot
    await prisma.learningEntry.create({
      data: {
        userId: teamMember.id,
        skillId: nextSkill.id,
        date: new Date(),
        hoursSpent: 3.5,
        learningType: LearningType.SELF_LEARNING,
        learningSource: LearningSource.MANUAL,
        description: 'Reading Next.js 15 App Router docs & rendering patterns',
        status: ApprovalStatus.PENDING,
      }
    });

    // Approved logs for Galahad
    await prisma.learningEntry.create({
      data: {
        userId: teamMember2.id,
        skillId: pythonSkill.id,
        date: new Date(new Date().setDate(new Date().getDate() - 8)),
        hoursSpent: 15.0,
        learningType: LearningType.CERTIFICATION,
        learningSource: LearningSource.COURSERA,
        description: 'Passed Python for Data Science and AI exam',
        status: ApprovalStatus.APPROVED,
        approverId: reportingManager.id,
        approvalDate: new Date(),
        comments: 'Congratulations on your certification!'
      }
    });

    await prisma.learningEntry.create({
      data: {
        userId: teamMember2.id,
        skillId: postgresSkill.id,
        date: new Date(),
        hoursSpent: 6.0,
        learningType: LearningType.RESEARCH,
        learningSource: LearningSource.OTHER,
        description: 'Researching PostgreSQL execution plan optimization methods',
        status: ApprovalStatus.PENDING,
      }
    });

    // Logging Manager's own entries that go to Tower Head for approval
    await prisma.learningEntry.create({
      data: {
        userId: reportingManager.id,
        skillId: tsSkill.id,
        date: new Date(new Date().setDate(new Date().getDate() - 3)),
        hoursSpent: 8.0,
        learningType: LearningType.CONFERENCE,
        learningSource: LearningSource.OTHER,
        description: 'Attended regional JS/TS tech conference',
        status: ApprovalStatus.APPROVED,
        approverId: towerHead.id,
        approvalDate: new Date(),
        comments: 'Good learnings shared with team.'
      }
    });

    await prisma.learningEntry.create({
      data: {
        userId: reportingManager.id,
        skillId: pythonSkill.id,
        date: new Date(),
        hoursSpent: 5.0,
        learningType: LearningType.COURSE,
        learningSource: LearningSource.UDEMY,
        description: 'FastAPI Microservice Development course',
        status: ApprovalStatus.PENDING,
      }
    });

    // Approved logs for Bedivere (Product Member)
    const agileSkill = dbSkills.find(s => s.name === 'Agile');
    const scrumSkill = dbSkills.find(s => s.name === 'Scrum');
    if (agileSkill && scrumSkill) {
      await prisma.learningEntry.create({
        data: {
          userId: productMember.id,
          skillId: agileSkill.id,
          date: new Date(new Date().setDate(new Date().getDate() - 4)),
          hoursSpent: 10.0,
          learningType: LearningType.COURSE,
          learningSource: LearningSource.UDEMY,
          description: 'Agile Product Management Mastery',
          status: ApprovalStatus.APPROVED,
          approverId: productManager.id,
          approvalDate: new Date(),
          comments: 'Very detailed breakdown.'
        }
      });
      await prisma.learningEntry.create({
        data: {
          userId: productMember.id,
          skillId: scrumSkill.id,
          date: new Date(),
          hoursSpent: 5.0,
          learningType: LearningType.WORKSHOP,
          learningSource: LearningSource.INTERNAL_LMS,
          description: 'Scrum Alliance Workshop',
          status: ApprovalStatus.PENDING
        }
      });
    }
  }

  // 6. Seed some mock Udemy Business Data
  console.log('Seeding Udemy mock courses and progress...');
  if (reactSkill && pythonSkill && nextSkill) {
    const course1 = await prisma.udemyCourse.upsert({
      where: { courseId: 101 },
      update: {},
      create: {
        courseId: 101,
        title: 'React Key Concepts and Architecture',
        instructor: 'Maximilian Schwarzmüller',
        duration: 32.5,
        category: 'Development',
        rating: 4.7,
        language: 'English',
        url: 'https://udemy.com/react-key-concepts',
        skillId: reactSkill.id,
      }
    });

    const course2 = await prisma.udemyCourse.upsert({
      where: { courseId: 102 },
      update: {},
      create: {
        courseId: 102,
        title: 'Complete Python Bootcamp: Go from Zero to Hero',
        instructor: 'Jose Portilla',
        duration: 22.0,
        category: 'Development',
        rating: 4.6,
        language: 'English',
        url: 'https://udemy.com/complete-python-bootcamp',
        skillId: pythonSkill.id,
      }
    });

    // Progress for Lancelot (Team Member)
    await prisma.udemyProgress.upsert({
      where: { userId_courseId: { userId: teamMember.id, courseId: course1.id } },
      update: {},
      create: {
        userId: teamMember.id,
        courseId: course1.id,
        progressPercent: 78.5,
        timeSpent: 25.5,
        lastAccessDate: new Date(),
      }
    });

    // Progress for Galahad
    await prisma.udemyProgress.upsert({
      where: { userId_courseId: { userId: teamMember2.id, courseId: course2.id } },
      update: {},
      create: {
        userId: teamMember2.id,
        courseId: course2.id,
        progressPercent: 100.0,
        timeSpent: 22.0,
        lastAccessDate: new Date(new Date().setDate(new Date().getDate() - 2)),
      }
    });

    // Certification for Galahad
    await prisma.udemyCertification.upsert({
      where: { userId_courseId: { userId: teamMember2.id, courseId: course2.id } },
      update: {},
      create: {
        certificateName: 'UC-PYTHON-ZERO-TO-HERO-102',
        userId: teamMember2.id,
        courseId: course2.id,
        completionDate: new Date(new Date().setDate(new Date().getDate() - 2)),
      }
    });
  }

  // 7. Seed System Audits
  console.log('Seeding audit logs...');
  await prisma.auditLog.createMany({
    data: [
      { userId: towerHead.id, action: 'USER_LOGIN', details: 'Tower Head logged in from web interface', ipAddress: '127.0.0.1' },
      { userId: towerHead.id, action: 'USER_CREATE', details: 'Created Reporting Manager: rm.lead@skilltrack.com', ipAddress: '127.0.0.1' },
      { userId: reportingManager.id, action: 'USER_LOGIN', details: 'Reporting Manager logged in', ipAddress: '127.0.0.1' },
      { userId: reportingManager.id, action: 'USER_CREATE', details: 'Created Team Member: tm.dev@skilltrack.com', ipAddress: '127.0.0.1' },
      { userId: teamMember.id, action: 'LEARNING_ENTRY_SUBMIT', details: 'Logged 3.5 hours for Next.js', ipAddress: '127.0.0.1' }
    ]
  });

  // 8. Seed Notifications
  console.log('Seeding notifications...');
  await prisma.notification.createMany({
    data: [
      { userId: reportingManager.id, message: 'Lancelot du Lac submitted a learning log for Next.js (3.5 hrs) pending approval.', isRead: false },
      { userId: teamMember.id, message: 'Your learning hours for React (12.5 hrs) have been approved by Guinevere Pendragon.', isRead: true },
      { userId: teamMember.id, message: 'Your learning hours for TypeScript (4.0 hrs) have been approved by Guinevere Pendragon.', isRead: false },
      { userId: towerHead.id, message: 'Guinevere Pendragon submitted a learning log for Python (5.0 hrs) pending approval.', isRead: false }
    ]
  });

  console.log('Database Seeding Completed Successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
