/**
* Created by rickhyun on 2018-05-14.
*/
const Command = require('command')
const Long = require("long")
const config = require('./config.json')

// credit : https://github.com/Some-AV-Popo
String.prototype.clr = function (hexColor) { return `<font color="#${hexColor}">${this}</font>` }

module.exports = function MyDPS(d) {
  const command = Command(d)

  let enable = config.enable
      notice = config.notice

  let gid,
      boss = new Set(),
      enraged = false,
      inHH = false,
      hpCur=0,
      hpMax=0,
      exhpCur=0,
      exhpMax=0,
      starttime=0,
      endtime=0,
      extarget= new Long(0,0),
      totaldamage= new Long(0,0)

  d.hook('S_LOGIN', (e) => {
    gid=e.gameId
  })

  d.hook('S_LOAD_TOPO', (e) => {
    (e.zone === 9950) ? inHH = true : inHH = false
  })

  d.hook('S_BOSS_GAGE_INFO', (e) => {
    if (!enable || inHH) return
    // notified boss before start battle
    boss.add(e.id.toString())
    hpMax = e.maxHp
    hpCur = e.curHp
    hpPer = Math.floor((hpCur / hpMax) * 100)
  })

  d.hook('S_EACH_SKILL_RESULT', (e) => {
    if (!enable || inHH) return
    if(gid.equals(e.source) && e.damage > 0 && boss.has(e.target.toString())){
    //if(e.damage > 0 && boss.has(e.target.toString())){ // for debug
      if (extarget.notEquals(e.target)){
        if(totaldamage.gt(0)) printoutdps(exhpMax,exhpCur)
        starttime = Date.now()
        totaldamage = e.damage
        //toChat('new')
      }
      else totaldamage = e.damage.add(totaldamage)
      //toChat('totaldamage' + totaldamage.toString())
      extarget = e.target;
      exhpMax = hpMax;
      exhpCur = hpCur;
    }
  })

  d.hook('S_DESPAWN_NPC', (e) => {
    if (!enable || inHH) return
    if (boss.has(e.gameId.toString())) {
      printoutdps(hpMax,hpCur)
      boss.delete(e.gameId.toString())
    }
  })

  d.hook('S_NPC_STATUS', (e) => {
    if (!enable || inHH) return
    if (!boss.has(e.creature.toString())) return
    if (e.enraged === 1 && !enraged) {
      printoutdps(hpMax,hpCur)
      enraged = true
    } else if (e.enraged === 0 && enraged) {
      if (hpPer === 100) return
      printoutdps(hpMax,hpCur)
      enraged = false
    }
  })

  function printoutdps(BossMaxhp,BossCurhp)
  {
    partydamage=BossMaxhp-BossCurhp
    if(partydamage === 0 || totaldamage === 0) return
    endtime=Date.now()
    battleduration = Math.floor((endtime-starttime) / 1000)
    if(battleduration == 0 || starttime == 0) return
    toChat( Math.floor(totaldamage.div(1000 * battleduration)) + 'k/s '.clr('E69F00')
            + Math.floor( totaldamage.multiply(100).div(partydamage))  + '% '.clr('E69F00')
            + battleduration.toFixed(0) + 'seconds'.clr('E69F00') )
  }

  // helper
  function toChat(msg) {
    if (notice) d.toClient('S_DUNGEON_EVENT_MESSAGE', {
      unk1: 31, // 42 blue shiny text, 31 normal Text
      unk2: 0,
      unk3: 27,
      message: msg
    })
    else send(msg)
  }

  // command
  command.add('mydps', (arg) => {
    // toggle
    if (!arg) {
      enable = !enable
      send(`${enable ? 'Enabled'.clr('56B4E9') : 'Disabled'.clr('E69F00')}`)
    }
    else if (arg == 'c' || arg=='current') {
      printoutdps()
    }
    // notice
    else if (arg === 'n' || arg === 'ㅜ' || arg === 'notice') {
      notice = !notice
      send(`Notice to screen ${notice ? 'enabled'.clr('56B4E9') : 'disabled'.clr('E69F00')}`)
      // status
    } else if (arg === 's' || arg === 'ㄴ' || arg === 'status') status()
    else send(`Invalid argument.`.clr('FF0000') + ' mydps or mydps c/n/s')
  })
  function send(msg) { command.message(`[mydps] : ` + [...arguments].join('\n\t - '.clr('FFFFFF'))) }
  function status() { send(
    `Enrage message : ${enable ? 'Enabled'.clr('56B4E9') : 'Disabled'.clr('E69F00')}`,
    `Notice to screen : ${notice ? 'Enabled'.clr('56B4E9') : 'Disabled'.clr('E69F00')}`)
  }

}
