/**
 * Created by baehw on 2018-05-14.
 */
const Command = require('command')
const Long = require("long");

module.exports = function MyDPS(d) {

    const command = Command(d)

    let dpts=0, // dps per ten sec
        gid,
        target = new Long(0, 0),
        ex_target = new Long(0, 0),
        counter=0,
        target_flag=0,
        damagearray = [], // dps for target
        timeout = 0;

    d.hook('sLogin', (e) => {
        gid=e.gameId;
    });

    d.hook('sEachSkillResult', (e) => {

        if(gid.equals(e.source) && e.damage > 0){

            target = e.target;
            if(target.notEquals(ex_target) )
            {
                ex_target = target;

                target_flag=1;
                dpts=0;

            }


        //send('target :' + target + ' damage :' + e.damage);
            //dpts=e.damage.add(dpts);
            dpts = dpts + Math.floor(e.damage/1000);

            if(timeout==0) timeout = setTimeout(ResetDPS, 10000);
        }

    });

    function ResetDPS(){

        if (target_flag==1) {
            send('Reset array :' + damagearray.length + ' target ' + target);
            damagearray.length=0;
            target_flag=0;
            counter=0;
        }// reset data

        damagearray[counter]=dpts;

        // caculate totoal dps
        tdps=0;
        for(i=0;i<damagearray.length;i++){
            tdps = tdps+damagearray[i];
        }

        sec=(counter+1) * 10;

        send( 'Ten sec :' + Math.round(dpts/10) + 'k/s ' + 'Total :' + Math.round(tdps/sec) + 'k/s sec : '); // printout avarage in 10 sec, total dps

        dpts=0;
        counter++;
        clearTimeout(timeout);
        timeout=0;
    }

    function send(msg) { command.message(`[MYDPS] : ` + [...arguments].join('\n\t - '.clr('FFFFFF'))) }

    clearTimeout(timeout)
};