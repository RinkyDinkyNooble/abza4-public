// Loot: ABZA's pools by category and tier (global.ABZA_LOOT, loot_table.js) turned into LootJS pools. A loot table
// names the pools it rolls, each with its number of rolls (a number, or [least, most]) and, optionally, a factor on
// each stack's count; its own loot is removed first, and nothing is enchanted.
//
//   abzaLoot(event, 'abza:chests/t1_house', [['food', 1, [2, 4]], ['ammo', 1, [1, 2]], ['medical', 1, 1]])
//   abzaLoot(event, 'abza:chests/t1_armoury', [['ammo', 1, [6, 8], 3]])     // stacks three times as big
//
// A building's table (abza:chests/<name>) picks different items from the region its container stands in, more in a
// bigger container, by the weight of each source (a category, or a kind of thing in ABZA_LOOT_KINDS); it can add
// cash, and extras: a lock's note, a story document or one more item, each at a chance:
//
//   ['home/bedroom', [['linen', 5], ['homegear', 2], ['ammo', 0.5]], [1, 5, 0.25]]
//   ['home/keepsakes', [['linen', 4]], [5, 10], [['note', 'safe', 0.33]]]

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

// Kinds of things a place holds, drawn from the categories' pools of each tier: only the items listed, or every item
// but those listed (an id, or an id and its NBT); weights: an item's weight in this kind instead of its rank's
const ABZA_WOOL = ['white', 'light_gray', 'gray', 'black', 'brown', 'red', 'orange', 'yellow', 'lime', 'green', 'cyan',
    'light_blue', 'blue', 'purple', 'magenta', 'pink'].map(colour => `minecraft:${colour}_wool`)
const ABZA_LOOT_KINDS = {
    // Kitchen cupboards, beside food
    kitchenware: { from: ['materials', 'gear'], only: ['minecraft:bowl', 'minecraft:glass_bottle', 'minecraft:sugar',
        'mekanism:salt', 'minecraft:paper', 'minecraft:string', 'minecraft:stick', 'minecraft:charcoal', 'minecraft:torch'],
        weights: { 'minecraft:bowl': 4, 'minecraft:glass_bottle': 4 } },
    // Wardrobes and beds: cloth and leather
    linen: { from: ['materials'], only: ABZA_WOOL.concat(['minecraft:leather', 'minecraft:string', 'minecraft:feather']),
        weights: { 'minecraft:leather': 24, 'minecraft:string': 16, 'minecraft:feather': 2 } },
    // Nightstands and keepsakes: papers, books, small valuables
    personal: { from: ['materials'], only: ['minecraft:book', 'minecraft:paper', 'minecraft:ink_sac', 'minecraft:feather',
        'minecraft:string', 'minecraft:gold_nugget', 'minecraft:iron_nugget', 'minecraft:lapis_lazuli'],
        weights: { 'minecraft:feather': 2, 'minecraft:ink_sac': 4 } },
    // Bathrooms, beside medicine
    toiletries: { from: ['materials'], only: ['minecraft:glass_bottle', 'minecraft:paper', 'minecraft:string',
        'minecraft:white_wool', 'minecraft:light_gray_wool', 'minecraft:sugar', 'mekanism:salt', 'minecraft:honeycomb'],
        weights: { 'minecraft:honeycomb': 1, 'minecraft:white_wool': 4, 'minecraft:light_gray_wool': 4 } },
    // Living rooms, desks and anywhere else in a home
    household: { from: ['materials', 'gear'], only: ['minecraft:book', 'minecraft:paper', 'minecraft:ink_sac',
        'minecraft:feather', 'minecraft:string', 'minecraft:leather', 'minecraft:stick', 'minecraft:bowl',
        'minecraft:glass_bottle', 'minecraft:charcoal', 'minecraft:coal', 'minecraft:iron_nugget', 'minecraft:gold_nugget',
        'minecraft:torch'], weights: { 'minecraft:bowl': 4, 'minecraft:glass_bottle': 4, 'minecraft:feather': 2,
        'minecraft:ink_sac': 4 } },
    // Things a person keeps and uses again
    homegear: { from: ['gear'], only: ['mekanism:canteen', 'minecraft:clock', 'minecraft:compass',
        'minecraft:flint_and_steel', 'minecraft:lantern', 'minecraft:shears', 'minecraft:bucket'] },
    // Hand tools
    tools: { from: ['gear'], only: ['minecraft:wooden_axe', 'minecraft:stone_axe', 'minecraft:iron_axe',
        'minecraft:diamond_axe', 'minecraft:wooden_pickaxe', 'minecraft:stone_pickaxe', 'minecraft:iron_pickaxe',
        'minecraft:diamond_pickaxe', 'minecraft:wooden_shovel', 'minecraft:stone_shovel', 'minecraft:iron_shovel',
        'minecraft:diamond_shovel', 'minecraft:wooden_hoe', 'minecraft:stone_hoe', 'minecraft:iron_hoe', 'mekanism:configurator',
        'mekanism:gauge_dropper', 'superbwarfare:repair_tool', 'parcool:wooden_zipline_hook', 'parcool:iron_zipline_hook',
        'tacz:target'] },
    // Workshop consumables
    supplies: { from: ['gear'], only: ['minecraft:torch', 'parcool:zipline_rope'] },
    // Medicine but blood packs, and blood packs alone
    medicine: { from: ['medical'], not: ['lrtactical:consumable{ConsumableId:"abza:blood_pack"}'] },
    bloodpack: { from: ['medical'], only: ['lrtactical:consumable{ConsumableId:"abza:blood_pack"}'] },
    // Workshops: metal, fuel, powder
    workshop: { from: ['materials'], not: ABZA_WOOL.concat(['minecraft:book', 'minecraft:paper', 'minecraft:feather',
        'minecraft:ink_sac', 'minecraft:bowl', 'minecraft:glass_bottle', 'minecraft:sugar', 'mekanism:salt',
        'minecraft:honeycomb', 'minecraft:rotten_flesh', 'minecraft:bone', 'minecraft:lapis_lazuli', 'minecraft:clay_ball']) },
    // Gardens, beside seeds
    gardening: { from: ['materials'], only: ['minecraft:bone', 'minecraft:stick', 'minecraft:string', 'minecraft:flint',
        'minecraft:clay_ball'] },
    // Food on a shop's shelf: nothing raw
    shelffood: { from: ['food'], not: ['minecraft:beef', 'minecraft:chicken', 'minecraft:cod', 'minecraft:mutton',
        'minecraft:porkchop', 'minecraft:rabbit', 'minecraft:salmon', 'minecraft:pufferfish', 'minecraft:tropical_fish'] },
    // A pharmacy's stockroom: what medicine is made of
    dispensing: { from: ['materials'], only: ['minecraft:glass_bottle', 'minecraft:paper', 'minecraft:string',
        'minecraft:leather', 'minecraft:white_wool', 'minecraft:sugar'],
        weights: { 'minecraft:glass_bottle': 4, 'minecraft:string': 4, 'minecraft:leather': 4 } }
}

// A source's entries in a tier: a category's pool, or a kind's items from its categories' pools
const ABZA_SOURCE_ENTRIES = {}
function abzaSourceEntries(source, tier) {
    var key = source + '_t' + tier
    if (ABZA_SOURCE_ENTRIES[key]) return ABZA_SOURCE_ENTRIES[key]
    var kind = ABZA_LOOT_KINDS[source]
    var listed = (list, entry) => list.indexOf(entry[0]) >= 0 || list.indexOf(entry[0] + entry[1]) >= 0
    var entries = []
    ;(kind ? kind.from : [source]).forEach(category => {
        ;(global.ABZA_LOOT[category + '_t' + tier] || []).forEach(entry => {
            if (kind && kind.only && !listed(kind.only, entry)) return
            if (kind && kind.not && listed(kind.not, entry)) return
            var weight = kind && kind.weights ? kind.weights[entry[0]] : undefined
            entries.push(weight === undefined ? entry : [entry[0], entry[1], weight, entry[3], entry[4], entry[5]])
        })
    })
    if (entries.length == 0) console.warn('loot.js: nothing for ' + source + ' in tier ' + tier)
    ABZA_SOURCE_ENTRIES[key] = entries
    return entries
}

// One of a list by weight
function abzaWeighted(list, weight) {
    var total = list.reduce((sum, item) => sum + weight(item), 0)
    var roll = Math.random() * total
    for (var i = 0; i < list.length; i++) {
        roll -= weight(list[i])
        if (roll < 0) return list[i]
    }
    return list[list.length - 1]
}

// An entry as an item stack, its count rolled and never more than a stack
function abzaEntryStack(entry) {
    var nbt = entry[1]
    if (nbt.indexOf('hook:') == 0) return global.abzaGrappleHook(nbt.substring(5))
    var stack = nbt ? Item.of(entry[0], nbt) : Item.of(entry[0])
    var count = entry[3] + Math.floor(Math.random() * (entry[4] - entry[3] + 1))
    stack.setCount(Math.min(count, entry[5] || stack.getMaxStackSize()))
    return stack
}

// Up to n different items from weighted sources ([[source, weight], ...]), none already taken
function abzaPickStacks(sources, tier, n, taken) {
    var out = []
    for (var i = 0; i < n; i++) {
        var open = []
        sources.forEach(source => {
            var entries = abzaSourceEntries(source[0], tier).filter(entry => !taken[entry[0] + entry[1]])
            if (entries.length > 0) open.push([entries, source[1]])
        })
        if (open.length == 0) break
        var entry = abzaWeighted(abzaWeighted(open, source => source[1])[0], entry => entry[2])
        taken[entry[0] + entry[1]] = true
        out.push(abzaEntryStack(entry))
    }
    return out
}

// How many different items a container holds, by its size: a chest or barrel 3 to 6 (a double one 5 to 10), other
// storage 1 to 2 up to 9 slots, 1 to 3 up to 18, 2 to 4 up to 27, 3 to 6 up to 36, 5 to 10 above
function abzaLootCount(level, pos) {
    var slots = 27
    var chest = false
    try {
        chest = /chest|barrel/.test(String(level.getBlockState(pos).getBlock().id))
        var entity = level.getBlockEntity(pos)
        if (entity && entity.getContainerSize) slots = entity.getContainerSize()
    } catch (e) {
        console.warn('loot.js: no container size at ' + pos + ': ' + e)
    }
    var range = chest ? (slots > 27 ? [5, 10] : [3, 6]) : slots <= 9 ? [1, 2] : slots <= 18 ? [1, 3] : slots <= 27 ?
        [2, 4] : slots <= 36 ? [3, 6] : [5, 10]
    return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1))
}

// Fills a building's loot table by the region its container stands in: different items from its sources, cash
// ([least, most, chance] in tier 1 dollars, doubled for each tier above; every time when the chance is left out) and
// extras: ['note', lock, share] the lock's note where this copy of the building has the lock (abzaLockHere),
// ['story', document, chance, region] a story document, ['pool', source, chance] one more item
function abzaBuildingLoot(event, name, sources, cash, extras) {
    ;[1, 2, 3].forEach(tier => {
        event.addLootTableModifier('abza:chests/' + name).anyBiome('#abza:tier' + tier).apply(ctx => {
            var level = ctx.getLevel()
            var pos = ctx.getBlockPos()
            var taken = {}
            var stacks = abzaPickStacks(sources, tier, abzaLootCount(level, pos), taken)
            ;(extras || []).forEach(extra => {
                if (extra[0] == 'note' && abzaLockHere(level, extra[1], pos, extra[2])) {
                    stacks.push(abzaLockItem(level, extra[1], pos))
                } else if (extra[0] == 'story' && (!extra[3] || extra[3] == tier) && Math.random() < extra[2]) {
                    stacks.push(abzaStoryDoc(extra[1], level))
                } else if (extra[0] == 'pool' && Math.random() < extra[2]) {
                    stacks = stacks.concat(abzaPickStacks([[extra[1], 1]], tier, 1, taken))
                }
            })
            if (cash && (cash[2] === undefined || Math.random() < cash[2])) {
                var dollars = (cash[0] + Math.floor(Math.random() * (cash[1] - cash[0] + 1))) * Math.pow(2, tier - 1)
                stacks = stacks.concat(abzaCashStacks(dollars))
            }
            stacks.forEach(stack => ctx.addLoot(LootEntry.of(stack)))
        })
    })
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

// Buildings' loot tables, filled by region: [name, [[source, weight], ...], [least, most, chance] of cash, extras]
const ABZA_BUILDING_LOOT_TABLES = [
    // Homes' furniture: kitchen cupboards and the oven, the fridge, wardrobes and beds, nightstands, bathroom
    // cabinets, workroom shelves and benches, garden boxes, desks, and anything else that stores (living rooms, halls)
    ['home/kitchen', [['kitchenware', 5], ['food', 0.4]]],
    ['home/fridge', [['food', 1]]],
    ['home/bedroom', [['linen', 6], ['ammo', 0.1]], [1, 4, 0.15]],
    ['home/nightstand', [['personal', 5], ['medicine', 0.5], ['homegear', 0.15], ['ammo', 0.3]], [1, 6, 0.4]],
    ['home/bathroom', [['medicine', 1], ['toiletries', 4]]],
    ['home/garage', [['workshop', 6], ['supplies', 1], ['tools', 0.1], ['parts', 1], ['defence', 1]]],
    ['home/garden', [['farming', 6], ['gardening', 3], ['defence', 1], ['tools', 0.1]]],
    ['home/desk', [['household', 4], ['personal', 2], ['parts', 1], ['homegear', 0.15]], [2, 8, 0.5]],
    ['home/odds', [['household', 6]], [1, 3, 0.1]],
    // Homes' chests, a roll for every player: the main bedroom's (the house's cash, the safe's note), the one by
    // the door (the post), the second bedroom's
    ['home/keepsakes', [['personal', 4], ['linen', 2], ['medicine', 0.25], ['ammo', 0.5], ['homegear', 0.15]], [6, 12], [['note', 'safe', 0.33]]],
    ['home/post', [['household', 5]], null, [['story', 'premium_letter', 0.2, 1]]],
    // A flat's Lootr chest on a storey that repeats: the home's sure money, without the safe's note
    ['home/flat', [['personal', 4], ['linen', 2], ['medicine', 0.25], ['ammo', 0.5], ['homegear', 0.15]], [5, 10]],
    ['home/guest', [['linen', 4], ['personal', 2], ['medicine', 0.25]], null, [['story', 'booking', 0.2, 1]]],
    // Homes' keypad safe
    ['home/safe', [['ammo', 3], ['medicine', 1], ['gear', 1]], [10, 30], [['pool', 'guns', 0.15], ['pool', 'bloodpack', 0.15]]],
    // Shops: shelves, coolers, the stockroom's crates and shelves, the till, the stockroom's keypad safe
    ['shop/shelf', [['shelffood', 0.5], ['household', 3], ['toiletries', 2], ['supplies', 1], ['medicine', 0.25]]],
    ['shop/cooler', [['shelffood', 1], ['kitchenware', 1]]],
    ['shop/stock', [['shelffood', 0.3], ['household', 3], ['workshop', 2], ['supplies', 1], ['parts', 0.3]]],
    ['shop/till', [['personal', 1]], [8, 20]],
    ['shop/safe', [['ammo', 2], ['medicine', 1], ['gear', 1]], [20, 50], [['pool', 'guns', 0.15]]],
    // The pharmacy: its shelves, the dispensary's cabinets and the counter, the stockroom, the office's chest
    ['shop/pharmacy', [['toiletries', 4], ['household', 1], ['shelffood', 1]]],
    ['shop/dispensary', [['medicine', 1.25], ['toiletries', 2]]],
    ['shop/pharmacy_stock', [['dispensing', 5]]],
    ['shop/pharmacy_office', [['personal', 3], ['household', 1]], null, [['story', 'pharmacy_slip', 0.25, 1]]],
    // The car park: the attendant's office, the maintenance room, the decks' bins, cages and cabinets, the plant room
    ['carpark/office', [['household', 3], ['personal', 2], ['parts', 0.5], ['medicine', 0.2]], [1, 6, 0.2]],
    ['carpark/workshop', [['workshop', 4], ['parts', 1.5], ['supplies', 1], ['tools', 0.1]]],
    ['carpark/deck', [['household', 3], ['workshop', 2], ['supplies', 1], ['parts', 0.15], ['shelffood', 0.12]]],
    ['carpark/plant', [['workshop', 5], ['parts', 1], ['supplies', 1]]],
    // A stash off the main way, in any building: a Lootr chest, a roll for every player
    ['stash', [['ammo', 3], ['medicine', 1.5], ['shelffood', 1.5], ['personal', 1], ['supplies', 0.5]], [5, 15], [['pool', 'guns', 0.05]]],
    // Prospero, the hub: the galley's and the bars' cupboards, the fridges, berths and wardrobes, nightstands, washbasins,
    // Ruth's cabinets, Bram's workshop and the engine room, the stores, everything else aboard
    ['hub/kitchen', [['kitchenware', 1]]],
    ['hub/fridge', [['food', 1]]],
    ['hub/cabin', [['linen', 6], ['personal', 1]]],
    ['hub/nightstand', [['personal', 5], ['household', 1]]],
    ['hub/bathroom', [['toiletries', 1]]],
    ['hub/medical', [['dispensing', 5], ['toiletries', 1]]],
    ['hub/workshop', [['workshop', 6], ['supplies', 1], ['parts', 0.3]]],
    ['hub/stores', [['household', 3], ['workshop', 2], ['kitchenware', 1], ['supplies', 1], ['shelffood', 0.3]]],
    ['hub/office', [['household', 4], ['personal', 2]]]
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

ServerEvents.chestLootTables(event => {
    ABZA_BUILDING_LOOT_TABLES.forEach(table => event.addChest('abza:' + table[0], loot => {}))
})

LootJS.modifiers(event => {
    ABZA_LOOT_TABLES.forEach(table => abzaLoot(event, table[0], table[1]))
    ABZA_REGION_LOOT_TABLES.forEach(table => abzaRegionLoot(event, table[0], table[1]))
    ABZA_BUILDING_LOOT_TABLES.forEach(table => abzaBuildingLoot(event, table[0], table[1], table[2], table[3]))
    ABZA_LOOT_CHANCES.forEach(extra => abzaLootChance(event, extra[0], extra[1], extra[2], extra[3]))
})
