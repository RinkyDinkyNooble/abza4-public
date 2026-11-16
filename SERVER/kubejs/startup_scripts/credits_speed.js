// The credits screen scrolls at its sped-up rate, as if Space were held (client only)

if (Platform.isClientEnvironment()) {
    let $AbzaWinScreen = Java.loadClass('net.minecraft.client.gui.screens.WinScreen')

    ForgeEvents.onEvent('net.minecraftforge.client.event.ScreenEvent$Init$Post', event => {
        let screen = event.getScreen()
        if (screen instanceof $AbzaWinScreen) screen.keyPressed(32, 0, 0)
    })
}
