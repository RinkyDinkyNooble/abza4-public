// priority: -1
// Gun tooltips: damage, headshot, armour piercing, fire rate, range, pierce, movement, condition and jamming,
// read from each gun's data with its attachments counted. TaCZ's own parts are hidden through the gun's
// HideFlags (its bits: description 1, ammo 2, base 4, extra 8, attachment tip 16, gun pack 32), keeping the
// ammo part and Gun Durability's jam chance line. Runs after item_tooltips.js, so the spacer sits above the
// tier lines.
const TimelessAPI = Java.loadClass('com.tacz.guns.api.TimelessAPI')
const AttachmentDataUtils = Java.loadClass('com.tacz.guns.util.AttachmentDataUtils')
const SyncConfig = Java.loadClass('com.tacz.guns.config.sync.SyncConfig')
const GunDurabilityData = Java.loadClass('mod.cdv.gdb.DataLookup')
const GunResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')

const GUN_HIDE_FLAGS = 1 | 4 | 8 | 16 | 32

// Each stat's label colour, by group: damage warm reds, fire rate amber, range blues, movement greens,
// condition purples. Values are white.
const GUN_KEY_COLOURS = {
    'Damage': 0xE8826F,
    'Explosion': 0xE89A5C,
    'Headshot': 0xE07A9A,
    'Armour piercing': 0xD4A373,
    'Fire rate': 0xE6C86E,
    'Full damage': 0x7FB8E6,
    'Pierces': 0x6CCFC8,
    'Speed': 0x8FD17A,
    'aiming': 0xA9CF8C,
    'reloading': 0x7DBF9A,
    'Condition': 0xB49BE0,
    'jams below': 0xC98BD6
}

function trimmed(value) {
    return String(Math.round(value * 100) / 100)
}

function signedPercent(value) {
    const rounded = Math.round(value * 1000) / 10
    return (rounded > 0 ? '+' : '') + rounded + '%'
}

function statLine(parts) {
    let line = Text.empty()
    parts.forEach((part, i) => {
        if (i > 0) line = line.append(Text.darkGray(' · '))
        const colour = GUN_KEY_COLOURS[part[0]]
        const key = colour ? Text.of(part[0] + ' ').color(colour) : Text.gray(part[0] + ' ')
        line = line.append(key).append(Text.white(part[1]))
    })
    return line
}

ItemEvents.tooltip(event => {
    event.addAdvanced('tacz:modern_kinetic_gun', (item, advanced, text) => {
        const tag = item.nbt
        if (!tag || !tag.contains('GunId')) return
        const index = TimelessAPI.getCommonGunIndex(new GunResourceLocation(tag.getString('GunId')))
        if (!index.isPresent()) return
        if (tag.getInt('HideFlags') != GUN_HIDE_FLAGS) tag.putInt('HideFlags', GUN_HIDE_FLAGS)
        const data = index.get().getGunData()
        const bullet = data.getBulletData()
        const extra = bullet.getExtraDamage()

        // Spacer below Gun Durability's jam chance line
        text.add(1, Text.empty())

        // Damage, pellets and explosion
        let damage = trimmed(AttachmentDataUtils.getDamageWithAttachment(item, data))
        if (bullet.getBulletAmount() > 1) damage += ` in ${bullet.getBulletAmount()} pellets`
        const damageParts = [['Damage', damage]]
        const explosion = bullet.getExplosionData()
        if (explosion && AttachmentDataUtils.isExplodeEnabled(item, data)) damageParts.push(['Explosion', trimmed(explosion.getDamage())])
        text.add(statLine(damageParts))

        // Headshot and armour piercing
        text.add(statLine([
            ['Headshot', '×' + trimmed(AttachmentDataUtils.getHeadshotMultiplier(item, data))],
            ['Armour piercing', Math.round(AttachmentDataUtils.getArmorIgnoreWithAttachment(item, data) * 100) + '%']
        ]))

        // Fire rate, full damage range and pierce
        const handling = [['Fire rate', data.getRoundsPerMinute() + ' a minute']]
        const falloff = extra ? extra.getDamageAdjust() : null
        if (falloff && !falloff.isEmpty()) {
            const distance = falloff.getFirst().getDistance()
            handling.push(['Full damage', distance > 100000 ? 'at any range' : `to ${Math.round(distance)} blocks`])
        }
        text.add(statLine(handling))
        if (bullet.getPierce() > 1) text.add(statLine([['Pierces', `up to ${bullet.getPierce()} mobs`]]))

        // Movement: the weight slowdown times the gun's holding, aiming or reloading value
        const weightFactor = 1 - AttachmentDataUtils.getWightWithAttachment(item, data) * SyncConfig.WEIGHT_SPEED_MULTIPLIER.get()
        const move = data.getMoveSpeed()
        text.add(statLine([
            ['Speed', signedPercent(weightFactor * (1 + move.getBaseMultiplier()) - 1)],
            ['aiming', signedPercent(weightFactor * (1 + move.getAimMultiplier()) - 1)],
            ['reloading', signedPercent(weightFactor * (1 + move.getReloadMultiplier()) - 1)]
        ]))

        // Condition and when jamming starts
        if (item.getMaxDamage() > 0) {
            const condition = [['Condition', Math.round((1 - item.getDamageValue() / item.getMaxDamage()) * 100) + '%']]
            const durability = GunDurabilityData.getModifiers(item)
            if (durability && durability.jam()) condition.push(['jams below', Math.round(durability.jamThreshold() * 100) + '%'])
            text.add(statLine(condition))
        }
    })
})
