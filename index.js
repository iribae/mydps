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
      partydamage = new Long(0,0),
      expartydamage = new Long(0,0),
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
    partydamage = hpMax - hpCur
    hpPer = Math.floor((hpCur / hpMax) * 100)
  })

  d.hook('S_EACH_SKILL_RESULT', (e) => {
    if (!enable || inHH) return
    if(gid.equals(e.source) && e.damage > 0 && boss.has(e.target.toString())){
    //if(e.damage > 0 && boss.has(e.target.toString())){ // for debug
      if (extarget.notEquals(e.target)){
        if(totaldamage.gt(0)) printoutdps(expartydamage)
        starttime = Date.now()
        totaldamage = e.damage
        //toChat('new')
      }
      else totaldamage = e.damage.add(totaldamage)
      //toChat('totaldamage' + totaldamage.toString())
      extarget = e.target;
      expartydamage = hpMax.sub(hpCur)
    }
  })

  d.hook('S_DESPAWN_NPC', (e) => {
    if (!enable || inHH) return
    if (boss.has(e.gameId.toString())) {
      printoutdps(partydamage)
      boss.delete(e.gameId.toString())
    }
  })

  d.hook('S_NPC_STATUS', (e) => {
    if (!enable || inHH) return
    if (!boss.has(e.creature.toString())) return
    if (e.enraged === 1 && !enraged) {
      printoutdps(partydamage)
      enraged = true
    } else if (e.enraged === 0 && enraged) {
      if (hpPer === 100) return
      printoutdps(partydamage)
      enraged = false
    }
  })

  function printoutdps(damage)
  {
    endtime=Date.now()
    if( damage === 0 || totaldamage === 0 || starttime === 0 || endtime <= starttime) {
      toChat( 'totaldamage ' + totaldamage.toString() + 'battleduration ' + Math.floor((endtime-starttime) / 1000) + 'damage ' + damage.toString() );
      return
    }//debug
    //else toChat( 'totaldamage ' + totaldamage.toString() + 'battleduration ' + Math.floor((endtime-starttime) / 1000) + 'damage ' + damage.toString() );

    battleduration = Math.floor((endtime-starttime) / 1000)
    toChat( Math.floor(totaldamage.div(1000 * battleduration)) + 'k/s '.clr('E69F00')
            + Math.floor( totaldamage.multiply(100).div(damage))  + '% '.clr('E69F00')
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
      printoutdps(partydamage)
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
