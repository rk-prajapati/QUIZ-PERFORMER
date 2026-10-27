/* Exam Portal – LocalStorage layer */
const DB_KEYS = {
  USERS: 'ep_users',
  QUIZZES: 'ep_quizzes',
  RESULTS: 'ep_results',
  SESSION: 'ep_session',
  THEME: 'ep_theme',
  REMEMBER: 'ep_remember'
};

const Storage = {
  get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(key); },
  uid() { return 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
};

// Users
const UsersDB = {
  all() { return Storage.get(DB_KEYS.USERS, []); },
  save(users) { Storage.set(DB_KEYS.USERS, users); },
  findByEmail(email) { return this.all().find(u => u.email.toLowerCase() === email.toLowerCase()); },
  add(user) {
    const users = this.all();
    users.push(user);
    this.save(users);
    return user;
  },
  update(id, patch) {
    const users = this.all().map(u => u.id === id ? { ...u, ...patch } : u);
    this.save(users);
  }
};

// Quizzes
const QuizzesDB = {
  all() { return Storage.get(DB_KEYS.QUIZZES, []); },
  save(list) { Storage.set(DB_KEYS.QUIZZES, list); },
  find(id) { return this.all().find(q => q.id === id); },
  add(quiz) { const l = this.all(); l.push(quiz); this.save(l); return quiz; },
  update(id, patch) {
    const l = this.all().map(q => q.id === id ? { ...q, ...patch } : q);
    this.save(l);
  },
  remove(id) { this.save(this.all().filter(q => q.id !== id)); }
};

// Results
const ResultsDB = {
  all() { return Storage.get(DB_KEYS.RESULTS, []); },
  save(list) { Storage.set(DB_KEYS.RESULTS, list); },
  add(r) { const l = this.all(); l.push(r); this.save(l); return r; },
  byStudent(studentId) { return this.all().filter(r => r.studentId === studentId); },
  byQuiz(quizId) { return this.all().filter(r => r.quizId === quizId); }
};

// Session
const Session = {
  current() { return Storage.get(DB_KEYS.SESSION, null); },
  login(user) { Storage.set(DB_KEYS.SESSION, { id: user.id, email: user.email, name: user.name, role: user.role }); },
  logout() { Storage.remove(DB_KEYS.SESSION); },
  requireRole(role, redirect = 'login.html') {
    const s = this.current();
    if (!s || (role && s.role !== role)) {
      window.location.href = redirect;
      return null;
    }
    return s;
  }
};

/* Seed the built-in five-question exams. Data is stored in this browser. */
(function seed() {
  const questions = rows => rows.map(([question, correct, ...wrong]) => ({
    question,
    options: [correct, ...wrong],
    correctAnswer: 0
  }));
  const exams = [
    ['JavaScript Fundamentals', 'Programming', [
      ['Which keyword declares a block-scoped variable?', 'let', 'var', 'define', 'global'],
      ['What does the === operator compare?', 'Value and type', 'Value only', 'Type only', 'Memory size'],
      ['Which method adds an item to the end of an array?', 'push()', 'pop()', 'shift()', 'slice()'],
      ['What is the result of typeof null?', 'object', 'null', 'undefined', 'boolean'],
      ['Which function converts JSON text into an object?', 'JSON.parse()', 'JSON.stringify()', 'JSON.convert()', 'JSON.object()']
    ]],
    ['General Knowledge', 'General Knowledge', [
      ['What is the capital of France?', 'Paris', 'Berlin', 'Madrid', 'Rome'],
      ['Which is the largest planet in the Solar System?', 'Jupiter', 'Earth', 'Saturn', 'Neptune'],
      ['Which is the largest ocean on Earth?', 'Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'],
      ['How many continents are there?', 'Seven', 'Five', 'Six', 'Eight'],
      ['Which country is famous for the pyramids of Giza?', 'Egypt', 'Greece', 'Mexico', 'India']
    ]],
    ['HTML Essentials', 'Web Development', [
      ['Which tag creates the largest heading?', '<h1>', '<h6>', '<header>', '<title>'],
      ['Which attribute provides alternative text for an image?', 'alt', 'src', 'title', 'href'],
      ['Which tag creates a hyperlink?', '<a>', '<link>', '<nav>', '<url>'],
      ['Which element represents the main page content?', '<main>', '<body>', '<section>', '<content>'],
      ['Which input type hides entered characters?', 'password', 'hidden', 'secure', 'private']
    ]],
    ['CSS Fundamentals', 'Web Development', [
      ['Which property changes text color?', 'color', 'font-color', 'text-color', 'foreground'],
      ['Which layout system is two-dimensional?', 'CSS Grid', 'Flexbox', 'Float', 'Inline block'],
      ['Which selector targets an element with id="hero"?', '#hero', '.hero', 'hero', '*hero'],
      ['Which property adds space inside an element?', 'padding', 'margin', 'gap', 'spacing'],
      ['Which unit is relative to the root font size?', 'rem', 'px', 'cm', 'pt']
    ]],
    ['Python Basics', 'Programming', [
      ['Which keyword defines a function in Python?', 'def', 'function', 'func', 'define'],
      ['Which data type stores key-value pairs?', 'dict', 'list', 'tuple', 'set'],
      ['Which operator performs floor division?', '//', '/', '%', '**'],
      ['Which method adds an item to a list?', 'append()', 'push()', 'addLast()', 'insertEnd()'],
      ['Which keyword begins exception handling?', 'try', 'catch', 'error', 'handle']
    ]],
    ['Java Basics', 'Programming', [
      ['Which method is the entry point of a Java application?', 'main()', 'start()', 'run()', 'init()'],
      ['Which keyword creates an object?', 'new', 'create', 'object', 'class'],
      ['Which primitive type stores true or false?', 'boolean', 'bool', 'bit', 'logical'],
      ['Which keyword prevents inheritance?', 'final', 'static', 'private', 'const'],
      ['Which collection does not allow duplicate values?', 'Set', 'List', 'ArrayList', 'Queue']
    ]],
    ['C Programming', 'Programming', [
      ['Which header declares printf()?', '<stdio.h>', '<stdlib.h>', '<string.h>', '<math.h>'],
      ['Which operator gets a variable address?', '&', '*', '#', '@'],
      ['Which function allocates dynamic memory?', 'malloc()', 'alloc()', 'new()', 'memory()'],
      ['Which symbol ends a C statement?', ';', ':', '.', ','],
      ['Which loop always executes its body at least once?', 'do-while', 'while', 'for', 'foreach']
    ]],
    ['C++ Fundamentals', 'Programming', [
      ['Which feature allows one name with different implementations?', 'Polymorphism', 'Encapsulation', 'Compilation', 'Iteration'],
      ['Which operator accesses a class member through a pointer?', '->', '.', '::', '=>'],
      ['Which keyword declares a constant variable?', 'const', 'final', 'static', 'fixed'],
      ['Which standard container is a dynamic array?', 'vector', 'map', 'stack', 'set'],
      ['Which function is called when an object is destroyed?', 'Destructor', 'Constructor', 'Finalizer', 'Deallocator']
    ]],
    ['SQL Essentials', 'Database', [
      ['Which command retrieves data from a table?', 'SELECT', 'GET', 'FETCH TABLE', 'READ'],
      ['Which clause filters rows?', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING ALL'],
      ['Which keyword removes duplicate result rows?', 'DISTINCT', 'UNIQUE', 'DIFFERENT', 'SINGLE'],
      ['Which operation combines rows from related tables?', 'JOIN', 'MERGE CELL', 'CONNECT', 'APPEND ROW'],
      ['Which aggregate function counts rows?', 'COUNT()', 'SUM()', 'TOTAL()', 'ROWS()']
    ]],
    ['DBMS Concepts', 'Database', [
      ['Which key uniquely identifies a table row?', 'Primary key', 'Foreign key', 'Composite value', 'Index key'],
      ['What does normalization mainly reduce?', 'Data redundancy', 'Query syntax', 'Table names', 'User permissions'],
      ['Which ACID property means all-or-nothing?', 'Atomicity', 'Consistency', 'Isolation', 'Durability'],
      ['Which key references a primary key in another table?', 'Foreign key', 'Candidate key', 'Super key', 'Natural key'],
      ['Which language category includes INSERT and UPDATE?', 'DML', 'DDL', 'DCL', 'TCL']
    ]],
    ['Computer Networks', 'Computer Science', [
      ['Which protocol securely transfers web pages?', 'HTTPS', 'HTTP', 'FTP', 'SMTP'],
      ['Which device connects different networks?', 'Router', 'Switch', 'Hub', 'Repeater'],
      ['How many bits are in an IPv4 address?', '32', '64', '128', '16'],
      ['Which protocol translates domain names to IP addresses?', 'DNS', 'DHCP', 'ARP', 'SNMP'],
      ['Which OSI layer handles routing?', 'Network layer', 'Data link layer', 'Transport layer', 'Session layer']
    ]],
    ['Operating Systems', 'Computer Science', [
      ['Which component manages hardware and system resources?', 'Kernel', 'Compiler', 'Browser', 'Editor'],
      ['What is a process waiting for CPU time called?', 'Ready', 'Running', 'Terminated', 'Blocked forever'],
      ['Which technique gives each process a time slice?', 'Round-robin scheduling', 'Batch compiling', 'Paging only', 'Spooling'],
      ['What is virtual memory mainly backed by?', 'Secondary storage', 'CPU registers', 'Cache only', 'ROM only'],
      ['Which condition occurs when processes wait indefinitely for resources?', 'Deadlock', 'Overflow', 'Fragmentation', 'Starvation-free state']
    ]],
    ['Cybersecurity Basics', 'Security', [
      ['Which attack tricks users into revealing information?', 'Phishing', 'Hashing', 'Backup', 'Compression'],
      ['What does MFA require?', 'More than one verification factor', 'One long password', 'A public username', 'Only a fingerprint'],
      ['Which tool filters network traffic using rules?', 'Firewall', 'Compiler', 'Load balancer', 'Text editor'],
      ['What is malware that encrypts files for payment?', 'Ransomware', 'Adware', 'Spyware', 'Firmware'],
      ['Which practice best protects stored passwords?', 'Salted hashing', 'Plain text storage', 'Emailing passwords', 'Reusing one password']
    ]],
    ['Cloud Computing', 'Cloud', [
      ['Which model provides virtual machines and storage?', 'IaaS', 'SaaS', 'PaaS', 'FaaS only'],
      ['Which term means adding resources automatically with demand?', 'Auto scaling', 'Hashing', 'Indexing', 'Refactoring'],
      ['Which deployment model is dedicated to one organization?', 'Private cloud', 'Public cloud', 'Community web', 'Open source cloud'],
      ['What is serverless billing commonly based on?', 'Actual execution and usage', 'A permanent physical server', 'Number of developers', 'Code file count'],
      ['Which feature distributes traffic across servers?', 'Load balancing', 'Version control', 'Encryption at rest', 'Object mapping']
    ]],
    ['Git and GitHub', 'Development Tools', [
      ['Which command creates a local Git repository?', 'git init', 'git start', 'git create', 'git new'],
      ['Which command records staged changes?', 'git commit', 'git push', 'git add', 'git clone'],
      ['Which command copies a remote repository locally?', 'git clone', 'git fork', 'git branch', 'git merge'],
      ['What is a pull request used for?', 'Reviewing and merging proposed changes', 'Deleting a repository', 'Installing Git', 'Running local HTML'],
      ['Which file lists intentionally untracked paths?', '.gitignore', 'README.md', 'package.json', '.gitkeep']
    ]],
    ['React Basics', 'Web Development', [
      ['What is a reusable React UI unit called?', 'Component', 'Controller', 'Module server', 'Database view'],
      ['Which hook stores component state?', 'useState', 'useEffect', 'useMemo', 'useRef only'],
      ['Which syntax describes React UI?', 'JSX', 'SQL', 'XML Schema', 'Markdown'],
      ['Which prop helps React identify list items?', 'key', 'id only', 'name', 'indexOf'],
      ['Which hook runs side effects?', 'useEffect', 'useState', 'useContext', 'useReducer only']
    ]],
    ['Node.js Basics', 'Web Development', [
      ['Which engine powers Node.js?', 'V8', 'SpiderMonkey', 'WebKit', 'JVM'],
      ['Which command initializes a package.json file?', 'npm init', 'node start', 'npm create-json', 'node init-package'],
      ['Which built-in module creates an HTTP server?', 'http', 'server', 'network', 'web'],
      ['What does npm manage?', 'Packages and dependencies', 'Database rows', 'CSS selectors', 'Operating system users'],
      ['Which pattern allows Node.js to handle many I/O tasks efficiently?', 'Event-driven non-blocking I/O', 'One process per line', 'Synchronous-only loops', 'GPU-only execution']
    ]],
    ['Data Structures', 'Computer Science', [
      ['Which structure follows LIFO?', 'Stack', 'Queue', 'Graph', 'Heap'],
      ['Which structure follows FIFO?', 'Queue', 'Stack', 'Tree', 'Set'],
      ['What is the average lookup time of a hash table?', 'O(1)', 'O(n)', 'O(n²)', 'O(log n!)'],
      ['Which tree has at most two children per node?', 'Binary tree', 'B-tree', 'Trie', 'General graph'],
      ['Which structure represents pairwise relationships?', 'Graph', 'Array', 'Stack', 'String']
    ]],
    ['Web Development', 'Web Development', [
      ['Which part of a web app runs in the browser?', 'Frontend', 'Database', 'DNS server', 'Backend only'],
      ['Which API style commonly uses HTTP verbs and resources?', 'REST', 'SMTP', 'FTP', 'SSH'],
      ['Which status code means Not Found?', '404', '200', '301', '500'],
      ['Which browser storage persists after the tab closes?', 'localStorage', 'A local variable', 'DOM text', 'Function scope'],
      ['Which method submits sensitive form data more appropriately?', 'POST', 'GET', 'TRACE', 'HEAD']
    ]],
    ['Quantitative Aptitude', 'Aptitude', [
      ['What is 15% of 200?', '30', '20', '25', '35'],
      ['A number increased from 80 to 100. What is the percentage increase?', '25%', '20%', '15%', '30%'],
      ['What is the average of 10, 20 and 30?', '20', '15', '25', '30'],
      ['If 5 pens cost ₹100, what does one pen cost?', '₹20', '₹15', '₹25', '₹10'],
      ['What is 3/4 expressed as a percentage?', '75%', '60%', '70%', '80%']
    ]],
    ['Logical Reasoning', 'Aptitude', [
      ['Complete the series: 2, 4, 8, 16, ?', '32', '24', '30', '34'],
      ['If all roses are flowers, which statement must be true?', 'Every rose is a flower', 'Every flower is a rose', 'No rose is a flower', 'Some roses are not flowers'],
      ['Find the odd one out: Square, Triangle, Circle, Cube', 'Cube', 'Square', 'Triangle', 'Circle'],
      ['If CAT becomes DBU, DOG becomes?', 'EPH', 'DPH', 'EOG', 'FQI'],
      ['A is taller than B and B is taller than C. Who is shortest?', 'C', 'A', 'B', 'Cannot be determined']
    ]],
    ['English Grammar', 'Language', [
      ['Choose the correct plural of child.', 'Children', 'Childs', 'Childes', 'Childrens'],
      ['Which word is a synonym of rapid?', 'Fast', 'Slow', 'Weak', 'Late'],
      ['Choose the correct article: ___ honest person.', 'An', 'A', 'The only', 'No article'],
      ['Which sentence is in the past tense?', 'She walked home.', 'She walks home.', 'She will walk home.', 'She is walking home.'],
      ['Which word is an adjective?', 'Beautiful', 'Beauty', 'Beautifully', 'Beautify']
    ]],
    ['General Science', 'Science', [
      ['What is the chemical formula of water?', 'H₂O', 'CO₂', 'O₂', 'NaCl'],
      ['Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Mercury'],
      ['Which gas do plants absorb during photosynthesis?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'],
      ['What is the SI unit of force?', 'Newton', 'Joule', 'Watt', 'Pascal'],
      ['Which organ pumps blood through the human body?', 'Heart', 'Liver', 'Lung', 'Kidney']
    ]],
    ['Class 1 Basic Quiz', 'Class 1', [
      ['What comes after the number 5?', '6', '4', '7', '8'],
      ['Which colour is the sun usually drawn as?', 'Yellow', 'Blue', 'Black', 'Purple'],
      ['How many legs does a cat have?', '4', '2', '6', '8'],
      ['Which shape has three sides?', 'Triangle', 'Circle', 'Square', 'Rectangle'],
      ['Which letter comes after A?', 'B', 'C', 'D', 'E']
    ]],
    ['Class 2 Basic Quiz', 'Class 2', [
      ['What is 8 + 7?', '15', '14', '16', '13'],
      ['How many days are in one week?', '7', '5', '6', '8'],
      ['Which word is a naming word?', 'School', 'Run', 'Quickly', 'Blue'],
      ['Which animal gives us milk?', 'Cow', 'Lion', 'Tiger', 'Fox'],
      ['What is 20 - 6?', '14', '12', '13', '16']
    ]],
    ['Class 3 Basic Quiz', 'Class 3', [
      ['What is 6 × 4?', '24', '20', '22', '26'],
      ['Which part of a plant absorbs water?', 'Roots', 'Flowers', 'Fruit', 'Stem top'],
      ['What is the plural of box?', 'Boxes', 'Boxs', 'Boxen', 'Boxies'],
      ['How many months are in one year?', '12', '10', '11', '13'],
      ['Which direction is opposite to north?', 'South', 'East', 'West', 'Up']
    ]],
    ['Class 4 Basic Quiz', 'Class 4', [
      ['What is one-half of 20?', '10', '5', '15', '12'],
      ['Which organ helps us breathe?', 'Lungs', 'Heart', 'Stomach', 'Brain'],
      ['Which sentence is a question?', 'Where are you going?', 'I am going home.', 'Please sit down.', 'What a nice day!'],
      ['How many centimetres make one metre?', '100', '10', '50', '1000'],
      ['Which planet do we live on?', 'Earth', 'Mars', 'Venus', 'Jupiter']
    ]],
    ['Class 5 Basic Quiz', 'Class 5', [
      ['What is 12 × 8?', '96', '86', '92', '108'],
      ['What is the perimeter of a square with side 5 cm?', '20 cm', '10 cm', '15 cm', '25 cm'],
      ['Which is the largest planet in our Solar System?', 'Jupiter', 'Earth', 'Mars', 'Mercury'],
      ['Which process changes water into water vapour?', 'Evaporation', 'Freezing', 'Melting', 'Condensation'],
      ['Which word is an adverb in “She runs quickly”?', 'Quickly', 'She', 'Runs', 'She runs']
    ]],
    ['Class 6 Basic Quiz', 'Class 6', [
      ['If x + 5 = 12, what is x?', '7', '5', '6', '17'],
      ['What is 3/4 as a decimal?', '0.75', '0.25', '0.5', '1.25'],
      ['Which gas is most abundant in Earth’s atmosphere?', 'Nitrogen', 'Oxygen', 'Carbon dioxide', 'Hydrogen'],
      ['Which imaginary line divides Earth into northern and southern halves?', 'Equator', 'Prime Meridian', 'Tropic of Cancer', 'Arctic Circle'],
      ['Which part of speech describes a noun?', 'Adjective', 'Verb', 'Adverb', 'Preposition']
    ]]
  ].map(([title, category, rows], index) => ({
    seedKey: `default_exam_${index + 1}`,
    title,
    category,
    duration: 5,
    questions: questions(rows)
  }));

  const existing = QuizzesDB.all();
  exams.forEach(exam => {
    const found = existing.find(q => q.seedKey === exam.seedKey || q.title === exam.title);
    if (found) {
      QuizzesDB.update(found.id, exam);
    } else {
      QuizzesDB.add({ id: Storage.uid(), createdAt: Date.now(), ...exam });
    }
  });
})();
