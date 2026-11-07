// Oxygen loader and distributor: oxygen only, no water
ServerEvents.recipes(event => {
  event.remove({ id: 'ad_astra:oxygen_loading/oxygen_from_oxygen_loading_water' })
})
