const Complaint = require('../models/Complaint');
const Category = require('../models/Category');

/**
 * Predicts category based on keyword matching.
 * @param {string} title 
 * @param {string} description 
 * @param {Array} categories 
 * @returns {Object|null} Suggested Category
 */
const predictCategory = async (title, description) => {
  const categories = await Category.find({});
  const combinedText = `${title} ${description}`.toLowerCase();

  const keywordsMap = {
    'road-damage': ['pothole', 'road', 'asphalt', 'crater', 'pavement', 'crack', 'street damage', 'highway'],
    'street-light': ['street light', 'lamp', 'bulb', 'darkness', 'lamp post', 'light post', 'streetlamp'],
    'garbage': ['garbage', 'trash', 'waste', 'litter', 'rubbish', 'refuse', 'dumping', 'smell', 'stench'],
    'water-leakage': ['water leakage', 'water leak', 'burst pipe', 'flooding water', 'sprinkler', 'leak', 'main break'],
    'stray-animals': ['stray', 'dog', 'animal', 'monkey', 'cow', 'cat', 'rabid', 'bite', 'barking'],
    'traffic-signal': ['traffic signal', 'traffic light', 'stop light', 'red light', 'sensor', 'signal out'],
    'illegal-dumping': ['illegal dumping', 'dumping', 'fly tipping', 'abandoned car', 'tires', 'debris'],
    'fallen-trees': ['fallen tree', 'branch', 'tree block', 'limb', 'timber', 'uprooted'],
    'drainage': ['drainage', 'clogged drain', 'sewer', 'manhole', 'overflow', 'gutters', 'blockage'],
    'public-property-damage': ['graffiti', 'vandalism', 'broken bench', 'park damage', 'playground', 'smashed']
  };

  let bestMatch = null;
  let maxHits = 0;

  for (const category of categories) {
    const keywords = keywordsMap[category.slug] || [];
    let hits = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        hits += matches.length;
      }
    });

    if (hits > maxHits) {
      maxHits = hits;
      bestMatch = category;
    }
  }

  // Fallback to "Other" category if hits are zero
  if (!bestMatch) {
    bestMatch = await Category.findOne({ slug: 'other' });
  }

  return {
    suggestedCategory: bestMatch,
    confidenceScore: maxHits > 0 ? Math.min(0.5 + (maxHits * 0.1), 0.95) : 0.40
  };
};

/**
 * Estimates severity of complaint.
 * @param {string} title 
 * @param {string} description 
 * @returns {string} Low, Medium, or High
 */
const estimateSeverity = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  
  const highRiskKeywords = [
    'sinkhole', 'fire', 'collapsed', 'danger', 'wire', 'exposed wire', 
    'injury', 'accident', 'blocking highway', 'broken pipe flood', 
    'burst pipe', 'major accident', 'gas leak', 'exploding'
  ];

  const mediumRiskKeywords = [
    'pothole', 'street light out', 'garbage pile', 'stray dog', 
    'traffic light out', 'leak', 'fallen branch', 'blocked drain',
    'smelly', 'illegal park'
  ];

  let highCount = 0;
  highRiskKeywords.forEach(keyword => {
    if (text.includes(keyword)) highCount++;
  });

  if (highCount > 0) return 'High';

  let mediumCount = 0;
  mediumRiskKeywords.forEach(keyword => {
    if (text.includes(keyword)) mediumCount++;
  });

  if (mediumCount > 0) return 'Medium';

  return 'Low';
};

/**
 * Basic duplicate complaint check based on location coordinates and category.
 * Finds complaints in same category within 100 meters.
 * @param {number} lng 
 * @param {number} lat 
 * @param {string} categoryId 
 * @returns {Array} List of potential duplicates
 */
const detectDuplicates = async (lng, lat, categoryId) => {
  const maxDistanceMeters = 100;
  if (isNaN(lng) || lng < -180 || lng > 180 || isNaN(lat) || lat < -90 || lat > 90) {
    console.warn(`Invalid coordinates passed to detectDuplicates: lng=${lng}, lat=${lat}`);
    return [];
  }
  try {
    const potentialDuplicates = await Complaint.find({
      category: categoryId,
      status: { $in: ['Reported', 'Verified', 'Assigned', 'Accepted', 'In Progress'] },
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistanceMeters
        }
      }
    }).populate('category citizen', 'name email');

    return potentialDuplicates;
  } catch (error) {
    console.error('Error in duplicate detection:', error);
    return [];
  }
};

/**
 * Auto-suggest title and description tweaks based on selected category.
 * @param {string} categorySlug 
 * @returns {Object} suggestions
 */
const getAiSuggestions = (categorySlug) => {
  const suggestions = {
    'road-damage': {
      title: 'Pothole on [Street Name]',
      description: 'There is a deep pothole in the middle of the road near [Landmark]. It is posing a risk to vehicles and cyclists.'
    },
    'street-light': {
      title: 'Non-functional Street Light near [House Number]',
      description: 'The street light is completely out, making the area pitch black and unsafe for pedestrians at night.'
    },
    'garbage': {
      title: 'Accumulated Garbage Pile on [Street Name]',
      description: 'A large pile of household garbage and plastic waste has accumulated here. It has started smelling and attracting pests.'
    },
    'water-leakage': {
      title: 'Water Pipe Leakage at [Location]',
      description: 'Clean drinking water has been leaking from a damaged pipe for the past [X] hours, flooding the footpath.'
    },
    'stray-animals': {
      title: 'Pack of Aggressive Stray Dogs near [Park]',
      description: 'A group of stray dogs has taken over the corner. They chase bikes and pedestrians, creating a hazard.'
    },
    'traffic-signal': {
      title: 'Broken Traffic Light at [Intersection]',
      description: 'The traffic signal light has stopped working (either flashing or completely black), causing gridlock at the junction.'
    },
    'illegal-dumping': {
      title: 'Illegal Dumping of Construction Debris at [Location]',
      description: 'Unknown trucks have dumped concrete blocks and construction waste on the sidewalk, blocking passage.'
    },
    'fallen-trees': {
      title: 'Fallen Tree Blocking Road near [Location]',
      description: 'A large tree branch has snapped and fallen, completely blocking one side of the road. Needs chainsaws to remove.'
    },
    'drainage': {
      title: 'Overflowing Sewage/Drain near [Landmark]',
      description: 'The stormwater drain is choked with plastic bags. Water is overflowing onto the main road and smelling bad.'
    },
    'public-property-damage': {
      title: 'Graffiti/Broken Bench at [Park Name]',
      description: 'The park bench has been vandalized, or public swings have been broken, making them unsafe for children.'
    },
    'other': {
      title: 'Civic Issue at [Location]',
      description: 'Please describe the civic issue, its impact, and what needs fixing.'
    }
  };

  return suggestions[categorySlug] || suggestions['other'];
};

module.exports = {
  predictCategory,
  estimateSeverity,
  detectDuplicates,
  getAiSuggestions
};
