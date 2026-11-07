// Grappling hooks in JEI: each hook by its abza_hook id, the plain item hidden
JEIEvents.subtypes(event => {
    event.useNBTKey('grapplemod:grapplinghook', 'abza_hook')
})

JEIEvents.addItems(event => {
    event.add(global.abzaGrappleHookIds.map(id => global.abzaGrappleHook(id)))
})

JEIEvents.hideItems(event => {
    event.hide(Ingredient.custom('grapplemod:grapplinghook', stack => !stack.nbt || !stack.nbt.contains('abza_hook')))
})
