"use client"

import { useState, useEffect, useRef } from "react"
import "./App.css"
import OpenAI from "openai"

// Initialize OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true, // Note: In production, API calls should be made from the server
})

// Simple tokenizer for browser compatibility
const tokenizer = {
  tokenize: (text) =>
    text
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 0),
}

// Simple stemmer for browser compatibility
const stemmer = {
  stem: (word) => {
    // Very basic stemming - just handles some common endings
    if (word.length < 4) return word
    if (word.endsWith("ing")) return word.slice(0, -3)
    if (word.endsWith("ed")) return word.slice(0, -2)
    if (word.endsWith("s")) return word.slice(0, -1)
    return word
  },
}

// Simple TF-IDF implementation for browser
class TfIdf {
  constructor() {
    this.documents = []
  }

  addDocument(doc) {
    this.documents.push(doc)
  }

  tfIdfForTerm(term, docIndex) {
    // Simple TF-IDF calculation
    const doc = this.documents[docIndex]
    const termFreq = doc.split(term).length - 1
    let docFreq = 0

    for (const document of this.documents) {
      if (document.includes(term)) docFreq++
    }

    return termFreq * Math.log(this.documents.length / (docFreq || 1))
  }
}

// PDF knowledge base - This would be populated from PDFs in a real implementation
// In production, this would be loaded from PDF files in the "PDFs" folder
const pdfKnowledgeBase = {
  syllabusData: {
    "cloud computing":
      "Cloud Computing Syllabus (CSE-CC-401):\n\nUnit 1: Introduction to Cloud Computing\n- Cloud Computing Concepts\n- Service Models: IaaS, PaaS, SaaS\n- Deployment Models: Public, Private, Hybrid\n\nUnit 2: Cloud Architecture\n- Virtualization Technologies\n- Resource Management\n- Cloud Storage Systems\n\nUnit 3: Cloud Security\n- Security Challenges in Cloud\n- Identity and Access Management\n- Data Protection\n\nUnit 4: Cloud Service Providers\n- AWS, Azure, Google Cloud\n- Features and Comparison\n\nUnit 5: Cloud Application Development\n- Microservices Architecture\n- Containerization with Docker\n- Orchestration with Kubernetes",

    "data science":
      "Data Science Syllabus (CSE-DS-301):\n\nUnit 1: Introduction to Data Science\n- Data Science Process\n- Statistical Foundations\n- Data Collection and Cleaning\n\nUnit 2: Data Analysis\n- Exploratory Data Analysis\n- Data Visualization\n- Statistical Analysis\n\nUnit 3: Machine Learning\n- Supervised Learning\n- Unsupervised Learning\n- Model Evaluation\n\nUnit 4: Big Data Analytics\n- Hadoop Ecosystem\n- Spark for Data Processing\n- NoSQL Databases\n\nUnit 5: Data Science Applications\n- Business Intelligence\n- Predictive Analytics\n- Ethics in Data Science",

    "artificial intelligence":
      "Artificial Intelligence Syllabus (CSE-AI-201):\n\nUnit 1: Introduction to AI\n- History and Evolution\n- Intelligent Agents\n- Problem Solving\n\nUnit 2: Knowledge Representation\n- Logic-Based Representation\n- Rule-Based Systems\n- Semantic Networks\n\nUnit 3: Machine Learning\n- Supervised Learning\n- Unsupervised Learning\n- Reinforcement Learning\n\nUnit 4: Natural Language Processing\n- Text Processing\n- Sentiment Analysis\n- Language Models\n\nUnit 5: AI Applications\n- Computer Vision\n- Robotics\n- Expert Systems",

    "computer science":
      "Computer Science Engineering Syllabus (CSE-101):\n\nSemester 1:\n- Mathematics I\n- Physics\n- Programming in C\n- Engineering Drawing\n- English\n\nSemester 2:\n- Mathematics II\n- Chemistry\n- Data Structures\n- Electrical Engineering\n- Environmental Science\n\nSemester 3:\n- Data Structures and Algorithms\n- Object-Oriented Programming\n- Digital Logic Design\n- Discrete Mathematics\n- Computer Organization\n\nSemester 4:\n- Operating Systems\n- Database Management Systems\n- Computer Networks\n- Design and Analysis of Algorithms\n- Probability and Statistics",

    electronics:
      "Electronics & Communication Engineering Syllabus (ECE-101):\n\nSemester 1:\n- Mathematics I\n- Physics\n- Programming in C\n- Engineering Drawing\n- English\n\nSemester 2:\n- Mathematics II\n- Chemistry\n- Basic Electronics\n- Electrical Engineering\n- Environmental Science\n\nSemester 3:\n- Electronic Devices and Circuits\n- Digital System Design\n- Signals and Systems\n- Network Theory\n- Electromagnetic Theory\n\nSemester 4:\n- Analog Circuits\n- Communication Systems\n- Microprocessors and Microcontrollers\n- Control Systems\n- Probability Theory and Stochastic Processes",

    "data structures":
      "Data Structures Syllabus (CSE-201):\n\nUnit 1: Introduction to Data Structures\n- Abstract Data Types\n- Time and Space Complexity\n- Big O Notation\n\nUnit 2: Linear Data Structures\n- Arrays and Linked Lists\n- Stacks and Queues\n- Priority Queues\n\nUnit 3: Trees\n- Binary Trees\n- Binary Search Trees\n- AVL Trees\n- B-Trees\n\nUnit 4: Graphs\n- Graph Representation\n- Graph Traversals (BFS, DFS)\n- Shortest Path Algorithms\n- Minimum Spanning Trees\n\nUnit 5: Hashing\n- Hash Functions\n- Collision Resolution Techniques\n- Hash Tables",

    // Adding more syllabi from the attached PDF
    "operating systems":
      "Operating Systems Syllabus (CSE-403PC):\n\nUnit 1: Introduction\n- OS Functions and Characteristics\n- OS Structure and Operations\n- System Calls\n- System Programs\n- OS Generation and System Boot\n\nUnit 2: Process Management\n- Process Concepts and Scheduling\n- Operations on Processes\n- Interprocess Communication\n- CPU Scheduling Algorithms\n- Process Synchronization\n\nUnit 3: Memory Management\n- Memory Allocation Strategies\n- Virtual Memory\n- Page Replacement Algorithms\n- Segmentation\n- Thrashing\n\nUnit 4: File Systems\n- File Concepts and Access Methods\n- Directory Structure\n- File System Implementation\n- Disk Space Allocation\n- Free-Space Management\n\nUnit 5: I/O Systems\n- I/O Hardware and Software\n- Disk Scheduling\n- RAID Structure\n- Disk Management\n- Case Studies",

    dbms: "Database Management Systems Syllabus (CSE-404PC):\n\nUnit 1: Introduction to DBMS\n- Database System Concepts\n- Data Models\n- Database Languages\n- Database Architecture\n- Database Users and Administrators\n\nUnit 2: Entity-Relationship Model\n- Basic Concepts\n- Constraints\n- E-R Diagrams\n- Enhanced E-R Features\n- Database Design\n\nUnit 3: Relational Model\n- Relational Algebra\n- SQL Fundamentals\n- Advanced SQL Features\n- Integrity Constraints\n- Views\n\nUnit 4: Normalization\n- Functional Dependencies\n- Normal Forms (1NF to BCNF)\n- Lossless Join Decomposition\n- Dependency Preservation\n\nUnit 5: Transaction Management\n- ACID Properties\n- Concurrency Control\n- Recovery Techniques\n- Deadlock Handling\n- Database Security",

    "machine learning":
      "Machine Learning Syllabus (CSE-601PC):\n\nUnit 1: Introduction\n- Concept Learning\n- Decision Tree Learning\n- Artificial Neural Networks\n\nUnit 2: Evaluation of Hypotheses\n- Bayesian Learning\n- Computational Learning Theory\n- Instance-Based Learning\n\nUnit 3: Genetic Algorithms\n- Rule-Based Learning\n- Reinforcement Learning\n\nUnit 4: Analytical Learning\n- Combining Inductive and Analytical Learning\n\nUnit 5: Advanced Topics\n- Deep Learning Introduction\n- Support Vector Machines\n- Ensemble Methods",

    "web technologies":
      "Web Technologies Syllabus (CSE-504PC):\n\nUnit 1: Introduction to PHP\n- Variables and Data Types\n- Control Structures\n- Form Handling\n- Database Connectivity\n- File Handling\n\nUnit 2: HTML and XML\n- HTML Common Tags\n- Cascading Style Sheets\n- XML Introduction\n- Document Type Definition\n- XML Parsing\n\nUnit 3: Servlets\n- Servlet Lifecycle\n- HTTP Request & Response\n- Cookies and Sessions\n- Database Connectivity\n\nUnit 4: JSP\n- JSP Processing\n- Directives and Expressions\n- Implicit Objects\n- Beans in JSP\n- Database Connectivity\n\nUnit 5: Client-side Scripting\n- JavaScript Introduction\n- Variables and Functions\n- Event Handlers\n- DOM\n- Form Validation",

    "compiler design":
      "Compiler Design Syllabus (CSE-602PC):\n\nUnit 1: Introduction\n- Compiler Structure\n- Lexical Analysis\n- Regular Expressions\n- Finite Automata\n\nUnit 2: Syntax Analysis\n- Context-Free Grammars\n- Top-Down Parsing\n- Bottom-Up Parsing\n- LR Parsing\n\nUnit 3: Syntax-Directed Translation\n- Syntax-Directed Definitions\n- Evaluation Orders\n- Intermediate Code Generation\n\nUnit 4: Run-Time Environments\n- Stack Allocation\n- Heap Management\n- Code Generation\n- Optimization\n\nUnit 5: Machine-Independent Optimization\n- Data-Flow Analysis\n- Loop Optimization\n- Procedure Optimization",

    cryptography:
      "Cryptography and Network Security Syllabus (CSE-701PC):\n\nUnit 1: Security Concepts\n- Security Approaches\n- Types of Attacks\n- Cryptography Concepts\n\nUnit 2: Symmetric and Asymmetric Ciphers\n- DES, AES, Blowfish\n- RSA, Diffie-Hellman\n\nUnit 3: Hash Functions\n- Message Authentication\n- Digital Signatures\n- Key Management\n\nUnit 4: Transport-level Security\n- SSL/TLS\n- HTTPS\n- Wireless Security\n\nUnit 5: Email Security\n- PGP\n- S/MIME\n- IP Security",

    mathematics:
      "Mathematics Syllabus (21MA101BS & 21MA201BS):\n\nMathematics-I:\n- Matrices and Linear Systems\n- Eigenvalues and Eigenvectors\n- Differential Calculus\n- Integral Calculus\n- Multiple Integrals\n\nMathematics-II:\n- First Order Differential Equations\n- Higher Order Linear Differential Equations\n- Series Solutions and Special Functions\n- Laplace Transforms\n- Fourier Series and Transforms",

    chemistry:
      "Chemistry Syllabus (21CH102BS):\n\nUnit 1: Atomic and Molecular Structure\n- Quantum Mechanics\n- Molecular Orbitals\n- Spectroscopy\n\nUnit 2: Water and its Treatment\n- Hardness\n- Purification Methods\n- Desalination\n\nUnit 3: Electrochemistry\n- Electrochemical Cells\n- Batteries\n- Fuel Cells\n\nUnit 4: Stereochemistry\n- Isomerism\n- Chirality\n- Conformational Analysis\n\nUnit 5: Phase Rule and Polymer Chemistry\n- Phase Diagrams\n- Polymer Synthesis\n- Polymer Properties",

    physics:
      "Applied Physics Syllabus (21AP202BS):\n\nUnit 1: Wave Optics\n- Interference\n- Diffraction\n- Polarization\n\nUnit 2: Quantum Mechanics\n- Wave-Particle Duality\n- Schrödinger Equation\n- Applications\n\nUnit 3: Semiconductor Physics\n- Energy Bands\n- Charge Carriers\n- p-n Junctions\n\nUnit 4: Dielectric and Magnetic Properties\n- Polarization\n- Magnetization\n- Ferroelectrics and Ferromagnetics\n\nUnit 5: Lasers and Fiber Optics\n- Laser Principles\n- Types of Lasers\n- Optical Fibers",

    "formal languages":
      "Formal Languages and Automata Theory Syllabus (21CS501PC):\n\nUnit 1: Introduction to Finite Automata\n- Structural Representations\n- Deterministic and Non-deterministic Finite Automata\n- Conversion of NFA to DFA\n\nUnit 2: Regular Expressions\n- Finite Automata and Regular Expressions\n- Pumping Lemma\n- Closure Properties\n\nUnit 3: Context-Free Grammars\n- Derivations and Parse Trees\n- Pushdown Automata\n- Equivalence of PDA and CFG\n\nUnit 4: Normal Forms\n- Chomsky Normal Form\n- Greibach Normal Form\n- Pumping Lemma for CFLs\n\nUnit 5: Turing Machines\n- Formal Description\n- Undecidability\n- Recursive Languages",

    "software engineering":
      "Software Engineering Syllabus (21CS502PC):\n\nUnit 1: Introduction\n- Software Process Models\n- Process Framework\n- Process Patterns\n\nUnit 2: Requirements Engineering\n- Functional and Non-functional Requirements\n- Requirements Elicitation\n- System Models\n\nUnit 3: Design Engineering\n- Design Process\n- Architectural Design\n- UML Diagrams\n\nUnit 4: Testing Strategies\n- Black-box and White-box Testing\n- Validation Testing\n- System Testing\n\nUnit 5: Metrics and Quality Management\n- Process and Product Metrics\n- Risk Management\n- Quality Assurance",

    "computer networks":
      "Computer Networks Syllabus (21CS503PC):\n\nUnit 1: Network Hardware and Software\n- OSI and TCP/IP Models\n- Physical Layer\n- Transmission Media\n\nUnit 2: Data Link Layer\n- Error Detection and Correction\n- Sliding Window Protocols\n- Medium Access Control\n\nUnit 3: Network Layer\n- Routing Algorithms\n- Congestion Control\n- Internetworking\n\nUnit 4: Transport Layer\n- TCP and UDP Protocols\n- Connection Management\n\nUnit 5: Application Layer\n- DNS\n- Email\n- Web\n- Streaming Media",

    m1: "Mathematics-I Syllabus (21MA101BS):\n\nUnit 1: Matrices\n- Types of Matrices\n- Rank of a Matrix\n- Eigenvalues and Eigenvectors\n\nUnit 2: Differential Calculus\n- Limits and Continuity\n- Partial Derivatives\n- Total Derivative\n\nUnit 3: Integral Calculus\n- Multiple Integrals\n- Applications\n- Change of Variables\n\nUnit 4: Vector Calculus\n- Gradient, Divergence, Curl\n- Line, Surface, and Volume Integrals\n- Vector Identities\n\nUnit 5: Ordinary Differential Equations\n- First Order Equations\n- Linear Differential Equations\n- Applications",

    m2: "Mathematics-II Syllabus (21MA201BS):\n\nUnit 1: First Order Differential Equations\n- Exact, Linear, Bernoulli Equations\n- Applications\n\nUnit 2: Higher Order Linear Differential Equations\n- Homogeneous Equations\n- Non-homogeneous Equations\n- Method of Variation of Parameters\n\nUnit 3: Series Solutions\n- Power Series Method\n- Frobenius Method\n\nUnit 4: Laplace Transforms\n- Properties\n- Inverse Transforms\n- Applications to Differential Equations\n\nUnit 5: Fourier Analysis\n- Fourier Series\n- Fourier Transforms\n- Applications",

    chem: "Chemistry Syllabus (21CH102BS):\n\nUnit 1: Atomic and Molecular Structure\n- Quantum Mechanics\n- Molecular Orbitals\n- Spectroscopy\n\nUnit 2: Water and its Treatment\n- Hardness\n- Purification Methods\n- Desalination\n\nUnit 3: Electrochemistry\n- Electrochemical Cells\n- Batteries\n- Fuel Cells\n\nUnit 4: Stereochemistry\n- Isomerism\n- Chirality\n- Conformational Analysis\n\nUnit 5: Phase Rule and Polymer Chemistry\n- Phase Diagrams\n- Polymer Synthesis\n- Polymer Properties",

    algorithms:
      "Design and Analysis of Algorithms Syllabus (21CS603PC):\n\nUnit 1: Introduction\n- Algorithm Analysis\n- Asymptotic Notations\n- Divide and Conquer\n\nUnit 2: Disjoint Sets and Backtracking\n- Disjoint Set Operations\n- Union and Find Algorithms\n- N-Queens Problem\n- Graph Coloring\n\nUnit 3: Dynamic Programming\n- Optimal Binary Search Trees\n- Knapsack Problem\n- All Pairs Shortest Path\n- Traveling Salesperson Problem\n\nUnit 4: Greedy Method\n- Job Sequencing\n- Minimum Cost Spanning Trees\n- Single Source Shortest Path\n\nUnit 5: Branch and Bound\n- Traveling Salesperson Problem\n- 0/1 Knapsack Problem\n- NP-Hard and NP-Complete Problems",
  },
}

// Initialize TF-IDF with syllabi
const tfidf = new TfIdf()
Object.entries(pdfKnowledgeBase.syllabusData).forEach(([key, value]) => {
  tfidf.addDocument(value.toLowerCase())
})

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "👋 Hi! I'm your NNRG Virtual Assistant. I'm here to help with information about our college, programs, facilities, and more. How can I help you today?",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [conversationContext, setConversationContext] = useState([]) // Store conversation history for context
  const [userStyle, setUserStyle] = useState("formal") // Track user's communication style
  const chatBodyRef = useRef(null)
  const chatWidgetRef = useRef(null)

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages])

  // Add animation class when chat is opened
  useEffect(() => {
    if (chatWidgetRef.current) {
      if (isChatOpen) {
        chatWidgetRef.current.classList.add("chat-open")
      } else {
        chatWidgetRef.current.classList.remove("chat-open")
      }
    }
  }, [isChatOpen])

  // Knowledge base for rule-based responses
  const knowledgeBase = {
    general: {
      contact:
        "📞 You can contact NNRG at:\n\nPhone: +91-8414-252644, 252645, 252646\nEmail: info@nnrg.edu.in\nAddress: Chowdariguda, Ghatkesar, Hyderabad",
      location: "📍 NNRG is located in Chowdariguda, Ghatkesar, Hyderabad, Telangana, India.",
      date: () =>
        `📅 Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
      time: () =>
        `🕒 The current time is ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
    },
    about: {
      nnrg: "NNRG (Nalla Narasimha Reddy Education Society's Group of Institutions) is a premier educational institution established in 2009. We offer various undergraduate and postgraduate programs in engineering, management, and computer applications. Our campus is equipped with state-of-the-art facilities to provide quality education.",
      dean: "👨‍🏫 Dr. Janardhan Reddy is the Dean of NNRG. He oversees academic affairs and curriculum development. You can reach him at dean@nnrg.edu.in for academic-related inquiries.",
      director:
        "Dr. C.V. Krishna Reddy is the current Director of NNRG. He has extensive experience in educational administration and is committed to maintaining high academic standards. For more information, please visit https://nnrg.edu.in/about-us/director/",
      principal:
        "Dr. G. Janardhana Raju is the Principal of NNRG. He oversees the academic and administrative functions of the college and is dedicated to providing quality education to students.",
      chairman:
        "Mr. Nalla Narasimha Reddy is the Chairman of NNRG. Under his visionary leadership, NNRG has grown into one of the premier educational institutions in the region. For more information about our chairman and management team, please visit https://nnrg.edu.in/about-us/management/",
      vision:
        "To emerge as a premier technical institution striving for excellence in education, research and technological services contributing to the advancement of society.",
      mission:
        "Our mission is to:\n\n- Provide quality education through innovative teaching-learning processes\n- Foster research and development through industry collaboration\n- Develop entrepreneurial skills among students\n- Promote ethical values and leadership qualities",
      departments:
        "NNRG has 7 academic departments:\n\n1. Computer Science Engineering (CSE)\n2. Electronics & Communication Engineering (ECE)\n3. Electrical & Electronics Engineering (EEE)\n4. Mechanical Engineering (MECH)\n5. Civil Engineering (CIVIL)\n6. Master of Business Administration (MBA)\n7. Master of Computer Applications (MCA)",
    },
    academics: {
      "ug programs":
        "🎓 NNRG offers various undergraduate programs including:\n\n- B.Tech in Computer Science Engineering\n- B.Tech in Electronics & Communication\n- B.Tech in Mechanical Engineering\n- B.Tech in Civil Engineering\n- B.Tech in AI & ML\n- B.Tech in Data Science",
      "pg programs":
        "🎓 Our postgraduate programs include:\n\n- M.Tech in CSE\n- M.Tech in ECE\n- M.Tech in AI & ML\n- MBA\n- MCA",
      "fee structure":
        "💰 The fee structure for 2024-25:\n\nB.Tech Programs:\n- CSE: ₹1,20,000/year\n- ECE: ₹1,15,000/year\n- Mechanical: ₹1,10,000/year\n\nPG Programs:\n- M.Tech: ₹85,000/year\n- MBA: ₹80,000/year",
    },
    facilities: {
      campus:
        "🏫 NNRG campus features:\n\n- Modern laboratories\n- Digital library\n- Sports complex\n- Wi-Fi enabled campus\n- Cafeteria\n- Transport facilities\n- Hostel accommodation\n- Medical facilities",
      transport:
        "🚌 College buses operate from various points in Hyderabad. Check route details at https://nnrg.edu.in/facilities/transport/",
      placements:
        "💼 Our placement cell ensures excellent career opportunities. Recent recruiters include major IT companies and core engineering firms. Visit https://nnrg.edu.in/placements/ for details.",
      sports:
        "🏆 NNRG offers excellent sports facilities including:\n\n- Indoor sports arena\n- Cricket ground\n- Basketball court\n- Volleyball court\n- Table tennis\n- Badminton courts\n- Gym with modern equipment\n\nWe regularly organize inter-college tournaments and encourage students to participate in state and national level competitions.",
      cafeteria:
        "🍽️ Our cafeteria provides:\n\n- Freshly prepared meals\n- Variety of snacks and beverages\n- Hygienic food preparation\n- Comfortable seating area\n- Special menu on festivals\n- Affordable prices\n\nThe cafeteria is open from 8:00 AM to 4:00 PM on all working days.",
      library:
        "📚 NNRG Library features:\n\n- Over 50,000 books\n- Digital resources and e-journals\n- Spacious reading halls\n- Online catalog system\n- Subscription to IEEE, Springer, and other journals\n- Extended hours during exams\n- Photocopying facilities\n\nLibrary hours: 9:00 AM to 4:00 PM (Monday-Saturday)",
      labs: "🔬 Our laboratories are equipped with state-of-the-art equipment and software:\n\n- Computer Labs with latest hardware and software\n- Electronics Labs with advanced testing equipment\n- Mechanical Workshops with modern machinery\n- Civil Engineering Labs with testing facilities\n- Chemistry and Physics Labs\n\nAll labs are maintained by experienced staff and updated regularly to keep pace with industry standards.",
      "anti-ragging":
        "🛡️ NNRG has a strict Anti-Ragging Policy in accordance with UGC regulations. Our Anti-Ragging Committee ensures a ragging-free campus environment. Any form of ragging is strictly prohibited and punishable. Students can report incidents to the committee members or through our dedicated helpline: +91-8414-252644 (ext. 123). We conduct regular awareness programs and have installed CCTV cameras across the campus for monitoring.",
      "medical facilities":
        "🏥 NNRG provides comprehensive medical facilities for students and staff:\n\n- On-campus medical center with qualified doctors\n- First-aid facilities in all buildings\n- Ambulance service for emergencies\n- Regular health check-up camps\n- Tie-ups with nearby hospitals for specialized care\n- Mental health counseling services\n\nThe medical center is open from 9:00 AM to 5:00 PM on all working days.",
      "hostel accommodation":
        "🏠 NNRG offers separate hostel facilities for boys and girls:\n\n- Well-furnished rooms (single, double, and triple sharing options)\n- 24/7 security with biometric access\n- Wi-Fi connectivity\n- Clean drinking water and hygienic food\n- Recreation rooms with TV and indoor games\n- Laundry services\n- Regular housekeeping\n\nFor hostel admission and fee details, contact the hostel warden at hostel@nnrg.edu.in.",
      "wi-fi campus":
        "📶 NNRG campus is fully Wi-Fi enabled with high-speed internet connectivity. Students and faculty can access the internet for academic and research purposes. The network is secured with proper authentication mechanisms and is monitored to ensure appropriate usage.",
    },
    events: {
      upcoming: "🎉 Stay tuned for upcoming events! Check our website for the latest updates.",
    },
    admissions: {
      procedure:
        "📝 The admission procedure for B.Tech programs is based on state-level entrance exams. For more details, visit https://nnrg.edu.in/admissions/",
      eligibility:
        "To be eligible for B.Tech programs, students must have completed 10+2 with Mathematics, Physics, and Chemistry. For more specific eligibility criteria, please visit our website.",
    },
    college: {
      "is nnrg good":
        "NNRG is recognized as one of the top engineering colleges in Hyderabad. We have excellent faculty, state-of-the-art infrastructure, and strong industry connections. Our placement record is impressive with students being placed in leading companies. We also focus on holistic development through various extracurricular activities.",
      "about nnrg":
        "NNRG is a premier educational institution established in 2009, offering various undergraduate and postgraduate programs in engineering, management, and computer applications. We are approved by AICTE and affiliated to JNTUH. Our campus spans over 25 acres with modern facilities including well-equipped laboratories, digital library, sports complex, and more.",
      "how is nnrg":
        "NNRG is known for its quality education, experienced faculty, and excellent infrastructure. We have a strong focus on both academic excellence and practical learning. Our placement record is impressive, with students being placed in leading companies across various sectors. We also encourage research and innovation through various initiatives.",
      "where is nnrg":
        "NNRG is located in Chowdariguda, Ghatkesar, Hyderabad, Telangana, India. The campus is approximately 25 km from the city center and is well-connected by public transport.",
      "nnrg ranking":
        "NNRG is consistently ranked among the top engineering colleges in Telangana. We have received various accolades for our academic excellence, infrastructure, and placement records. Our commitment to quality education has earned us recognition from various educational bodies.",
    },
    departments: {
      cse: "The Department of Computer Science Engineering (CSE) at NNRG is headed by Dr. Srinivas Rao. The department offers B.Tech in CSE, AI & ML, and Data Science. The department has state-of-the-art labs and experienced faculty members who are dedicated to providing quality education to students.",
      ece: "The Department of Electronics & Communication Engineering (ECE) at NNRG is headed by Dr. Ramesh Kumar. The department offers B.Tech and M.Tech programs in ECE. The department has well-equipped laboratories for practical training and research.",
      eee: "The Department of Electrical & Electronics Engineering (EEE) at NNRG is headed by Dr. Suresh Babu. The department offers B.Tech in EEE with a focus on power systems, control systems, and electrical machines.",
      mech: "The Department of Mechanical Engineering at NNRG is headed by Dr. Venkatesh. The department offers B.Tech in Mechanical Engineering with specializations in thermal engineering, design engineering, and manufacturing engineering.",
      civil:
        "The Department of Civil Engineering at NNRG is headed by Dr. Rajesh. The department offers B.Tech in Civil Engineering with a focus on structural engineering, transportation engineering, and environmental engineering.",
      mba: "The Department of Master of Business Administration (MBA) at NNRG is headed by Dr. Lakshmi. The department offers MBA program with specializations in finance, marketing, human resources, and operations management.",
      mca: "The Department of Master of Computer Applications (MCA) at NNRG is headed by Dr. Prasad. The department offers MCA program with a focus on software development, database management, and web technologies.",
    },
    hod: {
      cse: "Dr. Srinivas Rao is the Head of Department (HOD) for Computer Science Engineering at NNRG. He has over 15 years of experience in teaching and research in the field of computer science.",
      ece: "Dr. Ramesh Kumar is the Head of Department (HOD) for Electronics & Communication Engineering at NNRG. He has extensive experience in the field of communication systems and signal processing.",
      eee: "Dr. Suresh Babu is the Head of Department (HOD) for Electrical & Electronics Engineering at NNRG. He specializes in power systems and electrical machines.",
      mech: "Dr. Venkatesh is the Head of Department (HOD) for Mechanical Engineering at NNRG. He has expertise in thermal engineering and fluid mechanics.",
      civil:
        "Dr. Rajesh is the Head of Department (HOD) for Civil Engineering at NNRG. He specializes in structural engineering and construction management.",
      mba: "Dr. Lakshmi is the Head of Department (HOD) for Master of Business Administration at NNRG. She has expertise in finance and strategic management.",
      mca: "Dr. Prasad is the Head of Department (HOD) for Master of Computer Applications at NNRG. He specializes in database management systems and software engineering.",
    },
  }

  // Personality responses for general queries with style variations
  const personalityResponses = {
    greetings: {
      formal: {
        hi: "👋 Hello! I'm your friendly NNRG Assistant. How can I help you today?",
        hello: "👋 Hi there! I'm here to assist you. What can I do for you?",
        hey: "👋 Hey! Great to see you. How can I be of help?",
        "good morning": "🌅 Good morning! Hope you're having a great day. How can I assist you?",
        "good afternoon": "🌞 Good afternoon! How may I help you today?",
        "good evening": "🌆 Good evening! How can I be of assistance?",
        bye: "👋 Goodbye! Have a wonderful day ahead! Feel free to return if you have any questions.",
        goodbye: "👋 Goodbye! It was a pleasure assisting you. See you next time!",
        "see you": "👋 See you soon! Don't hesitate to come back if you need any information.",
        "talk to you later": "👋 Looking forward to helping you again. Have a great day!",
      },
      casual: {
        hi: "👋 Hi there! What's up? How can I help you out?",
        hello: "👋 Hey! What can I do for you today?",
        hey: "👋 Hey! What's going on? Need some info?",
        "good morning": "🌅 Morning! Ready for a great day? What do you need help with?",
        "good afternoon": "🌞 Afternoon! What can I help you with?",
        "good evening": "🌆 Evening! What's on your mind?",
        bye: "👋 Later! Come back anytime you need something!",
        goodbye: "👋 Catch you later! Have a good one!",
        "see you": "👋 See ya! Drop by anytime you need help!",
        "talk to you later": "👋 Sure thing! I'll be here when you need me!",
      },
      bro: {
        hi: "👋 Yo bro! What's up? How can I help you out?",
        hello: "👋 Hey bro! What can I do for you today?",
        hey: "👋 Sup bro! What's going on? Need some info?",
        "good morning": "🌅 Morning bro! Ready for a great day? What do you need help with?",
        "good afternoon": "🌞 Afternoon bro! What can I help you with?",
        "good evening": "🌆 Evening bro! What's on your mind?",
        bye: "👋 Later bro! Come back whenever you need anything!",
        goodbye: "👋 Peace out bro! Have a good one!",
        "see you": "👋 Catch you on the flip side, bro!",
        "talk to you later": "👋 For sure, bro! I'll be right here when you need me!",
      },
    },
    personality: {
      formal: {
        "how are you":
          "I'm doing great, thank you for asking! I'm always excited to help students and visitors learn more about NNRG. How can I assist you today?",
        "who are you":
          "I'm the NNRG Virtual Assistant, your friendly guide to everything about our institution. I was developed by CSE B 4th year students to help you with information about programs, admissions, campus life, and more!",
        "what can you do":
          "I can help you with various things like:\n\n- Information about our programs\n- Admission details\n- Fee structure\n- Campus facilities\n- And much more!\n\nWhat would you like to know?",
        "thank you": "You're welcome! 😊 Let me know if there's anything else you need help with!",
        thanks: "Happy to help! 😊 Don't hesitate to ask if you have more questions!",
        "who developed you":
          "I was developed by the CSE B 4th year students as their project. They created me to help students and visitors get information about NNRG easily.",
        "who created you":
          "I'm a creation of CSE B 4th year students. They developed me as part of their project to provide information about NNRG in an interactive way.",
        "your name":
          "I'm the NNRG Virtual Assistant. I don't have a personal name, but you can think of me as your friendly guide to all things NNRG!",
      },
      casual: {
        "how are you": "Doing great! Always happy to chat about NNRG. What's on your mind?",
        "who are you":
          "I'm your NNRG chatbot buddy! I was made by CSE B 4th year students to help with anything about the college - courses, campus life, you name it!",
        "what can you do":
          "I can hook you up with info on:\n\n- Programs we offer\n- How to apply\n- Fees and costs\n- Campus stuff\n- Lots more!\n\nWhat do you want to know?",
        "thank you": "No problem! 😊 Hit me up if you need anything else!",
        thanks: "Anytime! 😊 Just ask if you need more info!",
        "who developed you":
          "I was created by the CSE B 4th year students. They built me to help people learn about NNRG in a fun way!",
        "who created you": "The awesome CSE B 4th year students made me as their project. Cool, right?",
        "your name":
          "Just call me your NNRG assistant! I'm here to make finding info about the college super easy for you.",
      },
      bro: {
        "how are you": "All good bro! Ready to help you with NNRG stuff. What's up?",
        "who are you":
          "I'm your NNRG chatbot bro! Made by CSE B 4th year students to help with anything about the college - courses, campus life, whatever you need!",
        "what can you do":
          "Bro, I got you covered with:\n\n- Programs we offer\n- How to apply\n- Fees and costs\n- Campus stuff\n- Lots more!\n\nWhat do you wanna know?",
        "thank you": "No worries bro! 😊 I'm here if you need anything else!",
        thanks: "Anytime bro! 😊 Just ask if you need more info!",
        "who developed you":
          "The CSE B 4th year students created me, bro! They built me to make college info easy to get.",
        "who created you": "Some cool CSE B 4th year students made me as their project, bro!",
        "your name": "No special name bro, just your NNRG assistant! Here to help you navigate college stuff!",
      },
    },
  }

  // Enhanced synonym dictionary for common terms with more variations for syllabus
  const synonymDictionary = {
    syllabus: [
      "curriculum",
      "course content",
      "subjects",
      "course structure",
      "program outline",
      "course",
      "courses",
      "syllabus",
      "sylabus",
      "sylabes",
      "sylabs",
      "syllabes",
      "ciriculum",
      "curiculum",
      "course plan",
      "study plan",
      "subject details",
      "course details",
      "program details",
      "subject outline",
      "course outline",
      "program structure",
      "academic plan",
      "study outline",
      "academic outline",
      "academic structure",
      "academic content",
      "study content",
      "subject content",
      "subject structure",
      "course syllabus",
      "subject syllabus",
      "program syllabus",
    ],
    transport: ["transportation", "travel", "commute", "vehicle", "commuting"],
    // Removed "bus" as a synonym for transport to avoid confusion with syllabus
    cafeteria: ["canteen", "food court", "mess", "dining", "food", "eat", "restaurant"],
    library: ["books", "study room", "reading", "reference", "journals"],
    sports: ["games", "athletics", "physical activities", "play", "sport", "exercise", "fitness"],
    hostel: ["accommodation", "dorm", "dormitory", "residence", "living", "stay"],
    admission: ["enrollment", "joining", "application", "apply", "register", "registration"],
    fee: ["fees", "cost", "payment", "expense", "tuition", "price"],
    placement: ["job", "career", "employment", "recruitment", "hiring", "internship", "opportunity"],
    faculty: ["professor", "teacher", "staff", "lecturer", "instructor", "teaching staff"],
    exam: ["examination", "test", "assessment", "evaluation", "quiz"],
    scholarship: ["financial aid", "grant", "fellowship", "funding", "assistance"],
    event: ["function", "program", "celebration", "fest", "activity", "competition", "workshop", "seminar"],
    lab: ["laboratory", "workshop", "practical", "experiment", "research facility"],
    "anti-ragging": ["ragging", "bullying", "harassment", "safety", "security", "protection"],
    "medical facilities": ["health center", "clinic", "hospital", "doctor", "nurse", "healthcare", "medical"],
    bus: ["buses", "college bus", "transport bus", "shuttle"],
    director: ["director", "head of institution", "college director"],
    principal: ["principal", "college principal", "head of college"],
    hod: ["hod", "head of department", "department head", "department chair"],
    departments: ["departments", "branches", "streams", "disciplines", "specializations"],
  }

  // Subject abbreviations and common misspellings dictionary
  const subjectAbbreviations = {
    os: "operating systems",
    dbms: "dbms",
    cn: "computer networks",
    dsa: "data structures",
    ds: "data structures",
    algo: "algorithms",
    ml: "machine learning",
    ai: "artificial intelligence",
    se: "software engineering",
    wt: "web technologies",
    cd: "compiler design",
    cns: "cryptography",
    crypto: "cryptography",
    m1: "m1",
    m2: "m2",
    maths1: "m1",
    maths2: "m2",
    mathematics1: "m1",
    mathematics2: "m2",
    math1: "m1",
    math2: "m2",
    chem: "chem",
    chemistry: "chemistry",
    physics: "physics",
    phy: "physics",
    flat: "formal languages",
    toc: "formal languages",
    automata: "formal languages",
    "formal languages": "formal languages",
    cs: "computer science",
    cse: "computer science",
    ece: "electronics",
    electronics: "electronics",
    cc: "cloud computing",
    cloud: "cloud computing",
    ds: "data science",
    "data science": "data science",
    algorithms: "algorithms",
    daa: "algorithms",
  }

  // Department abbreviations
  const departmentAbbreviations = {
    cse: "cse",
    cs: "cse",
    "computer science": "cse",
    computer: "cse",
    ece: "ece",
    electronics: "ece",
    communication: "ece",
    eee: "eee",
    electrical: "eee",
    mech: "mech",
    mechanical: "mech",
    civil: "civil",
    mba: "mba",
    business: "mba",
    management: "mba",
    mca: "mca",
    "computer applications": "mca",
  }

  // Quick links - Updated as per screenshot
  const quickLinks = [
    { id: "ug-programs", text: "UG Programs", emoji: "🎓" },
    { id: "pg-programs", text: "PG Programs", emoji: "📚" },
    { id: "fee-structure", text: "Fee Structure", emoji: "💰" },
    { id: "campus-life", text: "Campus Life", emoji: "🏫" },
    { id: "contact-us", text: "Contact Us", emoji: "📞" },
    { id: "admissions", text: "Admissions", emoji: "📝" },
    { id: "placements", text: "Placements", emoji: "💼" },
  ]

  // Detect user's communication style
  const detectUserStyle = (query) => {
    const lowercaseQuery = query.toLowerCase()

    // Check for casual/informal language markers
    if (lowercaseQuery.includes("bro") || lowercaseQuery.includes("dude") || lowercaseQuery.includes("yo")) {
      return "bro"
    } else if (
      lowercaseQuery.includes("sup") ||
      lowercaseQuery.includes("hey") ||
      lowercaseQuery.includes("hiya") ||
      lowercaseQuery.includes("wassup") ||
      lowercaseQuery.includes("what's up") ||
      lowercaseQuery.includes("whats up")
    ) {
      return "casual"
    }

    return "formal" // Default to formal
  }

  // Get personality response based on user's style
  const getPersonalityResponse = (query) => {
    const lowercaseQuery = query.toLowerCase()

    // Update user style based on their query
    const detectedStyle = detectUserStyle(query)
    if (detectedStyle !== userStyle) {
      setUserStyle(detectedStyle)
    }

    // Check greetings - Fixed to properly respond to hi/hello/bye
    for (const [key, value] of Object.entries(personalityResponses.greetings[userStyle])) {
      if (lowercaseQuery === key || lowercaseQuery.includes(key)) {
        return value
      }
    }

    // Check personality queries
    for (const [key, value] of Object.entries(personalityResponses.personality[userStyle])) {
      if (lowercaseQuery.includes(key)) {
        return value
      }
    }

    return null
  }

  // Enhanced function to check if query is about syllabus
  const isSyllabusQuery = (query) => {
    const lowercaseQuery = query.toLowerCase()
    const syllabusKeywords = synonymDictionary["syllabus"]

    // Special handling for syllabus
    if (syllabusKeywords.some((keyword) => lowercaseQuery.includes(keyword))) {
      // Make sure it's not asking about bus services when mentioning syllabus
      if (
        lowercaseQuery.includes("bus") &&
        (lowercaseQuery.includes("transport") ||
          lowercaseQuery.includes("travel") ||
          lowercaseQuery.includes("timing") ||
          lowercaseQuery.includes("route") ||
          lowercaseQuery.includes("service"))
      ) {
        return false
      }
      return true
    }

    // Check for subject abbreviations that might indicate a syllabus query
    for (const [abbr, subject] of Object.entries(subjectAbbreviations)) {
      if (lowercaseQuery.includes(abbr)) {
        // Check if it's likely a syllabus query by looking for context
        if (
          lowercaseQuery.includes("syllabus") ||
          lowercaseQuery.includes("course") ||
          lowercaseQuery.includes("subject") ||
          lowercaseQuery.includes("curriculum") ||
          lowercaseQuery.includes("teach") ||
          lowercaseQuery.includes("learn") ||
          lowercaseQuery.includes("study") ||
          lowercaseQuery.includes("content") ||
          lowercaseQuery.includes("topics") ||
          lowercaseQuery.includes("units") ||
          lowercaseQuery.includes("chapters") ||
          lowercaseQuery.includes("what is in") ||
          lowercaseQuery.includes("what's in") ||
          lowercaseQuery.includes("tell me about") ||
          lowercaseQuery.includes("show me") ||
          lowercaseQuery.includes("explain")
        ) {
          return true
        }
      }
    }

    return false
  }

  // Check if query is about transportation/buses
  const isTransportQuery = (query) => {
    const lowercaseQuery = query.toLowerCase()

    // Check for bus with transport context
    if (
      lowercaseQuery.includes("bus") &&
      (lowercaseQuery.includes("transport") ||
        lowercaseQuery.includes("travel") ||
        lowercaseQuery.includes("timing") ||
        lowercaseQuery.includes("route") ||
        lowercaseQuery.includes("service") ||
        !lowercaseQuery.includes("syllabus"))
    ) {
      return true
    }

    // Check for transport keywords
    return synonymDictionary["transport"].some((keyword) => lowercaseQuery.includes(keyword))
  }

  // Check if query is about college personnel (director, principal, HODs)
  const isPersonnelQuery = (query) => {
    const lowercaseQuery = query.toLowerCase()

    // Check for director or principal
    if (
      (lowercaseQuery.includes("director") ||
        lowercaseQuery.includes("principal") ||
        lowercaseQuery.includes("chairman")) &&
      lowercaseQuery.includes("nnrg")
    ) {
      return true
    }

    // Check for HOD queries
    if (
      (lowercaseQuery.includes("hod") ||
        lowercaseQuery.includes("head of department") ||
        lowercaseQuery.includes("department head")) &&
      (lowercaseQuery.includes("who") || lowercaseQuery.includes("name"))
    ) {
      return true
    }

    // Check for department queries
    if (
      lowercaseQuery.includes("department") &&
      (lowercaseQuery.includes("how many") || lowercaseQuery.includes("what are") || lowercaseQuery.includes("list"))
    ) {
      return true
    }

    return false
  }

  // Get personnel information based on query
  const getPersonnelInfo = (query) => {
    const lowercaseQuery = query.toLowerCase()

    // Check for director query
    if (lowercaseQuery.includes("director") && lowercaseQuery.includes("nnrg")) {
      return knowledgeBase.about.director
    }

    // Check for principal query
    if (lowercaseQuery.includes("principal") && lowercaseQuery.includes("nnrg")) {
      return knowledgeBase.about.principal
    }

    // Check for chairman query
    if (lowercaseQuery.includes("chairman") && lowercaseQuery.includes("nnrg")) {
      return knowledgeBase.about.chairman
    }

    // Check for departments query
    if (
      (lowercaseQuery.includes("department") || lowercaseQuery.includes("departments")) &&
      (lowercaseQuery.includes("how many") || lowercaseQuery.includes("what are") || lowercaseQuery.includes("list"))
    ) {
      return knowledgeBase.about.departments
    }

    // Check for HOD queries
    if (
      lowercaseQuery.includes("hod") ||
      lowercaseQuery.includes("head of department") ||
      lowercaseQuery.includes("department head")
    ) {
      // Check for specific department
      for (const [abbr, dept] of Object.entries(departmentAbbreviations)) {
        if (lowercaseQuery.includes(abbr)) {
          return knowledgeBase.hod[dept]
        }
      }

      // If no specific department mentioned, return a general response
      return "Please specify which department's HOD you're asking about. We have HODs for CSE, ECE, EEE, Mechanical, Civil, MBA, and MCA departments."
    }

    return null
  }

  // Enhanced function to get syllabus information from PDF knowledge base
  const getSyllabusInfo = (query) => {
    const lowercaseQuery = query.toLowerCase()

    // First check for subject abbreviations
    for (const [abbr, fullSubject] of Object.entries(subjectAbbreviations)) {
      if (lowercaseQuery.includes(abbr)) {
        // If we have this subject in our knowledge base, return it
        if (pdfKnowledgeBase.syllabusData[fullSubject]) {
          return pdfKnowledgeBase.syllabusData[fullSubject]
        }
      }
    }

    // Check for specific course mentions
    for (const [course, content] of Object.entries(pdfKnowledgeBase.syllabusData)) {
      if (lowercaseQuery.includes(course)) {
        return content
      }
    }

    // If no specific course is mentioned but it's a syllabus query
    if (isSyllabusQuery(query)) {
      // Try to extract potential subject names from the query
      const words = lowercaseQuery.split(/\s+/)
      const potentialSubjects = words.filter(
        (word) =>
          word.length > 2 &&
          ![
            "syllabus",
            "course",
            "subject",
            "about",
            "tell",
            "show",
            "what",
            "the",
            "for",
            "and",
            "can",
            "you",
            "me",
            "please",
          ].includes(word),
      )

      // If we found potential subjects, try to match them with our knowledge base
      if (potentialSubjects.length > 0) {
        for (const subject of potentialSubjects) {
          for (const [course, content] of Object.entries(pdfKnowledgeBase.syllabusData)) {
            if (course.includes(subject) || subject.includes(course)) {
              return content
            }
          }
        }
      }

      return "I can provide syllabus information for various courses like Cloud Computing, Data Science, Computer Science, Electronics, Data Structures, Artificial Intelligence, Operating Systems, DBMS, Web Technologies, Compiler Design, Cryptography, Mathematics (M1/M2), Chemistry, Physics, and more. Please specify which course syllabus you're interested in."
    }

    return null
  }

  // Check if query is related to NNRG
  const isNNRGRelated = (query) => {
    const lowercaseQuery = query.toLowerCase()

    // Check if query contains NNRG
    if (lowercaseQuery.includes("nnrg") || lowercaseQuery.includes("nalla") || lowercaseQuery.includes("college")) {
      return true
    }

    // Check if query is about education or college-related topics
    const educationKeywords = [
      "course",
      "program",
      "admission",
      "fee",
      "campus",
      "faculty",
      "student",
      "class",
      "lecture",
      "exam",
      "semester",
      "degree",
      "syllabus",
      "library",
      "hostel",
      "placement",
      "scholarship",
      "professor",
      "teacher",
      "study",
      "education",
      "university",
      "college",
      "academic",
      "school",
      "department",
      "director",
      "principal",
      "hod",
      "chairman",
    ]

    // Check if query contains any education keywords
    for (const keyword of educationKeywords) {
      if (lowercaseQuery.includes(keyword)) {
        return true
      }
    }

    // Check if query is about any topic in our knowledge base
    for (const category in knowledgeBase) {
      for (const key in knowledgeBase[category]) {
        if (lowercaseQuery.includes(key)) {
          return true
        }
      }
    }

    // Check synonyms
    for (const [term, synonyms] of Object.entries(synonymDictionary)) {
      if (synonyms.some((synonym) => lowercaseQuery.includes(synonym))) {
        return true
      }
    }

    // Check for basic greetings - consider them related to allow greeting responses
    const basicGreetings = [
      "hi",
      "hello",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "bye",
      "goodbye",
      "thanks",
      "thank you",
    ]
    if (basicGreetings.some((greeting) => lowercaseQuery === greeting || lowercaseQuery.includes(greeting))) {
      return true
    }

    // Check for questions about the bot itself
    const botQuestions = ["who are you", "what are you", "what can you do", "how are you", "your name"]
    if (botQuestions.some((question) => lowercaseQuery.includes(question))) {
      return true
    }

    return false
  }

  // Expand query with synonyms for better matching
  const expandQueryWithSynonyms = (query) => {
    const lowercaseQuery = query.toLowerCase()
    let expandedQuery = lowercaseQuery

    // Add synonyms to the query
    for (const [term, synonyms] of Object.entries(synonymDictionary)) {
      for (const synonym of synonyms) {
        if (lowercaseQuery.includes(synonym)) {
          expandedQuery += " " + term // Add the main term
          break
        }
      }
    }

    // Add full subject names for abbreviations
    for (const [abbr, fullSubject] of Object.entries(subjectAbbreviations)) {
      if (lowercaseQuery.includes(abbr)) {
        expandedQuery += " " + fullSubject
      }
    }

    // Add department names for abbreviations
    for (const [abbr, dept] of Object.entries(departmentAbbreviations)) {
      if (lowercaseQuery.includes(abbr)) {
        expandedQuery += " " + dept
      }
    }

    return expandedQuery
  }

  // Find rule-based answer using NLP techniques
  const findRuleBasedAnswer = (query) => {
    // Expand query with synonyms
    const expandedQuery = expandQueryWithSynonyms(query)
    const tokens = tokenizer.tokenize(expandedQuery.toLowerCase())
    const stemmedTokens = tokens.map((token) => stemmer.stem(token))

    // First check for personality responses
    const personalityResponse = getPersonalityResponse(query)
    if (personalityResponse) return personalityResponse

    // Check for personnel queries (director, principal, HODs)
    if (isPersonnelQuery(query)) {
      const personnelInfo = getPersonnelInfo(query)
      if (personnelInfo) return personnelInfo
    }

    // Check for department information
    for (const [abbr, dept] of Object.entries(departmentAbbreviations)) {
      if (expandedQuery.includes(abbr) && !expandedQuery.includes("hod") && !expandedQuery.includes("head")) {
        if (knowledgeBase.departments[dept]) {
          return knowledgeBase.departments[dept]
        }
      }
    }

    // Special case handling for syllabus vs transport confusion
    // Check if it's about transportation/buses
    if (isTransportQuery(query)) {
      return knowledgeBase.facilities.transport
    }

    // Check for syllabus queries
    const syllabusInfo = getSyllabusInfo(query)
    if (syllabusInfo) return syllabusInfo

    // Check for date and time queries
    if (expandedQuery.includes("date") || expandedQuery.includes("today")) {
      return knowledgeBase.general.date()
    }

    if (expandedQuery.includes("time") || expandedQuery.includes("now")) {
      return knowledgeBase.general.time()
    }

    // Check for specific facility queries using expanded query
    if (stemmedTokens.some((token) => ["sport", "game", "play", "athlet", "exercis"].includes(token))) {
      return knowledgeBase.facilities.sports
    }

    if (stemmedTokens.some((token) => ["cafeteria", "canteen", "food", "eat", "dining", "meal"].includes(token))) {
      return knowledgeBase.facilities.cafeteria
    }

    if (stemmedTokens.some((token) => ["librari", "book", "read", "studi", "journal"].includes(token))) {
      return knowledgeBase.facilities.library
    }

    if (stemmedTokens.some((token) => ["lab", "laboratori", "workshop", "practic", "experi"].includes(token))) {
      return knowledgeBase.facilities.labs
    }

    if (stemmedTokens.some((token) => ["event", "fest", "celebr", "function", "activ"].includes(token))) {
      return knowledgeBase.events.upcoming
    }

    // Check for anti-ragging and medical facilities
    if (stemmedTokens.some((token) => ["ragging", "bully", "harass", "safety", "secur"].includes(token))) {
      return knowledgeBase.facilities["anti-ragging"]
    }

    if (stemmedTokens.some((token) => ["medic", "health", "doctor", "clinic", "hospital"].includes(token))) {
      return knowledgeBase.facilities["medical facilities"]
    }

    if (stemmedTokens.some((token) => ["hostel", "accommod", "dorm", "resid", "stay"].includes(token))) {
      return knowledgeBase.facilities["hostel accommodation"]
    }

    if (stemmedTokens.some((token) => ["wifi", "internet", "connect", "network"].includes(token))) {
      return knowledgeBase.facilities["wi-fi campus"]
    }

    // Check for specific college queries
    for (const [key, value] of Object.entries(knowledgeBase.college)) {
      if (expandedQuery.includes(key)) {
        return value
      }
    }

    // Check for specific queries
    if (expandedQuery.includes("dean")) {
      return knowledgeBase.about.dean
    }

    // More specific check for NNRG to avoid returning the general info for every query with "nnrg"
    if (
      expandedQuery === "nnrg" ||
      expandedQuery === "about nnrg" ||
      expandedQuery === "tell me about nnrg" ||
      expandedQuery === "what is nnrg"
    ) {
      return knowledgeBase.about.nnrg
    }

    // Check categories
    for (const categoryKey in knowledgeBase) {
      const category = knowledgeBase[categoryKey]
      for (const [key, value] of Object.entries(category)) {
        if (expandedQuery.includes(key)) {
          if (typeof value === "function") {
            return value()
          }
          return value
        }
      }
    }

    // Additional specific checks
    if (stemmedTokens.some((token) => ["program", "cours", "degre", "studi"].includes(token))) {
      return knowledgeBase.academics["ug programs"]
    }

    if (stemmedTokens.some((token) => ["fee", "cost", "tuition", "payment", "expens"].includes(token))) {
      return knowledgeBase.academics["fee structure"]
    }

    // Check previous conversations for similar queries
    if (conversationContext.length > 0) {
      for (const prevConversation of conversationContext) {
        const similarity = calculateSimilarity(expandedQuery, prevConversation.query)
        if (similarity > 0.7) {
          // Threshold for similarity
          return prevConversation.response
        }
      }
    }

    return null
  }

  // Calculate similarity between two strings (simple implementation)
  const calculateSimilarity = (str1, str2) => {
    const tokens1 = tokenizer.tokenize(str1.toLowerCase())
    const tokens2 = tokenizer.tokenize(str2.toLowerCase())

    const stemmed1 = tokens1.map((token) => stemmer.stem(token))
    const stemmed2 = tokens2.map((token) => stemmer.stem(token))

    // Count matching tokens
    let matches = 0
    for (const token of stemmed1) {
      if (stemmed2.includes(token)) {
        matches++
      }
    }

    // Calculate Jaccard similarity
    const union = new Set([...stemmed1, ...stemmed2]).size
    return union === 0 ? 0 : matches / union
  }

  // Function to fetch data from the website - simplified for client-side
  const fetchWebsiteData = async (query) => {
    try {
      // Since we can't use cheerio on the client side, we'll return mock data based on the query
      const expandedQuery = expandQueryWithSynonyms(query)

      if (expandedQuery.includes("sports")) {
        return knowledgeBase.facilities.sports
      } else if (expandedQuery.includes("cafeteria") || expandedQuery.includes("canteen")) {
        return knowledgeBase.facilities.cafeteria
      } else if (expandedQuery.includes("library")) {
        return knowledgeBase.facilities.library
      } else if (expandedQuery.includes("labs") || expandedQuery.includes("laboratory")) {
        return knowledgeBase.facilities.labs
      } else if (expandedQuery.includes("events")) {
        return knowledgeBase.events.upcoming
      } else if (expandedQuery.includes("programs") || expandedQuery.includes("courses")) {
        return knowledgeBase.academics["ug programs"]
      } else if (expandedQuery.includes("anti-ragging") || expandedQuery.includes("ragging")) {
        return knowledgeBase.facilities["anti-ragging"]
      } else if (expandedQuery.includes("medical") || expandedQuery.includes("health")) {
        return knowledgeBase.facilities["medical facilities"]
      } else if (expandedQuery.includes("hostel") || expandedQuery.includes("accommodation")) {
        return knowledgeBase.facilities["hostel accommodation"]
      } else if (expandedQuery.includes("wifi") || expandedQuery.includes("internet")) {
        return knowledgeBase.facilities["wi-fi campus"]
      } else {
        // Default response for website data
        return `Based on the NNRG website: For more detailed information about ${query}, please visit https://nnrg.edu.in/`
      }
    } catch (error) {
      console.error("Error fetching website data:", error)
      return null
    }
  }

  // Helper function to format output in a readable way
  const formatOutput = (title, content) => {
    return `${title}\n\n${content}\n\nThis information was retrieved from the NNRG website.`
  }

  // Function to get response from OpenAI
  const getOpenAIResponse = async (query) => {
    try {
      // Create a system message with context about NNRG
      const systemMessage = `
        You are an AI assistant for NNRG (Nalla Narasimha Reddy Education Society's Group of Institutions), 
        a premier educational institution in Hyderabad, India. 
        Provide helpful, accurate, and concise information about the college.
        Format your responses in a readable way with line breaks between paragraphs.
        If you don't know the answer, suggest the user to visit the official website or contact the college directly.
        Only answer questions related to NNRG or education. If asked about unrelated topics, politely explain you were developed specifically for NNRG-related queries.
        If asked who created you or who developed you, mention that you were developed by CSE B 4th year students.
        ${
          userStyle === "bro"
            ? 'Use casual, friendly language with terms like "bro" in your responses.'
            : userStyle === "casual"
              ? "Use casual, friendly language in your responses."
              : "Use professional, helpful language in your responses."
        }
      `

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemMessage },
          ...conversationContext.slice(-5).map((item) => ({ role: "user", content: item.query })),
          ...conversationContext.slice(-5).map((item) => ({ role: "assistant", content: item.response })),
          { role: "user", content: query },
        ],
        max_tokens: 500,
        temperature: 0.7,
      })

      const result = completion.choices[0].message.content
      return result
    } catch (error) {
      console.error("Error calling OpenAI API:", error)
      return null
    }
  }

  // Format message text with links and line breaks
  const formatMessageText = (text) => {
    // Replace URLs with clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const withLinks = text.replace(
      urlRegex,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    )

    // Ensure line breaks are preserved
    return withLinks.replace(/\n/g, "<br>")
  }

  // Reset chat
  const resetChat = () => {
    setMessages([
      {
        type: "bot",
        text: "👋 Hi! I'm your NNRG Virtual Assistant. I'm here to help with information about our college, programs, facilities, and more. How can I help you today?",
      },
    ])
    setConversationContext([])
    setUserStyle("formal")
  }

  // Get a random greeting response
  const getRandomGreeting = (style, type) => {
    const greetings = personalityResponses.greetings[style]
    const options = Object.values(greetings).filter((g) =>
      type === "hello" ? !g.includes("bye") && !g.includes("later") : g.includes("bye") || g.includes("later"),
    )

    return options[Math.floor(Math.random() * options.length)]
  }

  // Handle sending messages
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // Add user message
    const updatedMessages = [...messages, { type: "user", text: inputValue.trim() }]
    setMessages(updatedMessages)
    setInputValue("")
    setIsLoading(true)
    setIsThinking(true)

    try {
      // Check if query is related to NNRG
      if (!isNNRGRelated(inputValue.trim())) {
        const offTopicResponse =
          userStyle === "bro"
            ? "Sorry bro, I was built specifically to answer questions about NNRG college. Try asking me about our programs, campus, or facilities instead!"
            : userStyle === "casual"
              ? "Sorry, I was built specifically to answer questions about NNRG college. Try asking me about our programs, campus, or facilities instead!"
              : "I apologize, but I was developed specifically to provide information about NNRG college. Please feel free to ask me about our academic programs, campus facilities, admissions process, or any other NNRG-related topics."

        setMessages((prev) => [...prev, { type: "bot", text: offTopicResponse }])
        setIsLoading(false)
        setIsThinking(false)
        return
      }

      // First try to get a rule-based answer
      let botResponse = findRuleBasedAnswer(inputValue.trim())

      // If no rule-based answer, try to get data from website
      if (!botResponse) {
        const websiteData = await fetchWebsiteData(inputValue.trim())
        if (websiteData) {
          botResponse = websiteData
        }
      }

      // If still no answer, use OpenAI
      if (!botResponse) {
        const aiResponse = await getOpenAIResponse(inputValue.trim())
        if (aiResponse) {
          botResponse = aiResponse
        } else {
          // Fallback response if all else fails
          botResponse =
            userStyle === "bro"
              ? "I understand you're asking about that, bro. While I don't have specific information right now, you can find details on our website at https://nnrg.edu.in/ or contact our office directly."
              : userStyle === "casual"
                ? "I understand you're asking about that. While I don't have specific information right now, you can find details on our website at https://nnrg.edu.in/ or contact our office directly."
                : "I understand you're inquiring about that topic. While I don't have specific information at this moment, you can find comprehensive details on our official website at https://nnrg.edu.in/ or contact our administrative office directly for personalized assistance."
        }
      }

      // Add bot response
      setMessages((prev) => [...prev, { type: "bot", text: botResponse }])

      // Update conversation context for learning
      setConversationContext((prev) => [
        ...prev,
        {
          query: inputValue.trim(),
          response: botResponse,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("Error getting response:", error)
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "I'm having trouble connecting right now. Please try again later or visit our website at https://nnrg.edu.in/ for information.",
        },
      ])
    } finally {
      setIsLoading(false)
      setIsThinking(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isLoading && inputValue.trim()) {
      sendMessage()
    }
  }

  // Handle quick link clicks
  const handleQuickLink = async (linkId) => {
    let queryText = ""
    let directAnswer = null

    switch (linkId) {
      case "ug-programs":
        queryText = "What UG programs does NNRG offer?"
        directAnswer = knowledgeBase.academics["ug programs"]
        break
      case "pg-programs":
        queryText = "What PG programs does NNRG offer?"
        directAnswer = knowledgeBase.academics["pg programs"]
        break
      case "fee-structure":
        queryText = "What is the fee structure?"
        directAnswer = knowledgeBase.academics["fee structure"]
        break
      case "campus-life":
        queryText = "Tell me about campus life"
        directAnswer = knowledgeBase.facilities.campus
        break
      case "contact-us":
        queryText = "How can I contact NNRG?"
        directAnswer = knowledgeBase.general.contact
        break
      case "admissions":
        queryText = "What is the admission procedure?"
        directAnswer = knowledgeBase.admissions.procedure
        break
      case "placements":
        queryText = "Tell me about placements"
        directAnswer = knowledgeBase.facilities.placements
        break
      default:
        queryText = linkId
    }

    setMessages((prev) => [...prev, { type: "user", text: queryText }])
    setIsThinking(true)

    // Simulate processing delay
    setTimeout(() => {
      setMessages((prev) => [...prev, { type: "bot", text: directAnswer }])
      setIsThinking(false)

      // Update conversation context
      setConversationContext((prev) => [
        ...prev,
        {
          query: queryText,
          response: directAnswer,
          timestamp: new Date().toISOString(),
        },
      ])
    }, 500)
  }

  return (
    <>
      {/* Chat Widget */}
      <div className={`chat-widget ${isChatOpen ? "chat-open" : "chat-hidden"}`} ref={chatWidgetRef}>
        {/* Chat Header */}
        <div className="chat-header">
          <div className="header-content">
            <div className="avatar">
              <span className="avatar-text">NN</span>
            </div>
            <div className="header-text">
              <span className="header-title">NNRG Assistant</span>
              <span className="header-status">Online</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-button" title="Reset conversation" onClick={resetChat}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                <path d="M16 21h5v-5"></path>
              </svg>
            </button>
            <button className="icon-button" onClick={() => setIsChatOpen(false)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Links - Updated as per screenshot */}
        <div className="quick-links">
          {quickLinks.map((link) => (
            <button key={link.id} className="quick-link-button" onClick={() => handleQuickLink(link.id)}>
              <span className="quick-link-icon">{link.emoji}</span>
              <span>{link.text}</span>
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="chat-messages" ref={chatBodyRef}>
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              {message.type === "bot" && (
                <div className="bot-avatar">
                  <span className="bot-avatar-text">NN</span>
                </div>
              )}
              <div className="message-content" dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }} />
            </div>
          ))}

          {isThinking && (
            <div className="message bot">
              <div className="bot-avatar">
                <span className="bot-avatar-text">NN</span>
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Footer */}
        <div className="chat-footer">
          <form onSubmit={handleSubmit} className="input-container">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button className="send-button" type="submit" disabled={!inputValue.trim() || isLoading}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z"></path>
                <path d="M22 2 11 13"></path>
              </svg>
            </button>
          </form>
          <p className="disclaimer">
            This AI assistant provides general information. For specific inquiries, please contact NNRG directly.
          </p>
        </div>
      </div>

      {/* Chat Toggle Button with Message Bubble - Always visible */}
      <div className="chat-toggle-container">
        {!isChatOpen && <div className="chat-bubble">👋 Hi! How can I help you today?</div>}
        <button className="chat-toggle-btn" onClick={() => setIsChatOpen(!isChatOpen)} aria-label="Toggle chat">
          <div className="chat-toggle-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <span className="chat-toggle-pulse"></span>
        </button>
      </div>
    </>
  )
}

export default App

