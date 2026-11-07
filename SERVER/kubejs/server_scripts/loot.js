// Loot: ABZA's pools by category and tier (global.ABZA_LOOT, loot_table.js) turned into LootJS pools. A loot table
// names the pools it rolls, each with its number of rolls (a number, or [least, most]) and, optionally, a factor on
// each stack's count; its own loot is removed first, and nothing is enchanted.
//
//   abzaLoot(event, 'abza:chests/t1_house', [['food', 1, [2, 4]], ['ammo', 1, [1, 2]], ['medical', 1, 1]])
//   abzaLoot(event, 'abza:chests/t1_armoury', [['ammo', 1, [6, 8], 3]])     // stacks three times as big

// One table entry, [item, NBT, weight, least, most, stack size], as a LootJS entry, its count times a factor but never
// more than one stack; a grappling hook comes from its own builder
function abzaLootEntry(entry, factor) {
    var item = entry[0], nbt = entry[1], weight = entry[2], stack = entry[5]
    var least = entry[3] * (factor || 1), most = entry[4] * (factor || 1)
    if (nbt.indexOf('hook:') == 0) return LootEntry.of(global.abzaGrappleHook(nbt.substring(5))).withWeight(weight)
    var count = least == most ? least : { type: 'minecraft:uniform', min: least, max: most }
    var functions = [{ function: 'minecraft:set_count', count: count }]
    if (stack && most > stack) functions.push({ function: 'minecraft:limit_count', limit: { max: stack } })
    if (nbt) functions.push({ function: 'minecraft:set_nbt', tag: nbt })
    return LootEntry.ofJson({ type: 'minecraft:item', name: item, functions: functions }).withWeight(weight)
}

// A category's entries in one tier (empty when the tier has none), their counts times a factor
function abzaLootPool(category, tier, factor) {
    var entries = global.ABZA_LOOT[category + '_t' + tier]
    if (!entries) {
        console.warn('loot.js: no loot for ' + category + ' in tier ' + tier)
        return []
    }
    return entries.map(entry => abzaLootEntry(entry, factor))
}

// Replaces a loot table's loot with rolls from the named pools: [[category, tier, rolls, factor], ...]
function abzaLoot(event, table, pools) {
    var modifier = event.addLootTableModifier(table).removeLoot(Ingredient.all)
    pools.forEach(pool => {
        var entries = abzaLootPool(pool[0], pool[1], pool[3])
        if (entries.length > 0) modifier.addWeightedLoot(pool[2], entries)
    })
}

// Replaces a loot table's loot with the pools of the region its container stands in: [[category, rolls], ...]
function abzaRegionLoot(event, table, pools) {
    [1, 2, 3].forEach(tier => {
        var modifier = event.addLootTableModifier(table).anyBiome('#abza:tier' + tier).removeLoot(Ingredient.all)
        pools.forEach(pool => {
            var entries = abzaLootPool(pool[0], tier)
            if (entries.length > 0) modifier.addWeightedLoot(pool[1], entries)
        })
    })
}

// Adds one entry to a loot table at a chance, in one region's containers when a region is given
function abzaLootChance(event, table, entry, chance, region) {
    var modifier = event.addLootTableModifier(table)
    if (region) modifier = modifier.anyBiome('#abza:tier' + region)
    modifier.randomChance(chance).addLoot(abzaLootEntry(entry))
}

// The loot tables ABZA fills: [table, [[category, tier, rolls, factor], ...]]
const ABZA_LOOT_TABLES = [
    // Air drops called by flare guns 1 to 3 (27 slots each)
    ['dyairdrop:chests/weaponairdrop1', [['guns', 1, [2, 3]], ['ammo', 1, [7, 9], 3], ['attachments', 1, [4, 5]], ['explosives', 1, [2, 3]], ['melee', 1, [1, 2]], ['gear', 1, [1, 2]], ['ordnance', 1, [0, 1]]]],
    ['dyairdrop:chests/weaponairdrop2', [['guns', 2, [2, 3]], ['ammo', 2, [7, 9], 3], ['attachments', 2, [4, 5]], ['explosives', 2, [2, 3]], ['melee', 2, [1, 2]], ['gear', 2, [1, 2]], ['ordnance', 2, [0, 1]]]],
    ['dyairdrop:chests/weaponairdrop3', [['guns', 3, [2, 3]], ['ammo', 3, [7, 9], 3], ['attachments', 3, [4, 5]], ['explosives', 3, [2, 3]], ['melee', 3, [1, 2]], ['gear', 3, [1, 2]], ['ordnance', 3, [0, 1]]]],
    ['dyairdrop:chests/medicalairdrop1', [['medical', 1, [5, 6]], ['food', 1, [7, 8]], ['farming', 1, [2, 3]], ['materials', 1, [2, 3]], ['gear', 1, [1, 2]], ['defence', 1, [0, 1]]]],
    ['dyairdrop:chests/medicalairdrop2', [['medical', 2, [5, 6]], ['food', 2, [7, 8]], ['farming', 2, [2, 3]], ['materials', 2, [2, 3]], ['gear', 2, [1, 2]], ['defence', 2, [0, 1]]]],
    ['dyairdrop:chests/medicalairdrop3', [['medical', 3, [5, 6]], ['food', 3, [7, 8]], ['farming', 3, [2, 3]], ['materials', 3, [2, 3]], ['gear', 3, [1, 2]], ['defence', 3, [0, 1]]]],
    ['dyairdrop:chests/smallairdrop1', [['food', 1, [5, 6]], ['ammo', 1, [3, 4]], ['materials', 1, [4, 5]], ['gear', 1, [2, 3]], ['parts', 1, [2, 3]], ['defence', 1, [1, 2]], ['farming', 1, [1, 2]], ['melee', 1, [0, 1]]]],
    ['dyairdrop:chests/smallairdrop2', [['food', 2, [5, 6]], ['ammo', 2, [3, 4]], ['materials', 2, [4, 5]], ['gear', 2, [2, 3]], ['parts', 2, [2, 3]], ['defence', 2, [1, 2]], ['farming', 2, [1, 2]], ['melee', 2, [0, 1]]]],
    ['dyairdrop:chests/smallairdrop3', [['food', 3, [5, 6]], ['ammo', 3, [3, 4]], ['materials', 3, [4, 5]], ['gear', 3, [2, 3]], ['parts', 3, [2, 3]], ['defence', 3, [1, 2]], ['farming', 3, [1, 2]], ['melee', 3, [0, 1]]]]
]

// The loot tables ABZA fills by region: [table, [[category, rolls], ...]]
const ABZA_REGION_LOOT_TABLES = [
    // World air drops (27 slots)
    ['dyairdrop:chests/largeairdrop1', [['guns', 2], ['ammo', [5, 6]], ['medical', [2, 3]], ['food', [3, 4]], ['gear', 2], ['materials', [2, 4]], ['attachments', 2], ['explosives', [1, 2]], ['parts', [0, 1]]]]
]

// Entries added at a chance: [table, entry, chance, region]
const ABZA_BLOOD_PACK = ['lrtactical:consumable', '{ConsumableId:"abza:blood_pack"}', 1, 1, 1]
const ABZA_LOOT_CHANCES = [
    // A blood pack in air drops, likelier in higher tiers
    ['dyairdrop:chests/weaponairdrop1', ABZA_BLOOD_PACK, 0.25],
    ['dyairdrop:chests/medicalairdrop1', ABZA_BLOOD_PACK, 0.25],
    ['dyairdrop:chests/smallairdrop1', ABZA_BLOOD_PACK, 0.25],
    ['dyairdrop:chests/weaponairdrop2', ABZA_BLOOD_PACK, 0.4],
    ['dyairdrop:chests/medicalairdrop2', ABZA_BLOOD_PACK, 0.4],
    ['dyairdrop:chests/smallairdrop2', ABZA_BLOOD_PACK, 0.4],
    ['dyairdrop:chests/weaponairdrop3', ABZA_BLOOD_PACK, 0.6],
    ['dyairdrop:chests/medicalairdrop3', ABZA_BLOOD_PACK, 0.6],
    ['dyairdrop:chests/smallairdrop3', ABZA_BLOOD_PACK, 0.6],
    ['dyairdrop:chests/largeairdrop1', ABZA_BLOOD_PACK, 0.25, 1],
    ['dyairdrop:chests/largeairdrop1', ABZA_BLOOD_PACK, 0.4, 2],
    ['dyairdrop:chests/largeairdrop1', ABZA_BLOOD_PACK, 0.6, 3]
]

LootJS.modifiers(event => {
    ABZA_LOOT_TABLES.forEach(table => abzaLoot(event, table[0], table[1]))
    ABZA_REGION_LOOT_TABLES.forEach(table => abzaRegionLoot(event, table[0], table[1]))
    ABZA_LOOT_CHANCES.forEach(extra => abzaLootChance(event, extra[0], extra[1], extra[2], extra[3]))
})
