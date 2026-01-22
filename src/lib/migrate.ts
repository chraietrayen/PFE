import mysql from 'mysql2/promise'

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env. DB_HOST,
    port:  Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  console.log('🚀 Début de la migration...\n')

  // Table User
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS User (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      password VARCHAR(255),
      role ENUM('SUPER_ADMIN', 'RH', 'USER') DEFAULT 'USER',
      image VARCHAR(500),
      emailVerified DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
  console.log('✅ Table User créée')

  // Table Account (pour OAuth Google)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS Account (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      userId VARCHAR(36) NOT NULL,
      type VARCHAR(255) NOT NULL,
      provider VARCHAR(255) NOT NULL,
      providerAccountId VARCHAR(255) NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INT,
      token_type VARCHAR(255),
      scope VARCHAR(255),
      id_token TEXT,
      session_state VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      UNIQUE KEY provider_providerAccountId (provider, providerAccountId)
    )
  `)
  console.log('✅ Table Account créée')

  // Table Session
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS Session (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      sessionToken VARCHAR(255) UNIQUE NOT NULL,
      userId VARCHAR(36) NOT NULL,
      expires DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )
  `)
  console.log('✅ Table Session créée')

  // Table VerificationToken
  await connection. execute(`
    CREATE TABLE IF NOT EXISTS VerificationToken (
      identifier VARCHAR(255) NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires DATETIME NOT NULL,
      PRIMARY KEY (identifier, token)
    )
  `)
  console.log('✅ Table VerificationToken créée')

  // Table Employee
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS Employee (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      matricule VARCHAR(50) UNIQUE NOT NULL,
      firstName VARCHAR(255) NOT NULL,
      lastName VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20),
      dateOfBirth DATE,
      address TEXT,
      department VARCHAR(255),
      position VARCHAR(255),
      hireDate DATE NOT NULL,
      contractType ENUM('CDI', 'CDD', 'STAGE', 'ALTERNANCE') DEFAULT 'CDI',
      salary DECIMAL(10, 2),
      status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
      userId VARCHAR(36),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL
    )
  `)
  console.log('✅ Table Employee créée')

  // Table Attendance (Pointage)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS Attendance (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      employeeId VARCHAR(36) NOT NULL,
      date DATE NOT NULL,
      checkIn DATETIME,
      checkOut DATETIME,
      status ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY') DEFAULT 'PRESENT',
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employeeId) REFERENCES Employee(id) ON DELETE CASCADE,
      UNIQUE KEY employee_date (employeeId, date)
    )
  `)
  console.log('✅ Table Attendance créée')

  // Table LeaveRequest (Congés)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS LeaveRequest (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      employeeId VARCHAR(36) NOT NULL,
      type ENUM('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER') NOT NULL,
      startDate DATE NOT NULL,
      endDate DATE NOT NULL,
      reason TEXT,
      status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
      approvedBy VARCHAR(36),
      approvedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employeeId) REFERENCES Employee(id) ON DELETE CASCADE,
      FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL
    )
  `)
  console.log('✅ Table LeaveRequest créée')

  // Table ChatMessage (pour Chatbot)
  await connection. execute(`
    CREATE TABLE IF NOT EXISTS ChatMessage (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      userId VARCHAR(36) NOT NULL,
      message TEXT NOT NULL,
      response TEXT,
      sentiment ENUM('POSITIVE', 'NEGATIVE', 'NEUTRAL'),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )
  `)
  console.log('✅ Table ChatMessage créée')

  // Créer un Super Admin par défaut
  await connection.execute(`
    INSERT IGNORE INTO User (id, email, name, password, role)
    VALUES (
      UUID(),
      'admin@santec.com',
      'Super Admin',
      '$2b$10$YourHashedPasswordHere',
      'SUPER_ADMIN'
    )
  `)
  console.log('✅ Super Admin créé (si non existant)')

  await connection.end()
  console.log('\n🎉 Migration terminée avec succès!')
}

migrate().catch(console.error)