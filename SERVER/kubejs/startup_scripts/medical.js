// Medical items: each region's affliction, the antigens and vaccines, and what happens when a medicine is used.
// The numbers are in medical_table.js; afflictions, resting and vaccinating run in server_scripts/medical.js.

// Afflictions: a named effect with no effect of its own (no natural healing while it lasts)
StartupEvents.registry('mob_effect', event => {
    Object.keys(global.ABZA_MEDICAL.afflictions).forEach(region => {
        var row = global.ABZA_MEDICAL.afflictions[region]
        event.create(row.effect).harmful().color(row.colour).displayName(row.name)
    })
})

// Reagents (each tier's drops, processed, for its medicine), antigens (a region's mini-boss drop, processed) and
// vaccines (an antigen in a syringe, injected)
StartupEvents.registry('item', event => {
    var medical = global.ABZA_MEDICAL
    Object.keys(medical.reagents).forEach(id => {
        var row = medical.reagents[id]
        event.create(id).displayName(row.name).texture('layer0', 'minecraft:item/potion_overlay')
            .texture('layer1', 'minecraft:item/potion').color(0, row.colour)
    })
    Object.keys(medical.antigens).forEach(id => {
        var row = medical.antigens[id]
        event.create(id).displayName(row.name).texture('layer0', 'minecraft:item/potion_overlay')
            .texture('layer1', 'minecraft:item/potion').color(0, row.colour)
    })
    Object.keys(medical.vaccines).forEach(id => {
        var row = medical.vaccines[id]
        event.create(id).displayName(row.name).texture('layer0', 'spore:item/syringe')
            .texture('layer1', 'spore:item/syringe_contents').color(1, row.colour)
            .useAnimation('bow')
            .useDuration(stack => 32)
            .use((level, player, hand) => !player.stages.has('abza_vaccine_t' + row.region))
            .finishUsing((stack, level, entity) => {
                if (!level.isClientSide() && entity.isPlayer() && global.abzaVaccinate) {
                    global.abzaVaccinate(entity, row.region)
                    if (!entity.isCreative()) stack.shrink(1)
                }
                return stack
            })
    })
})

// A medicine used (LR Tactical's event, after its heal and effects): the blood pack restores max health lost to deaths
ForgeEvents.onEvent('me.xjqsh.lrtactical.api.event.ConsumableUseEvent', event => {
    var user = event.getUser()
    if (!user.isPlayer() || String(event.getConsumableId()) != global.ABZA_MEDICAL.bloodPack) return
    if (global.abzaBloodPack) global.abzaBloodPack(user)
})
