// Bosses and final bosses heal when left alone: once no player has hit them for ABZA_REGEN_DELAY seconds, each
// heals a percentage of its max health at its own interval.
// A mob missing here never heals this way.

// Seconds after a player's last hit before healing starts (0: heals even mid-fight)
global.ABZA_REGEN_DELAY = 15

// Mob: [percent of max health, every N seconds]
global.ABZA_REGEN = {
    // Tier 1
    'infectious:ancient_zombie_boss': [1, 10],
    'infectious:giant_zombie': [1.5, 15],
    'infectious:zombified_rex': [0.5, 4],
    'undead_revamp2:clogger': [0.25, 2.5],

    // Tier 2
    'prionmod:hive': [1, 10],
    'prionmod:breacher': [0.5, 5],
    'prionmod:tank': [2, 20],
    'prionmod:vomiter': [0.25, 2.5],

    // Tier 3
    'entomophobia:myiatic_cow': [1, 10],
    'entomophobia:hive_heart': [0.5, 3],

    // Tier 5
    'the_eyes_are_back:destroyer': [1, 10],
    'the_eyes_are_back:crawling_ender_eyemination': [0.75, 6],
    'the_eyes_are_back:extreme_eye_humanoid': [1, 5],

    // Tier 6
    'the_flesh_that_hates:flesh_community': [1, 10],
    'the_flesh_that_hates:flesh_hunter_three': [0.5, 4],
    'the_flesh_that_hates:plaquethreelegcreature': [1, 6],

    // Tier 7
    'phayriosisreborn:dreadmind': [1, 10],
    'phayriosisreborn:gory_titan': [2, 15],
    'phayriosisreborn:immaculate_kingdom': [0.5, 3],
    'phayriosisreborn:immaculate_resistor': [1, 5],

    // Tier 8
    'spore:howitzer': [1, 10],
    'spore:gazenbreacher': [1, 6],
    'spore:hindenburg': [2, 12],
    'spore:hohlfresser': [0.5, 3],
    'spore:kraken': [1.5, 10],
    'spore:leviathan': [2, 15],
    'spore:proto': [1, 3],
    'spore:sieger': [1, 8],
    'spore:stahl': [0.75, 5],
    'spore:verfall': [0.5, 2.5],
}
