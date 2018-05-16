/**
* Created by baehw on 2018-05-14.
*/
const Command = require('command')
const Long = require("long");

module.exports = function MyDPS(d) {

  const command = Command(d)

  let dpts=0, // dps per ten sec
  gid,
  bossid = new Long(0, 0),
  bosscurHp= new Long(0,0),
  bossmaxHp= new Long(0,0),
  newbossflag=0,
  starttime,
  endtime,
  totaldamage= new Long(0,0),
  target = new Long(0, 0),
  counter=0,
  target_flag=0,
  damagearray = [], // dps for target
  timeout = 0;

  d.hook('sLogin', (e) => {
    gid=e.gameId;
  });

  d.hook('sBossGageInfo', (e) => {
    if(bossid.notEquals(e.id)){
      //new BAM
      newbossflag=1;
      //send('new boss : ' + e.id + ' exboss :' + bossid);
    }

    if(newbossflag==1 && bosscurHp.notEquals(bossmaxHp)){
      // battle started
      starttime=Date.now();
      newbossflag=0;
      //send('battle started : ' + bossid + ' start at :' + starttime);
    }

    bossid=e.id;
    bosscurHp=e.curHp;
    bossmaxHp=e.maxHp;

    //send('boss gage : ' + bosscurHp + ' maxhp :' + bossmaxHp + ' bossid : ' +bossid);

    if(bosscurHp.equals(0))
    {
      endtime=Date.now();

      battleduration = Math.floor((endtime-starttime) / 1000);

      //send('boss dead : ' + bossid + ' end at : ' + battleduration.toFixed(0));

      send( (totaldamage/1000/battleduration).toFixed(1) + ' k/s' + ' duration :' + battleduration.toFixed(0));

      totaldamage=0;
    }

  });

  d.hook('sEachSkillResult', (e) => {

    if(gid.equals(e.source) && e.damage > 0 && e.target.equals(bossid)){

      totaldamage = e.damage.add(totaldamage);

      //send('total damage : ' + totaldamage);

    }

  });

  function send(msg) { command.message(`[MYDPS] : ` + [...arguments].join('\n\t - '.clr('FFFFFF'))) }

};
