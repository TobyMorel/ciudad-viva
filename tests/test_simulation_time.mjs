import test from 'node:test';
import assert from 'node:assert/strict';
import {formatGameTime,isNight,daylightIntensity,trafficWindowAt,trafficWindowLabel} from '../simulation_time.js';

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
