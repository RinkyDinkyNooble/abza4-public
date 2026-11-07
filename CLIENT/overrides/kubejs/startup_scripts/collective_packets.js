// Collective's and Starter Kit's network packets registered again once loading completes; a packet already
// registered is left as it is, and one missing gets its channel
const $AbzaCollectiveCommon = Java.loadClass('com.natamus.collective_common_forge.CollectiveCommon')
const $AbzaStarterKitCommon = Java.loadClass('com.serilum.starterkit_common_forge.ModCommon')

ForgeModEvents.onEvent('net.minecraftforge.fml.event.lifecycle.FMLLoadCompleteEvent', event => {
    try {
        $AbzaCollectiveCommon.registerPackets()
        $AbzaStarterKitCommon.registerPackets()
    } catch (error) {
        console.error('collective_packets.js: the packets could not be registered again: ' + error)
    }
})
