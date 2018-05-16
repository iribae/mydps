/**
* Created by baehw on 2018-05-14.
*/
const Command = require('command')
const Long = require("long");
const config = require('./config.json')

module.exports = function MyDPS(d) {
  const command = Command(d)

  let enable = config.enable;

  let gid,
  boss = new Set();
  inHH = false,
  hpCur=0,
  hpMax=0,
  newbossflag=0,
  starttime=0,
  endtime=0,
  totaldamage= new Long(0,0);

  d.hook('S_LOGIN', (e) => {
    gid=e.gameId;
  });

  d.hook('S_LOAD_TOPO', (e) => {
    (e.zone === 9950) ? inHH = true : inHH = false
  })

  d.hook('S_BOSS_GAGE_INFO', (e) => {
    if (!enable || inHH) return
    // notified boss before start battle
    if (!boss.has(e.id.toString())) {
      //new BAM
      boss.add(e.id.toString())
      hpMax = e.maxHp;
      newbossflag = 1;
      totaldamage = 0;
      //send('new boss : ' + e.id + ' exboss :' + bossid);
    }
    hpCur = e.curHp;
    hpPer = Math.floor((hpCur / hpMax) * 100)
    // someone hit the boss : started battle.
    if(newbossflag == 1 && hpCur < hpMax){
      // battle started
      starttime = Date.now();
      newbossflag = 0;
    }
  });

  d.hook('sEachSkillResult', (e) => {
    if (!enable || inHH) return
    if(gid.equals(e.source) && e.damage > 0 && boss.has(e.target.toString())){
      totaldamage = e.damage.add(totaldamage);
    }
  });

  d.hook('S_DESPAWN_NPC', (e) => {
    if (!enable || inHH) return
    if (boss.has(e.gameId.toString())) {
      endtime=Date.now();
      battleduration = Math.floor((endtime-starttime) / 1000);
      send( (totaldamage/1000/battleduration).toFixed(1) + ' k/s ' + totaldamage.multiply(100).div(hpMax) + '%' + ' duration : ' + battleduration.toFixed(0) + 'seconds');
      totaldamage=0;
      boss.delete(e.gameId.toString())
    }
  })

  function send(msg) { command.message(`[MYDPS] : ` + [...arguments].join('\n\t - '.clr('FFFFFF'))) }

};
