import type { ChapterNote, DailyGoal, QuestionItem, SyllabusSubject } from '../types/studybook';

export const DEFAULT_DAILY_GOALS: DailyGoal[] = [
  { id: 'goal_tech', text: '2h Technical Study', done: false },
  { id: 'goal_pyq', text: '50 PYQs Solved', done: false },
  { id: 'goal_reasoning', text: '30m Reasoning & Roots', done: false },
];

export const ENGINEERING_QUOTES: { text: string; attribution: string }[] = [
  {
    text: 'Precision in fundamentals beats last-minute memorization in every JE merit list.',
    attribution: 'SSC JE & RRB JE Discipline',
  },
  {
    text: 'One solved mistake book question saves 1.25 marks on exam day.',
    attribution: 'Negative Marking Principle',
  },
  {
    text: 'Revisit every mastered chapter at 3, 7, and 21 days until formulas feel automatic.',
    attribution: 'Spaced Repetition Rule',
  },
  {
    text: 'Strong engineers build load paths; top rankers build daily study habits.',
    attribution: 'Structural Consistency',
  },
  {
    text: 'IS codes, standard units, and clean free-body diagrams win technical papers.',
    attribution: 'Core Engineering Maxim',
  },
  {
    text: 'Speed in Reasoning buys calm thinking time for technical numericals.',
    attribution: 'CBT Time Strategy',
  },
];

export const SYLLABUS_SUBJECTS: SyllabusSubject[] = [
  // ==================== CIVIL ENGINEERING ====================
  {
    id: 'civ_bm',
    name: 'Building Materials',
    shortName: 'BMC',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_bm_1', title: 'Stones & Quarrying Characteristics', weightage: 'High' },
      { id: 'civ_bm_2', title: 'Bricks, Clay Products & Kiln Tests', weightage: 'High' },
      { id: 'civ_bm_3', title: 'Cement: Bogue Compounds, Grades & Lab Tests (IS 4031)', weightage: 'High' },
      { id: 'civ_bm_4', title: 'Lime, Mortar & Pozzolanic Materials', weightage: 'Medium' },
      { id: 'civ_bm_5', title: 'Timber: Defects, Seasoning & Preservation', weightage: 'High' },
      { id: 'civ_bm_6', title: 'Paints, Varnishes, Bitumen & Asphalt', weightage: 'Medium' },
    ],
  },
  {
    id: 'civ_ecv',
    name: 'Estimating, Costing & Valuation',
    shortName: 'Estimating',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_ecv_1', title: 'Units of Measurement & Deductions (IS 1200)', weightage: 'High' },
      { id: 'civ_ecv_2', title: 'Types of Estimates: Plinth Area, Cube Rate & Detailed', weightage: 'High' },
      { id: 'civ_ecv_3', title: 'Analysis of Rates, Task Work & Earthwork Lead/Lift', weightage: 'High' },
      { id: 'civ_ecv_4', title: 'Valuation, Depreciation, Sinking Fund & Capitalized Value', weightage: 'High' },
      { id: 'civ_ecv_5', title: 'Tenders, Contracts, EMD & Security Deposit', weightage: 'Medium' },
    ],
  },
  {
    id: 'civ_surv',
    name: 'Surveying',
    shortName: 'Surveying',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_surv_1', title: 'Chain & Tape Corrections and Linear Measurement', weightage: 'High' },
      { id: 'civ_surv_2', title: 'Compass Surveying, Bearings & Local Attraction', weightage: 'High' },
      { id: 'civ_surv_3', title: 'Levelling, Curvature/Refraction & Contouring', weightage: 'High' },
      { id: 'civ_surv_4', title: 'Theodolite Traversing & Tacheometry', weightage: 'High' },
      { id: 'civ_surv_5', title: 'Plane Table Surveying & Simple/Transition Curves', weightage: 'Medium' },
    ],
  },
  {
    id: 'civ_soil',
    name: 'Soil Mechanics & Foundation',
    shortName: 'Geotech',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_soil_1', title: 'Phase Relationships, Index Properties & Atterberg Limits', weightage: 'High' },
      { id: 'civ_soil_2', title: 'Soil Classification (ISCS), Permeability & Seepage', weightage: 'High' },
      { id: 'civ_soil_3', title: 'Effective Stress, Compaction & Consolidation', weightage: 'High' },
      { id: 'civ_soil_4', title: 'Shear Strength of Soil & Mohr-Coulomb Criteria', weightage: 'High' },
      { id: 'civ_soil_5', title: 'Earth Pressure Theories (Rankine & Coulomb)', weightage: 'Medium' },
      { id: 'civ_soil_6', title: 'Shallow & Deep Foundations (Terzaghi & Pile Capacity)', weightage: 'High' },
    ],
  },
  {
    id: 'civ_fm',
    name: 'Hydraulics & Fluid Mechanics',
    shortName: 'Hydraulics',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_fm_1', title: 'Fluid Properties, Viscosity & Surface Tension', weightage: 'High' },
      { id: 'civ_fm_2', title: 'Hydrostatics, Manometers & Buoyancy', weightage: 'High' },
      { id: 'civ_fm_3', title: 'Fluid Kinematics, Bernoulli Equation & Venturimeter', weightage: 'High' },
      { id: 'civ_fm_4', title: 'Pipe Flow, Darcy-Weisbach & Boundary Layer', weightage: 'High' },
      { id: 'civ_fm_5', title: 'Open Channel Flow, Specific Energy & Hydraulic Jump', weightage: 'High' },
      { id: 'civ_fm_6', title: 'Turbines, Centrifugal Pumps & Dimensional Analysis', weightage: 'Medium' },
    ],
  },
  {
    id: 'civ_irr',
    name: 'Irrigation & Hydrology',
    shortName: 'Irrigation',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_irr_1', title: 'Crop Water Requirement: Duty, Delta & Base Period', weightage: 'High' },
      { id: 'civ_irr_2', title: 'Canal Design: Kennedy & Lacey Silt Theories', weightage: 'High' },
      { id: 'civ_irr_3', title: 'Waterlogging, Lining & Cross-Drainage Works', weightage: 'Medium' },
      { id: 'civ_irr_4', title: 'Hydrology: Precipitation, Runoff & Unit Hydrograph', weightage: 'Medium' },
    ],
  },
  {
    id: 'civ_trans',
    name: 'Transportation Engineering',
    shortName: 'Highway',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_trans_1', title: 'Geometric Design: SSD, OSD, Superelevation & Extra Widening', weightage: 'High' },
      { id: 'civ_trans_2', title: 'Highway Materials, CBR Test & Pavement Design', weightage: 'High' },
      { id: 'civ_trans_3', title: 'Traffic Engineering, Signals & Intersections', weightage: 'Medium' },
      { id: 'civ_trans_4', title: 'Railway Track Components, Gauges & Cant Deficiency', weightage: 'High' },
    ],
  },
  {
    id: 'civ_env',
    name: 'Environmental Engineering',
    shortName: 'Env Engg',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_env_1', title: 'Water Demand, Population Forecasting & Quality Standards', weightage: 'High' },
      { id: 'civ_env_2', title: 'Water Treatment: Sedimentation, Filtration & Disinfection', weightage: 'High' },
      { id: 'civ_env_3', title: 'Waste Water Characteristics: BOD, COD & Sewer Design', weightage: 'High' },
      { id: 'civ_env_4', title: 'Sewage Treatment (ASP, Trickling Filter) & Air/Noise Pollution', weightage: 'Medium' },
    ],
  },
  {
    id: 'civ_som',
    name: 'SOM & Theory of Structures',
    shortName: 'SOM / TOS',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_som_1', title: 'Elastic Constants, Stress-Strain & Thermal Stresses', weightage: 'High' },
      { id: 'civ_som_2', title: 'Shear Force & Bending Moment Diagrams (SFD / BMD)', weightage: 'High' },
      { id: 'civ_som_3', title: 'Bending & Shear Stress Distribution in Beams', weightage: 'High' },
      { id: 'civ_som_4', title: 'Torsion of Shafts, Springs & Principal Stresses (Mohr Circle)', weightage: 'High' },
      { id: 'civ_som_5', title: 'Deflection of Beams, Columns (Euler/Rankine) & Indeterminacy', weightage: 'High' },
    ],
  },
  {
    id: 'civ_ct',
    name: 'Concrete Technology',
    shortName: 'Concrete',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_ct_1', title: 'Aggregates, Water-Cement Ratio & Hydration', weightage: 'High' },
      { id: 'civ_ct_2', title: 'Workability Tests (Slump, Vee-Bee, Compaction Factor)', weightage: 'High' },
      { id: 'civ_ct_3', title: 'Mix Design (IS 10262), Curing, Creep & Shrinkage', weightage: 'High' },
      { id: 'civ_ct_4', title: 'Admixtures, NDT Tests & Special Concretes', weightage: 'Medium' },
    ],
  },
  {
    id: 'civ_rcc',
    name: 'RCC Design (IS 456:2000)',
    shortName: 'RCC',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_rcc_1', title: 'WSM vs LSM Fundamentals & Partial Safety Factors', weightage: 'High' },
      { id: 'civ_rcc_2', title: 'Singly, Doubly Reinforced & T-Beams Design', weightage: 'High' },
      { id: 'civ_rcc_3', title: 'Shear, Torsion, Bond & Development Length', weightage: 'High' },
      { id: 'civ_rcc_4', title: 'One-Way & Two-Way Slabs, Columns & Footings', weightage: 'High' },
      { id: 'civ_rcc_5', title: 'Pre-Stressed Concrete Losses & Retaining Walls', weightage: 'Medium' },
    ],
  },
  {
    id: 'civ_steel',
    name: 'Steel Design (IS 800:2007)',
    shortName: 'Steel',
    category: 'technical',
    branch: 'civil',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'civ_steel_1', title: 'Riveted, Bolted & Welded Connections', weightage: 'High' },
      { id: 'civ_steel_2', title: 'Tension Members, Lug Angles & Shear Lag', weightage: 'High' },
      { id: 'civ_steel_3', title: 'Compression Members, Lacing, Battening & Column Bases', weightage: 'High' },
      { id: 'civ_steel_4', title: 'Beams, Plate Girders, Roof Trusses & Plastic Analysis', weightage: 'Medium' },
    ],
  },

  // ==================== MECHANICAL ENGINEERING ====================
  {
    id: 'mech_tom',
    name: 'Theory of Machines & Machine Design',
    shortName: 'TOM & MD',
    category: 'technical',
    branch: 'mechanical',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'mech_tom_1', title: 'Kinematic Links, Pairs, Chains & Four-Bar Inversions', weightage: 'High' },
      { id: 'mech_tom_2', title: 'Flywheels, Governors (Watt, Porter, Hartnell) & Gyroscopes', weightage: 'High' },
      { id: 'mech_tom_3', title: 'Gears, Gear Trains, Belts, Ropes & Chains', weightage: 'High' },
      { id: 'mech_tom_4', title: 'Clutches, Brakes, Dynamometers & Balancing', weightage: 'High' },
      { id: 'mech_tom_5', title: 'Riveted/Welded Joints, Shafts, Keys & Bearings', weightage: 'High' },
    ],
  },
  {
    id: 'mech_som',
    name: 'Engineering Mechanics & SOM',
    shortName: 'EM & SOM',
    category: 'technical',
    branch: 'mechanical',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'mech_som_1', title: 'Equilibrium, Friction, Centroid & Moment of Inertia', weightage: 'High' },
      { id: 'mech_som_2', title: 'Stress-Strain Relations, Elastic Constants & Thermal Stress', weightage: 'High' },
      { id: 'mech_som_3', title: 'SFD, BMD, Bending Stress & Shear Stress in Beams', weightage: 'High' },
      { id: 'mech_som_4', title: 'Torsion, Helical Springs & Principal Stresses (Mohr Circle)', weightage: 'High' },
      { id: 'mech_som_5', title: 'Columns (Euler/Rankine), Thin Cylinders & Theories of Failure', weightage: 'High' },
    ],
  },
  {
    id: 'mech_td',
    name: 'Thermodynamics & IC Engines',
    shortName: 'Thermo & IC',
    category: 'technical',
    branch: 'mechanical',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'mech_td_1', title: 'Zeroth & First Law, SFEE & Pure Substances (Steam Tables)', weightage: 'High' },
      { id: 'mech_td_2', title: 'Second Law, Entropy, Carnot Theorem & Availability', weightage: 'High' },
      { id: 'mech_td_3', title: 'Air Standard Cycles: Otto, Diesel, Dual & Brayton', weightage: 'High' },
      { id: 'mech_td_4', title: 'IC Engines: Combustion, Detonation, Octane/Cetane & Testing', weightage: 'High' },
      { id: 'mech_td_5', title: 'Air Compressors: Reciprocating, Multistage & Intercooling', weightage: 'Medium' },
    ],
  },
  {
    id: 'mech_fm',
    name: 'Fluid Mechanics & Hydraulic Machines',
    shortName: 'FM & HM',
    category: 'technical',
    branch: 'mechanical',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'mech_fm_1', title: 'Fluid Properties, Viscosity, Manometry & Buoyancy', weightage: 'High' },
      { id: 'mech_fm_2', title: 'Fluid Kinematics, Continuity, Bernoulli & Flow Measurement', weightage: 'High' },
      { id: 'mech_fm_3', title: 'Laminar/Turbulent Pipe Flow & Boundary Layer Theory', weightage: 'High' },
      { id: 'mech_fm_4', title: 'Impact of Jets, Pelton, Francis & Kaplan Turbines', weightage: 'High' },
      { id: 'mech_fm_5', title: 'Centrifugal & Reciprocating Pumps, Cavitation & NPSH', weightage: 'High' },
    ],
  },
  {
    id: 'mech_prod',
    name: 'Production & Manufacturing',
    shortName: 'Production',
    category: 'technical',
    branch: 'mechanical',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'mech_prod_1', title: 'Engineering Materials, Iron-Carbon Diagram & Heat Treatment', weightage: 'High' },
      { id: 'mech_prod_2', title: 'Casting: Patterns, Moulding, Gating & Casting Defects', weightage: 'High' },
      { id: 'mech_prod_3', title: 'Welding: Arc, Gas, TIG/MIG, Brazing & Resistance Welding', weightage: 'High' },
      { id: 'mech_prod_4', title: 'Metal Cutting, Merchant Circle, Tool Life & Machining', weightage: 'High' },
      { id: 'mech_prod_5', title: 'Metal Forming, Metrology, Limits, Fits & Tolerances', weightage: 'High' },
    ],
  },
  {
    id: 'mech_rac',
    name: 'Refrigeration & Air Conditioning',
    shortName: 'RAC',
    category: 'technical',
    branch: 'mechanical',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'mech_rac_1', title: 'COP, Bell-Coleman Cycle & Vapour Compression (VCRS)', weightage: 'High' },
      { id: 'mech_rac_2', title: 'Refrigerants Designation, Properties & VARS', weightage: 'Medium' },
      { id: 'mech_rac_3', title: 'Psychrometry, DBT/WBT, Bypass Factor & Air Conditioning', weightage: 'High' },
    ],
  },
  {
    id: 'mech_ht',
    name: 'Heat & Mass Transfer',
    shortName: 'HMT',
    category: 'technical',
    branch: 'mechanical',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'mech_ht_1', title: 'Conduction: Fourier Law, Critical Radius & Fins', weightage: 'High' },
      { id: 'mech_ht_2', title: 'Convection: Dimensionless Numbers (Nu, Pr, Re, Gr)', weightage: 'Medium' },
      { id: 'mech_ht_3', title: 'Radiation (Stefan-Boltzmann, Wien) & Heat Exchangers (LMTD)', weightage: 'High' },
    ],
  },
  {
    id: 'mech_pp',
    name: 'Power Plant Engineering',
    shortName: 'Power Plant',
    category: 'technical',
    branch: 'mechanical',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'mech_pp_1', title: 'Rankine Cycle, Reheating, Regeneration & Steam Nozzles', weightage: 'High' },
      { id: 'mech_pp_2', title: 'Boilers: Classification, Mountings & Accessories', weightage: 'High' },
      { id: 'mech_pp_3', title: 'Steam Turbines (Impulse & Reaction) & Condensers', weightage: 'Medium' },
    ],
  },

  // ==================== NON-TECH (SHARED) ====================
  {
    id: 'nt_reasoning',
    name: 'General Intelligence & Reasoning',
    shortName: 'Reasoning',
    category: 'nontech',
    branch: 'nontech',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'nt_reas_1', title: 'Number & Alphabet Series, Analogy & Classification', weightage: 'High' },
      { id: 'nt_reas_2', title: 'Coding-Decoding, Place Values & Opposite Pairs', weightage: 'High' },
      { id: 'nt_reas_3', title: 'Syllogism, Venn Diagrams & Statement-Conclusions', weightage: 'High' },
      { id: 'nt_reas_4', title: 'Blood Relations, Direction Sense & Seating Arrangement', weightage: 'High' },
      { id: 'nt_reas_5', title: 'Mirror/Water Images, Paper Folding, Cubes & Dice', weightage: 'Medium' },
      { id: 'nt_reas_6', title: 'Mathematical Operations, Missing Number & Calendar/Clock', weightage: 'High' },
    ],
  },
  {
    id: 'nt_ga',
    name: 'General Awareness',
    shortName: 'GA / GK',
    category: 'nontech',
    branch: 'nontech',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'nt_ga_1', title: 'Indian Polity: Constitution, Articles & Amendments', weightage: 'High' },
      { id: 'nt_ga_2', title: 'Modern & Ancient Indian History + Culture', weightage: 'High' },
      { id: 'nt_ga_3', title: 'Indian Geography: Rivers, Passes, Soils & Climate', weightage: 'High' },
      { id: 'nt_ga_4', title: 'Indian Economy, Five-Year Plans & Banking Basics', weightage: 'Medium' },
      { id: 'nt_ga_5', title: 'Current Affairs, Awards, Sports & Static GK', weightage: 'High' },
    ],
  },
  {
    id: 'nt_gs',
    name: 'General Science',
    shortName: 'Gen Science',
    category: 'nontech',
    branch: 'nontech',
    exams: ['ssc_je', 'rrb_je'],
    chapters: [
      { id: 'nt_gs_1', title: 'Physics: Units, Optics, Electricity & Mechanics', weightage: 'High' },
      { id: 'nt_gs_2', title: 'Chemistry: Periodic Table, Acids-Bases, Alloys & Metallurgy', weightage: 'High' },
      { id: 'nt_gs_3', title: 'Biology: Human Systems, Vitamins, Diseases & Cell Biology', weightage: 'High' },
    ],
  },
  {
    id: 'nt_math',
    name: 'Mathematics (RRB JE CBT-1)',
    shortName: 'Mathematics',
    category: 'nontech',
    branch: 'nontech',
    exams: ['rrb_je'],
    chapters: [
      { id: 'nt_math_1', title: 'Number System, BODMAS, HCF/LCM & Surds', weightage: 'High' },
      { id: 'nt_math_2', title: 'Percentage, Ratio-Proportion, Profit-Loss & SI/CI', weightage: 'High' },
      { id: 'nt_math_3', title: 'Time & Work, Pipes-Cisterns & Time-Speed-Distance', weightage: 'High' },
      { id: 'nt_math_4', title: 'Algebra, Geometry, Mensuration & Trigonometry', weightage: 'High' },
    ],
  },
  {
    id: 'nt_comp',
    name: 'Basics of Computers & Applications',
    shortName: 'Computers',
    category: 'nontech',
    branch: 'nontech',
    exams: ['rrb_je'],
    chapters: [
      { id: 'nt_comp_1', title: 'Computer Architecture, Input/Output & Memory Hierarchy', weightage: 'High' },
      { id: 'nt_comp_2', title: 'Number Systems (Binary/Hex), OS & DBMS Fundamentals', weightage: 'High' },
      { id: 'nt_comp_3', title: 'Networking (OSI Model, Protocols), Cyber Security & MS Office', weightage: 'High' },
    ],
  },
];

// Reasoning Quick-Reference Data (1-30 Squares, Cubes, Square Roots, Cube Roots)
export interface NumberReferenceRow {
  n: number;
  square: number;
  cube: number;
  sqrt: string;
  cbrt: string;
}

export const REASONING_NUMBER_TABLE: NumberReferenceRow[] = Array.from({ length: 30 }, (_, idx) => {
  const n = idx + 1;
  return {
    n,
    square: n * n,
    cube: n * n * n,
    sqrt: Math.sqrt(n).toFixed(3),
    cbrt: Math.cbrt(n).toFixed(3),
  };
});

export interface AlphabetReferenceRow {
  letter: string;
  forward: number;
  reverse: number;
  opposite: string;
  pairMnemonic: string;
}

const OPPOSITE_MNEMONICS: Record<string, string> = {
  A: 'AZad',
  B: 'BoY',
  C: 'CraX',
  D: 'DeW',
  E: 'EVen',
  F: 'FUll',
  G: 'GT Road',
  H: 'High School',
  I: 'Indian Railway',
  J: 'Jungle Queen',
  K: 'KanPur',
  L: 'LOve',
  M: 'MaN',
};

export const ALPHABET_REFERENCE_TABLE: AlphabetReferenceRow[] = Array.from({ length: 26 }, (_, idx) => {
  const letter = String.fromCharCode(65 + idx);
  const opposite = String.fromCharCode(90 - idx);
  const key = idx < 13 ? letter : opposite;
  return {
    letter,
    forward: idx + 1,
    reverse: 26 - idx,
    opposite,
    pairMnemonic: OPPOSITE_MNEMONICS[key] || '',
  };
});

// Authentic Pre-seeded PYQs so CBT Simulator works out of the box
export const SEED_QUESTIONS: QuestionItem[] = [
  {
    id: 'seed_civ_1',
    subject: 'Building Materials',
    topic: 'Cement (IS 4031)',
    examType: 'ssc_je',
    branch: 'civil',
    questionText:
      'As per IS 269:2015, the initial setting time of Ordinary Portland Cement (OPC) should not be less than:',
    options: ['15 minutes', '30 minutes', '60 minutes', '600 minutes'],
    correctIndex: 1,
    explanation:
      'For OPC (33, 43, and 53 grades), initial setting time must be >= 30 minutes and final setting time must be <= 600 minutes (10 hours).',
    sourceName: 'SSC JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_civ_2',
    subject: 'RCC Design (IS 456:2000)',
    topic: 'Limit State of Flexure',
    examType: 'ssc_je',
    branch: 'civil',
    questionText:
      'According to IS 456:2000, the maximum limiting depth of neutral axis (xu,max / d) for Fe 415 grade steel is:',
    options: ['0.53', '0.48', '0.46', '0.42'],
    correctIndex: 1,
    explanation:
      'IS 456:2000 specifies xu,max/d = 0.53 for Fe 250, 0.48 for Fe 415, and 0.46 for Fe 500.',
    sourceName: 'SSC JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_civ_3',
    subject: 'Soil Mechanics & Foundation',
    topic: 'Phase Relationships',
    examType: 'rrb_je',
    branch: 'civil',
    questionText:
      'If the void ratio (e) of a soil sample is 0.50, what is its porosity (n) expressed as a percentage?',
    options: ['25.0%', '33.33%', '50.0%', '66.67%'],
    correctIndex: 1,
    explanation:
      'Porosity n = e / (1 + e) = 0.50 / (1 + 0.50) = 0.50 / 1.50 = 1/3 = 33.33%.',
    sourceName: 'RRB JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_civ_4',
    subject: 'Surveying',
    topic: 'Levelling & Curvature',
    examType: 'ssc_je',
    branch: 'civil',
    questionText:
      'The combined correction for earth curvature and atmospheric refraction for a distance D (in km) is given by:',
    options: ['+0.0785 D² m', '-0.0785 D² m', '-0.0673 D² m', '+0.0112 D² m'],
    correctIndex: 2,
    explanation:
      'Curvature correction Cc = -0.0785 D² m and refraction correction Cr = +0.0112 D² m; combined C = -0.0673 D² m (always subtractive).',
    sourceName: 'SSC JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_civ_5',
    subject: 'SOM & Theory of Structures',
    topic: 'SFD & BMD',
    examType: 'ssc_je',
    branch: 'civil',
    questionText:
      'A simply supported beam of span L carries a uniformly distributed load w per unit length over its entire span. The maximum bending moment at mid-span is:',
    options: ['wL² / 4', 'wL² / 8', 'wL² / 12', 'wL / 2'],
    correctIndex: 1,
    explanation:
      'For an SSB with full-span UDL w, support reactions are wL/2 and maximum bending moment occurs at center: Mmax = wL² / 8.',
    sourceName: 'SSC JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_civ_6',
    subject: 'Hydraulics & Fluid Mechanics',
    topic: 'Open Channel Flow',
    examType: 'rrb_je',
    branch: 'civil',
    questionText:
      'For the most economical rectangular open channel section, the hydraulic radius R in terms of flow depth y is:',
    options: ['R = y', 'R = y / 2', 'R = 2y', 'R = y / 4'],
    correctIndex: 1,
    explanation:
      'For an economical rectangular channel, width b = 2y, giving wetted perimeter P = 4y, area A = 2y², and hydraulic radius R = A/P = y/2.',
    sourceName: 'RRB JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_mech_1',
    subject: 'Thermodynamics & IC Engines',
    topic: 'Air Standard Cycles',
    examType: 'ssc_je',
    branch: 'mechanical',
    questionText:
      'For the same compression ratio (r) and same heat rejection, the correct order of air-standard thermal efficiency is:',
    options: [
      'Diesel > Dual > Otto',
      'Otto > Dual > Diesel',
      'Dual > Otto > Diesel',
      'Otto = Diesel = Dual',
    ],
    correctIndex: 1,
    explanation:
      'For the same compression ratio and heat input/rejection, Otto cycle adds heat at constant volume (highest mean temperature), so η_Otto > η_Dual > η_Diesel.',
    sourceName: 'SSC JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_mech_2',
    subject: 'Fluid Mechanics & Hydraulic Machines',
    topic: 'Hydraulic Turbines',
    examType: 'rrb_je',
    branch: 'mechanical',
    questionText:
      'Which of the following is a high-head, low-specific-speed tangential flow impulse turbine?',
    options: ['Francis Turbine', 'Kaplan Turbine', 'Pelton Wheel', 'Propeller Turbine'],
    correctIndex: 2,
    explanation:
      'Pelton wheel operates under high head (>250 m) with low specific speed (Ns ≈ 10–35 single jet) and is a pure tangential flow impulse turbine.',
    sourceName: 'RRB JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_mech_3',
    subject: 'Theory of Machines & Machine Design',
    topic: 'Governors',
    examType: 'ssc_je',
    branch: 'mechanical',
    questionText:
      'A governor is said to be isochronous when its equilibrium speed for all radii of rotation within the working range is:',
    options: ['Zero', 'Constant', 'Linearly increasing', 'Inversely proportional to sleeve lift'],
    correctIndex: 1,
    explanation:
      'An isochronous governor has zero range of speed (Nmax = Nmin), meaning equilibrium speed stays constant across the entire working range (infinite sensitiveness).',
    sourceName: 'SSC JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_mech_4',
    subject: 'Production & Manufacturing',
    topic: 'Iron-Carbon Diagram',
    examType: 'rrb_je',
    branch: 'mechanical',
    questionText:
      'The eutectoid reaction in the Iron-Carbon equilibrium diagram occurs at 727°C and carbon percentage of:',
    options: ['0.025% C', '0.8% C', '2.1% C', '4.3% C'],
    correctIndex: 1,
    explanation:
      'At 0.8% C and 727°C, solid Austenite (γ) transforms into Pearlite (α-ferrite + Fe3C cementite). 4.3% C at 1147°C is the eutectic point.',
    sourceName: 'RRB JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_mech_5',
    subject: 'Engineering Mechanics & SOM',
    topic: 'Columns & Struts',
    examType: 'ssc_je',
    branch: 'mechanical',
    questionText:
      'According to Euler buckling theory, the effective length of a column of length L fixed at one end and free at the other end is:',
    options: ['L / 2', 'L / √2', 'L', '2L'],
    correctIndex: 3,
    explanation:
      'Effective length Le: Both ends hinged = L, Both fixed = L/2, One fixed & one hinged = L/√2, One fixed & one free = 2L.',
    sourceName: 'SSC JE PYQ Bank',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_nt_1',
    subject: 'General Intelligence & Reasoning',
    topic: 'Number Series',
    examType: 'ssc_je',
    branch: 'nontech',
    questionText: 'Find the missing term in the series: 7, 26, 63, 124, 215, ?',
    options: ['342', '343', '344', '336'],
    correctIndex: 0,
    explanation:
      'Pattern is n³ - 1: 2³-1=7, 3³-1=26, 4³-1=63, 5³-1=124, 6³-1=215, therefore 7³-1 = 343 - 1 = 342.',
    sourceName: 'SSC JE Reasoning PYQ',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_nt_2',
    subject: 'General Intelligence & Reasoning',
    topic: 'Coding-Decoding',
    examType: 'rrb_je',
    branch: 'nontech',
    questionText:
      'In a certain code language, RAIL is written as IZRO. Using the opposite-letter rule, how will BEAM be written?',
    options: ['YVZN', 'YVZO', 'YWZN', 'XVZN'],
    correctIndex: 0,
    explanation:
      'Each letter is replaced by its opposite pair (sum = 27): B(2)↔Y(25), E(5)↔V(22), A(1)↔Z(26), M(13)↔N(14) → YVZN.',
    sourceName: 'RRB JE Reasoning PYQ',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_nt_3',
    subject: 'General Awareness',
    topic: 'Indian Polity',
    examType: 'ssc_je',
    branch: 'nontech',
    questionText:
      'Which Article of the Constitution of India deals with the Right to Constitutional Remedies?',
    options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
    correctIndex: 3,
    explanation:
      'Article 32 grants the Right to Constitutional Remedies (5 writs: Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo Warranto) — called the heart and soul of the Constitution by Dr. B.R. Ambedkar.',
    sourceName: 'SSC JE GA PYQ',
    isMistake: false,
    wrongCount: 0,
  },
  {
    id: 'seed_nt_4',
    subject: 'General Science',
    topic: 'Physics — Units & Electricity',
    examType: 'rrb_je',
    branch: 'nontech',
    questionText: 'The SI unit of electrical conductance is:',
    options: ['Ohm', 'Siemens (mho)', 'Henry', 'Tesla'],
    correctIndex: 1,
    explanation:
      'Conductance G = 1/R; its SI unit is Siemens (S), also written as mho (Ω⁻¹). Henry is inductance and Tesla is magnetic flux density.',
    sourceName: 'RRB JE Science PYQ',
    isMistake: false,
    wrongCount: 0,
  },
];

// Pre-seeded Visual Notes with crisp monochrome SVG diagrams
export const SEED_NOTES: Record<string, ChapterNote> = {
  civ_rcc_1: {
    chapterId: 'civ_rcc_1',
    subjectId: 'civ_rcc',
    chapterTitle: 'WSM vs LSM Fundamentals & Partial Safety Factors',
    branch: 'civil',
    tldr: 'Limit State Method (IS 456:2000) designs structures for both safety at ultimate collapse and serviceability under working loads using characteristic values and partial safety factors (1.5 for concrete, 1.15 for steel).',
    plainNotes:
      '• Characteristic strength (fck): Value below which not more than 5% of test results are expected to fall (f_mean = fck + 1.65σ).\n• Design strength of concrete in flexure = 0.67 fck / 1.5 = 0.446 fck ≈ 0.45 fck.\n• Design strength of steel = fy / 1.15 = 0.87 fy.\n• Max compressive strain in concrete at extreme fiber in bending = 0.0035.\n• Min tensile strain in steel at failure = (fy / 1.15 Es) + 0.002 where Es = 2 × 10⁵ MPa.',
    conceptCards: [
      {
        title: '01. Partial Safety Factors (IS 456 Table 18)',
        summary:
          'Concrete has higher manufacturing variability on site than factory-rolled steel, hence a larger material partial safety factor (1.5 vs 1.15).',
        formulas: [
          'γm (Concrete) = 1.50  |  γm (Steel) = 1.15',
          'Load Combination (DL + LL) = 1.5 (DL + LL)',
          'Load Combination (DL + LL + WL/EL) = 1.2 (DL + LL + WL)',
        ],
        memoryTrick: 'Concrete is site-mixed (1.50), Steel is mill-made (1.15). Under 3 loads together, factor drops to 1.2.',
      },
      {
        title: '02. Stress Block Parameters (Flexure)',
        summary:
          'In LSM, the concrete stress block is rectangular up to 0.002 strain (0.43 xu from top) and parabolic from 0.002 down to 0 at neutral axis.',
        formulas: [
          'Total Compression C = 0.36 · fck · b · xu',
          'Centroid of C from extreme compression fiber = 0.42 · xu',
          'Lever arm z = d − 0.42 · xu',
        ],
        memoryTrick: 'Remember 36-42-87: 0.36 fck b xu, centroid 0.42 xu, steel stress 0.87 fy.',
      },
      {
        title: '03. Limiting Neutral Axis Ratio (xu,max / d)',
        summary:
          'Under-reinforced sections (xu < xu,max) are always preferred so steel yields first, giving ductile warning before concrete crushes.',
        formulas: [
          'Fe 250 → xu,max / d = 0.53  |  Mu,lim = 0.148 fck b d²',
          'Fe 415 → xu,max / d = 0.48  |  Mu,lim = 0.138 fck b d²',
          'Fe 500 → xu,max / d = 0.46  |  Mu,lim = 0.133 fck b d²',
        ],
        memoryTrick: 'Higher fy → lower xu,max/d (53 → 48 → 46) because higher grade steel needs more strain to yield.',
      },
    ],
    diagrams: [
      {
        title: 'LSM Strain & Rectangular-Parabolic Stress Block (IS 456)',
        caption: 'Extreme compression strain 0.0035, uniform stress 0.446 fck, resultant C = 0.36 fck b xu at 0.42 xu.',
        svg: `<svg viewBox="0 0 420 180" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
  <!-- Section -->
  <rect x="26" y="24" width="66" height="132" stroke-width="1.5"/>
  <line x1="20" y1="86" x2="102" y2="86" stroke-width="1" stroke-dasharray="4 3" stroke-opacity="0.7"/>
  <circle cx="44" cy="140" r="4" fill="currentColor" stroke="none"/>
  <circle cx="59" cy="140" r="4" fill="currentColor" stroke="none"/>
  <circle cx="74" cy="140" r="4" fill="currentColor" stroke="none"/>
  <text x="42" y="16" fill="currentColor" stroke="none" font-size="10" font-family="monospace">SECTION</text>
  <text x="104" y="89" fill="currentColor" stroke="none" font-size="9" font-family="monospace">N.A.</text>

  <!-- Strain Diagram -->
  <line x1="168" y1="24" x2="168" y2="156" stroke-width="1.2"/>
  <line x1="168" y1="24" x2="218" y2="24" stroke-width="1.5"/>
  <line x1="218" y1="24" x2="138" y2="140" stroke-width="1.5"/>
  <line x1="138" y1="140" x2="168" y2="140" stroke-width="1.5"/>
  <line x1="168" y1="52" x2="198" y2="52" stroke-width="1" stroke-dasharray="3 2" stroke-opacity="0.6"/>
  <text x="150" y="16" fill="currentColor" stroke="none" font-size="10" font-family="monospace">STRAIN</text>
  <text x="222" y="27" fill="currentColor" stroke="none" font-size="9" font-family="monospace">0.0035</text>
  <text x="202" y="55" fill="currentColor" stroke="none" font-size="9" font-family="monospace">0.002</text>
  <text x="116" y="154" fill="currentColor" stroke="none" font-size="8.5" font-family="monospace">0.002+0.87fy/Es</text>

  <!-- Stress Block -->
  <line x1="286" y1="24" x2="286" y2="156" stroke-width="1.2"/>
  <path d="M286 24 L348 24 L348 52 Q348 80 286 86 Z" fill="currentColor" fill-opacity="0.1" stroke-width="1.6"/>
  <line x1="354" y1="48" x2="392" y2="48" stroke-width="1.6"/>
  <path d="M354 48 L361 44 M354 48 L361 52" stroke-width="1.4"/>
  <line x1="286" y1="140" x2="352" y2="140" stroke-width="1.6"/>
  <path d="M352 140 L345 136 M352 140 L345 144" stroke-width="1.4"/>
  <text x="284" y="16" fill="currentColor" stroke="none" font-size="10" font-family="monospace">STRESS BLOCK</text>
  <text x="352" y="27" fill="currentColor" stroke="none" font-size="9" font-family="monospace">0.446fck</text>
  <text x="358" y="42" fill="currentColor" stroke="none" font-size="9" font-family="monospace">C=0.36fck·b·xu</text>
  <text x="356" y="143" fill="currentColor" stroke="none" font-size="9" font-family="monospace">T=0.87fy·Ast</text>
</svg>`,
      },
    ],
    comparisonTables: [
      {
        title: 'WSM vs LSM (Exam High-Yield Comparison)',
        headers: ['Parameter', 'Working Stress (WSM)', 'Limit State (LSM)'],
        rows: [
          ['Design Philosophy', 'Elastic / Linear stress-strain', 'Inelastic / Probabilistic safety'],
          ['Safety Factor', 'Single FOS (3 for concrete, 1.8 steel)', 'Partial safety factors (Load & Material)'],
          ['Modular Ratio (m)', 'm = 280 / (3 · σcbc)', 'Not used in flexure design'],
          ['Economy & Ductility', 'Heavier, uneconomical sections', 'Economical, ductile failure mode'],
        ],
      },
    ],
    qaHistory: [],
  },
  mech_td_3: {
    chapterId: 'mech_td_3',
    subjectId: 'mech_td',
    chapterTitle: 'Air Standard Cycles: Otto, Diesel, Dual & Brayton',
    branch: 'mechanical',
    tldr: 'Air-standard cycles model IC engine thermodynamics assuming ideal gas air with constant specific heats. Thermal efficiency depends primarily on compression ratio (r), adiabatic index (γ = 1.4), and cutoff ratio (ρ).',
    plainNotes:
      '• Otto Cycle (SI / Petrol): 2 reversible adiabatics + 2 constant volume processes. η = 1 − 1 / r^(γ−1).\n• Diesel Cycle (CI / Diesel): Heat addition at constant pressure, rejection at constant volume.\n• Mean Effective Pressure (MEP) = Net Work / Swept Volume.\n• For same peak pressure & peak temperature: η_Diesel > η_Dual > η_Otto (reverse of same compression ratio!).\n• Brayton Cycle (Gas Turbine): 2 isentropics + 2 isobaric processes; optimum pressure ratio rp = (T3/T1)^(γ / (2(γ−1))).',
    conceptCards: [
      {
        title: '01. Otto Cycle Efficiency',
        summary:
          'Otto efficiency depends ONLY on compression ratio r and adiabatic index γ; it is completely independent of heat supplied.',
        formulas: [
          'η_Otto = 1 − (1 / r^(γ − 1))',
          'For monoatomic gas (γ = 1.67) > diatomic (1.4) > triatomic (1.33)',
          'Typical SI compression ratio: r = 6 to 10',
        ],
        memoryTrick: 'More γ or more r always lifts η_Otto. Heat input Q_in never changes η_Otto!',
      },
      {
        title: '02. Diesel Cycle & Cutoff Ratio (ρ)',
        summary:
          'Increasing cutoff ratio ρ = V3 / V2 increases the bracketed factor > 1, thereby reducing Diesel cycle efficiency for a fixed r.',
        formulas: [
          'η_Diesel = 1 − [1 / r^(γ−1)] · [(ρ^γ − 1) / (γ(ρ − 1))]',
          'Typical CI compression ratio: r = 14 to 22',
          'Cutoff ratio ρ = V3 / V2 = T3 / T2',
        ],
        memoryTrick: 'Same r → O-D-D (Otto > Dual > Diesel). Same Pmax & Tmax → D-D-O (Diesel > Dual > Otto).',
      },
    ],
    diagrams: [
      {
        title: 'Otto vs Diesel Cycle Comparison on P-v Plane (Same r)',
        caption: 'Process 2-3 (constant volume) for Otto vs 2-3′ (constant pressure) for Diesel.',
        svg: `<svg viewBox="0 0 420 180" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
  <!-- Axes -->
  <line x1="56" y1="152" x2="372" y2="152" stroke-width="1.5"/>
  <line x1="56" y1="152" x2="56" y2="18" stroke-width="1.5"/>
  <path d="M56 18 L52 25 M56 18 L60 25" stroke-width="1.4"/>
  <path d="M372 152 L365 148 M372 152 L365 156" stroke-width="1.4"/>
  <text x="36" y="28" fill="currentColor" stroke="none" font-size="11" font-family="monospace">P</text>
  <text x="376" y="156" fill="currentColor" stroke="none" font-size="11" font-family="monospace">v</text>

  <!-- Otto Cycle 1-2-3-4 -->
  <path d="M312 132 Q196 124 126 76 L126 30 Q206 86 312 108 Z" fill="currentColor" fill-opacity="0.08" stroke-width="1.6"/>
  <!-- Diesel constant-pressure 2-3' dashed -->
  <path d="M126 76 L196 76 Q254 100 312 114" stroke-width="1.5" stroke-dasharray="5 3"/>

  <!-- State points -->
  <circle cx="312" cy="132" r="3" fill="currentColor" stroke="none"/>
  <circle cx="126" cy="76" r="3" fill="currentColor" stroke="none"/>
  <circle cx="126" cy="30" r="3" fill="currentColor" stroke="none"/>
  <circle cx="196" cy="76" r="3" fill="currentColor" stroke="none"/>
  <circle cx="312" cy="108" r="3" fill="currentColor" stroke="none"/>

  <!-- Labels -->
  <text x="318" y="136" fill="currentColor" stroke="none" font-size="10" font-family="monospace">1</text>
  <text x="114" y="79" fill="currentColor" stroke="none" font-size="10" font-family="monospace">2</text>
  <text x="114" y="32" fill="currentColor" stroke="none" font-size="10" font-family="monospace">3 (Otto v=C)</text>
  <text x="196" y="68" fill="currentColor" stroke="none" font-size="9.5" font-family="monospace">3' (Diesel P=C)</text>
  <text x="318" y="109" fill="currentColor" stroke="none" font-size="10" font-family="monospace">4</text>
  <text x="206" y="168" fill="currentColor" stroke="none" font-size="9.5" font-family="monospace">Vs = V1 − V2 (Swept Volume)</text>
</svg>`,
      },
    ],
    comparisonTables: [
      {
        title: 'Efficiency Ranking by Comparison Basis',
        headers: ['Constraint Basis', 'Highest η', 'Middle η', 'Lowest η'],
        rows: [
          ['Same Compression Ratio (r) & Heat Input', 'Otto', 'Dual', 'Diesel'],
          ['Same Max Pressure (Pmax) & Heat Rejection', 'Diesel', 'Dual', 'Otto'],
          ['Same Max Pressure & Max Temperature', 'Diesel', 'Dual', 'Otto'],
        ],
      },
    ],
    qaHistory: [],
  },
};

export function getSubjectsForContext(
  branch: 'civil' | 'mechanical',
  targetExam: 'combo' | 'ssc_je' | 'rrb_je',
): SyllabusSubject[] {
  return SYLLABUS_SUBJECTS.filter((subj) => {
    const branchMatch = subj.branch === branch || subj.branch === 'nontech';
    if (!branchMatch) return false;
    if (targetExam === 'combo') return true;
    return subj.exams.includes(targetExam);
  });
}

export function findChapterMeta(chapterId: string): { subject: SyllabusSubject; title: string } | null {
  for (const subj of SYLLABUS_SUBJECTS) {
    const ch = subj.chapters.find((c) => c.id === chapterId);
    if (ch) return { subject: subj, title: ch.title };
  }
  return null;
}
