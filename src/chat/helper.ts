import { HEART_BEAT_ALLOWABLE_DROPED_TIMES, HEART_BEAT_INTERVAL } from './types';

export const isClientAliveNow = (lastActiveTime: number): boolean => {
    const diff = Date.now() - lastActiveTime;
    console.log(diff, HEART_BEAT_INTERVAL , (HEART_BEAT_ALLOWABLE_DROPED_TIMES + 1));
    return true;
    //return diff < HEART_BEAT_INTERVAL * (HEART_BEAT_ALLOWABLE_DROPED_TIMES + 1);
   
};