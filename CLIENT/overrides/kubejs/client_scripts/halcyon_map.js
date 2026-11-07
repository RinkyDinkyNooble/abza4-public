// Halcyon's map on the rocket's planet screen
const RenderSolarSystemEvent = Java.loadClass('earth.terrarium.adastra.api.client.events.AdAstraClientEvents$RenderSolarSystemEvent')
const PlanetsScreen = Java.loadClass('earth.terrarium.adastra.client.screens.PlanetsScreen')
const Tesselator = Java.loadClass('com.mojang.blaze3d.vertex.Tesselator')
const RenderSystem = Java.loadClass('com.mojang.blaze3d.systems.RenderSystem')
const VertexMode = Java.loadClass('com.mojang.blaze3d.vertex.VertexFormat$Mode')
const DefaultVertexFormat = Java.loadClass('com.mojang.blaze3d.vertex.DefaultVertexFormat')
const GameRenderer = Java.loadClass('net.minecraft.client.renderer.GameRenderer')
const ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const Axis = Java.loadClass('com.mojang.math.Axis')
const Util = Java.loadClass('net.minecraft.Util')

const HALCYON_STAR = new ResourceLocation('ad_astra', 'textures/environment/red_sun.png')
const HALCYON_PLANETS = ['cinder', 'eden', 'umbra'].map(planet => new ResourceLocation('abza', 'textures/environment/' + planet + '.png'))

// Registered once per game: Ad Astra keeps its listeners across script reloads
if (global.halcyonMap === undefined) {
  global.halcyonMap = true
  RenderSolarSystemEvent.register((graphics, system, width, height) => {
    if (!global.halcyonMap || String(system) != 'abza:halcyon') return
    try {
      let tesselator = Tesselator.getInstance()
      let buffer = tesselator.getBuilder()
      RenderSystem.setShader(() => GameRenderer.getPositionColorShader())
      buffer.begin(VertexMode.DEBUG_LINES, DefaultVertexFormat.POSITION_COLOR)
      PlanetsScreen.drawCircles(0, HALCYON_PLANETS.length, -14404997, buffer, width, height)
      tesselator.end()
      graphics.blit(HALCYON_STAR, Math.floor(width / 2) - 8, Math.floor(height / 2) - 8, 0, 0, 16, 16, 16, 16)
      let time = Util.getMillis() / 100
      HALCYON_PLANETS.forEach((texture, i) => {
        let ring = i + 1
        let pose = graphics.pose()
        pose.pushPose()
        pose.translate(width / 2, height / 2, 0)
        pose.mulPose(Axis.ZP.rotationDegrees(time * (5 - ring) / 2))
        pose.translate(31 * ring - 10, 0, 0)
        graphics.blit(texture, 0, 0, 0, 0, 12, 12, 12, 12)
        pose.popPose()
      })
    } catch (e) {
      global.halcyonMap = false
      console.error('Halcyon map: ' + e)
    }
  })
}
