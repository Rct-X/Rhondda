// =====================================
// BUILD FRONTEND SEARCH ALIASES
// FROM SHARED CATEGORY ALIASES
// =====================================

window.searchAliases = {};

const categoryAliases = {

  "Electricians": [
    "electrician",
    "electricians",
    "sparky",
    "rewire",
    "electrical",
    "fuse board"
  ],

  "Plumbers": [
    "plumber",
    "plumbers",
    "boiler repair",
    "leak",
    "blocked sink"
  ],

  "Driving Schools": [
    "driving lessons",
    "driving instructor",
    "learn to drive",
    "driving school"
  ],

  "Handyman Services": [
    "handyman",
    "odd jobs",
    "home repairs",
    "maintenance"
  ]

};

// Build intent map automatically
Object.entries(categoryAliases).forEach(([category, aliases]) => {

  const slug = category.toLowerCase();

  aliases.forEach(alias => {
    window.searchAliases[alias.toLowerCase()] = slug;
  });

});
