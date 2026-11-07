// Mobs from these mods breathe without oxygen and survive acid rain on Ad Astra's planets.
ServerEvents.tags('entity_type', event => {
    ['spore', 'phayriosisreborn', 'the_eyes_are_back', 'the_flesh_that_hates'].forEach(mod => {
        event.add('ad_astra:lives_without_oxygen', `@${mod}`)
        event.add('ad_astra:can_survive_in_acid_rain', `@${mod}`)
    })
})
