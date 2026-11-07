// NeonCraft recipe fixes.
ServerEvents.recipes(event => {
    const dyes = [
        ['lightblue', 'light_blue'],
        ['lime', 'lime'],
        ['magenta', 'magenta'],
        ['orange', 'orange'],
        ['red', 'red'],
        ['yellow', 'yellow']
    ]

    // Right vertical bars and top horizontal bars, dyed from their own white base
    dyes.forEach(([colour, dye]) => {
        const top = colour == 'magenta' ? 'megenta' : colour
        event.remove({ id: 'neoncraft:vbr_' + colour + '_crafting' })
        event.remove({ id: 'neoncraft:hbt_' + colour + '_crafting' })
        event.shapeless('neoncraft:vertical_bar_right_' + colour, ['neoncraft:vertical_bar_right', 'minecraft:' + dye + '_dye'])
            .id('abza:neoncraft/vertical_bar_right_' + colour)
        event.shapeless('neoncraft:horizontal_bar_top_' + top, ['neoncraft:horizontal_bar_top', 'minecraft:' + dye + '_dye'])
            .id('abza:neoncraft/horizontal_bar_top_' + top)
    })

    // Lime F, lime 2 and orange C
    event.remove({ id: 'neoncraft:f_lime_crafting' })
    event.remove({ id: 'neoncraft:lime_2_crafting' })
    event.remove({ id: 'neoncraft:c_orange_crafting' })
    event.shapeless('neoncraft:f_lime', ['neoncraft:f_white', 'minecraft:lime_dye']).id('abza:neoncraft/f_lime')
    event.shapeless('neoncraft:lime_2', ['neoncraft:white_2', 'minecraft:lime_dye']).id('abza:neoncraft/lime_2')
    event.shapeless('neoncraft:c_orange', ['neoncraft:c_white', 'minecraft:orange_dye']).id('abza:neoncraft/c_orange')

    const key = {
        P: 'minecraft:white_stained_glass_pane',
        T: 'neoncraft:neon_tube'
    }

    // White left and right pieces: NeonCraft's own layouts, unmirrored
    const unmirrored = [
        ['cornor_bar_left_bottom', 'cblb', ['PT', 'PP']],
        ['cornor_bar_right_bottom', 'cbrb', ['TP', 'PP']],
        ['cornor_bar_left_top', 'cblt', ['PP', 'PT']],
        ['cornor_bar_right_top', 'cbrt', ['PP', 'TP']],
        ['vertical_bar_left', 'vbl', ['P ', 'PT', 'P ']],
        ['vertical_bar_right', 'vbr', [' P', 'TP', ' P']],
        ['arrow_left', 'arrow_left', ['PT ', 'PPP']],
        ['arrow_right', 'arrow_right', [' TP', 'PPP']]
    ]
    unmirrored.forEach(([piece, recipe, pattern]) => {
        event.remove({ id: 'neoncraft:' + recipe + '_crafting' })
        event.shaped('neoncraft:' + piece, pattern, key).noMirror().id('abza:neoncraft/' + piece)
    })

    // White I, L and minus: layouts of their own
    const relaid = [
        ['i_white', ['P', 'T', 'P']],
        ['l_white', ['PT', 'P ', 'PP']],
        ['neon_minus', ['PTP']]
    ]
    relaid.forEach(([piece, pattern]) => {
        event.remove({ id: 'neoncraft:' + piece + '_crafting' })
        event.shaped('neoncraft:' + piece, pattern, key).id('abza:neoncraft/' + piece)
    })
})
