// PvE: every player joins one vanilla team with friendly fire off (FTB Teams parties are separate and voluntary)
// - the team is made, or set again, when the server loads; each player joins it on logging in

const ABZA_PVE_TEAM = 'abza_survivors'

// The team, made if missing, with friendly fire off and invisible teammates seen
function abzaPveTeam(server) {
    var board = server.getScoreboard()
    var team = board.getPlayerTeam(ABZA_PVE_TEAM)
    if (team == null) team = board.addPlayerTeam(ABZA_PVE_TEAM)
    team.setAllowFriendlyFire(false)
    team.setSeeFriendlyInvisibles(true)
    return team
}

ServerEvents.loaded(event => {
    abzaPveTeam(event.server)
})

PlayerEvents.loggedIn(event => {
    var board = event.server.getScoreboard()
    var team = abzaPveTeam(event.server)
    var name = event.player.getUsername()
    if (board.getPlayersTeam(name) != team) board.addPlayerToTeam(name, team)
})
