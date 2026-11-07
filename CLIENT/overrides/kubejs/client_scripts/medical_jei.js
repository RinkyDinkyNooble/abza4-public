// LR Tactical's own medicines and its condensed milk hidden from JEI
JEIEvents.hideItems(event => {
    ['ai2', 'amoxycillin', 'blood_pack', 'carfak', 'cms', 'condensed_milk', 'goldenstar', 'ibuprofen', 'surv12', 'vaseline'].forEach(id => {
        event.hide(Item.of('lrtactical:consumable', `{ConsumableId:"lrtactical:${id}"}`).weakNBT())
    })
})
