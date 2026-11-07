// TROL's two logo paintings are left out of the paintings a placed painting picks from
ServerEvents.tags('painting_variant', event => {
    event.remove('minecraft:placeable', ['trol_armor:logo', 'trol_armor:logo_2'])
})
