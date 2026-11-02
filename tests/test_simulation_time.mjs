import test from 'node:test';
import assert from 'node:assert/strict';
import {formatGameTime,isNight,daylightIntensity,trafficWindowAt,trafficWindowLabel,gameMinutesForElapsedSeconds,REAL_SECONDS_PER_GAME_HOUR,visualProjectProgress} from '../simulation_time.js';

test('el reloj muestra 24 horas y las franjas pico concuerdan con la hora',()=>{
 assert.equal(formatGameTime(0),'00:00');assert.equal(formatGameTime(6*60+9),'06:09');assert.equal(formatGameTime(1440+17*60),'17:00');
 assert.equal(trafficWindowAt(8*60),'morningPeak');assert.equal(trafficWindowAt(17*60+30),'eveningPeak');
 assert.equal(trafficWindowLabel(trafficWindowAt(8*60)),'Pico de mañana');
});
test('el amanecer, el día y la noche cambian iluminación y farolas',()=>{
 assert.equal(isNight(4*60),true);assert.equal(isNight(12*60),false);assert.equal(isNight(21*60),true);
 assert.equal(daylightIntensity(2*60),0);assert.equal(daylightIntensity(12*60),1);assert.equal(daylightIntensity(22*60),0);
 assert.ok(daylightIntensity(6*60)>0&&daylightIntensity(6*60)<1,'el amanecer debe atenuar el cambio de luz');
});

test('las velocidades conservan días más largos y una relación x1/x2/x4',()=>{
 assert.equal(REAL_SECONDS_PER_GAME_HOUR,4);
 assert.equal(gameMinutesForElapsedSeconds(1,1),15);
 assert.equal(gameMinutesForElapsedSeconds(1,2),30);
 assert.equal(gameMinutesForElapsedSeconds(1,4),60);
 assert.equal(gameMinutesForElapsedSeconds(24,4),1440);
});

test('una obra activa avanza entre medianoches y se detiene al pausar el proyecto',()=>{
 const project={status:'contratada',duration:4,elapsed:0,progress:0,contractedMinute:420};
 assert.equal(visualProjectProgress(project,420),0);
 assert.ok(visualProjectProgress(project,780)>0);
 const before=visualProjectProgress(project,1439);
 assert.ok(Math.abs(before-visualProjectProgress({...project,elapsed:1,progress:.25},0))<.001);
 assert.equal(visualProjectProgress({...project,status:'pausada'},780),0);
});
