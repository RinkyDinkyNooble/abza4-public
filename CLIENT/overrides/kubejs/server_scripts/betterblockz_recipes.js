// BetterBlockZ blocks with no working recipe of their own
ServerEvents.recipes(event => {
    // Secret Cyber Lights, cut from a white Cyber Light like the other Cyber Light shapes
    for (let i = 0; i <= 17; i++) {
        event.stonecutting(`betterblockz:cyberlight_secret_blockz_${i}`, 'betterblockz:cyberlight_blockz_0')
            .id(`abza:betterblockz/cyberlight_secret_blockz_${i}`)
    }
    // BlockZ Dirt, cut from dirt
    event.stonecutting('betterblockz:dirt_blockz', 'minecraft:dirt').id('abza:betterblockz/dirt_blockz')

    // Base blocks whose own recipe takes a cut ingredient: eight frame blocks around a centre, as the mod's own recipes
    const bases = [
        ['crimson_blockz_0', 'betterblockz:ironslate_blockz_0', 'betterblockz:ironslate_blockz_0', 'minecraft:red_dye'],
        ['kryp_blockz_0', 'betterblockz:blockz_core', 'betterblockz:blockz_core', 'minecraft:coal'],
        ['vect_blockz_0', 'betterblockz:blockz_core', 'betterblockz:blockz_core', 'minecraft:obsidian'],
        ['vena_blockz_0', 'betterblockz:blockz_core', 'betterblockz:blockz_core', 'minecraft:redstone'],
        ['lairblood_blockz_0', 'betterblockz:blockz_core', 'minecraft:granite', 'minecraft:red_mushroom'],
        ['lairdecay_blockz_0', 'betterblockz:blockz_core', 'minecraft:granite', 'minecraft:brown_mushroom'],
        ['lairflesh_blockz_0', 'betterblockz:blockz_core', 'minecraft:granite', 'minecraft:rotten_flesh'],
        ['lairhusk_blockz_0', 'betterblockz:blockz_core', 'minecraft:granite', 'minecraft:beetroot'],
        ['lairstain_blockz_0', 'betterblockz:blockz_core', 'minecraft:granite', 'minecraft:ink_sac']
    ]
    bases.forEach(([block, corner, side, centre]) => {
        event.shaped(Item.of(`betterblockz:${block}`, 8), ['CSC', 'SMS', 'CSC'], { C: corner, S: side, M: centre })
            .id(`abza:betterblockz/${block}`)
    })
})
